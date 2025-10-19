function safeValue(value: number | null | undefined, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

export type ShareContext = {
  outcome: "win" | "loss";
  scoreDelta: number | null | undefined;
  scoreTotal: number | null | undefined;
  rank: number | null | undefined;
  handle: string | null | undefined;
  wins: number | null | undefined;
  losses: number | null | undefined;
  streak: number | null | undefined;
};

export function buildShareCopy(context: ShareContext): string {
  const saved = context.outcome === "win";
  const handle = context.handle ? context.handle.replace(/^@?/, "@") : "@anon";
  const wins = safeValue(context.wins, "0");
  const losses = safeValue(context.losses, "0");
  const streak = safeValue(context.streak, "0");
  const score = safeValue(context.scoreTotal, "0");
  const delta = safeValue(context.scoreDelta, "0");
  const rank = safeValue(context.rank, "unranked");
  const subject = saved ? `Majnu Bhai was saved today by ${handle}.` : `Majnu Bhai couldn't be saved today.`;
  const summary = `Score ${score} (Δ${delta}) · Rank ${rank} · Wins ${wins} · Losses ${losses} · Streak ${streak}.`;
  return `${subject} ${summary}`;
}
