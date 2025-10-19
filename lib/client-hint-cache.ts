"use client";

type HintRecord = {
  domain: string;
  word: string;
  hint: string;
  updatedAt: number;
};

type HintCache = Record<string, HintRecord[]>;

const CACHE_KEY = "majnu-hint-cache";
const CACHE_LIMIT = 20;

function safeParse(value: string | null): HintCache {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as HintCache;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function readCache(): HintCache {
  if (typeof window === "undefined") {
    return {};
  }
  return safeParse(window.localStorage.getItem(CACHE_KEY));
}

function writeCache(cache: HintCache) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore write failures
  }
}

export function rememberHint(domain: string, word: string, hint: string): void {
  const normalizedDomain = domain.toLowerCase();
  const normalizedWord = word.toLowerCase();
  const cache = readCache();
  const records = cache[normalizedDomain] ?? [];
  const filtered = records.filter((entry) => entry.word !== normalizedWord);
  const updated: HintRecord = {
    domain: normalizedDomain,
    word: normalizedWord,
    hint,
    updatedAt: Date.now(),
  };
  cache[normalizedDomain] = [updated, ...filtered].slice(0, CACHE_LIMIT);
  writeCache(cache);
}

export function findCachedHint(domain: string, word: string): { hint: string; minutesAgo: number } | null {
  const normalizedDomain = domain.toLowerCase();
  const normalizedWord = word.toLowerCase();
  const cache = readCache();
  const records = cache[normalizedDomain];
  if (!records) {
    return null;
  }
  const match = records.find((entry) => entry.word === normalizedWord);
  if (!match) {
    return null;
  }
  const minutesAgo = Math.floor((Date.now() - match.updatedAt) / (60 * 1000));
  return { hint: match.hint, minutesAgo };
}
