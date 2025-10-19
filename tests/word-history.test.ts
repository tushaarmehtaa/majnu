import { describe, expect, it } from "vitest";

import { getRecentWordsForUser, rememberWordForUser } from "@/lib/instantdb";

describe("word history cache", () => {
  it("keeps only the most recent 15 words per user and domain", () => {
    const userId = `user-${Date.now()}`;
    const domain = "startups";

    for (let index = 0; index < 30; index += 1) {
      rememberWordForUser(userId, domain, `word-${index}`);
    }

    const recent = getRecentWordsForUser(userId, domain);
    expect(recent).toHaveLength(15);
    expect(recent[0]).toBe("word-29");
    expect(recent.at(-1)).toBe("word-15");
  });
});
