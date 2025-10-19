"use client";

import { useCallback, useEffect } from "react";

import { soundManager } from "@/lib/soundManager";
import { useIsClient } from "@/hooks/use-is-client";

type UseSoundOptions = {
  volume?: number;
};

export function useSound(src: string, options?: UseSoundOptions) {
  const volume = options?.volume ?? 1.0;
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;
    soundManager.preload([src]).catch(() => null);
  }, [isClient, src]);

  const play = useCallback(() => {
    if (!isClient) return;
    soundManager.play(src, volume).catch(() => null);
  }, [isClient, src, volume]);

  return { play };
}
