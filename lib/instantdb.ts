import { randomUUID } from "crypto";

import domains from "@/data/domains.json";

import type { GameStatus } from "@/lib/game";
import { dateKey, weekKey } from "@/lib/datekeys";
import { scoreDelta, type GameResult } from "@/lib/score";
import { logServerError, logServerEvent } from "@/lib/logger";

export type UserRecord = {
  id: string;
  handle?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export type GameMode = "standard" | "daily";

export type GameRecord = {
  id: string;
  user_id: string;
  domain: string;
  mode: GameMode;
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

export type LeaderboardListItem = LeaderboardEntry & {
  cursor: string;
  badges: string[];
  updated_at: string;
  trend?: "up" | "down" | "same";
};

export type LeaderboardPage = {
  items: LeaderboardListItem[];
  userEntry: LeaderboardListItem | null;
  nextCursor?: string;
  total: number;
  summary: {
    wins: number;
    losses: number;
    games: number;
  };
};

type RateBucket = {
  windowStart: number;
  count: number;
};

export type HintRecord = {
  id: string;
  domain: string;
  word: string;
  hint: string;
  created_at: string;
};

export type AchievementRecord = {
  id: string;
  user_id: string;
  key: string;
  title: string;
  description: string;
  unlocked_at: string;
};

export type ShortLinkRecord = {
  id: string;
  target: string;
  created_at: string;
};

export type DailyPuzzleRecord = {
  date_key: string;
  domain: string;
  word: string;
  hint: string;
  created_at: string;
};

export type UserStreakRecord = {
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_play_date: string | null;
  total_daily_played: number;
};

type RankSnapshot = {
  scope_key: string;
  user_id: string;
  rank: number;
  captured_at: string;
};

type InMemoryInstantDB = {
  users: Map<string, UserRecord>;
  games: Map<string, GameRecord>;
  userStats: Map<string, UserStatsRecord>;
  leaderboardsDaily: Map<string, LeaderboardRecord>;
  leaderboardsWeekly: Map<string, LeaderboardRecord>;
  guessBuckets: Map<string, RateBucket>;
  finishBuckets: Map<string, RateBucket>;
  hints: Map<string, HintRecord>;
  handles: Map<string, string>;
  achievements: Map<string, AchievementRecord>;
  shortLinks: Map<string, ShortLinkRecord>;
  wordHistory: Map<string, string[]>;
  gameFinishes: Map<string, GameFinishSnapshot>;
  dailyWords: Map<string, DailySelection>;
  dailyAttempts: Map<string, string>;
  dailyHistory: string[];
  dailyPuzzles: Map<string, DailyPuzzleRecord>;
  userStreaks: Map<string, UserStreakRecord>;
  leaderboardSnapshots: Map<string, RankSnapshot>;
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
      finishBuckets: new Map<string, RateBucket>(),
      hints: new Map<string, HintRecord>(),
      handles: new Map<string, string>(),
      achievements: new Map<string, AchievementRecord>(),
      shortLinks: new Map<string, ShortLinkRecord>(),
      wordHistory: new Map<string, string[]>(),
      gameFinishes: new Map<string, GameFinishSnapshot>(),
      dailyWords: new Map<string, DailySelection>(),
      dailyAttempts: new Map<string, string>(),
      dailyHistory: [],
      dailyPuzzles: new Map<string, DailyPuzzleRecord>(),
      userStreaks: new Map<string, UserStreakRecord>(),
      leaderboardSnapshots: new Map<string, RankSnapshot>(),
    };
  }

  return globalThis.__MAJNU_DB__;
}

const store = createStore();

function cloneGameRecord(record: GameRecord): GameRecord {
  return {
    ...record,
    guessed_letters: [...record.guessed_letters],
    wrong_letters: [...record.wrong_letters],
  };
}

function cloneUserStatsRecord(record: UserStatsRecord): UserStatsRecord {
  return { ...record };
}

function cloneLeaderboardRecord(record: LeaderboardRecord): LeaderboardRecord {
  return { ...record };
}

async function withRetries<T>(operation: () => Promise<T>, retries = 2, context: Record<string, unknown> = {}): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any;
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logServerError("instantdb_retry_error", error, {
        attempt,
        ...context,
      });
      attempt += 1;
      if (attempt > retries) {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function getOrCreateAnonymousUser(id?: string): Promise<UserRecord> {
  if (id) {
    const user = store.users.get(id);
    if (user) {
      if (user.handle) {
        store.handles.set(user.handle.toLowerCase(), user.id);
      }
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

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  return store.users.get(id);
}

function normaliseHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export async function isHandleAvailable(handle: string, userId?: string): Promise<boolean> {
  const normalized = normaliseHandle(handle);
  const existingOwner = store.handles.get(normalized);
  if (!existingOwner) {
    return true;
  }
  return existingOwner === userId;
}

export async function setUserHandle(userId: string, handle: string): Promise<UserRecord> {
  const user = store.users.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const sanitized = handle.replace(/^@/, "").trim();
  if (sanitized.length === 0) {
    throw new Error("Handle cannot be empty");
  }

  if (user.handle && user.handle.toLowerCase() !== sanitized.toLowerCase()) {
    throw new Error("Handle already set");
  }

  const normalized = normaliseHandle(sanitized);
  const existingOwner = store.handles.get(normalized);
  if (existingOwner && existingOwner !== userId) {
    throw new Error("Handle already taken");
  }

  user.handle = sanitized;
  store.users.set(userId, user);
  store.handles.set(normalized, userId);
  return user;
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
  mode = "standard",
}: {
  userId: string;
  domain: string;
  answer: string;
  hint: string;
  masked: string;
  mode?: GameMode;
}): Promise<GameRecord> {
  const id = randomUUID();
  const record: GameRecord = {
    id,
    user_id: userId,
    domain,
    mode,
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
  logServerEvent("instantdb_create_game", {
    gameId: id,
    userId,
    domain,
    mode,
    createdAt: record.created_at,
  });
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
  logServerEvent("instantdb_update_game", {
    gameId: id,
    userId: updated.user_id,
    status: updated.status,
    finishedAt: updated.finished_at,
    patchKeys: Object.keys(patch),
  });
  return updated;
}

export async function listGamesByUser(userId: string): Promise<GameRecord[]> {
  return Array.from(store.games.values()).filter((game) => game.user_id === userId);
}

function hintKey(domain: string, word: string): string {
  return `${domain.toLowerCase()}::${word.toLowerCase()}`;
}

export async function getCachedHint(
  domain: string,
  word: string,
): Promise<HintRecord | undefined> {
  return store.hints.get(hintKey(domain, word));
}

export async function saveHint(
  domain: string,
  word: string,
  hint: string,
): Promise<HintRecord> {
  const id = hintKey(domain, word);
  const record: HintRecord = {
    id,
    domain,
    word,
    hint,
    created_at: now(),
  };
  store.hints.set(id, record);
  return record;
}

const ACHIEVEMENT_DEFINITIONS: Record<string, { title: string; description: string; predicate: (context: { result: GameResult; stats: UserStatsRecord; streakBefore: number }) => boolean }> = {
  first_win: {
    title: "First Blood",
    description: "You saved Majnu for the first time.",
    predicate: ({ result, stats }) => result === "win" && stats.wins_all === 1,
  },
  first_loss: {
    title: "Too Slow",
    description: "Your first loss. The don is displeased.",
    predicate: ({ result, stats }) => result === "loss" && stats.losses_all === 1,
  },
  hot_streak: {
    title: "Hot Streak",
    description: "Five wins in a row. Rope dodged!",
    predicate: ({ result, stats, streakBefore }) => result === "win" && streakBefore >= 4 && stats.streak_current >= 5,
  },
};

function achievementKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

export async function getAchievements(userId: string): Promise<AchievementRecord[]> {
  return Array.from(store.achievements.values()).filter((record) => record.user_id === userId);
}

async function unlockAchievements(
  userId: string,
  context: { result: GameResult; stats: UserStatsRecord; streakBefore: number },
): Promise<AchievementRecord[]> {
  const unlocked: AchievementRecord[] = [];
  for (const [key, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    const alreadyUnlocked = store.achievements.get(achievementKey(userId, key));
    if (alreadyUnlocked) continue;
    if (!definition.predicate(context)) continue;
    const record: AchievementRecord = {
      id: randomUUID(),
      user_id: userId,
      key,
      title: definition.title,
      description: definition.description,
      unlocked_at: now(),
    };
    store.achievements.set(achievementKey(userId, key), record);
    unlocked.push(record);
  }
  return unlocked;
}

function generateShortId(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createShortLink(target: string): Promise<ShortLinkRecord> {
  let id = generateShortId();
  while (store.shortLinks.has(id)) {
    id = generateShortId();
  }
  const record: ShortLinkRecord = {
    id,
    target,
    created_at: now(),
  };
  store.shortLinks.set(id, record);
  return record;
}

export async function getShortLink(id: string): Promise<ShortLinkRecord | undefined> {
  return store.shortLinks.get(id);
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
  logServerEvent("instantdb_update_leaderboard", {
    scope,
    scopeKey,
    userId,
    wins: record.wins,
    losses: record.losses,
    score: record.score,
    streakBest: record.streak_best,
    updatedAt: record.updated_at,
  });
}

export type OnGameFinishResult = {
  scoreDelta: number;
  stats: UserStatsRecord;
  throttled: boolean;
  requiresHandle: boolean;
  achievements: AchievementRecord[];
};

const WORD_HISTORY_SIZE = 15;

function historyKey(userId: string, domain: string): string {
  return `${userId.toLowerCase()}::${domain.toLowerCase()}`;
}

export function getRecentWordsForUser(userId: string, domain: string): string[] {
  const key = historyKey(userId, domain);
  const recent = store.wordHistory.get(key);
  return recent ? [...recent] : [];
}

export function rememberWordForUser(userId: string, domain: string, word: string) {
  const key = historyKey(userId, domain);
  const current = store.wordHistory.get(key) ?? [];
  const normalized = word.toLowerCase();
  const next = [normalized, ...current.filter((value) => value !== normalized)].slice(
    0,
    WORD_HISTORY_SIZE,
  );
  store.wordHistory.set(key, next);
}

type DailySelection = {
  domain: string;
  word: string;
};

const DAILY_HISTORY_LIMIT = 15;

const DAILY_CANDIDATES: DailySelection[] = Object.entries(domains).flatMap(
  ([domain, definition]) =>
    definition.words.map((word) => ({
      domain,
      word: word.toLowerCase(),
    })),
);

function stringToSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function shuffleDaily(items: DailySelection[], seedKey: string): DailySelection[] {
  const seed = stringToSeed(seedKey);
  let state = seed;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function dailySelectionKey(selection: DailySelection): string {
  return `${selection.domain}::${selection.word}`;
}

function dailyAttemptKey(userId: string, dateKey: string): string {
  return `${userId}:${dateKey}`;
}

export function getDailySelection(dateKey: string): DailySelection {
  const existing = store.dailyWords.get(dateKey);
  if (existing) {
    return existing;
  }

  const recent = new Set(store.dailyHistory);
  const shuffled = shuffleDaily(DAILY_CANDIDATES, dateKey);
  const choice =
    shuffled.find((candidate) => !recent.has(dailySelectionKey(candidate))) ??
    shuffled[0];

  store.dailyWords.set(dateKey, choice);
  store.dailyHistory = [
    dailySelectionKey(choice),
    ...store.dailyHistory.filter((key) => key !== dailySelectionKey(choice)),
  ].slice(0, DAILY_HISTORY_LIMIT);

  return choice;
}

export function recordDailyAttempt(userId: string, date: string, gameId: string) {
  store.dailyAttempts.set(dailyAttemptKey(userId, date), gameId);
}

export function getDailyAttempt(userId: string, date: string): string | undefined {
  return store.dailyAttempts.get(dailyAttemptKey(userId, date));
}

export function getDailyPuzzle(date: string): DailyPuzzleRecord | undefined {
  return store.dailyPuzzles.get(date);
}

export function saveDailyPuzzle(record: DailyPuzzleRecord): DailyPuzzleRecord {
  store.dailyPuzzles.set(record.date_key, record);
  return record;
}

export function ensureDailyPuzzle(date: string): DailyPuzzleRecord {
  const existing = getDailyPuzzle(date);
  if (existing) {
    return existing;
  }

  const selection = getDailySelection(date);
  const domainConfig = domains[selection.domain as keyof typeof domains];
  const record: DailyPuzzleRecord = {
    date_key: date,
    domain: selection.domain,
    word: selection.word,
    hint: domainConfig?.hint ?? `Clue from ${selection.domain}`,
    created_at: now(),
  };
  saveDailyPuzzle(record);
  return record;
}

function streakKey(userId: string): string {
  return userId;
}

export function getUserStreakRecord(userId: string): UserStreakRecord {
  let record = store.userStreaks.get(streakKey(userId));
  if (!record) {
    record = {
      user_id: userId,
      current_streak: 0,
      best_streak: 0,
      last_play_date: null,
      total_daily_played: 0,
    };
    store.userStreaks.set(streakKey(userId), record);
  }
  return record;
}

export function updateUserDailyStreak(userId: string, date: string, result: GameResult): UserStreakRecord {
  const record = { ...getUserStreakRecord(userId) };
  const previousDate = record.last_play_date;
  if (result === "loss" && previousDate === date) {
    // already recorded today
    store.userStreaks.set(streakKey(userId), record);
    return record;
  }

  if (previousDate) {
    const prev = new Date(previousDate);
    const current = new Date(date);
    const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      record.current_streak += 1;
    } else if (diff > 1) {
      record.current_streak = 1;
    }
  } else {
    record.current_streak = 1;
  }

  if (result === "loss") {
    record.current_streak = 0;
  }

  record.best_streak = Math.max(record.best_streak, record.current_streak);
  record.last_play_date = date;
  record.total_daily_played += 1;
  store.userStreaks.set(streakKey(userId), record);
  return record;
}

function snapshotKey(scopeKey: string, userId: string): string {
  return `${scopeKey}:${userId}`;
}

function recordRankSnapshot(scopeKey: string, userId: string, rank: number) {
  const key = snapshotKey(scopeKey, userId);
  store.leaderboardSnapshots.set(key, {
    scope_key: scopeKey,
    user_id: userId,
    rank,
    captured_at: now(),
  });
}

function resolveRankTrend(scopeKey: string, userId: string, currentRank: number | null): "up" | "down" | "same" | undefined {
  if (currentRank == null) {
    return undefined;
  }
  const previous = store.leaderboardSnapshots.get(snapshotKey(scopeKey, userId));
  if (!previous) {
    recordRankSnapshot(scopeKey, userId, currentRank);
    return undefined;
  }

  const trend = previous.rank === currentRank ? "same" : previous.rank > currentRank ? "up" : "down";
  recordRankSnapshot(scopeKey, userId, currentRank);
  return trend;
}

export type GameFinishSnapshot = {
  game: GameRecord;
  scoreDelta: number;
  scoreTotal: number;
  throttled: boolean;
  requiresHandle: boolean;
  achievements: AchievementRecord[];
};

export async function finalizeGame(
  gameId: string,
  result: GameResult,
  patch: Partial<
    Pick<
      GameRecord,
      | "word_masked"
      | "wrong_guesses_count"
      | "status"
      | "finished_at"
      | "guessed_letters"
      | "wrong_letters"
    >
  > & { finished_at?: string },
): Promise<GameFinishSnapshot> {
  const cached = store.gameFinishes.get(gameId);
  if (cached) {
    return cached;
  }

  const game = await getGameById(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "active") {
    const stats = getOrCreateUserStats(game.user_id);
    const snapshot: GameFinishSnapshot = {
      game,
      scoreDelta: 0,
      scoreTotal: stats.score_total,
      throttled: false,
      requiresHandle: false,
      achievements: [],
    };
    store.gameFinishes.set(gameId, snapshot);
    return snapshot;
  }
  const activeGame = cloneGameRecord(game);

  const attemptFinalize = async (): Promise<GameFinishSnapshot> => {
    const finishedAt = patch.finished_at ?? now();
    const finishedDate = new Date(finishedAt);

    const originalGame = cloneGameRecord(activeGame);
    const existingStats = store.userStats.get(activeGame.user_id);
    const statsBackup = existingStats ? cloneUserStatsRecord(existingStats) : null;

    const dailyKey = leaderboardKey(dateKey(finishedDate), activeGame.user_id);
    const weeklyKey = leaderboardKey(weekKey(finishedDate), activeGame.user_id);
    const existingDaily = store.leaderboardsDaily.get(dailyKey);
    const dailyBackup = existingDaily ? cloneLeaderboardRecord(existingDaily) : null;
    const existingWeekly = store.leaderboardsWeekly.get(weeklyKey);
    const weeklyBackup = existingWeekly ? cloneLeaderboardRecord(existingWeekly) : null;
    const finishBackup = store.gameFinishes.get(gameId);

    try {
      const updated = await updateGame(gameId, {
        ...patch,
        status: result === "win" ? "won" : "lost",
        finished_at: finishedAt,
      });

      const finishResult = await onGameFinish(
        updated.id,
        result,
        updated.user_id,
        finishedDate,
      );

      const finalGame = (await getGameById(gameId)) ?? updated;
      if (finalGame.mode === "daily") {
        updateUserDailyStreak(finalGame.user_id, dateKey(finishedDate), result);
      }
      const snapshot: GameFinishSnapshot = {
        game: finalGame,
        scoreDelta: finishResult.scoreDelta,
        scoreTotal: finishResult.stats.score_total,
        throttled: finishResult.throttled,
        requiresHandle: finishResult.requiresHandle,
        achievements: finishResult.achievements,
      };

      store.gameFinishes.set(gameId, snapshot);
      logServerEvent("instantdb_finalize_game", {
        gameId,
        userId: finalGame.user_id,
        result,
        finishedAt,
      });

      return snapshot;
    } catch (error) {
      store.games.set(gameId, originalGame);
      if (statsBackup) {
        store.userStats.set(activeGame.user_id, statsBackup);
      } else {
        store.userStats.delete(activeGame.user_id);
      }
      if (dailyBackup) {
        store.leaderboardsDaily.set(dailyKey, dailyBackup);
      } else {
        store.leaderboardsDaily.delete(dailyKey);
      }
      if (weeklyBackup) {
        store.leaderboardsWeekly.set(weeklyKey, weeklyBackup);
      } else {
        store.leaderboardsWeekly.delete(weeklyKey);
      }
      if (finishBackup) {
        store.gameFinishes.set(gameId, finishBackup);
      } else {
        store.gameFinishes.delete(gameId);
      }
      throw error;
    }
  };

  return withRetries(() => attemptFinalize(), 2, {
    gameId,
    result,
  });
}

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
      throttled: false,
      requiresHandle: false,
      achievements: [],
    };
  }

  const stats = getOrCreateUserStats(userId);
  const streakBefore = stats.streak_current;
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User missing during finish");
  }

  const missingHandle = !user.handle;
  const isAllowed = missingHandle ? true : registerFinish(userId);

  if (!isAllowed) {
    await updateGame(gameId, {
      scored: true,
      result,
      finished_at: game.finished_at ?? now(),
    });
    return {
      scoreDelta: 0,
      stats,
      throttled: true,
      requiresHandle: false,
      achievements: [],
    };
  }

  const baseDelta = scoreDelta(result, streakBefore);
  const dailyBonus = game.mode === "daily" && result === "win" ? 2 : 0;
  const delta = baseDelta + dailyBonus;

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
  logServerEvent("instantdb_update_stats", {
    userId,
    result,
    scoreTotal: stats.score_total,
    wins: stats.wins_all,
    losses: stats.losses_all,
    streakCurrent: stats.streak_current,
    streakBest: stats.streak_best,
    finishedAt: finishedAt.toISOString(),
  });

  const scopeDate = finishedAt;
  const dailyKey = dateKey(scopeDate);
  const weeklyKey = weekKey(scopeDate);

  if (!missingHandle) {
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
  }

  await updateGame(gameId, {
    scored: true,
    result,
    finished_at: game.finished_at ?? now(),
  });

  const achievements = await unlockAchievements(userId, {
    result,
    stats,
    streakBefore,
  });

  return {
    scoreDelta: delta,
    stats,
    throttled: false,
    requiresHandle: missingHandle,
    achievements,
  };
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
      if (b.streak_best !== a.streak_best) return b.streak_best - a.streak_best;
      return a.updated_at.localeCompare(b.updated_at);
    });
}

function recentResults(userId: string, limit = 3): GameResult[] {
  return Array.from(store.games.values())
    .filter((game) => game.user_id === userId && game.result && game.finished_at)
    .sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""))
    .slice(0, limit)
    .map((game) => game.result as GameResult);
}

function computeBadges(userId: string, stats: UserStatsRecord): string[] {
  const badges: string[] = [];
  if (stats.streak_current >= 5) {
    badges.push("Hot Streak");
  }

  const results = recentResults(userId, 3);
  if (
    results.length === 3 &&
    results[0] === "win" &&
    results[1] === "win" &&
    results[2] === "loss"
  ) {
    badges.push("Comeback");
  }

  return badges;
}

function formatLeaderboardItem(
  record: LeaderboardRecord,
  rank: number,
  scopeKey: string,
): LeaderboardListItem {
  const user = store.users.get(record.user_id);
  const stats = getOrCreateUserStats(record.user_id);
  const badges = computeBadges(record.user_id, stats);
  const trend = resolveRankTrend(scopeKey, record.user_id, rank);

  return {
    cursor: record.id,
    user_id: record.user_id,
    handle: user?.handle ?? null,
    wins: record.wins,
    losses: record.losses,
    score: record.score,
    streak_best: record.streak_best,
    rank,
    badges,
    updated_at: record.updated_at,
    trend,
  };
}

export async function getLeaderboard(
  scope: "daily" | "weekly",
  limit: number,
  userId: string,
  options: { cursor?: string; date?: Date } = {},
): Promise<LeaderboardPage> {
  const { cursor, date = new Date() } = options;
  const scopeKey = scope === "daily" ? dateKey(date) : weekKey(date);
  const map = getLeaderboardMap(scope);
  const relevant = Array.from(map.values()).filter((record) => record.scope_key === scopeKey);
  const sorted = sortLeaderboard(relevant);
  const total = sorted.length;
  const totals = sorted.reduce(
    (acc, record) => {
      acc.wins += record.wins;
      acc.losses += record.losses;
      return acc;
    },
    { wins: 0, losses: 0 },
  );

  let startIndex = 0;
  if (cursor) {
    const [ts, cursorId] = cursor.split("::");
    const cursorTime = Date.parse(ts);
    if (cursorId) {
      const cursorIndex = sorted.findIndex((record) => record.id === cursorId);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      } else if (!Number.isNaN(cursorTime)) {
        const nextIndex = sorted.findIndex((record) => Date.parse(record.updated_at) > cursorTime);
        startIndex = nextIndex >= 0 ? nextIndex : sorted.length;
      }
    } else if (!Number.isNaN(cursorTime)) {
      const nextIndex = sorted.findIndex((record) => Date.parse(record.updated_at) > cursorTime);
      startIndex = nextIndex >= 0 ? nextIndex : sorted.length;
    }
  }

  const slice = sorted.slice(startIndex, startIndex + limit);
  const items = slice.map((record, index) =>
    formatLeaderboardItem(record, startIndex + index + 1, scopeKey),
  );

  const nextRecord = sorted[startIndex + limit];
  const nextCursor = nextRecord ? `${nextRecord.updated_at}::${nextRecord.id}` : undefined;

  let userEntry: LeaderboardListItem | null = null;
  const userIndex = sorted.findIndex((record) => record.user_id === userId);
  if (userIndex >= 0) {
    userEntry = formatLeaderboardItem(sorted[userIndex], userIndex + 1, scopeKey);
  }

  return {
    items,
    userEntry,
    nextCursor,
    total,
    summary: {
      wins: totals.wins,
      losses: totals.losses,
      games: totals.wins + totals.losses,
    },
  };
}

export async function getUserRank(
  scope: "daily" | "weekly",
  userId: string,
  date: Date = new Date(),
): Promise<number | null> {
  const scopeKey = scope === "daily" ? dateKey(date) : weekKey(date);
  const map = getLeaderboardMap(scope);
  const relevant = Array.from(map.values()).filter((record) => record.scope_key === scopeKey);
  const sorted = sortLeaderboard(relevant);
  const index = sorted.findIndex((record) => record.user_id === userId);
  return index >= 0 ? index + 1 : null;
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

const FINISH_LIMIT_PER_MINUTE = 8;

function registerFinish(userId: string): boolean {
  const nowTs = Date.now();
  const windowMs = 60 * 1000;
  let bucket = store.finishBuckets.get(userId);
  if (!bucket) {
    bucket = { windowStart: nowTs, count: 0 };
  }

  if (nowTs - bucket.windowStart > windowMs) {
    bucket.windowStart = nowTs;
    bucket.count = 0;
  }

  if (bucket.count >= FINISH_LIMIT_PER_MINUTE) {
    store.finishBuckets.set(userId, bucket);
    return false;
  }

  bucket.count += 1;
  store.finishBuckets.set(userId, bucket);
  return true;
}
