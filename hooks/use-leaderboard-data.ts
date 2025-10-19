"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import type { LeaderboardPayload, LeaderboardRow, LeaderboardScope } from "@/lib/leaderboard-types";
import { getCachedLeaderboard, persistLeaderboard } from "@/lib/leaderboard-cache";

const fetchPage = async (scope: LeaderboardScope, cursor?: string): Promise<LeaderboardPayload> => {
  const params = new URLSearchParams({ scope });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/leaderboard?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load leaderboard (${response.status})`);
  }
  return (await response.json()) as LeaderboardPayload;
};

export function useLeaderboardData(scope: LeaderboardScope, initial?: LeaderboardPayload) {
  const fallback = useMemo(() => initial ?? getCachedLeaderboard(scope) ?? null, [initial, scope]);
  const [state, setState] = useState<LeaderboardPayload | null>(fallback);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, error, isLoading, mutate, isValidating } = useSWR<LeaderboardPayload>(
    ["leaderboard", scope],
    () => fetchPage(scope),
    {
      fallbackData: fallback ?? undefined,
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
      errorRetryCount: 2,
    },
  );

  useEffect(() => {
    if (data) {
      persistLeaderboard(scope, data);
      setState(data);
    }
  }, [data, scope]);

  useEffect(() => {
    if (!state && fallback) {
      setState(fallback);
    }
  }, [fallback, state]);

  const loadMore = useCallback(async () => {
    if (!state?.nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const next = await fetchPage(scope, state.nextCursor ?? undefined);
      const merged: LeaderboardPayload = {
        items: mergeItems(state.items, next.items ?? []),
        my: next.my ?? state.my ?? null,
        summary: next.summary ?? state.summary,
        nextCursor: next.nextCursor ?? null,
      };
      persistLeaderboard(scope, merged);
      setState(merged);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, scope, state]);

  const safeLoadMore = useCallback(async () => {
    try {
      await loadMore();
    } catch (error) {
      console.warn("[leaderboard] load more failed", error);
    }
  }, [loadMore]);

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  return {
    data: state,
    error,
    loading: isLoading && !state,
    validating: isValidating,
    refresh,
    loadMore: safeLoadMore,
    hasMore: Boolean(state?.nextCursor),
    loadingMore,
  };
}

function mergeItems(current: LeaderboardRow[] = [], incoming: LeaderboardRow[] = []): LeaderboardRow[] {
  if (incoming.length === 0) {
    return current;
  }
  const map = new Map(current.map((row) => [row.userId, row]));
  for (const row of incoming) {
    map.set(row.userId, row);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });
}
