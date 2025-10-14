import { NextResponse } from "next/server";

import { isLoss, isWin, reveal } from "@/lib/game";
import {
  checkGuessRate,
  getGameById,
  now,
  onGameFinish,
  updateGame,
} from "@/lib/instantdb";

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

  const isCorrect = game.word_answer.includes(letter);

  if (isCorrect) {
    const updatedMask = reveal(game.word_masked, game.word_answer, letter);
    const guessedLetters = [...game.guessed_letters, letter];
    const updatedStatus = isWin(updatedMask, game.word_answer)
      ? "won"
      : "active";
    const finishedAt =
      updatedStatus === "won" ? now() : game.finished_at ?? null;

    const updated = await updateGame(game.id, {
      word_masked: updatedMask,
      guessed_letters: guessedLetters,
      status: updatedStatus,
      finished_at: finishedAt,
    });

    let scoreDelta: number | undefined;
    if (updated.status !== "active") {
      const result = await onGameFinish(updated.id, "win", updated.user_id);
      scoreDelta = result.scoreDelta;
    }

    return NextResponse.json({
      gameId: updated.id,
      domain: updated.domain,
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
      score_delta: scoreDelta,
    });
  }

  const wrongLetters = [...game.wrong_letters, letter];
  const wrongGuesses = game.wrong_guesses_count + 1;
  const updatedStatus = isLoss(wrongGuesses) ? "lost" : "active";
  const finishedAt = updatedStatus === "lost" ? now() : game.finished_at;

  const updated = await updateGame(game.id, {
    wrong_guesses_count: wrongGuesses,
    wrong_letters: wrongLetters,
    status: updatedStatus,
    finished_at: finishedAt,
  });

  let scoreDelta: number | undefined;
  if (updated.status !== "active") {
    const result = await onGameFinish(updated.id, "loss", updated.user_id);
    scoreDelta = result.scoreDelta;
  }

  return NextResponse.json({
    gameId: updated.id,
    domain: updated.domain,
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
    score_delta: scoreDelta,
  });
}
