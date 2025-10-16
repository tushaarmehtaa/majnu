import { describe, expect, it } from "vitest";

import { scoreDelta } from "@/lib/score";

describe("score math", () => {
  it("awards base points for fresh wins and losses", () => {
    expect(scoreDelta("win", 0)).toBe(3);
    expect(scoreDelta("loss", 3)).toBe(-1);
  });

  it("adds streak bonuses for extended runs", () => {
    expect(scoreDelta("win", 3)).toBe(4);
    expect(scoreDelta("win", 5)).toBe(6);
    expect(scoreDelta("win", 10)).toBe(8);
  });
});
