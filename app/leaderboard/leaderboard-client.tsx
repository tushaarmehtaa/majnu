"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  LeaderboardListItem,
  LeaderboardPage,
  UserStatsRecord,
} from "@/lib/instantdb";
import { buildAvatar } from "@/lib/avatar";
import { COPY } from "@/lib/copy";
import { useUser } from "@/context/user-context";

const PAGE_SIZE = 100;

type Scope = "daily" | "weekly";

function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function msUntilNextWeeklyReset(): number {
  const now = new Date();
  const day = now.getDay();
  // Reset every Monday 00:00 local time.
  const daysUntilMonday = (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

type ScopeState = {
  items: LeaderboardListItem[];
  nextCursor: string | null;
  total: number;
  loading: boolean;
  error: string | null;
  my: {
    rank: number | null;
    score: number;
    streak: number;
    streak_best: number;
    badges: string[];
    wins: number;
    losses: number;
    handle: string | null;
  };
  summary: {
    wins: number;
    losses: number;
    games: number;
  };
};

type LeaderboardClientProps = {
  userId: string;
  stats: UserStatsRecord;
  initialData: {
    daily: LeaderboardPage;
    weekly: LeaderboardPage;
  };
};

function mergeItems(existing: LeaderboardListItem[], incoming: LeaderboardListItem[]) {
  const merged = new Map<string, LeaderboardListItem>();
  for (const item of existing) {
    merged.set(item.cursor, item);
  }
  for (const item of incoming) {
    merged.set(item.cursor, item);
  }
  return Array.from(merged.values()).sort((a, b) => a.rank - b.rank);
}

function buildInitialState(
  data: LeaderboardPage,
  stats: UserStatsRecord,
): ScopeState {
  return {
    items: data.items,
    nextCursor: data.nextCursor ?? null,
    total: data.total,
    loading: false,
    error: null,
    my: {
      rank: data.userEntry?.rank ?? null,
      score: stats.score_total,
      streak: stats.streak_current,
      streak_best: stats.streak_best,
      badges: data.userEntry?.badges ?? [],
      wins: stats.wins_all,
      losses: stats.losses_all,
      handle: data.userEntry?.handle ?? null,
    },
    summary: data.summary,
  };
}

export function LeaderboardClient({ userId, stats, initialData }: LeaderboardClientProps) {
  const [overview, setOverview] = useState({
    wins: stats.wins_all,
    losses: stats.losses_all,
    streak_current: stats.streak_current,
    streak_best: stats.streak_best,
    score_total: stats.score_total,
  });
  const [activeScope, setActiveScope] = useState<Scope>("daily");
  const [state, setState] = useState<Record<Scope, ScopeState>>({
    daily: buildInitialState(initialData.daily, stats),
    weekly: buildInitialState(initialData.weekly, stats),
  });
  const { user } = useUser();

  const shouldPoll = state[activeScope].items.length <= PAGE_SIZE;

  const fetchLeaderboard = useCallback(
    async (scope: Scope, { cursor, append = false }: { cursor?: string; append?: boolean } = {}) => {
      setState((prev) => ({
        ...prev,
        [scope]: {
          ...prev[scope],
          loading: true,
          error: null,
        },
      }));

      try {
        const params = new URLSearchParams({ scope, limit: String(PAGE_SIZE) });
        if (cursor) params.set("cursor", cursor);
        const response = await fetch(`/api/leaderboard?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to load leaderboard: ${response.status}`);
        }
        const payload = await response.json();

        setOverview((prev) => ({
          wins: payload.my?.wins ?? prev.wins,
          losses: payload.my?.losses ?? prev.losses,
          streak_current: payload.my?.streak ?? prev.streak_current,
          streak_best: payload.my?.streak_best ?? prev.streak_best,
          score_total: payload.my?.score ?? prev.score_total,
        }));

        setState((prev) => {
          const previousItems = append ? prev[scope].items : [];
          const mergedItems = mergeItems(previousItems, payload.items ?? []);

          return {
            ...prev,
            [scope]: {
              items: mergedItems,
              nextCursor: payload.nextCursor ?? null,
              total: payload.total ?? mergedItems.length,
              loading: false,
              error: null,
              my: {
                rank: payload.my?.rank ?? null,
                score: payload.my?.score ?? stats.score_total,
                streak: payload.my?.streak ?? stats.streak_current,
                streak_best: payload.my?.streak_best ?? stats.streak_best,
                badges: payload.my?.badges ?? [],
                wins: payload.my?.wins ?? stats.wins_all,
                losses: payload.my?.losses ?? stats.losses_all,
                handle: payload.my?.handle ?? prev[scope].my.handle ?? null,
              },
              summary: payload.summary ?? prev[scope].summary,
            },
          };
        });
      } catch {
        setState((prev) => ({
          ...prev,
          [scope]: {
            ...prev[scope],
            loading: false,
            error: "Unable to load leaderboard. Try again.",
          },
        }));
      }
    },
    [stats.losses_all, stats.score_total, stats.streak_best, stats.streak_current, stats.wins_all],
  );

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }
    const interval = window.setInterval(() => {
      fetchLeaderboard(activeScope, { append: false });
    }, 25000);

    return () => window.clearInterval(interval);
  }, [activeScope, fetchLeaderboard, shouldPoll]);

  const topThree = useMemo(() => state.daily.items.slice(0, 3), [state.daily.items]);

  const [countdowns, setCountdowns] = useState({ daily: "00:00", weekly: "00:00" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScope, setModalScope] = useState<Scope>("daily");

  useEffect(() => {
    const update = () => {
      setCountdowns({
        daily: formatCountdown(msUntilNextMidnight()),
        weekly: formatCountdown(msUntilNextWeeklyReset()),
      });
    };
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const openModal = (scope: Scope) => {
    setModalScope(scope);
    setModalOpen(true);
    if (!state[scope].loading && state[scope].items.length === 0) {
      fetchLeaderboard(scope, { append: false });
    }
  };

  const activeProfile = state[activeScope].my;
  const activeBadgeCount = activeProfile.badges.length;
  const activeHandleLabel = activeProfile.handle
    ? `@${activeProfile.handle}`
    : COPY.leaderboard.profileCard.anonymous;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-3 text-center">
        <Badge className="mx-auto bg-red/10 text-red shadow-sm">{COPY.leaderboard.title}</Badge>
        <h1 className="font-display text-5xl uppercase tracking-[0.3em] text-red">{COPY.leaderboard.title}</h1>
        <p className="text-sm text-foreground/70">
          {COPY.leaderboard.subtitle}
        </p>
        <div className="grid gap-2 text-xs uppercase tracking-[0.3em] text-foreground/60 sm:grid-cols-2 lg:grid-cols-5">
          <span>Wins: {overview.wins}</span>
          <span>Losses: {overview.losses}</span>
          <span>Current Streak: {overview.streak_current}</span>
          <span>Best Streak: {overview.streak_best}</span>
          <span>Total Score: {overview.score_total}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-red/20 bg-white/75 p-5 shadow-[0_20px_40px_-28px_rgba(192,57,43,0.35)] md:flex md:items-center md:justify-between">
        <div className="space-y-1 text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">{COPY.leaderboard.profileCard.heading}</p>
          <p className="text-lg font-semibold text-red">{activeHandleLabel}</p>
          <p className="text-sm text-foreground/70">{COPY.leaderboard.profileCard.subheading}</p>
        </div>
        <div className="mt-4 grid w-full gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60 sm:grid-cols-3 md:mt-0 md:w-auto md:grid-cols-1">
          <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
            <span className="text-[0.7rem] text-foreground/60">{COPY.leaderboard.profileCard.score}</span>
            <span className="text-base font-semibold text-red">{activeProfile.score}</span>
          </span>
          <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
            <span className="text-[0.7rem] text-foreground/60">{COPY.leaderboard.profileCard.bestStreak}</span>
            <span className="text-base font-semibold text-red">{activeProfile.streak_best}</span>
          </span>
          <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
            <span className="text-[0.7rem] text-foreground/60">{COPY.leaderboard.profileCard.badges}</span>
            <span className="text-base font-semibold text-red">{activeBadgeCount}</span>
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-red/20 bg-white/70 p-4 backdrop-blur">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-foreground/60">Today&apos;s Top 3</p>
        <div className="flex flex-col gap-2 text-sm text-foreground/80 sm:flex-row sm:justify-between">
          {topThree.length === 0 ? (
            <span>No saviors logged today. Be the first.</span>
          ) : (
            topThree.map((entry) => (
              <span key={entry.cursor} className="flex items-center gap-2">
                <span className="font-semibold text-red">#{entry.rank}</span>
                <span>{entry.handle ? `@${entry.handle}` : "Anonymous"}</span>
                <span className="font-mono text-xs text-foreground/60">{entry.score} pts</span>
              </span>
            ))
          )}
        </div>
      </div>

      {state.weekly.summary.games > 0 ? (
        <div className="rounded-2xl border border-red/20 bg-red/10 p-4 text-center text-sm font-semibold text-red">
          {COPY.leaderboard.weeklyBanner(state.weekly.summary.wins)}
        </div>
      ) : null}

      <Tabs
        value={activeScope}
        onValueChange={(value) => setActiveScope(value as Scope)}
        className="w-full"
      >
        <TabsList className="mx-auto flex w-fit gap-2 rounded-full border border-red/30 bg-white/70 px-2 py-1 shadow-inner">
          <TabsTrigger value="daily" className="data-[state=active]:bg-red data-[state=active]:text-beige">
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-red data-[state=active]:text-beige">
            Weekly
          </TabsTrigger>
        </TabsList>
        {(["daily", "weekly"] as Scope[]).map((scope) => {
          const scopeData = state[scope];
          const currentHandle = scopeData.my.handle ?? user?.handle ?? null;
          const resetCountdown = scope === "daily" ? countdowns.daily : countdowns.weekly;
          return (
            <TabsContent key={scope} value={scope} className="space-y-6">
              {scopeData.error ? (
                <div className="rounded-2xl border border-red/30 bg-red/10 p-4 text-sm text-red">
                  {scopeData.error}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 rounded-2xl border border-red/20 bg-white/70 p-4 text-xs uppercase tracking-[0.3em] text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
                <span>{COPY.leaderboard.reset(resetCountdown)}</span>
                <Button variant="ghost" size="sm" onClick={() => openModal(scope)}>
                  View Full Rankings
                </Button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-red/30 shadow-[0_25px_60px_-35px_rgba(192,57,43,0.5)] backdrop-blur-sm">
                <LeaderboardTableView entries={scopeData.items} userId={userId} />
              </div>
              {scopeData.nextCursor ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-red/40 text-red hover:bg-red/10"
                    disabled={scopeData.loading}
                    onClick={() => fetchLeaderboard(scope, { cursor: scopeData.nextCursor ?? undefined, append: true })}
                  >
                    {scopeData.loading ? "Loading..." : "Load more"}
                  </Button>
                </div>
              ) : null}
              <div className="rounded-2xl border border-dashed border-red/30 bg-white/80 p-6 shadow-[0_18px_40px_-30px_rgba(192,57,43,0.45)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-red">Your Rank</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-[0.2em] text-red">
                  {scopeData.my.rank ? `Rank ${scopeData.my.rank}` : "Unranked"}
                </h2>
                <p className="text-sm text-foreground/70">
                  {currentHandle ? `@${currentHandle}` : "Claim a handle to appear on the board"}
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Score: {scopeData.my.score} · Streak: {scopeData.my.streak} · Best Streak: {scopeData.my.streak_best}
                </p>
                <p className="text-sm text-foreground/70">
                  Wins: {scopeData.my.wins} · Losses: {scopeData.my.losses}
                </p>
                {scopeData.my.badges.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
                    {scopeData.my.badges.map((badge) => (
                      <span key={`${scope}-${badge}`} className="rounded-full border border-red/30 bg-white/70 px-2 py-0.5">
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex justify-center text-sm text-foreground/60">
        <Link href="/play" className="font-semibold text-red hover:underline">
          Back to the execution chamber →
        </Link>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-left">
              <span>{modalScope === "daily" ? "Daily" : "Weekly"} Rankings</span>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
                Resets in {modalScope === "daily" ? countdowns.daily : countdowns.weekly}
              </span>
            </DialogTitle>
            <DialogDescription>
              Discover everyone keeping Majnu alive. Scroll for more and load additional saviors.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-red/30 bg-white/90 p-2">
            <LeaderboardTableView entries={state[modalScope].items} userId={userId} />
          </div>
          {state[modalScope].nextCursor ? (
            <Button
              variant="outline"
              className="border-red/40 text-red hover:bg-red/10"
              onClick={() => fetchLeaderboard(modalScope, { cursor: state[modalScope].nextCursor ?? undefined, append: true })}
              disabled={state[modalScope].loading}
            >
              {state[modalScope].loading ? "Loading..." : "Load more saviors"}
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeaderboardTableView({ entries, userId }: { entries: LeaderboardListItem[]; userId: string }) {
  return (
    <table className="w-full min-w-[320px] divide-y divide-red/20 bg-white/90 text-left text-sm">
      <thead className="bg-red/10 text-xs uppercase tracking-[0.3em] text-red">
        <tr>
          <th className="px-4 py-3">Rank</th>
          <th className="px-4 py-3">Player</th>
          <th className="px-4 py-3">Badges</th>
          <th className="px-4 py-3">Wins</th>
          <th className="px-4 py-3">Losses</th>
          <th className="px-4 py-3">Score</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const isSelf = entry.user_id === userId;
          const avatar = buildAvatar(entry.handle ? entry.handle : entry.user_id);
          return (
            <tr
              key={entry.cursor}
              className={`border-b border-red/10 ${isSelf ? "bg-red/10 font-semibold" : "bg-white"}`}
            >
              <td className="px-4 py-3">{entry.rank}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: avatar.color }}
                    aria-hidden
                  >
                    {avatar.initials}
                  </span>
                  <span>{entry.handle ? `@${entry.handle}` : isSelf ? "You" : "Anonymous"}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
                  {entry.badges.length > 0 ? (
                    entry.badges.map((badge) => (
                      <span key={`${entry.cursor}-${badge}`} className="rounded-full border border-red/30 bg-white/80 px-2 py-0.5">
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">{entry.wins}</td>
              <td className="px-4 py-3">{entry.losses}</td>
              <td className="px-4 py-3 font-mono">{entry.score}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
