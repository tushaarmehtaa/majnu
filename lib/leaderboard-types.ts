export type LeaderboardScope = "daily" | "weekly";

export type LeaderboardSummary = {
  wins: number;
  losses: number;
  games: number;
};

export type LeaderboardRow = {
  userId: string;
  handle: string;
  score: number;
  wins: number;
  losses: number;
  streakBest: number;
  updatedAt: string;
  rank: number | null;
};

export type LeaderboardPayload = {
  items: LeaderboardRow[];
  my?: LeaderboardRow | null;
  summary?: LeaderboardSummary;
  nextCursor?: string | null;
};
