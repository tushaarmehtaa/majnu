import { getRecentWordsForUser, rememberWordForUser } from "@/lib/instantdb";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function shuffleWithSeed<T>(items: T[], seedKey: string): T[] {
  const seed = stringToSeed(seedKey || "majnu");
  const random = mulberry32(seed);
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type SelectWordOptions = {
  domain: string;
  pool: string[];
  userId: string;
  preferred?: string | null;
  today?: string;
};

export async function selectWordForUser({
  domain,
  pool,
  userId,
  preferred,
  today,
}: SelectWordOptions): Promise<string> {
  if (pool.length === 0) {
    throw new Error(`Domain ${domain} has no words configured`);
  }

  const normalizedPool = pool.map((word) => word.toLowerCase());
  const normalizedPreferred = preferred?.toLowerCase();

  if (normalizedPreferred && normalizedPool.includes(normalizedPreferred)) {
    await rememberWordForUser(userId, domain, normalizedPreferred);
    return normalizedPreferred;
  }

  const recent = new Set(getRecentWordsForUser(userId, domain));
  const seedKey = `${userId}:${today ?? new Date().toISOString().split("T")[0]}`;
  const shuffled = shuffleWithSeed(normalizedPool, seedKey);
  const choice = shuffled.find((word) => !recent.has(word)) ?? shuffled[0];

  await rememberWordForUser(userId, domain, choice);
  return choice;
}
