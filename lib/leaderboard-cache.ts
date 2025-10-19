import type { LeaderboardPayload, LeaderboardScope } from "@/lib/leaderboard-types";

type CacheShape = Partial<Record<LeaderboardScope, { payload: LeaderboardPayload; updatedAt: string }>>;

const STORAGE_KEY = "majnu-leaderboard-cache";

function readCache(): CacheShape {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheShape;
    return parsed ?? {};
  } catch (error) {
    console.warn("[leaderboard-cache] unable to parse cache", error);
    return {};
  }
}

function writeCache(cache: CacheShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("[leaderboard-cache] unable to write cache", error);
  }
}

export function getCachedLeaderboard(scope: LeaderboardScope): LeaderboardPayload | null {
  const cache = readCache();
  return cache[scope]?.payload ?? null;
}

export function persistLeaderboard(scope: LeaderboardScope, payload: LeaderboardPayload) {
  if (typeof window === "undefined") return;
  const cache = readCache();
  cache[scope] = {
    payload,
    updatedAt: new Date().toISOString(),
  };
  writeCache(cache);
}
