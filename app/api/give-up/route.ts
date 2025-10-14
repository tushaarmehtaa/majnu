import { NextResponse } from "next/server";

import { MAX_WRONG_GUESSES } from "@/lib/game";
import { getGameById, now, onGameFinish, updateGame } from "@/lib/instantdb";

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

  if (game.status !== "active") {
    return NextResponse.json(
      { status: game.status, finished_at: game.finished_at },
      { status: 200 },
    );
  }

  const updated = await updateGame(game.id, {
    status: "lost",
    wrong_guesses_count: Math.max(game.wrong_guesses_count, MAX_WRONG_GUESSES),
    finished_at: now(),
  });

  const result = await onGameFinish(updated.id, "loss", updated.user_id);

  return NextResponse.json({
    status: updated.status,
    finished_at: updated.finished_at,
    wrong_guesses_count: updated.wrong_guesses_count,
    gameId: updated.id,
    domain: updated.domain,
    hint: updated.hint,
    userId: updated.user_id,
    score_delta: result.scoreDelta,
  });
}
