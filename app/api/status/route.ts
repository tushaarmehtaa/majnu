import { NextResponse } from "next/server";

import { getLeaderboard, getOrCreateAnonymousUser } from "@/lib/instantdb";
import { logServerError, logServerEvent } from "@/lib/logger";

const STATUS_USER_ID = "status-probe";

export async function GET() {
  try {
    const user = await getOrCreateAnonymousUser(STATUS_USER_ID);
    const [daily, weekly] = await Promise.all([
      getLeaderboard("daily", 5, user.id),
      getLeaderboard("weekly", 5, user.id),
    ]);

    const version =
      process.env.NEXT_PUBLIC_APP_VERSION ||
      process.env.APP_VERSION ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "dev";

    logServerEvent("status_probe", {
      version,
      uptime: process.uptime(),
      dailyPlayers: daily.total,
      weeklyPlayers: weekly.total,
    });

    return NextResponse.json({
      status: "ok",
      version,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
      leaderboard: {
        daily: {
          players: daily.total,
          wins: daily.summary.wins,
          losses: daily.summary.losses,
          games: daily.summary.games,
        },
        weekly: {
          players: weekly.total,
          wins: weekly.summary.wins,
          losses: weekly.summary.losses,
          games: weekly.summary.games,
        },
      },
    });
  } catch (error) {
    logServerError("status_probe_error", error);
    return NextResponse.json({ status: "error", message: "status unavailable" }, { status: 500 });
  }
}
