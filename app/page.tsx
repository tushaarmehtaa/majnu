"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { preloadDomains } from "@/hooks/use-domains";
import { useOffline } from "@/hooks/use-offline";
import { logEvent } from "@/lib/analytics";
import { fetchWithRetry, resolveFetchErrorMessage } from "@/lib/http";

export default function LandingPage() {
  const router = useRouter();
  const [topPlayers, setTopPlayers] = useState<
    Array<{ cursor: string; rank: number; handle: string | null; score: number }>
  >([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);
  const { offline } = useOffline();
  const TOP_CACHE_KEY = "majnu-top-daily";

  const fetchTop = useCallback(async () => {
    if (offline) {
      setTopError(COPY.game.offline.description);
      setTopLoading(false);
      if (typeof window !== "undefined") {
        try {
          const cached = window.localStorage.getItem(TOP_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Array<{ cursor: string; rank: number; handle: string | null; score: number }>;
            setTopPlayers(parsed);
          }
        } catch {
          // ignore cache read errors
        }
      }
      return;
    }

    setTopLoading(true);
    setTopError(null);

    try {
      const response = await fetchWithRetry("/api/leaderboard?scope=daily&limit=3", {
        cache: "no-store",
      });
      const payload = await response.json();
      setTopPlayers(payload.items ?? []);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(TOP_CACHE_KEY, JSON.stringify(payload.items ?? []));
        } catch {
          // ignore cache errors
        }
      }
    } catch (error) {
      const message = await resolveFetchErrorMessage(error, "Unable to load leaderboard");
      setTopError(message);
      logEvent({
        event: "error",
        metadata: {
          source: "landing_leaderboard",
          message,
        },
      });
      if (typeof window !== "undefined") {
        try {
          const cached = window.localStorage.getItem(TOP_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Array<{ cursor: string; rank: number; handle: string | null; score: number }>;
            setTopPlayers(parsed);
          } else {
            setTopPlayers([]);
          }
        } catch {
          setTopPlayers([]);
        }
      } else {
        setTopPlayers([]);
      }
    } finally {
      setTopLoading(false);
    }
  }, [TOP_CACHE_KEY, offline]);

  useEffect(() => {
    fetchTop();
    preloadDomains().catch(() => null);
    try {
      router.prefetch("/play");
      router.prefetch("/leaderboard");
    } catch {
      // ignore prefetch errors in development
    }
  }, [fetchTop, router]);

  useEffect(() => {
    if (!offline && topError) {
      fetchTop().catch(() => null);
    }
  }, [fetchTop, offline, topError]);

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col items-center justify-center px-4 py-24 text-foreground"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center opacity-10">
        <Image
          src="/majnu-states/1.webp"
          alt="Majnu watermark"
          width={420}
          height={380}
          className="mt-10 max-w-[320px] mix-blend-multiply"
          priority
        />
      </div>
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-10 rounded-3xl border border-red/10 bg-white/75 p-10 shadow-[0_30px_80px_-28px_rgba(192,57,43,0.45)] backdrop-blur"
      >
        <header className="flex flex-col items-center gap-4 text-center">
          <Badge className="bg-red/10 text-red shadow-sm">Bollywood Tragicomedy</Badge>
          <Link
            href="/play?mode=daily"
            className="inline-flex items-center justify-center rounded-full border border-red/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red transition hover:border-red hover:bg-red/10"
          >
            {COPY.landing.dailyChip}
          </Link>
          <h1 className="font-display text-5xl uppercase tracking-[0.25em] text-red sm:text-7xl">
            {COPY.landing.title}
          </h1>
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-red">
            {COPY.landing.subtitle}
          </p>
          <p className="max-w-xl text-balance text-base text-foreground/80">
            Bollywood gallows humor. Each wrong guess adds a limb. Five mistakes and the rope snaps tight.
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-red">
            {COPY.landing.line}
          </p>
        </header>
        <ul className="grid gap-3 text-sm text-foreground md:grid-cols-3">
          {COPY.landing.highlights.map((item) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl border border-red/20 bg-white/70 px-4 py-3 text-center font-medium shadow-sm"
            >
              {item}
            </motion.li>
          ))}
        </ul>
        <div className="rounded-2xl border border-red/20 bg-white/70 p-4 text-sm text-foreground/80">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-foreground/60">
            <span>Today&apos;s Saviors</span>
            <span>{topLoading ? "Syncing..." : `Top ${topPlayers.length}`}</span>
          </div>
          {topLoading ? (
            <p className="text-foreground/60">Fetching fresh dangling heroes...</p>
          ) : topError ? (
            <div className="flex flex-col items-start gap-3 text-foreground/70">
              <p>{COPY.landing.leaderboardError}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red/40 text-red hover:bg-red/10"
                  onClick={() => {
                    fetchTop().catch(() => null);
                  }}
                >
                  {COPY.landing.leaderboardRetry}
                </Button>
                <span className="text-xs text-foreground/60">{topError}</span>
              </div>
            </div>
          ) : topPlayers.length === 0 ? (
            <p className="text-foreground/60">No wins logged yet. Claim the rope first.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topPlayers.map((player) => (
                <div key={player.cursor} className="flex items-center justify-between">
                  <span>
                    <span className="font-semibold text-red">#{player.rank}</span>{" "}
                    {player.handle ?? "Anonymous"}
                  </span>
                  <span className="font-mono text-xs text-foreground/60">{player.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <footer className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/80 md:flex-row">
          <span className="text-center md:text-left">
            Now with sound effects and public executions 🥲
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="bg-red text-beige hover:bg-red/90" asChild>
              <Link href="/play">🔥 {COPY.landing.cta}</Link>
            </Button>
            <Button variant="outline" className="border-red/40 text-red hover:bg-red/10" asChild>
              <Link href="/leaderboard">🪦 {COPY.landing.secondary}</Link>
            </Button>
          </div>
        </footer>
      </motion.section>
    </motion.main>
  );
}
