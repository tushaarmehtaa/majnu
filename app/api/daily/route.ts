import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { maskWord } from "@/lib/game";
import { generateHintForWord } from "@/lib/hint-service";
import {
  createGame,
  ensureDailyPuzzle,
  getDailyAttempt,
  getDailyPuzzle,
  getGameById,
  getOrCreateAnonymousUser,
  recordDailyAttempt,
  rememberWordForUser,
  saveDailyPuzzle,
  now,
} from "@/lib/instantdb";
import { logServerError, logServerEvent } from "@/lib/logger";
import { dateKey } from "@/lib/datekeys";

const USER_COOKIE = "majnu-user-id";

type DailyActionPayload = {
  action?: "start" | "complete";
  gameId?: string;
  status?: "won" | "lost";
  guesses?: number;
};

type Countdown = {
  seconds: number;
  formatted: string;
};

function countdownToMidnight(): Countdown {
  const nowDate = new Date();
  const reset = new Date(nowDate);
  reset.setUTCHours(24, 0, 0, 0);
  const diffSeconds = Math.max(0, Math.floor((reset.getTime() - nowDate.getTime()) / 1000));
  const hours = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, "0");
  const formatted = `${hours}:${minutes}`;
  return { seconds: diffSeconds, formatted };
}

export async function GET() {
  const today = dateKey();
  try {
    const cookieStore = await cookies();
    const existingUserId = cookieStore.get(USER_COOKIE)?.value;
    const user = await getOrCreateAnonymousUser(existingUserId);

    if (!existingUserId) {
      cookieStore.set(USER_COOKIE, user.id, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      });
    }

    const puzzle = ensureDailyPuzzle(today);
    const attemptGameId = getDailyAttempt(user.id, today);
    let attempt: {
      status: "none" | "active" | "won" | "lost";
      gameId: string | null;
    } = { status: "none", gameId: null };

    if (attemptGameId) {
      const existingGame = await getGameById(attemptGameId);
      if (existingGame) {
        attempt = {
          status: existingGame.status,
          gameId: existingGame.id,
        } as typeof attempt;
      }
    }

    const countdown = countdownToMidnight();

    return NextResponse.json({
      puzzle: {
        date: today,
        domain: puzzle.domain,
        hint: puzzle.hint,
        wordLength: puzzle.word.length,
      },
      attempt,
      countdown,
    });
  } catch (error) {
    logServerError("daily_get_error", error);
    return NextResponse.json({ error: "Unable to load daily puzzle" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const today = dateKey();
  let payload: DailyActionPayload = {};
  try {
    payload = (await request.json()) as DailyActionPayload;
  } catch {
    payload = {};
  }

  const action = payload.action ?? "start";

  try {
    const cookieStore = await cookies();
    const existingUserId = cookieStore.get(USER_COOKIE)?.value;
    const user = await getOrCreateAnonymousUser(existingUserId);

    if (!existingUserId) {
      cookieStore.set(USER_COOKIE, user.id, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      });
    }

    if (action === "complete") {
      logServerEvent("daily_word_finish", {
        userId: user.id,
        status: payload.status ?? "unknown",
        guesses: payload.guesses ?? null,
        date: today,
      });
      return NextResponse.json({ ok: true });
    }

    const existingAttempt = getDailyAttempt(user.id, today);
    if (existingAttempt) {
      const existingGame = await getGameById(existingAttempt);
      if (existingGame) {
        if (existingGame.status === "active") {
          return NextResponse.json({
            gameId: existingGame.id,
            userId: existingGame.user_id,
            domain: existingGame.domain,
            masked: existingGame.word_masked,
            hint: existingGame.hint,
            status: existingGame.status,
            wrong_guesses_count: existingGame.wrong_guesses_count,
            guessed_letters: existingGame.guessed_letters,
            wrong_letters: existingGame.wrong_letters,
            created_at: existingGame.created_at,
            finished_at: existingGame.finished_at,
            updated_at: now(),
            mode: existingGame.mode,
          });
        }

        return NextResponse.json(
          { error: "daily already completed", status: existingGame.status },
          { status: 409 },
        );
      }
    }

    let puzzle = getDailyPuzzle(today);
    if (!puzzle) {
      const generated = ensureDailyPuzzle(today);
      const hintResult = await generateHintForWord({ domain: generated.domain, word: generated.word });
      puzzle = saveDailyPuzzle({
        ...generated,
        hint: hintResult.hint ?? generated.hint,
      });
    }

    const hintResult = await generateHintForWord({ domain: puzzle.domain, word: puzzle.word });
    const masked = maskWord(puzzle.word);
    await rememberWordForUser(user.id, puzzle.domain, puzzle.word);

    const game = await createGame({
      userId: user.id,
      domain: puzzle.domain,
      answer: puzzle.word,
      hint: hintResult.hint ?? puzzle.hint,
      masked,
      mode: "daily",
    });

    recordDailyAttempt(user.id, today, game.id);

    logServerEvent("daily_word_start", {
      userId: user.id,
      gameId: game.id,
      domain: game.domain,
      date: today,
      hintSource: hintResult.source,
    });

    return NextResponse.json({
      gameId: game.id,
      userId: user.id,
      domain: game.domain,
      masked: game.word_masked,
      hint: game.hint,
      status: game.status,
      wrong_guesses_count: game.wrong_guesses_count,
      guessed_letters: game.guessed_letters,
      wrong_letters: game.wrong_letters,
      created_at: game.created_at,
      finished_at: game.finished_at,
      updated_at: now(),
      mode: game.mode,
    });
  } catch (error) {
    logServerError("daily_post_error", error);
    return NextResponse.json({ error: "Failed to start daily puzzle" }, { status: 500 });
  }
}
