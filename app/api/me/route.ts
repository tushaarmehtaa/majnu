import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getOrCreateAnonymousUser, getUserStats } from "@/lib/instantdb";

const USER_COOKIE = "majnu-user-id";

export async function GET() {
  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = await getOrCreateAnonymousUser(existingUserId);

  cookieStore.set(USER_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  const stats = await getUserStats(user.id);

  return NextResponse.json({
    userId: user.id,
    handle: user.handle ?? null,
    wins_all: stats.wins_all,
    losses_all: stats.losses_all,
    streak_current: stats.streak_current,
    streak_best: stats.streak_best,
    score_total: stats.score_total,
  });
}
