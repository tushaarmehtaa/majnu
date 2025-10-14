export type GameResult = "win" | "loss";

export function scoreDelta(result: GameResult, streakBefore: number): number {
  const base = result === "win" ? 3 : -1;
  if (result === "loss") {
    return base;
  }

  const bonus = streakBefore >= 3 ? Math.min(streakBefore - 2, 5) : 0;
  return base + bonus;
}
