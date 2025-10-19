import type { LeaderboardPage } from "@/lib/instantdb";
import type { LeaderboardPayload, LeaderboardRow } from "@/lib/leaderboard-types";

export function anonymiseHandle(userId: string, handle?: string | null): string {
  if (handle && handle.trim().length > 0) {
    const normalized = handle.startsWith("@") ? handle : `@${handle}`;
    return normalized;
  }
  const suffix = userId.slice(-4).toUpperCase();
  return `@anon-${suffix}`;
}

export function mapLeaderboardPage(page: LeaderboardPage, fallbackUserId: string, fallbackHandle?: string | null): LeaderboardPayload {
  const items: LeaderboardRow[] = page.items.map((entry) => ({
    userId: entry.user_id,
    handle: anonymiseHandle(entry.user_id, entry.handle),
    score: entry.score,
    wins: entry.wins,
    losses: entry.losses,
    streakBest: entry.streak_best,
    updatedAt: entry.updated_at,
    rank: entry.rank ?? null,
  }));

  const userEntry = page.userEntry
    ? {
        userId: page.userEntry.user_id,
        handle: anonymiseHandle(page.userEntry.user_id, page.userEntry.handle),
        score: page.userEntry.score,
        wins: page.userEntry.wins,
        losses: page.userEntry.losses,
        streakBest: page.userEntry.streak_best,
        updatedAt: page.userEntry.updated_at,
        rank: page.userEntry.rank ?? null,
      }
    : undefined;

  const fallbackRow: LeaderboardRow = {
    userId: fallbackUserId,
    handle: anonymiseHandle(fallbackUserId, fallbackHandle),
    score: 0,
    wins: 0,
    losses: 0,
    streakBest: 0,
    updatedAt: new Date().toISOString(),
    rank: null,
  };

  return {
    items,
    my: userEntry ?? fallbackRow,
    summary: page.summary ?? { wins: 0, losses: 0, games: 0 },
    nextCursor: page.nextCursor ?? null,
  };
}
