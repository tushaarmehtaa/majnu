import { NextRequest, NextResponse } from "next/server";

import { getGameById } from "@/lib/instantdb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const game = await getGameById(gameId);

  if (!game) {
    return NextResponse.json({ error: "game not found" }, { status: 404 });
  }

  return NextResponse.json({
    gameId: game.id,
    userId: game.user_id,
    domain: game.domain,
    masked: game.word_masked,
    hint: game.hint,
    status: game.status,
    wrong_guesses_count: game.wrong_guesses_count,
    guessed_letters: game.guessed_letters,
    wrong_letters: game.wrong_letters,
    created_at: game.created_at,
    finished_at: game.finished_at,
  });
}
