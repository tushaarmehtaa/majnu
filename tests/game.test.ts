import { describe, expect, it } from "vitest";

import {
  isLoss,
  isWin,
  maskWord,
  MAX_WRONG_GUESSES,
  reveal,
} from "@/lib/game";

describe("game mechanics", () => {
  it("reveals matching letters while keeping others hidden", () => {
    const answer = "bridge";
    const masked = maskWord(answer);
    expect(masked).toBe("______");

    const withG = reveal(masked, answer, "g");
    expect(withG).toBe("____g_");

    const withR = reveal(withG, answer, "r");
    expect(withR).toBe("_r__g_");
  });

  it("detects win only when mask matches answer", () => {
    const answer = "router";
    expect(isWin("router", answer)).toBe(true);
    expect(isWin("route_", answer)).toBe(false);
  });

  it("treats loss only after hitting max wrong guesses", () => {
    expect(isLoss(MAX_WRONG_GUESSES - 1)).toBe(false);
    expect(isLoss(MAX_WRONG_GUESSES)).toBe(true);
    expect(isLoss(MAX_WRONG_GUESSES + 3)).toBe(true);
  });
});
