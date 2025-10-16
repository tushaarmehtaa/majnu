import { NextResponse } from "next/server";

import { isLoss, isWin, reveal } from "@/lib/game";
import {
  checkGuessRate,
  finalizeGame,
  getGameById,
  getUserRank,
  now,
  updateGame,
} from "@/lib/instantdb";
import { logServerError, logServerEvent } from "@/lib/logger";

type GuessPayload = {
  gameId?: string;
  letter?: string;
};

const LETTER_PATTERN = /^[a-z]$/i;

export async function POST(request: Request) {
  let body: GuessPayload = {};
  try {
    body = (await request.json()) as GuessPayload;
  } catch {
    body = {};
  }
  const raw = (body.letter ?? "").toString().trim();
  const letter = raw.toLowerCase();

  if (!body.gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  if (!(raw.length === 1 && LETTER_PATTERN.test(raw))) {
    return NextResponse.json({ error: "letter must be a-z" }, { status: 400 });
  }

  const game = await getGameById(body.gameId);

  if (!game) {
    return NextResponse.json({ error: "game not found" }, { status: 404 });
  }

  if (!checkGuessRate(game.user_id)) {
    return NextResponse.json({ error: "too many guesses" }, { status: 429 });
  }

  logServerEvent("guess", {
    gameId: game.id,
    userId: game.user_id,
    domain: game.domain,
    letter,
    attempt: game.guessed_letters.length + game.wrong_letters.length + 1,
  });

  if (game.status !== "active") {
    return NextResponse.json(
      {
        error: "game already finished",
        status: game.status,
      },
      { status: 400 },
    );
  }

  const alreadyPlayed = new Set([
    ...game.guessed_letters,
    ...game.wrong_letters,
  ]);

  if (alreadyPlayed.has(letter)) {
    return NextResponse.json({
      gameId: game.id,
      domain: game.domain,
      mode: game.mode,
      masked: game.word_masked,
      isCorrect: null,
      isRepeat: true,
      wrong_guesses_count: game.wrong_guesses_count,
      status: game.status,
      guessed_letters: game.guessed_letters,
      wrong_letters: game.wrong_letters,
      finished_at: game.finished_at,
      updated_at: now(),
      hint: game.hint,
      userId: game.user_id,
    });
  }

  try {
    const isCorrect = game.word_answer.includes(letter);

    if (isCorrect) {
      const updatedMask = reveal(game.word_masked, game.word_answer, letter);
      const guessedLetters = [...game.guessed_letters, letter];
      const updatedStatus = isWin(updatedMask, game.word_answer)
        ? "won"
        : "active";
      if (updatedStatus === "active") {
        const updated = await updateGame(game.id, {
          word_masked: updatedMask,
          guessed_letters: guessedLetters,
        });

        return NextResponse.json({
          gameId: updated.id,
          domain: updated.domain,
          mode: updated.mode,
          masked: updated.word_masked,
          isCorrect: true,
          isRepeat: false,
          wrong_guesses_count: updated.wrong_guesses_count,
          status: updated.status,
          guessed_letters: updated.guessed_letters,
          wrong_letters: updated.wrong_letters,
          finished_at: updated.finished_at,
          updated_at: now(),
          hint: updated.hint,
          userId: updated.user_id,
        });
      }

      const finishedAt = now();
      const snapshot = await finalizeGame(game.id, "win", {
        word_masked: updatedMask,
        guessed_letters: guessedLetters,
        finished_at: finishedAt,
      });
      const rank = await getUserRank("weekly", snapshot.game.user_id);

      logServerEvent("game_finish", {
        gameId: snapshot.game.id,
        userId: snapshot.game.user_id,
        domain: snapshot.game.domain,
        status: snapshot.game.status,
        wrongGuesses: snapshot.game.wrong_guesses_count,
        scoreDelta: snapshot.scoreDelta,
        throttled: snapshot.throttled,
      });

      return NextResponse.json({
        gameId: snapshot.game.id,
        domain: snapshot.game.domain,
        mode: snapshot.game.mode,
        masked: snapshot.game.word_masked,
        isCorrect: true,
        isRepeat: false,
        wrong_guesses_count: snapshot.game.wrong_guesses_count,
        status: snapshot.game.status,
        guessed_letters: snapshot.game.guessed_letters,
        wrong_letters: snapshot.game.wrong_letters,
        finished_at: snapshot.game.finished_at,
        updated_at: now(),
        hint: snapshot.game.hint,
        userId: snapshot.game.user_id,
        score_delta: snapshot.scoreDelta,
        score_total: snapshot.scoreTotal,
        throttled: snapshot.throttled,
        rank,
        word_answer: snapshot.game.word_answer,
        requires_handle: snapshot.requiresHandle,
        achievements: snapshot.achievements,
      });
    }

    const wrongLetters = [...game.wrong_letters, letter];
    const wrongGuesses = game.wrong_guesses_count + 1;
    const updatedStatus = isLoss(wrongGuesses) ? "lost" : "active";
    if (updatedStatus === "active") {
      const updated = await updateGame(game.id, {
        wrong_guesses_count: wrongGuesses,
        wrong_letters: wrongLetters,
      });

      return NextResponse.json({
        gameId: updated.id,
        domain: updated.domain,
        mode: updated.mode,
        masked: updated.word_masked,
        isCorrect: false,
        isRepeat: false,
        wrong_guesses_count: updated.wrong_guesses_count,
        status: updated.status,
        guessed_letters: updated.guessed_letters,
        wrong_letters: updated.wrong_letters,
        finished_at: updated.finished_at,
        updated_at: now(),
        hint: updated.hint,
        userId: updated.user_id,
      });
    }

    const finishedAt = now();
    const snapshot = await finalizeGame(game.id, "loss", {
      wrong_guesses_count: wrongGuesses,
      wrong_letters: wrongLetters,
      finished_at: finishedAt,
    });
    const rank = await getUserRank("weekly", snapshot.game.user_id);

    logServerEvent("game_finish", {
      gameId: snapshot.game.id,
      userId: snapshot.game.user_id,
      domain: snapshot.game.domain,
      status: snapshot.game.status,
      wrongGuesses: snapshot.game.wrong_guesses_count,
      scoreDelta: snapshot.scoreDelta,
      throttled: snapshot.throttled,
    });

    return NextResponse.json({
      gameId: snapshot.game.id,
      domain: snapshot.game.domain,
      mode: snapshot.game.mode,
      masked: snapshot.game.word_masked,
      isCorrect: false,
      isRepeat: false,
      wrong_guesses_count: snapshot.game.wrong_guesses_count,
      status: snapshot.game.status,
      guessed_letters: snapshot.game.guessed_letters,
      wrong_letters: snapshot.game.wrong_letters,
      finished_at: snapshot.game.finished_at,
      updated_at: now(),
      hint: snapshot.game.hint,
      userId: snapshot.game.user_id,
      score_delta: snapshot.scoreDelta,
      score_total: snapshot.scoreTotal,
      throttled: snapshot.throttled,
      rank,
      word_answer: snapshot.game.word_answer,
      requires_handle: snapshot.requiresHandle,
      achievements: snapshot.achievements,
    });
  } catch (error) {
    logServerError("guess_error", error, {
      gameId: game.id,
      userId: game.user_id,
      domain: game.domain,
    });
    return NextResponse.json(
      { error: "guess failed" },
      { status: 500 },
    );
  }
}
