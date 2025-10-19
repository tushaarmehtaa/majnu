"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LeaderboardRowSkeleton } from "@/components/leaderboard/row-skeleton";
import { LoadingOverlay } from "@/components/loading-overlay";
import { COPY } from "@/lib/copy";
import { buildAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { motionFade, motionListItem } from "@/lib/motion";
import { useOffline } from "@/hooks/use-offline";
import { useLeaderboardData } from "@/hooks/use-leaderboard-data";
import type { LeaderboardPayload, LeaderboardRow, LeaderboardScope } from "@/lib/leaderboard-types";

const SCOPES: LeaderboardScope[] = ["daily", "weekly"];

function msUntilNextMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function msUntilNextWeeklyReset(): number {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function useCountdown(scope: LeaderboardScope): string {
  const [value, setValue] = useState(() =>
    scope === "daily" ? formatCountdown(msUntilNextMidnight()) : formatCountdown(msUntilNextWeeklyReset()),
  );

  useEffect(() => {
    const update = () => {
      const nextMs = scope === "daily" ? msUntilNextMidnight() : msUntilNextWeeklyReset();
      setValue(formatCountdown(nextMs));
    };
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, [scope]);

  return value;
}

function LeaderboardTable({ rows, userId }: { rows: LeaderboardRow[]; userId: string }) {
  return (
    <div className="relative">
      <div className="hidden overflow-hidden rounded-2xl border border-red/30 shadow-[0_25px_60px_-35px_rgba(192,57,43,0.5)] md:block">
        <table className="w-full min-w-[600px] divide-y divide-red/20 bg-white text-left text-sm">
          <thead className="bg-red/10 text-xs uppercase tracking-[0.3em] text-red">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Wins</th>
              <th className="px-4 py-3 text-right">Losses</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((entry) => {
                const isSelf = entry.userId === userId;
                const avatar = buildAvatar(entry.handle);
                const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "💀";
                return (
                  <motion.tr
                    key={`${entry.userId}-${entry.updatedAt}`}
                    variants={motionListItem}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                      "border-b border-red/10 transition-colors",
                      isSelf ? "bg-red/5" : "bg-white hover:bg-red/5/30",
                      entry.rank === 1 && "hover:animate-[sway_1.5s_ease-in-out_infinite]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2 text-left">
                          <span aria-hidden>{medal}</span>
                          <span>{entry.rank ?? "—"}</span>
                        </TooltipTrigger>
                        <TooltipContent>Consecutive saves.</TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: avatar.color }}
                          aria-hidden
                        >
                          {avatar.initials}
                        </span>
                        <span>{isSelf ? "You" : entry.handle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{entry.wins}</td>
                    <td className="px-4 py-3 text-right font-mono">{entry.losses}</td>
                    <td className="px-4 py-3 text-right font-mono">{entry.score}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        <AnimatePresence initial={false}>
          {rows.map((entry) => {
            const isSelf = entry.userId === userId;
            const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "💀";
            return (
              <motion.div
                key={`${entry.userId}-${entry.updatedAt}`}
                variants={motionListItem}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "rounded-2xl border border-red/20 bg-white p-3 shadow-sm",
                  "transition-transform duration-200 focus-visible:outline focus-visible:outline-red",
                  isSelf && "border-red/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{medal}</span>
                    <div>
                      <p className="text-sm font-semibold text-red">{isSelf ? "You" : entry.handle}</p>
                      <p className="text-xs text-foreground/60">Rank {entry.rank ?? "—"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red">{entry.score}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-foreground/70">
                  <span>Wins {entry.wins}</span>
                  <span>Losses {entry.losses}</span>
                  <span>Streak {entry.streakBest}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryStrip({ summary }: { summary: { wins: number; losses: number; games: number } }) {
  return (
    <div className="rounded-2xl border border-dashed border-red/30 bg-white/80 p-6 text-center text-sm text-foreground/70">
      <p className="text-xs uppercase tracking-[0.3em] text-red">Daily summary</p>
      <p className="mt-2">Wins: {summary.wins} · Losses: {summary.losses} · Games: {summary.games}</p>
    </div>
  );
}

type LeaderboardClientProps = {
  userId: string;
  initialData: Record<LeaderboardScope, LeaderboardPayload>;
};

export function LeaderboardClient({ userId, initialData }: LeaderboardClientProps) {
  const [scope, setScope] = useState<LeaderboardScope>("daily");
  const { data, error, loading, validating, refresh, loadMore, hasMore, loadingMore } = useLeaderboardData(
    scope,
    initialData[scope],
  );
  const { offline } = useOffline();
  const countdown = useCountdown(scope);
  const payload = data ?? initialData[scope];
  const items = useMemo(() => payload?.items ?? [], [payload]);
  const summary = useMemo(() => payload?.summary ?? { wins: 0, losses: 0, games: 0 }, [payload]);
  const myRow = useMemo<LeaderboardRow>(
    () =>
      payload?.my ?? {
        userId,
        handle: "@anon",
        rank: null,
        score: 0,
        wins: 0,
        losses: 0,
        streakBest: 0,
        updatedAt: new Date().toISOString(),
      },
    [payload?.my, userId],
  );

  useEffect(() => {
    if (countdown === "00:00" && !loading && !offline) {
      refresh();
    }
  }, [countdown, loading, offline, refresh]);

  const topThree = useMemo(() => items.slice(0, 3), [items]);
  const subtitle = myRow.rank === 1 ? "You are keeping Majnu alive." : "Majnu trusts you to do better tomorrow.";
  const showSkeleton = !payload && loading;
  const showLoadMore = showSkeleton ? false : hasMore;
  const overlayActive = (validating || loadingMore) && !!payload;

  const handleRetry = () => {
    refresh();
  };

  const handleLoadMore = () => {
    if (offline || !hasMore) return;
    void loadMore();
  };

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <motion.header variants={motionFade} initial="hidden" animate="visible" className="flex flex-col gap-3 text-center">
        <Badge className="mx-auto bg-red/10 text-red shadow-sm">{COPY.leaderboard.title}</Badge>
        <h1 className="font-display text-5xl uppercase tracking-[0.3em] text-red">{COPY.leaderboard.title}</h1>
        <p className="text-sm text-foreground/70">{COPY.leaderboard.subtitle}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">{subtitle}</p>
      </motion.header>

      <motion.section
        variants={motionFade}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-red/20 bg-white/80 p-5 shadow-[0_20px_40px_-28px_rgba(192,57,43,0.35)]"
      >
        <div className="flex flex-col gap-3 text-sm text-foreground/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Your rope report</p>
            <p className="text-lg font-semibold text-red">{myRow.handle}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Rank {myRow.rank ?? "—"}</p>
          </div>
          <div className="grid gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60 sm:grid-cols-3">
            <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
              <span className="text-[0.7rem] text-foreground/60">Score</span>
              <span className="text-base font-semibold text-red">{myRow.score}</span>
            </span>
            <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
              <span className="text-[0.7rem] text-foreground/60">Best streak</span>
              <span className="text-base font-semibold text-red">{myRow.streakBest}</span>
            </span>
            <span className="flex flex-col rounded-xl border border-red/20 bg-white/80 px-4 py-2 text-center text-foreground">
              <span className="text-[0.7rem] text-foreground/60">Wins · Losses</span>
              <span className="text-base font-semibold text-red">
                {myRow.wins} · {myRow.losses}
              </span>
            </span>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={motionFade}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-red/20 bg-white/70 p-4 backdrop-blur"
      >
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-foreground/60">
          <span className={cn(overlayActive ? "animate-pulse" : undefined)}>Fetching fresh heroes…</span>
          <span>Resets in {countdown}</span>
        </div>
        <div className="flex flex-col gap-2 text-sm text-foreground/80 sm:flex-row sm:justify-between">
          {topThree.length === 0 && showSkeleton ? (
            <LeaderboardRowSkeleton rows={3} />
          ) : topThree.length === 0 ? (
            <span>No saviors logged yet. Be the first.</span>
          ) : (
            topThree.map((entry) => (
              <motion.div
                key={entry.userId}
                variants={motionListItem}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-2"
              >
                <span className="font-semibold text-red">#{entry.rank}</span>
                <span>{entry.userId === userId ? "You" : entry.handle}</span>
                <span className="font-mono text-xs text-foreground/60">{entry.score} pts</span>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      <section className="space-y-6">
        <Tabs value={scope} onValueChange={(value) => setScope(value as LeaderboardScope)} className="w-full">
          <TabsList className="mx-auto flex w-fit gap-2 rounded-full border border-red/30 bg-white/70 px-2 py-1 shadow-inner">
            {SCOPES.map((item) => (
              <TabsTrigger key={item} value={item} className="data-[state=active]:bg-red data-[state=active]:text-beige">
                {item === "daily" ? "Daily" : "All Time"}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={scope} className="space-y-6">
            <div className="relative">
              {showSkeleton ? (
                <LeaderboardRowSkeleton rows={6} />
              ) : (
                <LeaderboardTable rows={items} userId={userId} />
              )}
              <LoadingOverlay active={overlayActive} label="Refreshing saviors..." />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  variants={motionFade}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-2xl border border-red/30 bg-red/10 p-6 text-center text-sm text-red"
                >
                  <p className="font-semibold">The rope snarled.</p>
                  <p className="mt-2 text-xs text-red/80">{error instanceof Error ? error.message : String(error)}</p>
                  <Button variant="outline" className="mt-4 border-red/40 text-red hover:bg-red/10" onClick={handleRetry}>
                    Retry
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center">
              <Button
                variant="outline"
                className="border-red/40 text-red hover:bg-red/10"
                disabled={!showLoadMore || validating || loadingMore || offline}
                onClick={handleLoadMore}
              >
                {showLoadMore ? (loadingMore ? "Loading..." : "Load more") : "No more saviors"}
              </Button>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-red/0 via-red/20 to-red/0" />

            <SummaryStrip summary={summary} />
          </TabsContent>
        </Tabs>
      </section>

      <div className="flex justify-center text-sm text-foreground/60">
        <Link href="/play" className="font-semibold text-red hover:underline">
          Back to Execution Chamber →
        </Link>
      </div>
      </div>
    </TooltipProvider>
  );
}
