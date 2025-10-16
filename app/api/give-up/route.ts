import { NextResponse } from "next/server";

import { MAX_WRONG_GUESSES } from "@/lib/game";
import { finalizeGame, getGameById, getUserRank, now } from "@/lib/instantdb";
import { logServerError, logServerEvent } from "@/lib/logger";

type GiveUpPayload = {
  gameId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GiveUpPayload;

  if (!body.gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const game = await getGameById(body.gameId);

  if (!game) {
    return NextResponse.json({ error: "game not found" }, { status: 404 });
  }

  try {
    if (game.status !== "active") {
      return NextResponse.json(
        { status: game.status, finished_at: game.finished_at, mode: game.mode },
        { status: 200 },
      );
    }

    const snapshot = await finalizeGame(game.id, "loss", {
      wrong_guesses_count: Math.max(game.wrong_guesses_count, MAX_WRONG_GUESSES),
      finished_at: now(),
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
      cause: "give_up",
    });

    return NextResponse.json({
      status: snapshot.game.status,
      finished_at: snapshot.game.finished_at,
      wrong_guesses_count: snapshot.game.wrong_guesses_count,
      gameId: snapshot.game.id,
      domain: snapshot.game.domain,
      mode: snapshot.game.mode,
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
    logServerError("give_up_error", error, {
      gameId: game.id,
      userId: game.user_id,
    });
    return NextResponse.json(
      { error: "Unable to give up right now" },
      { status: 500 },
    );
  }
}
