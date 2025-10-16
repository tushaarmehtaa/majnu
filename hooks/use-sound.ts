"use client";

import { useCallback, useEffect } from "react";

import { soundManager } from "@/lib/soundManager";

type UseSoundOptions = {
  volume?: number;
};

export function useSound(src: string, options?: UseSoundOptions) {
  const volume = options?.volume ?? 1.0;

  useEffect(() => {
    soundManager.preload([src]);
  }, [src]);

  const play = useCallback(() => {
    soundManager.play(src, volume).catch(() => null);
  }, [src, volume]);

  return { play };
}
