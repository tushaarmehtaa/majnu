const PALETTE = [
  "#F97316",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#EC4899",
  "#0EA5E9",
  "#F59E0B",
  "#14B8A6",
  "#8B5CF6",
  "#FACC15",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildAvatar(seed: string): { color: string; initials: string } {
  const normalized = seed.trim();
  const hash = hashString(normalized.length > 0 ? normalized : "majnu");
  const color = PALETTE[hash % PALETTE.length];
  const parts = normalized.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "M";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "";
  const initials = `${first ?? "M"}${second ?? ""}`.toUpperCase();

  return { color, initials };
}
