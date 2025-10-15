const WIN_COPY = [
  "i saved majnu bhai. score +{delta}. rank #{rank}.",
  "rope missed. i live to tell. score {total}.",
];

const LOSS_COPY = [
  "majnu is gone. i failed. rank #{rank}.",
  "i could not save him. try your luck.",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function safeValue(value: number | null | undefined, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function formatDelta(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : String(value);
}

export type ShareContext = {
  outcome: "win" | "loss";
  scoreDelta: number | null | undefined;
  scoreTotal: number | null | undefined;
  rank: number | null | undefined;
};

export function buildShareCopy(context: ShareContext): string {
  const pool = context.outcome === "win" ? WIN_COPY : LOSS_COPY;
  const template = pickRandom(pool);
  const rank = safeValue(context.rank, "unranked");
  const total = safeValue(context.scoreTotal, "0");
  const delta = formatDelta(context.scoreDelta);

  return template
    .replace("{rank}", rank)
    .replace("{total}", total)
    .replace("{delta}", delta);
}

export { WIN_COPY, LOSS_COPY };
