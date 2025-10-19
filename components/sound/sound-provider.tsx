"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

import { soundManager } from "@/lib/soundManager";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIsClient } from "@/hooks/use-is-client";

type SoundContextValue = {
  muted: boolean;
  volume: number;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const muted = useUIStore((state) => state.muted);
  const toggleMuted = useUIStore((state) => state.toggleMuted);

  useEffect(() => {
    if (!isClient) {
      return;
    }
    soundManager.setMuted(muted);
  }, [isClient, muted]);

  useEffect(() => {
    if (!isClient) return;
    if (typeof window === "undefined") return;

    const unlockAndPreload = async () => {
      try {
        await soundManager.unlock();
        await soundManager.preload();
      } catch (error) {
        console.warn("Unable to initialise audio context", error);
      }
    };

    window.addEventListener("pointerdown", unlockAndPreload, { once: true });
    window.addEventListener("keydown", unlockAndPreload, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAndPreload);
      window.removeEventListener("keydown", unlockAndPreload);
    };
  }, [isClient]);

  const value = useMemo<SoundContextValue>(
    () => ({
      muted,
      volume: muted ? 0 : 1,
      toggleMuted,
    }),
    [muted, toggleMuted],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundSettings(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundSettings must be used within a SoundProvider");
  }
  return context;
}
