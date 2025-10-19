import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UIState = {
  muted: boolean;
  activeGameId: string | null;
  confettiPlayedFor: string | null;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setActiveGame: (gameId: string | null) => void;
  markConfettiPlayed: (gameId: string) => void;
  resetGameEffects: () => void;
};

const storage = typeof window !== "undefined"
  ? createJSONStorage(() => window.localStorage)
  : undefined;

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      muted: false,
      activeGameId: null,
      confettiPlayedFor: null,
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setActiveGame: (gameId) =>
        set(() => ({
          activeGameId: gameId,
          confettiPlayedFor: null,
        })),
      markConfettiPlayed: (gameId) => set({ confettiPlayedFor: gameId }),
      resetGameEffects: () => set({ confettiPlayedFor: null }),
    }),
    {
      name: "majnu-ui-store",
      storage,
      partialize: (state) => ({
        muted: state.muted,
      }),
    },
  ),
);
