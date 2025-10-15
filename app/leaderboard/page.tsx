import { cookies } from "next/headers";

import {
  getLeaderboard,
  getOrCreateAnonymousUser,
  getUserStats,
} from "@/lib/instantdb";

import { LeaderboardClient } from "@/app/leaderboard/leaderboard-client";

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

  const [daily, weekly, stats] = await Promise.all([
    getLeaderboard("daily", 100, user.id),
    getLeaderboard("weekly", 100, user.id),
    getUserStats(user.id),
  ]);

  return (
    <LeaderboardClient
      userId={user.id}
      stats={stats}
      initialData={{
        daily,
        weekly,
      }}
    />
  );
}
