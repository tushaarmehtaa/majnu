"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { HandleModal } from "@/components/handle-modal";
import { useToast } from "@/hooks/use-toast";
import { buildAvatar } from "@/lib/avatar";
import type { AchievementRecord } from "@/lib/instantdb";

type UserState = {
  userId: string;
  handle: string | null;
  stats: {
    wins_all: number;
    losses_all: number;
    streak_current: number;
    streak_best: number;
    score_total: number;
  } | null;
  achievements: AchievementRecord[];
};

type UserContextValue = {
  loading: boolean;
  user: UserState | null;
  avatar: { color: string; initials: string } | null;
  refresh: () => Promise<void>;
  promptHandle: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

async function fetchUser(): Promise<UserState> {
  const response = await fetch("/api/me", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load user");
  }
  const payload = await response.json();
  return {
    userId: payload.userId,
    handle: payload.handle ?? null,
    stats: {
      wins_all: payload.wins_all,
      losses_all: payload.losses_all,
      streak_current: payload.streak_current,
      streak_best: payload.streak_best,
      score_total: payload.score_total,
    },
    achievements: payload.achievements ?? [],
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, error: fetchError, isLoading, mutate } = useSWR<UserState>("/api/me", fetchUser, {
    revalidateOnFocus: false,
  });

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  useEffect(() => {
    if (data && !data.handle) {
      setModalOpen(true);
    }
  }, [data]);

  useEffect(() => {
    if (fetchError) {
      toast({ title: "Unable to load profile", description: "Try refreshing." });
    }
  }, [fetchError, toast]);

  const avatar = useMemo(() => {
    if (!data) return null;
    const seed = data.handle ?? data.userId;
    return buildAvatar(seed);
  }, [data]);

  const saveHandle = useCallback(
    async (value: string) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/handle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: value }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload.error ?? "Unable to save handle";
          setError(message);
          return;
        }
        const payload = await response.json();
        await mutate((prev) =>
          prev
            ? {
                ...prev,
                handle: payload.handle ?? value.replace(/^@/, ""),
              }
            : prev,
          false,
        );
        toast({
          title: "Handle saved",
          description: `Welcome, @${payload.handle ?? value.replace(/^@/, "")}.`,
        });
        setModalOpen(false);
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast],
  );

  const contextValue = useMemo<UserContextValue>(
    () => ({
      loading: isLoading,
      user: data ?? null,
      avatar,
      refresh,
      promptHandle: () => setModalOpen(true),
    }),
    [avatar, data, isLoading, refresh],
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
      <HandleModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open && !data?.handle) {
            // allow closing but remind later
            setModalOpen(false);
          } else {
            setModalOpen(open);
          }
        }}
        onSubmit={saveHandle}
        loading={saving}
        error={error}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
