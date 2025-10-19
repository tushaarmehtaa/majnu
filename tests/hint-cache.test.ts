import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findCachedHint, rememberHint } from "@/lib/client-hint-cache";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  (global as typeof global & { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    },
  };
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("client hint cache", () => {
  it("stores and retrieves hints with recency metadata", () => {
    rememberHint("bollywood", "heraferi", "Cult comedy about rent wars.");

    vi.setSystemTime(new Date("2024-01-01T00:05:00Z"));

    const cached = findCachedHint("bollywood", "heraferi");
    expect(cached).not.toBeNull();
    expect(cached?.hint).toBe("Cult comedy about rent wars.");
    expect(cached?.minutesAgo).toBe(5);
  });

  it("keeps only the latest 20 hints per domain", () => {
    for (let index = 0; index < 25; index += 1) {
      rememberHint("startups", `word-${index}`, `hint-${index}`);
    }

    const raw = storage.get("majnu-hint-cache");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "{}") as Record<string, Array<{ word: string }>>;
    const words = parsed.startups.map((entry) => entry.word);

    expect(words).toHaveLength(20);
    expect(words[0]).toBe("word-24");
    expect(words.at(-1)).toBe("word-5");
  });
});
