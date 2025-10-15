const BUFFER_SIZE = 15;

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

export function selectWordForDomain(domain: string, pool: string[], userId: string): string {
  if (pool.length === 0) {
    throw new Error(`Domain ${domain} has no words configured`);
  }

  if (typeof window === "undefined") {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const key = `recentWords:${domain}`;
  let recentList: string[] = [];
  try {
    recentList = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(recentList)) {
      recentList = [];
    }
  } catch {
    recentList = [];
  }

  const recent = new Set(recentList);
  const seed = `${userId}:${new Date().toDateString()}`;
  const shuffled = shuffleWithSeed(pool, seed);
  const choice = shuffled.find((word) => !recent.has(word)) ?? shuffled[0];

  const next = [choice, ...recentList.filter((word) => word !== choice)];
  try {
    window.localStorage.setItem(key, JSON.stringify(next.slice(0, BUFFER_SIZE)));
  } catch {
    // ignore storage errors
  }

  return choice;
}
