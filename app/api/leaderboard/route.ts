import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getLeaderboard,
  getOrCreateAnonymousUser,
  getUserStats,
} from "@/lib/instantdb";

const USER_COOKIE = "majnu-user-id";
const DEFAULT_LIMIT = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope") ?? "daily";
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isNaN(limitParam) ? DEFAULT_LIMIT : Math.min(limitParam, 500);

  if (scopeParam !== "daily" && scopeParam !== "weekly") {
    return NextResponse.json({ error: "invalid scope" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = await getOrCreateAnonymousUser(existingUserId);

  cookieStore.set(USER_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  const { entries, userEntry } = await getLeaderboard(scopeParam, limit, user.id);
  const stats = await getUserStats(user.id);

  return NextResponse.json({
    scope: scopeParam,
    entries,
    user: userEntry ?? {
      user_id: user.id,
      handle: user.handle ?? null,
      wins: 0,
      losses: 0,
      score: stats.score_total,
      streak_best: stats.streak_best,
      rank: null,
    },
  });
}
