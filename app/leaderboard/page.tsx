import { cookies } from "next/headers";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getLeaderboard,
  getOrCreateAnonymousUser,
  getUserStats,
  now as instantNow,
} from "@/lib/instantdb";

const USER_COOKIE = "majnu-user-id";
const COOKIE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function cookieExpiry(): Date {
  return new Date(Date.parse(instantNow()) + COOKIE_TTL_MS);
}

export const metadata = {
  title: "Leaderboard | Save Majnu Bhai",
};

function formatHandle(handle: string | null, fallback: string) {
  if (handle && handle.trim().length > 0) {
    return handle;
  }
  return fallback;
}

function LeaderboardTable({
  entries,
  currentUserId,
}: {
  entries: Awaited<ReturnType<typeof getLeaderboard>>["entries"];
  currentUserId: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-red/30 bg-white/70 p-8 text-center text-foreground/70">
        No games logged yet. Be the first to keep Majnu alive.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red/30 shadow-[0_20px_50px_-30px_rgba(192,57,43,0.4)]">
      <table className="w-full min-w-[320px] divide-y divide-red/20 bg-white/90 text-left text-sm">
        <thead className="bg-red/10 text-xs uppercase tracking-[0.3em] text-red">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3">Wins</th>
            <th className="px-4 py-3">Losses</th>
            <th className="px-4 py-3">Streak</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isSelf = entry.user_id === currentUserId;
            return (
              <tr
                key={`${entry.user_id}-${entry.rank}`}
                className={`border-b border-red/10 ${
                  isSelf ? "bg-red/10 font-semibold" : "bg-white"
                }`}
              >
                <td className="px-4 py-3">{entry.rank}</td>
                <td className="px-4 py-3">
                  {formatHandle(entry.handle, isSelf ? "You" : "Anonymous")}
                </td>
                <td className="px-4 py-3">{entry.wins}</td>
                <td className="px-4 py-3">{entry.losses}</td>
                <td className="px-4 py-3">{entry.streak_best}</td>
                <td className="px-4 py-3 font-mono">{entry.score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YourRankCard({
  title,
  entry,
}: {
  title: string;
  entry: Awaited<ReturnType<typeof getLeaderboard>>["userEntry"];
}) {
  return (
    <div className="rounded-2xl border border-dashed border-red/30 bg-white/80 p-6 shadow-[0_10px_30px_-20px_rgba(192,57,43,0.4)]">
      <p className="text-xs uppercase tracking-[0.3em] text-red">{title}</p>
      <h2 className="mt-1 font-display text-3xl uppercase tracking-[0.2em] text-red">
        {entry?.rank ? `Rank ${entry.rank}` : "Unranked"}
      </h2>
      <p className="mt-2 text-sm text-foreground/70">
        Wins: {entry?.wins ?? 0} · Losses: {entry?.losses ?? 0} · Streak Best: {entry?.streak_best ?? 0}
      </p>
      <p className="text-sm text-foreground/70">Score: {entry?.score ?? 0}</p>
    </div>
  );
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-3 text-center">
        <Badge className="mx-auto bg-red/10 text-red">Bollywood Gallows Rankings</Badge>
        <h1 className="font-display text-5xl uppercase tracking-[0.3em] text-red">
          Leaderboard
        </h1>
        <p className="text-sm text-foreground/70">
          Wins earn +3, losses shave off 1. Survive consecutive rounds to stack streak bonuses.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] text-foreground/60">
          <span>Wins: {stats.wins_all}</span>
          <span>Losses: {stats.losses_all}</span>
          <span>Current Streak: {stats.streak_current}</span>
          <span>Best Streak: {stats.streak_best}</span>
          <span>Total Score: {stats.score_total}</span>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mx-auto flex w-fit gap-2 rounded-full border border-red/30 bg-white/70 px-2 py-1 shadow-inner">
          <TabsTrigger value="daily" className="data-[state=active]:bg-red data-[state=active]:text-beige">
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-red data-[state=active]:text-beige">
            Weekly
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="space-y-6">
          <LeaderboardTable entries={daily.entries} currentUserId={user.id} />
          <YourRankCard title="Your Daily Rank" entry={daily.userEntry} />
        </TabsContent>
        <TabsContent value="weekly" className="space-y-6">
          <LeaderboardTable entries={weekly.entries} currentUserId={user.id} />
          <YourRankCard title="Your Weekly Rank" entry={weekly.userEntry} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-center text-sm text-foreground/60">
        <Link href="/play" className="font-semibold text-red hover:underline">
          Back to the execution chamber →
        </Link>
      </div>
    </div>
  );
}
