"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

import domains from "@/data/domains.json";
import { MAX_WRONG_GUESSES, type GameStatus } from "@/lib/game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { useSound } from "@/hooks/use-sound";
import { logEvent, setAnalyticsUserId } from "@/lib/analytics";
import { useUser } from "@/context/user-context";
import type { AchievementRecord } from "@/lib/instantdb";

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
const MAJNU_FRAMES = ["0.png", "1.png", "2.png", "3.png", "4.png", "5.png"] as const;

const TOTAL_HEARTS = MAX_WRONG_GUESSES;

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { promptHandle, refresh, user } = useUser();
  const [activeTab, setActiveTab] = useState<"domain" | "game">("domain");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);
  const [isGuessing, setIsGuessing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [flashingLetter, setFlashingLetter] = useState<string | null>(null);
  const confettiFiredRef = useRef(false);
  const autoDailyTriggerRef = useRef(false);
  const { play: playCorrect } = useSound("/sfx/correct-guess.mp3");
  const { play: playWrong } = useSound("/sfx/wrong-guess.mp3");
  const { play: playWin } = useSound("/sfx/win.mp3", { volume: 0.85 });
  const { play: playLoss } = useSound("/sfx/loss.mp3", { volume: 0.9 });

  const domainEntries = useMemo(
    () => Object.entries(domains) as [string, { hint: string; words: string[] } ][],
    [],
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

  const isDailyActive = game?.mode === "daily" || selectedDomain === "daily";
  const isDailyPending = pendingDomain === "daily" && isStarting;

  useEffect(() => {
    if (!flashingLetter) {
      return;
    }
    const timer = window.setTimeout(() => setFlashingLetter(null), 450);
    return () => window.clearTimeout(timer);
  }, [flashingLetter]);

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

      if (state.status === "won") {
        playWin();
        if (!confettiFiredRef.current) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
          confettiFiredRef.current = true;
        }
      } else if (state.status === "lost") {
        playLoss();
      }
      logEvent({
        event: state.status === "won" ? "game_win" : "game_loss",
        userId: state.userId,
        metadata: {
          game_id: state.gameId,
          domain: state.domain,
          wrong_guesses: state.wrong_guesses_count,
          score_delta: state.score_delta ?? undefined,
          score_total: state.score_total ?? undefined,
          rank: state.rank ?? undefined,
          throttled: state.throttled ?? false,
        },
      });

      toast({
        title,
        description,
      });

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
    [playLoss, playWin, promptHandle, refresh, router, toast],
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

      try {
        setIsStarting(true);
        setPendingDomain(domainKey);
        setSelectedDomain(domainKey);

        const response = await fetch("/api/new-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: domainKey,
          }),
        });

        if (!response.ok) {
          throw new Error("Unable to start game");
        }

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
          score_delta: null,
          score_total: null,
          rank: null,
          throttled: false,
          requiresHandle: false,
          achievements: [],
        };

        setGame(nextState);
        confettiFiredRef.current = false;
        setActiveTab("game");
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
          },
        });

        toast({
          title: COPY.game.start.title,
          description: COPY.game.start.description(domainLabel),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to start game";
        toast({
          title: COPY.game.startError.title,
          description: COPY.game.startError.description(message),
          variant: "destructive",
        });
      } finally {
        setIsStarting(false);
        setPendingDomain(null);
      }
    },
    [game, isStarting, syncLocalStorage, toast, user],
  );

  const beginDailyGame = useCallback(async () => {
    if (isStarting) {
      return;
    }

    try {
      setIsStarting(true);
      setPendingDomain("daily");
      setSelectedDomain("daily");

      const response = await fetch("/api/daily-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 409) {
        toast({
          title: COPY.game.dailyLocked.title,
          description: COPY.game.dailyLocked.description,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to start daily challenge");
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
        score_delta: null,
        score_total: null,
        rank: null,
        throttled: false,
        requiresHandle: false,
        achievements: [],
      };

      setGame(nextState);
      confettiFiredRef.current = false;
      setActiveTab("game");
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
        },
      });

      toast({
        title: COPY.game.dailyStart.title,
        description: COPY.game.dailyStart.description(toTitleCase(nextState.domain)),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start daily challenge";
      toast({
        title: COPY.game.dailyError.title,
        description: COPY.game.dailyError.description(message),
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
      setPendingDomain(null);
    }
  }, [isStarting, setAnalyticsUserId, syncLocalStorage, toast]);

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
      syncLocalStorage(nextState);
      if (nextState.userId) {
        setAnalyticsUserId(nextState.userId);
      }
      if (nextState.status !== "active") {
        handleGameFinished(nextState);
      }
    },
    [game, handleGameFinished, syncLocalStorage],
  );

  const handleGuess = useCallback(
    async (letter: string) => {
      const normalized = letter.toLowerCase();
      if (!game || game.status !== "active" || isGuessing) {
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
        setIsGuessing(true);
        const response = await fetch("/api/guess", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ gameId: game.gameId, letter: normalized }),
        });

        if (!response.ok) {
          const errorPayload = await response.json();
          throw new Error(errorPayload.error ?? "Guess failed");
        }

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
        const message =
          error instanceof Error ? error.message : "Guess failed";
        toast({
          title: COPY.game.guessError.title,
          description: COPY.game.guessError.description(message),
          variant: "destructive",
        });
      } finally {
        setIsGuessing(false);
      }
    },
    [applyGuessResult, game, guessedLetterSet, isGuessing, playCorrect, playWrong, toast],
  );

  const handleGiveUp = useCallback(async () => {
    if (!game || game.status !== "active") {
      return;
    }

    try {
      const response = await fetch("/api/give-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId: game.gameId }),
      });

      if (!response.ok) {
        throw new Error("Unable to give up right now");
      }

      const payload = (await response.json()) as GameResponse;
      toast({
        title: COPY.game.giveUp.title,
        description: COPY.game.giveUp.description,
        variant: "destructive",
      });
      applyGuessResult(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to give up";
      toast({
        title: COPY.game.giveUpError.title,
        description: COPY.game.giveUpError.description(message),
        variant: "destructive",
      });
    }
  }, [applyGuessResult, game, toast]);

  const resumeGame = useCallback(async () => {
    const snapshot = window.localStorage.getItem(STORAGE_KEY);
    if (!snapshot) {
      setIsHydrating(false);
      return;
    }

    try {
      const data = JSON.parse(snapshot) as { gameId?: string };
      if (!data.gameId) {
        throw new Error("Invalid saved game");
      }

      const response = await fetch(`/api/game/${data.gameId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Saved game missing");
      }

      const payload = (await response.json()) as GameState;
      const nextState: GameState = {
        ...payload,
        mode: payload.mode ?? "standard",
      };

      setGame(nextState);
      confettiFiredRef.current = nextState.status === "won";
      setSelectedDomain(nextState.domain);
      setActiveTab("game");
      syncLocalStorage(nextState);
      if (nextState.userId) {
        setAnalyticsUserId(nextState.userId);
      }

      if (nextState.status !== "active") {
        handleGameFinished(nextState);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to resume game";
      setHydrationError(message);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrating(false);
    }
  }, [handleGameFinished, syncLocalStorage]);

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

  const maskedWordDisplay = useMemo(() => {
    if (!game) {
      return null;
    }

    return game.masked.split("").map((char, index) => {
      const display = char === "_" ? "" : char;
      return (
        <motion.span
          key={`${index}-${char}`}
          initial={{ scale: display ? 0.6 : 0.9, opacity: 0 }}
          animate={
            display
              ? { scale: [1.1, 0.95, 1], opacity: 1 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-dashed border-red/30 bg-white text-2xl font-semibold uppercase shadow-[0_4px_0_rgba(192,57,43,0.35)]"
        >
          {display}
        </motion.span>
      );
    });
  }, [game]);

  const hearts = useMemo(() => {
    if (!game) {
      return null;
    }
    const lost =
      game.status === "lost"
        ? TOTAL_HEARTS
        : Math.min(game.wrong_guesses_count, TOTAL_HEARTS);
    const remaining = Math.max(TOTAL_HEARTS - lost, 0);
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_HEARTS }).map((_, index) => {
          const isActive = index < remaining;
          return (
            <span
              key={index}
              aria-label={isActive ? "life remaining" : "life lost"}
              className={`h-6 w-6 rounded-full ${
                isActive ? "bg-success/80" : "bg-red/40"
              } shadow-sm`}
            />
          );
        })}
      </div>
    );
  }, [game]);

  const currentFrame = useMemo(() => {
    const wrong = Math.min(game?.wrong_guesses_count ?? 0, MAJNU_FRAMES.length - 1);
    return `/majnu-states/${MAJNU_FRAMES[wrong]}`;
  }, [game?.wrong_guesses_count]);

  const remainingLives = useMemo(() => {
    if (!game) {
      return TOTAL_HEARTS;
    }

    if (game.status === "lost") {
      return 0;
    }

    return Math.max(
      TOTAL_HEARTS - Math.min(game.wrong_guesses_count, TOTAL_HEARTS),
      0,
    );
  }, [game]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="container max-w-5xl py-10 text-foreground"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "domain" | "game")}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-full border border-red/30 bg-white/70 shadow-inner">
          <TabsTrigger value="domain" className="data-[state=active]:bg-red data-[state=active]:text-beige">
            1. Pick Domain
          </TabsTrigger>
          <TabsTrigger
            value="game"
            disabled={!game}
            className="data-[state=active]:bg-red data-[state=active]:text-beige"
          >
            2. Play
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domain">
          <Card className="border border-dashed border-red/30 bg-beige/90 shadow-[0_25px_60px_-20px_rgba(192,57,43,0.35)]">
            <CardHeader>
              <CardTitle className="font-display text-3xl uppercase tracking-[0.2em] text-red">
                {COPY.game.domainCard.title}
              </CardTitle>
              <CardDescription className="text-foreground/80">
                {COPY.game.domainCard.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={beginDailyGame}
                  disabled={isStarting}
                  onMouseEnter={() => setSelectedDomain("daily")}
                  onFocus={() => setSelectedDomain("daily")}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red disabled:opacity-70 ${
                    isDailyActive
                      ? "border-red bg-red text-beige"
                      : "border-red/40 bg-white text-red hover:border-red"
                  }`}
                >
                  <span>{COPY.game.dailyLabel}</span>
                  {isDailyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                </button>
                {domainEntries.map(([domainKey]) => {
                  const isSelected =
                    game?.domain === domainKey || selectedDomain === domainKey;
                  const isPending = pendingDomain === domainKey && isStarting;
                  return (
                    <button
                      key={domainKey}
                      type="button"
                      onClick={() => beginNewGame(domainKey)}
                      disabled={isStarting}
                      onMouseEnter={() => setSelectedDomain(domainKey)}
                      onFocus={() => setSelectedDomain(domainKey)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red disabled:opacity-70 ${
                        isSelected
                          ? "border-red bg-red text-beige"
                          : "border-red/40 bg-white text-red hover:border-red"
                      }`}
                    >
                      <span>{domainKey}</span>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-foreground/60">
                {selectedDomain === "daily"
                  ? COPY.game.dailyHint
                  : selectedDomain
                    ? domainEntries.find(([key]) => key === selectedDomain)?.[1].hint ?? ""
                    : COPY.game.domainCard.emptyHint}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/70">
              <span>
                {COPY.game.keyboard.tipBefore} <kbd>Enter</kbd> {COPY.game.keyboard.tipAfter}
              </span>
              <span>{COPY.game.keyboard.shortcuts}</span>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="game">
          <Card className="border border-dashed border-red/30 bg-white/80 shadow-[0_25px_60px_-20px_rgba(192,57,43,0.35)]">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
              <div>
                <CardTitle className="font-display text-2xl uppercase tracking-[0.3em] text-red">
                  {formattedDomain}
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  {COPY.game.statusDescription}
                </CardDescription>
                {game?.mode === "daily" ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {COPY.game.dailyDomain(toTitleCase(game.domain))} · {COPY.game.dailyBonusNote}
                  </p>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isHydrating ? (
                <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-start">
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                  <Skeleton className="h-64 w-full rounded-lg" />
                </div>
              ) : !game ? (
                <div className="rounded-lg border border-dashed border-red/30 bg-beige/90 p-6 text-center text-foreground">
                  <p className="text-lg font-semibold text-red">
                    {COPY.game.emptyState.title}
                  </p>
                  {hydrationError && (
                    <p className="mt-2 text-sm text-red">{hydrationError}</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-start">
                  <div className="space-y-6">
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between rounded-lg border border-dashed border-red/30 bg-white/60 px-4 py-3 text-sm font-semibold text-red">
                            <span className="flex items-center gap-2">
                              <span aria-hidden>💀</span>
                              {COPY.game.wrongBar(game.wrong_guesses_count, MAX_WRONG_GUESSES)}
                            </span>
                            {hearts}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Lives left: {remainingLives}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {game && (
                      <div className="flex justify-center">
                        <div
                          className={cn(
                            "relative w-full max-w-xl rounded-2xl border border-red/20 bg-[#FFF4C4] px-5 py-4 text-left shadow-[0_12px_30px_-18px_rgba(192,57,43,0.45)]",
                            isStarting && "animate-pulse",
                          )}
                        >
                          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red/70">
                            {COPY.game.hintLabel(game.hint)}
                          </p>
                          <span className="absolute -top-3 left-8 h-6 w-12 rounded-full bg-[#FADB82] opacity-70 blur-[2px]" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2">
                      {maskedWordDisplay}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {LETTERS.map((letter) => {
                        const normalized = letter.toLowerCase();
                        const isSelected = guessedLetterSet.has(normalized);
                        const isFlashing = flashingLetter === normalized;
                        return (
                          <motion.div
                            key={letter}
                            animate={
                              isFlashing
                                ? { x: [0, -4, 4, -4, 4, 0], rotate: [0, -2, 2, -2, 2, 0] }
                                : { x: 0, rotate: 0 }
                            }
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          >
                            <Button
                              variant="outline"
                              disabled={
                                isSelected ||
                                game.status !== "active" ||
                                isGuessing
                              }
                              aria-pressed={isSelected}
                              onClick={() => handleGuess(letter)}
                              className={cn(
                                "h-10 w-10 p-0 text-sm font-semibold uppercase transition-colors",
                                isSelected && "bg-red/20 text-red border-red/40",
                                isFlashing && "border-red bg-red text-beige"
                              )}
                            >
                              {letter}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-red/30 bg-beige/80 p-4 shadow-[0_20px_40px_-20px_rgba(192,57,43,0.45)]">
                    <motion.div
                      key={currentFrame}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="w-full"
                    >
                      <Image
                        src={currentFrame}
                        alt="Majnu Bhai execution state"
                        width={260}
                        height={260}
                        className="h-auto w-full max-w-[260px] rounded-md border border-red/30 bg-beige object-contain shadow-[0_15px_30px_-10px_rgba(0,0,0,0.25)]"
                        priority
                      />
                    </motion.div>
                    <Button
                      variant="destructive"
                      onClick={handleGiveUp}
                      disabled={!game || game.status !== "active"}
                      className="w-full"
                    >
                      Pull the Lever
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => beginNewGame(selectedDomain ?? "")}
                      disabled={!selectedDomain || isStarting}
                      className="w-full"
                    >
                      Replay domain
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
