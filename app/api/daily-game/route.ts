import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { maskWord } from "@/lib/game";
import { generateHintForWord } from "@/lib/hint-service";
import {
  createGame,
  getDailyAttempt,
  getDailySelection,
  getGameById,
  getOrCreateAnonymousUser,
  recordDailyAttempt,
  rememberWordForUser,
  now,
} from "@/lib/instantdb";
import { logServerError, logServerEvent } from "@/lib/logger";
import { dateKey } from "@/lib/datekeys";

const USER_COOKIE = "majnu-user-id";

export async function POST() {
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

    const previousGameId = getDailyAttempt(user.id, today);
    if (previousGameId) {
      const existingGame = await getGameById(previousGameId);
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
          {
            error: "daily already completed",
            status: existingGame.status,
          },
          { status: 409 },
        );
      }
    }

    const selection = getDailySelection(today);
    const hintResult = await generateHintForWord({
      domain: selection.domain,
      word: selection.word,
    });
    const masked = maskWord(selection.word);
    await rememberWordForUser(user.id, selection.domain, selection.word);

    const game = await createGame({
      userId: user.id,
      domain: selection.domain,
      answer: selection.word,
      hint: hintResult.hint ?? selection.domain,
      masked,
      mode: "daily",
    });

    recordDailyAttempt(user.id, today, game.id);

    logServerEvent("new_game", {
      userId: user.id,
      gameId: game.id,
      domain: game.domain,
      mode: "daily",
      wordLength: game.word_answer.length,
      hintSource: hintResult.source,
      date: today,
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
    logServerError("daily_game_error", error);
    return NextResponse.json({ error: "Failed to start daily game" }, { status: 500 });
  }
}
