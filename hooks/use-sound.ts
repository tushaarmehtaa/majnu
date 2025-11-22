"use client";

import { useCallback, useEffect } from "react";

import { soundManager } from "@/lib/soundManager";
import { useIsClient } from "@/hooks/use-is-client";

type UseSoundOptions = {
  volume?: number;
  playbackRate?: number;
  randomPitchVariance?: number;
};

export function useSound(src: string, options?: UseSoundOptions) {
  const volume = options?.volume ?? 1.0;
  const baseRate = options?.playbackRate ?? 1.0;
  const variance = options?.randomPitchVariance ?? 0;
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;
    soundManager.preload([src]).catch(() => null);
  }, [isClient, src]);

  const play = useCallback(() => {
    if (!isClient) return;
    const rate = variance > 0
      ? baseRate + (Math.random() * variance * 2 - variance)
      : baseRate;
    soundManager.play(src, volume, { playbackRate: rate }).catch(() => null);
  }, [isClient, src, volume, baseRate, variance]);

  return { play };
}
