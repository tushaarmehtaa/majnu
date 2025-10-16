"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { soundManager } from "@/lib/soundManager";

type SoundContextValue = {
  muted: boolean;
  volume: number;
  toggleMuted: () => void;
};

const STORAGE_KEY = "majnu-sound-muted";

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch (error) {
      console.warn("Unable to read sound preference", error);
      return false;
    }
  });

  useEffect(() => {
    soundManager.setMuted(muted);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(muted));
    } catch (error) {
      console.warn("Unable to persist sound preference", error);
    }
  }, [muted]);

  useEffect(() => {
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
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((previous) => !previous);
  }, []);

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
