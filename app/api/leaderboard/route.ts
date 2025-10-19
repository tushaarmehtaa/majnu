import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getLeaderboard,
  getOrCreateAnonymousUser,
  getUserRank,
  getUserStats,
} from "@/lib/instantdb";
import { anonymiseHandle, mapLeaderboardPage } from "@/lib/leaderboard-mapper";
import type { LeaderboardPayload } from "@/lib/leaderboard-types";

const USER_COOKIE = "majnu-user-id";
const MAX_LIMIT = 100;

const querySchema = z.object({
  scope: z.enum(["daily", "weekly"]).default("daily"),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    scope: searchParams.get("scope") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: "invalid parameters" }, { status: 400 });
  }

  const { scope, cursor, limit = MAX_LIMIT } = parseResult.data;

  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = await getOrCreateAnonymousUser(existingUserId);

  cookieStore.set(USER_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  const leaderboard = await getLeaderboard(scope, limit, user.id, { cursor });
  const stats = await getUserStats(user.id);
  const myRank = leaderboard.userEntry?.rank ?? (await getUserRank(scope, user.id));
  const payload: LeaderboardPayload = mapLeaderboardPage(leaderboard, user.id, user.handle ?? null);

  const myRow = {
    userId: user.id,
    handle: payload.my?.handle ?? anonymiseHandle(user.id, user.handle ?? null),
    score: stats.score_total,
    wins: stats.wins_all,
    losses: stats.losses_all,
    streakBest: stats.streak_best,
    updatedAt: payload.my?.updatedAt ?? new Date().toISOString(),
    rank: myRank ?? null,
  };

  return NextResponse.json({
    scope,
    items: payload.items,
    nextCursor: payload.nextCursor ?? null,
    total: leaderboard.total,
    summary: payload.summary,
    my: myRow,
  });
}
