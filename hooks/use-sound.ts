"use client";

import { useCallback, useEffect } from "react";

import { soundManager } from "@/lib/soundManager";

export function useSound(src: string) {
  useEffect(() => {
    soundManager.preload([src]);
  }, [src]);

  const play = useCallback(() => {
    soundManager.play(src).catch(() => null);
  }, [src]);

  return { play };
}
