import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  getLeaderboard,
  getOrCreateAnonymousUser,
  getUserStats,
} from "@/lib/instantdb";
import { LeaderboardClient } from "@/app/leaderboard/leaderboard-client";
import { anonymiseHandle, mapLeaderboardPage } from "@/lib/leaderboard-mapper";
import type { LeaderboardPayload } from "@/lib/leaderboard-types";

export const metadata: Metadata = {
  title: "Save Majnu Bhai — Leaderboard of Saviors",
  description: "Track the daily and all-time saviors keeping Majnu off the rope.",
};

const USER_COOKIE = "majnu-user-id";
const COOKIE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function cookieExpiry(): Date {
  return new Date(Date.now() + COOKIE_TTL_MS);
}

export default async function LeaderboardPage() {
  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = await getOrCreateAnonymousUser(existingUserId);

  if (!existingUserId) {
    cookieStore.set(USER_COOKIE, user.id, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: cookieExpiry(),
    });
  }

  const [dailyPage, weeklyPage, stats] = await Promise.all([
    getLeaderboard("daily", 100, user.id),
    getLeaderboard("weekly", 100, user.id),
    getUserStats(user.id),
  ]);

  const enrich = (payload: LeaderboardPayload): LeaderboardPayload => ({
    ...payload,
    my: {
      userId: user.id,
      handle: payload.my?.handle ?? anonymiseHandle(user.id, user.handle ?? null),
      score: stats.score_total,
      wins: stats.wins_all,
      losses: stats.losses_all,
      streakBest: stats.streak_best,
      updatedAt: payload.my?.updatedAt ?? new Date().toISOString(),
      rank: payload.my?.rank ?? null,
    },
  });

  const initialData: Record<"daily" | "weekly", LeaderboardPayload> = {
    daily: enrich(mapLeaderboardPage(dailyPage, user.id, user.handle ?? null)),
    weekly: enrich(mapLeaderboardPage(weeklyPage, user.id, user.handle ?? null)),
  };

  return <LeaderboardClient userId={user.id} initialData={initialData} />;
}
