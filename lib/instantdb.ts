import { randomUUID } from "crypto";

import type { GameStatus } from "@/lib/game";
import { dateKey, weekKey } from "@/lib/datekeys";
import { scoreDelta, type GameResult } from "@/lib/score";

export type UserRecord = {
  id: string;
  handle?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export type GameRecord = {
  id: string;
  user_id: string;
  domain: string;
  word_answer: string;
  word_masked: string;
  hint: string;
  wrong_guesses_count: number;
  status: GameStatus;
  created_at: string;
  finished_at: string | null;
  guessed_letters: string[];
  wrong_letters: string[];
  scored: boolean;
  result: GameResult | null;
};

export type UserStatsRecord = {
  user_id: string;
  wins_all: number;
  losses_all: number;
  streak_current: number;
  streak_best: number;
  score_total: number;
  updated_at: string;
};

export type LeaderboardRecord = {
  id: string;
  scope_key: string;
  user_id: string;
  wins: number;
  losses: number;
  score: number;
  streak_best: number;
  updated_at: string;
};

type RateBucket = {
  windowStart: number;
  count: number;
};

type InMemoryInstantDB = {
  users: Map<string, UserRecord>;
  games: Map<string, GameRecord>;
  userStats: Map<string, UserStatsRecord>;
  leaderboardsDaily: Map<string, LeaderboardRecord>;
  leaderboardsWeekly: Map<string, LeaderboardRecord>;
  guessBuckets: Map<string, RateBucket>;
};

declare global {
  var __MAJNU_DB__: InMemoryInstantDB | undefined;
}

export function now(): string {
  return new Date().toISOString();
}

function createStore(): InMemoryInstantDB {
  if (!globalThis.__MAJNU_DB__) {
    globalThis.__MAJNU_DB__ = {
      users: new Map<string, UserRecord>(),
      games: new Map<string, GameRecord>(),
      userStats: new Map<string, UserStatsRecord>(),
      leaderboardsDaily: new Map<string, LeaderboardRecord>(),
      leaderboardsWeekly: new Map<string, LeaderboardRecord>(),
      guessBuckets: new Map<string, RateBucket>(),
    };
  }

  return globalThis.__MAJNU_DB__;
}

const store = createStore();

export async function getOrCreateAnonymousUser(id?: string): Promise<UserRecord> {
  if (id) {
    const user = store.users.get(id);
    if (user) {
      return user;
    }
  }

  const userId = id ?? randomUUID();
  const record: UserRecord = {
    id: userId,
    created_at: now(),
    handle: null,
    avatar_url: null,
  };

  store.users.set(userId, record);
  return record;
}

export async function getGameById(id: string): Promise<GameRecord | undefined> {
  return store.games.get(id);
}

export async function createGame({
  userId,
  domain,
  answer,
  hint,
  masked,
}: {
  userId: string;
  domain: string;
  answer: string;
  hint: string;
  masked: string;
}): Promise<GameRecord> {
  const id = randomUUID();
  const record: GameRecord = {
    id,
    user_id: userId,
    domain,
    word_answer: answer,
    word_masked: masked,
    hint,
    wrong_guesses_count: 0,
    status: "active",
    created_at: now(),
    finished_at: null,
    guessed_letters: [],
    wrong_letters: [],
    scored: false,
    result: null,
  };

  store.games.set(id, record);
  return record;
}

export async function updateGame(
  id: string,
  patch: Partial<
    Pick<
      GameRecord,
      | "word_masked"
      | "wrong_guesses_count"
      | "status"
      | "finished_at"
      | "guessed_letters"
      | "wrong_letters"
      | "hint"
      | "scored"
      | "result"
    >
  >,
): Promise<GameRecord> {
  const existing = store.games.get(id);
  if (!existing) {
    throw new Error(`Game ${id} not found`);
  }
  const updated: GameRecord = {
    ...existing,
    ...patch,
  };
  store.games.set(id, updated);
  return updated;
}

export async function listGamesByUser(userId: string): Promise<GameRecord[]> {
  return Array.from(store.games.values()).filter((game) => game.user_id === userId);
}

function getOrCreateUserStats(userId: string): UserStatsRecord {
  let stats = store.userStats.get(userId);
  if (!stats) {
    stats = {
      user_id: userId,
      wins_all: 0,
      losses_all: 0,
      streak_current: 0,
      streak_best: 0,
      score_total: 0,
      updated_at: now(),
    };
    store.userStats.set(userId, stats);
  }
  return stats;
}

function leaderboardKey(scopeKey: string, userId: string): string {
  return `${scopeKey}:${userId}`;
}

function getLeaderboardMap(scope: "daily" | "weekly") {
  return scope === "daily" ? store.leaderboardsDaily : store.leaderboardsWeekly;
}

function upsertLeaderboard(
  scope: "daily" | "weekly",
  scopeKey: string,
  userId: string,
  updater: (record: LeaderboardRecord) => void,
) {
  const map = getLeaderboardMap(scope);
  const id = leaderboardKey(scopeKey, userId);
  let record = map.get(id);
  if (!record) {
    record = {
      id,
      scope_key: scopeKey,
      user_id: userId,
      wins: 0,
      losses: 0,
      score: 0,
      streak_best: 0,
      updated_at: now(),
    };
    map.set(id, record);
  }
  updater(record);
  record.updated_at = now();
  map.set(id, record);
}

export type OnGameFinishResult = {
  scoreDelta: number;
  stats: UserStatsRecord;
};

export async function onGameFinish(
  gameId: string,
  result: GameResult,
  userId: string,
  finishedAt: Date = new Date(),
): Promise<OnGameFinishResult> {
  const game = await getGameById(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  if (game.scored) {
    return {
      scoreDelta: 0,
      stats: getOrCreateUserStats(userId),
    };
  }

  const stats = getOrCreateUserStats(userId);
  const streakBefore = stats.streak_current;
  const delta = scoreDelta(result, streakBefore);

  if (result === "win") {
    stats.wins_all += 1;
    stats.streak_current += 1;
    stats.streak_best = Math.max(stats.streak_best, stats.streak_current);
  } else {
    stats.losses_all += 1;
    stats.streak_current = 0;
  }
  stats.score_total += delta;
  stats.updated_at = now();
  store.userStats.set(userId, stats);

  const scopeDate = finishedAt;
  const dailyKey = dateKey(scopeDate);
  const weeklyKey = weekKey(scopeDate);

  upsertLeaderboard("daily", dailyKey, userId, (record) => {
    if (result === "win") {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
    record.score += delta;
    record.streak_best = Math.max(record.streak_best, stats.streak_current, stats.streak_best);
  });

  upsertLeaderboard("weekly", weeklyKey, userId, (record) => {
    if (result === "win") {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
    record.score += delta;
    record.streak_best = Math.max(record.streak_best, stats.streak_current, stats.streak_best);
  });

  await updateGame(gameId, {
    scored: true,
    result,
    finished_at: game.finished_at ?? now(),
  });

  return { scoreDelta: delta, stats };
}

export async function getUserStats(userId: string): Promise<UserStatsRecord> {
  return getOrCreateUserStats(userId);
}

export type LeaderboardEntry = {
  user_id: string;
  handle: string | null;
  wins: number;
  losses: number;
  score: number;
  streak_best: number;
  rank: number;
};

function sortLeaderboard(records: LeaderboardRecord[]): LeaderboardRecord[] {
  return records
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.updated_at.localeCompare(b.updated_at);
    });
}

export async function getLeaderboard(
  scope: "daily" | "weekly",
  limit: number,
  userId: string,
  date: Date = new Date(),
): Promise<{ entries: LeaderboardEntry[]; userEntry: LeaderboardEntry | null }>
{
  const scopeKey = scope === "daily" ? dateKey(date) : weekKey(date);
  const map = getLeaderboardMap(scope);
  const relevant = Array.from(map.values()).filter((record) => record.scope_key === scopeKey);
  const sorted = sortLeaderboard(relevant);

  const entries = sorted.slice(0, limit).map((record, index) => {
    const user = store.users.get(record.user_id);
    return {
      user_id: record.user_id,
      handle: user?.handle ?? null,
      wins: record.wins,
      losses: record.losses,
      score: record.score,
      streak_best: record.streak_best,
      rank: index + 1,
    };
  });

  let userEntry: LeaderboardEntry | null = null;
  const userIndex = sorted.findIndex((record) => record.user_id === userId);
  if (userIndex >= 0) {
    const record = sorted[userIndex];
    const user = store.users.get(record.user_id);
    userEntry = {
      user_id: record.user_id,
      handle: user?.handle ?? null,
      wins: record.wins,
      losses: record.losses,
      score: record.score,
      streak_best: record.streak_best,
      rank: userIndex + 1,
    };
  }

  return { entries, userEntry };
}

const RATE_LIMIT_PER_MINUTE = 60;

export function checkGuessRate(userId: string): boolean {
  const bucket = store.guessBuckets.get(userId);
  const nowTs = Date.now();
  if (!bucket) {
    store.guessBuckets.set(userId, {
      windowStart: nowTs,
      count: 1,
    });
    return true;
  }

  const windowMs = 60 * 1000;
  if (nowTs - bucket.windowStart > windowMs) {
    bucket.windowStart = nowTs;
    bucket.count = 1;
    store.guessBuckets.set(userId, bucket);
    return true;
  }

  if (bucket.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  bucket.count += 1;
  store.guessBuckets.set(userId, bucket);
  return true;
}
