"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { MAX_WRONG_GUESSES, type GameStatus } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";
import { useOffline } from "@/hooks/use-offline";
import { useDomains } from "@/hooks/use-domains";
import { logEvent, setAnalyticsUserId } from "@/lib/analytics";
import { useUser } from "@/context/user-context";
import type { AchievementRecord } from "@/lib/instantdb";
import { useUIStore } from "@/lib/stores/ui-store";
import { findCachedHint, rememberHint } from "@/lib/client-hint-cache";
import { fetchWithRetry, MajnuFetchError, resolveFetchErrorMessage } from "@/lib/http";

type GameState = {
  gameId: string;
  userId: string;
  domain: string;
  mode: "standard" | "daily";
  masked: string;
  hint: string;
  status: GameStatus;
  wrong_guesses_count: number;
  guessed_letters: string[];
  wrong_letters: string[];
  finished_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  score_delta?: number | null;
  score_total?: number | null;
  rank?: number | null;
  throttled?: boolean;
  word_answer?: string;
  requiresHandle?: boolean;
  achievements?: AchievementRecord[];
};

type GameResponse = GameState & {
  isCorrect?: boolean | null;
  isRepeat?: boolean;
  score_delta?: number | null;
  score_total?: number | null;
  rank?: number | null;
  throttled?: boolean;
  word_answer?: string;
  requires_handle?: boolean;
  achievements?: AchievementRecord[];
};

const STORAGE_KEY = "majnu-active-game";
const LETTERS = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index),
);
const MAJNU_FRAMES = ["0.webp", "1.webp", "2.webp", "3.webp", "4.webp", "5.webp"] as const;

const TOTAL_HEARTS = MAX_WRONG_GUESSES;

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");


function PlayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { promptHandle, refresh } = useUser();
  const { domains } = useDomains();
  const { offline } = useOffline();
  const setActiveGame = useUIStore((state) => state.setActiveGame);
  const resetGameEffects = useUIStore((state) => state.resetGameEffects);
  const markConfettiPlayed = useUIStore((state) => state.markConfettiPlayed);
  const confettiPlayedFor = useUIStore((state) => state.confettiPlayedFor);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);
  const [isGuessing, setIsGuessing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [flashingLetter, setFlashingLetter] = useState<string | null>(null);
  const autoDailyTriggerRef = useRef(false);
  const roundStartRef = useRef<Record<string, number>>({});
  const hintTrackedRef = useRef<Set<string>>(new Set());
  const { play: playCorrect } = useSound(SOUNDS.correctGuess, { volume: SOUND_VOLUMES.feedback });
  const { play: playWrong } = useSound(SOUNDS.wrongGuess, { volume: SOUND_VOLUMES.feedback });
  const { play: playWin } = useSound(SOUNDS.win, { volume: SOUND_VOLUMES.outcome });
  const { play: playLoss } = useSound(SOUNDS.loss, { volume: SOUND_VOLUMES.outcome });
  const { play: playTypewriter } = useSound(SOUNDS.typewriterKey, { volume: SOUND_VOLUMES.ui });
  const triggerConfetti = useCallback(async () => {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 },
      ticks: 80,
      startVelocity: 38,
      scalar: 0.9,
    });
  }, []);

  const domainEntries = useMemo(
    () => (domains ? (Object.entries(domains) as [string, { hint: string; words: string[] }][]) : []),
    [domains],
  );

  const formattedDomain = useMemo(() => {
    if (game?.mode === "daily" || selectedDomain === "daily") {
      return COPY.game.dailyLabel;
    }

    if (game?.domain) {
      return toTitleCase(game.domain);
    }

    if (selectedDomain) {
      return toTitleCase(selectedDomain);
    }

    return COPY.game.domainPlaceholder;
  }, [game, selectedDomain]);

  const guessedLetterSet = useMemo(() => {
    if (!game) {
      return new Set<string>();
    }
    return new Set([...game.guessed_letters, ...game.wrong_letters]);
  }, [game]);

  useEffect(() => {
    if (!flashingLetter) {
      return;
    }
    const timer = window.setTimeout(() => setFlashingLetter(null), 450);
    return () => window.clearTimeout(timer);
  }, [flashingLetter]);

  useEffect(() => {
    if (!game?.gameId || !game.hint) {
      return;
    }
    if (hintTrackedRef.current.has(game.gameId)) {
      return;
    }
    hintTrackedRef.current.add(game.gameId);
    logEvent({
      event: "hint_used",
      userId: game.userId,
      metadata: {
        game_id: game.gameId,
        domain: game.domain,
        mode: game.mode,
      },
    });
  }, [game]);

  const handleGameFinished = useCallback(
    (state: GameState) => {
      window.localStorage.removeItem(STORAGE_KEY);
      const title = state.status === "won" ? COPY.result.title.win : COPY.result.title.loss;
      const scoreSnippet =
        typeof state.score_delta === "number"
          ? ` Score change: ${state.score_delta >= 0 ? "+" : ""}${state.score_delta}.`
          : "";
      const baseDescription =
        state.status === "won"
          ? COPY.result.winDescription
          : COPY.result.lossDescription;
      const description = `${baseDescription}${scoreSnippet}`;

      const startedAt = state.gameId ? roundStartRef.current[state.gameId] : undefined;
      const durationMs = typeof startedAt === "number" ? Math.max(Date.now() - startedAt, 0) : null;
      if (state.gameId) {
        delete roundStartRef.current[state.gameId];
        hintTrackedRef.current.delete(state.gameId);
      }

      if (state.status === "won") {
        playWin();
        if (state.gameId && confettiPlayedFor !== state.gameId) {
          triggerConfetti().catch(() => null);
          markConfettiPlayed(state.gameId);
        }
      } else if (state.status === "lost") {
        playLoss();
      }
      const outcomeEvent = state.status === "won" ? "game_win" : "game_loss";
      logEvent({
        event: outcomeEvent,
        userId: state.userId,
        metadata: {
          game_id: state.gameId,
          domain: state.domain,
          wrong_guesses: state.wrong_guesses_count,
          score_delta: state.score_delta ?? undefined,
          score_total: state.score_total ?? undefined,
          rank: state.rank ?? undefined,
          throttled: state.throttled ?? false,
          duration_ms: durationMs ?? undefined,
          round_started_at: startedAt ?? undefined,
        },
      });

      toast({
        title,
        description,
      });

      if (state.word_answer) {
        const cached = findCachedHint(state.domain, state.word_answer);
        rememberHint(state.domain, state.word_answer, state.hint);
        if (cached) {
          console.debug(
            `[hint-cache] ${state.domain}:${state.word_answer} last fetched ${cached.minutesAgo} mins ago`,
          );
        } else {
          console.debug(`[hint-cache] cached ${state.domain}:${state.word_answer}`);
        }
      }

      if (state.throttled) {
        toast({
          title: COPY.game.slowDown.title,
          description: COPY.game.slowDown.description,
          variant: "destructive",
        });
      }

      if (state.requiresHandle) {
        toast({
          title: COPY.game.handlePrompt.title,
          description: COPY.game.handlePrompt.description,
        });
        promptHandle();
      }

      if (state.achievements && state.achievements.length > 0) {
        state.achievements.forEach((achievement) => {
          toast({
            title: achievement.title,
            description: achievement.description,
          });
        });
      }

      refresh().catch(() => null);

      const searchParams = new URLSearchParams({
        status: state.status,
        gameId: state.gameId,
        domain: state.domain,
      });

      if (typeof state.score_delta === "number") {
        searchParams.set("scoreDelta", String(state.score_delta));
      }
      if (typeof state.score_total === "number") {
        searchParams.set("scoreTotal", String(state.score_total));
      }
      if (typeof state.rank === "number") {
        searchParams.set("rank", String(state.rank));
      }
      if (state.throttled) {
        searchParams.set("throttled", "true");
      }

      router.push(`/result?${searchParams.toString()}`);
    },
    [confettiPlayedFor, markConfettiPlayed, playLoss, playWin, promptHandle, refresh, router, toast, triggerConfetti],
  );

  const syncLocalStorage = useCallback((state: GameState | null) => {
    if (!state || state.status !== "active") {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ gameId: state.gameId }),
    );
  }, []);

  const beginNewGame = useCallback(
    async (domainKey: string) => {
      if (isStarting) {
        return;
      }

      if (offline) {
        toast({
          title: COPY.game.offline.title,
          description: COPY.game.offline.description,
          variant: "destructive",
        });
        logEvent({
          event: "error",
          metadata: {
            source: "new_game_offline",
            domain: domainKey,
          },
        });
        return;
      }

      if (!domains || !domains[domainKey]) {
        toast({
          title: COPY.game.domainUnavailable.title,
          description: COPY.game.domainUnavailable.description,
        });
        return;
      }

      try {
        setIsStarting(true);
        setPendingDomain(domainKey);
        setSelectedDomain(domainKey);

        const response = await fetchWithRetry(
          "/api/new-game",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              domain: domainKey,
            }),
          },
        );

        const payload = (await response.json()) as GameResponse;
        const domainLabel = toTitleCase(payload.domain ?? domainKey);
        const nextState: GameState = {
          gameId: payload.gameId,
          userId: payload.userId,
          domain: payload.domain,
          mode: payload.mode ?? "standard",
          masked: payload.masked,
          hint: payload.hint,
          status: payload.status,
          wrong_guesses_count: payload.wrong_guesses_count,
          guessed_letters: payload.guessed_letters,
          wrong_letters: payload.wrong_letters,
          finished_at: payload.finished_at ?? null,
          created_at: payload.created_at ?? null,
          updated_at: payload.updated_at ?? null,
          score_delta: null,
          score_total: null,
          rank: null,
          throttled: false,
          requiresHandle: false,
          achievements: [],
        };

        setGame(nextState);
        roundStartRef.current[nextState.gameId] = Date.now();
        hintTrackedRef.current.delete(nextState.gameId);
        setActiveGame(nextState.gameId);
        resetGameEffects();
        setSelectedDomain(payload.domain ?? domainKey);
        syncLocalStorage(nextState);
        if (nextState.userId) {
          setAnalyticsUserId(nextState.userId);
        }
        logEvent({
          event: "game_start",
          userId: nextState.userId,
          metadata: {
            domain: nextState.domain,
            game_id: nextState.gameId,
            mode: nextState.mode,
            round_started_at: roundStartRef.current[nextState.gameId],
          },
        });

        toast({
          title: COPY.game.start.title,
          description: COPY.game.start.description(domainLabel),
        });
      } catch (error) {
        const message = await resolveFetchErrorMessage(error, "Unable to start game");
        toast({
          title: COPY.game.startError.title,
          description: COPY.game.startError.description(message),
          variant: "destructive",
        });
        logEvent({
          event: "error",
          metadata: {
            source: "new_game",
            domain: domainKey,
            message,
          },
        });
      } finally {
        setIsStarting(false);
        setPendingDomain(null);
      }
    },
    [domains, isStarting, offline, resetGameEffects, setActiveGame, syncLocalStorage, toast],
  );

  const beginDailyGame = useCallback(async () => {
    if (isStarting) {
      return;
    }

    if (offline) {
      toast({
        title: COPY.game.offline.title,
        description: COPY.game.offline.description,
        variant: "destructive",
      });
      logEvent({
        event: "error",
        metadata: {
          source: "daily_game_offline",
        },
      });
      return;
    }

    try {
      setIsStarting(true);
      setPendingDomain("daily");
      setSelectedDomain("daily");

      let response: Response;
      try {
        response = await fetchWithRetry(
          "/api/daily-game",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
          {
            retryOnStatus: (status) => status !== 409 && status !== 412,
          },
        );
      } catch (error) {
        if (error instanceof MajnuFetchError && error.response?.status === 409) {
          toast({
            title: COPY.game.dailyLocked.title,
            description: COPY.game.dailyLocked.description,
            variant: "destructive",
          });
          logEvent({
            event: "error",
            metadata: {
              source: "daily_game_locked",
            },
          });
          return;
        }
        throw error;
      }

      const payload = (await response.json()) as GameResponse;
      const nextState: GameState = {
        gameId: payload.gameId,
        userId: payload.userId,
        domain: payload.domain,
        mode: payload.mode ?? "daily",
        masked: payload.masked,
        hint: payload.hint,
        status: payload.status,
        wrong_guesses_count: payload.wrong_guesses_count,
        guessed_letters: payload.guessed_letters,
        wrong_letters: payload.wrong_letters,
        finished_at: payload.finished_at ?? null,
        created_at: payload.created_at ?? null,
        updated_at: payload.updated_at ?? null,
        score_delta: null,
        score_total: null,
        rank: null,
        throttled: false,
        requiresHandle: false,
        achievements: [],
      };

      setGame(nextState);
      roundStartRef.current[nextState.gameId] = Date.now();
      hintTrackedRef.current.delete(nextState.gameId);
      setActiveGame(nextState.gameId);
      resetGameEffects();
      syncLocalStorage(nextState);
      if (nextState.userId) {
        setAnalyticsUserId(nextState.userId);
      }
      logEvent({
        event: "game_start",
        userId: nextState.userId,
        metadata: {
          domain: nextState.domain,
          game_id: nextState.gameId,
          mode: nextState.mode,
          round_started_at: roundStartRef.current[nextState.gameId],
        },
      });

      toast({
        title: COPY.game.dailyStart.title,
        description: COPY.game.dailyStart.description(toTitleCase(nextState.domain)),
      });
    } catch (error) {
      const message = await resolveFetchErrorMessage(error, "Unable to start daily challenge");
      toast({
        title: COPY.game.dailyError.title,
        description: COPY.game.dailyError.description(message),
        variant: "destructive",
      });
      logEvent({
        event: "error",
        metadata: {
          source: "daily_game",
          message,
        },
      });
    } finally {
      setIsStarting(false);
      setPendingDomain(null);
    }
  }, [isStarting, offline, resetGameEffects, setActiveGame, syncLocalStorage, toast]);

  useEffect(() => {
    if (autoDailyTriggerRef.current) {
      return;
    }
    if (!searchParams) {
      return;
    }
    if (searchParams.get("mode") === "daily") {
      autoDailyTriggerRef.current = true;
      void beginDailyGame();
    }
  }, [beginDailyGame, searchParams]);

  const applyGuessResult = useCallback(
    (payload: GameResponse) => {
      const nextState: GameState = {
        gameId: payload.gameId,
        userId: payload.userId ?? game?.userId ?? "",
        domain: payload.domain ?? game?.domain ?? "",
        mode: payload.mode ?? game?.mode ?? "standard",
        masked: payload.masked,
        hint: payload.hint ?? game?.hint ?? "",
        status: payload.status,
        wrong_guesses_count: payload.wrong_guesses_count,
        guessed_letters: payload.guessed_letters,
        wrong_letters: payload.wrong_letters,
        finished_at: payload.finished_at ?? null,
        created_at: payload.created_at ?? game?.created_at ?? null,
        updated_at: payload.updated_at ?? new Date().toISOString(),
        score_delta: payload.score_delta ?? null,
        score_total: payload.score_total ?? game?.score_total ?? null,
        rank: payload.rank ?? game?.rank ?? null,
        throttled: payload.throttled ?? false,
        word_answer: payload.word_answer ?? game?.word_answer,
        requiresHandle: payload.requires_handle ?? false,
        achievements: payload.achievements ?? [],
      };

      setGame(nextState);
      setSelectedDomain(nextState.domain);
      setActiveGame(nextState.gameId);
      syncLocalStorage(nextState);
      if (nextState.userId) {
        setAnalyticsUserId(nextState.userId);
      }
      if (nextState.status !== "active") {
        handleGameFinished(nextState);
      }
    },
    [game, handleGameFinished, setActiveGame, syncLocalStorage],
  );

  const handleGuess = useCallback(
    async (letter: string) => {
      const normalized = letter.toLowerCase();
      if (!game || game.status !== "active" || isGuessing) {
        return;
      }

      if (offline) {
        toast({
          title: COPY.game.offline.title,
          description: COPY.game.offline.description,
          variant: "destructive",
        });
        logEvent({
          event: "error",
          userId: game.userId,
          metadata: {
            source: "guess_offline",
            game_id: game.gameId,
          },
        });
        return;
      }

      if (guessedLetterSet.has(normalized)) {
        const repeatCopy = COPY.game.repeatToast(letter);
        toast({
          title: repeatCopy.title,
          description: repeatCopy.description,
        });
        return;
      }

      try {
        logEvent({
          event: "guess_click",
          userId: game.userId,
          metadata: {
            letter: normalized,
            game_id: game.gameId,
            domain: game.domain,
          },
        });
        setIsGuessing(true);
        const response = await fetchWithRetry(
          "/api/guess",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ gameId: game.gameId, letter: normalized }),
          },
        );

        const payload = (await response.json()) as GameResponse;

        if (payload.isRepeat) {
          const repeatCopy = COPY.game.repeatToast(letter);
          toast({
            title: repeatCopy.title,
            description: repeatCopy.description,
          });
          return;
        }

        if (payload.isCorrect) {
          playCorrect();
          const correctCopy = COPY.game.correctToast(letter);
          toast({
            title: correctCopy.title,
            description: correctCopy.description,
          });
        } else {
          playWrong();
          const isLastChance =
            payload.wrong_guesses_count === MAX_WRONG_GUESSES - 1;
          setFlashingLetter(normalized);
          if (isLastChance) {
            toast({
              title: COPY.game.lastChanceToast.title,
              description: COPY.game.lastChanceToast.description,
              variant: "destructive",
            });
          } else {
            const wrongCopy = COPY.game.wrongToast(letter);
            toast({
              title: wrongCopy.title,
              description: wrongCopy.description,
            });
          }
        }

        applyGuessResult(payload);
      } catch (error) {
        const message = await resolveFetchErrorMessage(error, "Guess failed");
        toast({
          title: COPY.game.guessError.title,
          description: COPY.game.guessError.description(message),
          variant: "destructive",
        });
        logEvent({
          event: "error",
          userId: game.userId,
          metadata: {
            source: "guess",
            game_id: game.gameId,
            message,
          },
        });
      } finally {
        setIsGuessing(false);
      }
    },
    [applyGuessResult, game, guessedLetterSet, isGuessing, offline, playCorrect, playWrong, toast],
  );

  const handleGiveUp = useCallback(async () => {
    if (!game || game.status !== "active") {
      return;
    }

    if (offline) {
      toast({
        title: COPY.game.offline.title,
        description: COPY.game.offline.description,
        variant: "destructive",
      });
      if (game) {
        logEvent({
          event: "error",
          userId: game.userId,
          metadata: {
            source: "give_up_offline",
            game_id: game.gameId,
          },
        });
      }
      return;
    }

    try {
      const response = await fetchWithRetry(
        "/api/give-up",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ gameId: game.gameId }),
        },
      );

      const payload = (await response.json()) as GameResponse;
      toast({
        title: COPY.game.giveUp.title,
        description: COPY.game.giveUp.description,
        variant: "destructive",
      });
      applyGuessResult(payload);
    } catch (error) {
      const message = await resolveFetchErrorMessage(error, "Unable to give up right now");
      toast({
        title: COPY.game.giveUpError.title,
        description: COPY.game.giveUpError.description(message),
        variant: "destructive",
      });
      if (game) {
        logEvent({
          event: "error",
          userId: game.userId,
          metadata: {
            source: "give_up",
            game_id: game.gameId,
            message,
          },
        });
      }
    }
  }, [applyGuessResult, game, offline, toast]);

  const resumeGame = useCallback(async () => {
    const snapshot = window.localStorage.getItem(STORAGE_KEY);
    if (!snapshot) {
      setIsHydrating(false);
      return;
    }

    if (offline) {
      setIsHydrating(false);
      return;
    }

    let savedGameId: string | null = null;
    try {
      const data = JSON.parse(snapshot) as { gameId?: string };
      if (!data.gameId) {
        throw new Error("Invalid saved game");
      }
      savedGameId = data.gameId;

      const response = await fetchWithRetry(
        `/api/game/${data.gameId}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as GameState;
      const nextState: GameState = {
        ...payload,
        mode: payload.mode ?? "standard",
      };

      setGame(nextState);
      if (nextState.gameId) {
        roundStartRef.current[nextState.gameId] = Date.now();
        hintTrackedRef.current.delete(nextState.gameId);
      }
      setActiveGame(nextState.gameId);
      if (nextState.status === "won" && nextState.gameId) {
        markConfettiPlayed(nextState.gameId);
      } else {
        resetGameEffects();
      }
      setSelectedDomain(nextState.domain);
      syncLocalStorage(nextState);
      if (nextState.userId) {
        setAnalyticsUserId(nextState.userId);
      }

      if (nextState.status !== "active") {
        handleGameFinished(nextState);
      }
    } catch (error) {
      const message = await resolveFetchErrorMessage(error, "Unable to resume game");
      window.localStorage.removeItem(STORAGE_KEY);
      logEvent({
        event: "error",
        metadata: {
          source: "resume_game",
          game_id: savedGameId,
          message,
        },
      });
    } finally {
      setIsHydrating(false);
    }
  }, [handleGameFinished, markConfettiPlayed, offline, resetGameEffects, setActiveGame, syncLocalStorage]);

  useEffect(() => {
    resumeGame();
  }, [resumeGame]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toUpperCase();
      const isEditableTarget =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";

      if (event.key === "Enter") {
        if (
          target?.tagName === "BUTTON" ||
          target?.getAttribute("role") === "button"
        ) {
          return;
        }

        if (isEditableTarget) {
          return;
        }

        if (!game && selectedDomain) {
          event.preventDefault();
          beginNewGame(selectedDomain);
          return;
        }

        if (game && game.status === "active") {
          event.preventDefault();
          handleGiveUp();
          return;
        }
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        if (isEditableTarget) {
          return;
        }
        event.preventDefault();
        handleGuess(event.key);
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [beginNewGame, game, handleGuess, handleGiveUp, selectedDomain]);

  if (isHydrating) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[calc(100vh-5rem)] flex-col items-center gap-8 px-4 py-8"
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Header / Status Bar */}
        <div className="flex items-center justify-between rounded-sm border-b-2 border-primary/20 bg-background/50 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Badge variant="evidence">
              {formattedDomain}
            </Badge>
            {game?.mode === "daily" && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE EXECUTION
              </Badge>
            )}
          </div>
          <div className="font-mono text-sm font-bold text-primary">
            {game?.status === "active" ? "STATUS: ACTIVE" : `STATUS: ${game?.status?.toUpperCase() ?? "UNKNOWN"}`}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          {/* Main Game Area */}
          <div className="space-y-8">
            {/* Hangman Visual */}
            <Card className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#F5E6D3] p-0 shadow-inner">
              <div className="absolute inset-0 bg-[url('/paper-texture.svg')] opacity-50 mix-blend-multiply" />
              <div className="relative z-10 h-full w-full p-8">
                <div className="relative h-full w-full">
                  <Image
                    src={`/majnu-states/${MAJNU_FRAMES[Math.min(game?.wrong_guesses_count ?? 0, 5)]}`}
                    alt="Majnu State"
                    fill
                    className="object-contain mix-blend-multiply"
                    priority
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.2)_100%)]" />
            </Card>

            {/* Word Display - Ransom Note Style */}
            <div className="flex flex-wrap justify-center gap-3 min-h-[4rem]">
              {game?.masked.split("").map((char, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex h-12 w-10 items-center justify-center text-2xl font-bold shadow-sm",
                    char === "_"
                      ? "border-b-4 border-primary/40 bg-transparent text-transparent"
                      : "bg-white text-foreground rotate-1 border border-gray-300 font-display transform even:-rotate-1"
                  )}
                >
                  {char === "_" ? "" : char}
                </motion.div>
              ))}
            </div>

            {/* Hint Section */}
            {game?.hint && (
              <div className="relative rounded-sm border border-primary/20 bg-primary/5 p-4 font-mono text-sm text-primary/80">
                <span className="absolute -top-2 left-4 bg-background px-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                  CLUE FOUND
                </span>
                <p className="italic">&quot;{game.hint}&quot;</p>
              </div>
            )}
          </div>

          {/* Sidebar / Controls */}
          <div className="space-y-6">
            {/* Keyboard */}
            <div className="grid grid-cols-5 gap-2">
              {LETTERS.map((letter) => {
                const isGuessed = guessedLetterSet.has(letter.toLowerCase());
                const isWrong = game?.wrong_letters.includes(letter.toLowerCase());
                const isCorrect = game?.guessed_letters.includes(letter.toLowerCase());

                return (
                  <Button
                    key={letter}
                    variant={isGuessed ? "outline" : "stamp"}
                    disabled={isGuessed || game?.status !== "active" || isGuessing}
                    onClick={() => {
                      playTypewriter();
                      void handleGuess(letter);
                    }}
                    className={cn(
                      "h-12 w-full text-lg font-bold transition-all",
                      isCorrect && "border-green-600 text-green-600 bg-green-50 opacity-100",
                      isWrong && "border-red-200 text-red-200 opacity-50 decoration-slice line-through",
                      flashingLetter === letter.toLowerCase() && "animate-shake bg-red-100 text-red-600"
                    )}
                  >
                    {letter}
                  </Button>
                );
              })}
            </div>

            {/* Game Controls */}
            <div className="space-y-4 border-t-2 border-dashed border-primary/10 pt-6">
              <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-foreground/60">
                <span>Mistakes</span>
                <span>{game?.wrong_guesses_count ?? 0} / {MAX_WRONG_GUESSES}</span>
              </div>
              {/* Health Bar / Mistakes Visual */}
              <div className="flex gap-1">
                {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      i < (game?.wrong_guesses_count ?? 0) ? "bg-destructive" : "bg-primary/10"
                    )}
                  />
                ))}
              </div>

              {game?.status === "active" && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => void handleGiveUp()}
                >
                  FORFEIT CASE
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!game && !isStarting && (
        <div className="mt-12 text-center">
          <h2 className="font-display text-3xl text-primary mb-6">SELECT A CASE FILE</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {domainEntries.map(([key, data]) => (
              <Button
                key={key}
                variant="paper"
                className="h-auto flex-col items-start gap-1 p-4 w-40"
                onClick={() => beginNewGame(key)}
              >
                <span className="font-display text-lg uppercase">{toTitleCase(key)}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {data.words.length} SUSPECTS
                </span>
              </Button>
            ))}
            <Button
              variant="paper"
              className="h-auto flex-col items-start gap-1 p-4 w-40 border-red-500/50"
              onClick={() => beginDailyGame()}
            >
              <span className="font-display text-lg uppercase text-red-600">DAILY EXECUTION</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ONE CHANCE
              </span>
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>}>
      <PlayPageContent />
    </Suspense>
  );
}
