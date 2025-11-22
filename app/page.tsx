"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";


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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 text-foreground"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-[0.03]">
        <h1 className="rotate-[-45deg] whitespace-nowrap font-display text-[20vw] leading-none text-primary blur-sm">
          MAJNU BHAI
        </h1>
      </div>

      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-12"
      >
        <header className="flex flex-col items-center gap-6 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="outline" className="border-primary/50 bg-primary/5 px-4 py-1 font-mono text-xs tracking-widest text-primary">
              CASE FILE #2025-MB
            </Badge>
          </motion.div>

          <div className="relative">
            <h1 className="font-display text-7xl uppercase tracking-tighter text-primary sm:text-9xl drop-shadow-2xl">
              {COPY.landing.title}
            </h1>
            <motion.div
              initial={{ scale: 2, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
              className="absolute -right-4 -top-4 rotate-12 rounded-sm border-2 border-primary bg-primary px-2 py-1 font-mono text-xs font-bold text-primary-foreground shadow-lg sm:text-sm"
            >
              WANTED ALIVE
            </motion.div>
          </div>

          <p className="max-w-xl text-balance font-mono text-lg text-foreground/80">
            {COPY.landing.subtitle} — <span className="text-primary">5 mistakes</span> and the rope snaps.
          </p>
        </header>

        <div className="grid w-full gap-8 md:grid-cols-2">
          {/* Action Area */}
          <div className="flex flex-col items-center justify-center gap-6 rounded-sm border-2 border-dashed border-primary/20 bg-background/50 p-8 backdrop-blur-sm">
            <div className="flex flex-col gap-4 text-center">
              <h3 className="font-display text-2xl tracking-wide text-foreground">Mission Brief</h3>
              <ul className="flex flex-col gap-2 font-mono text-sm text-foreground/70">
                {COPY.landing.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-primary">➤</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-col gap-4 w-full max-w-xs">
              <Button size="lg" variant="stamp" className="w-full text-xl py-8" asChild>
                <Link href="/play">
                  {COPY.landing.cta}
                </Link>
              </Button>
              <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10" asChild>
                <Link href="/leaderboard">VIEW DOSSIERS</Link>
              </Button>
            </div>
          </div>

          {/* Most Wanted List */}
          <div className="relative rotate-1 transform transition-transform hover:rotate-0">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="h-4 w-32 bg-primary/20 backdrop-blur-sm -rotate-1 skew-x-12" />
            </div>
            <div className="bg-[#F9F1E6] p-1 shadow-xl">
              <div className="border border-primary/10 p-6 bg-[url('/paper-texture.svg')] relative overflow-hidden">
                <div className="mb-4 flex items-center justify-between border-b-2 border-primary/20 pb-2">
                  <h3 className="font-display text-2xl tracking-widest text-primary">MOST WANTED</h3>
                  <span className="font-mono text-xs text-primary/60">{new Date().toLocaleDateString()}</span>
                </div>

                {topLoading ? (
                  <div className="flex h-40 items-center justify-center font-mono text-sm text-foreground/50 animate-pulse">
                    Decrypting records...
                  </div>
                ) : topError ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                    <p className="font-mono text-xs text-destructive">CONNECTION SEVERED</p>
                    <Button variant="link" size="sm" onClick={() => fetchTop().catch(() => null)}>
                      RETRY UPLINK
                    </Button>
                  </div>
                ) : topPlayers.length === 0 ? (
                  <div className="flex h-40 items-center justify-center font-mono text-sm text-foreground/50">
                    No records found. Be the first.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {topPlayers.map((player) => (
                      <div key={player.cursor} className="group flex items-center justify-between border-b border-dashed border-primary/10 pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                            {player.rank}
                          </span>
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {player.handle ?? "UNKNOWN SUSPECT"}
                          </span>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {player.score} PTS
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                    CONFIDENTIAL • DO NOT DISTRIBUTE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center font-mono text-xs text-foreground/40">
          <p>EST. 2025 • BOMBAY POLICE DEPT • CASE #8921</p>
        </footer>
      </motion.section>
    </motion.main>
  );
}
