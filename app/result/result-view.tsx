"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { ResultEffects } from "@/app/result/result-effects";
import { ShareButton } from "@/app/result/share-button";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { logEvent } from "@/lib/analytics";
import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";

const FOLLOW_URL = "https://x.com/intent/follow?screen_name=savemajnu";

type ResultViewProps = {
  statusLabel: string;
  outcome: "win" | "loss";
  streak: {
    current: number;
    best: number;
  } | null;
  heroImage: string;
  gameInfo?: {
    domainLabel: string;
    domainRaw: string;
    answer: string;
    wrongGuesses: number;
    hint: string;
    mode?: "standard" | "daily";
  } | null;
  share: {
    url: string;
    outcome: "win" | "loss";
    scoreDelta: number | null;
    scoreTotal: number | null;
    rank: number | null;
    userId?: string;
    handle?: string | null;
    wins?: number | null;
    losses?: number | null;
    streak?: number | null;
  };
  throttled?: boolean;
  playerHandle?: string | null;
  avatar?: { color: string; initials: string } | null;
};

export function ResultView({
  outcome,
  streak,
  heroImage,
  gameInfo,
  share,
  throttled,
}: ResultViewProps) {
  const isWin = outcome === "win";
  const verdictColor = isWin ? "text-green-700" : "text-destructive";
  const verdictBorder = isWin ? "border-green-700" : "border-destructive";
  const verdictBg = isWin ? "bg-green-50" : "bg-destructive/5";

  const { play: playVerdictStamp } = useSound(SOUNDS.verdictStamp, { volume: SOUND_VOLUMES.stamp });

  const handleFollowClick = useCallback(() => {
    logEvent({
      event: "follow_clicked",
      userId: share.userId,
      metadata: {
        source: "result",
        outcome,
      },
    });
    if (typeof window !== "undefined") {
      const opened = window.open(FOLLOW_URL, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = FOLLOW_URL;
      }
    }
  }, [outcome, share.userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      playVerdictStamp();
    }, 500);
    return () => clearTimeout(timer);
  }, [playVerdictStamp]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <ResultEffects outcome={outcome} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-20 w-full max-w-2xl"
      >
        {/* Verdict Stamp Animation */}
        <motion.div
          initial={{ scale: 2, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: -5 }}
          transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
          className={cn(
            "absolute -right-4 -top-6 z-30 rounded-sm border-4 px-4 py-2 font-display text-2xl uppercase tracking-widest shadow-xl backdrop-blur-sm md:-right-8 md:-top-8 md:text-4xl",
            verdictColor,
            verdictBorder,
            verdictBg
          )}
        >
          {isWin ? "SURVIVED" : "ELIMINATED"}
        </motion.div>

        <Card className="overflow-hidden border-2 border-primary/20 bg-[#F5E6D3] shadow-2xl">
          <div className="absolute inset-0 bg-[url('/paper-texture.svg')] opacity-50 mix-blend-multiply" />

          <CardContent className="relative space-y-8 p-8">
            {/* Header Section */}
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative h-48 w-full overflow-hidden rounded-sm border-2 border-primary/10 bg-white shadow-inner md:h-64">
                <Image
                  src={heroImage}
                  alt={isWin ? "Majnu celebrating" : "Majnu hanging"}
                  fill
                  className="object-cover sepia-[0.3]"
                  priority
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />
              </div>

              <div className="space-y-2">
                <Badge variant="evidence" className="mb-2">
                  CASE FILE #{gameInfo?.domainRaw.toUpperCase().slice(0, 3)}-{Math.floor(Math.random() * 1000)}
                </Badge>
                <h1 className="font-display text-4xl uppercase tracking-tight text-primary md:text-5xl">
                  {isWin ? COPY.result.title.win : COPY.result.title.loss}
                </h1>
                <p className="font-mono text-sm text-foreground/70">
                  {isWin
                    ? COPY.result.winDescription
                    : COPY.result.lossDescription}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-y-2 border-dashed border-primary/20 py-6">
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Score</p>
                <p className="font-display text-2xl text-primary">
                  {share.scoreTotal ?? "—"}
                </p>
                {share.scoreDelta !== null && (
                  <span className={cn("text-xs font-bold", share.scoreDelta >= 0 ? "text-green-600" : "text-red-600")}>
                    {share.scoreDelta >= 0 ? "+" : ""}{share.scoreDelta}
                  </span>
                )}
              </div>
              <div className="text-center border-x border-dashed border-primary/20">
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Streak</p>
                <p className="font-display text-2xl text-primary">
                  {streak?.current ?? 0}
                </p>
                <span className="text-xs text-foreground/50">Best: {streak?.best ?? 0}</span>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Rank</p>
                <p className="font-display text-2xl text-primary">
                  #{share.rank ?? "—"}
                </p>
              </div>
            </div>

            {/* Game Details */}
            {gameInfo && (
              <div className="rounded-sm bg-primary/5 p-4 font-mono text-sm">
                <div className="flex justify-between border-b border-primary/10 pb-2 mb-2">
                  <span className="text-foreground/60">SUBJECT:</span>
                  <span className="font-bold text-primary">{gameInfo.domainLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">ANSWER:</span>
                  <span className="font-bold text-primary tracking-widest uppercase">{gameInfo.answer}</span>
                </div>
              </div>
            )}

            {throttled && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-center font-mono text-xs text-destructive">
                ⚠️ SPEED LIMIT ENFORCED. SCORE NOT RECORDED.
              </div>
            )}
          </CardContent>

          <CardFooter className="relative flex flex-col gap-3 bg-primary/5 p-6 sm:flex-row sm:justify-between">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/play">NEXT MISSION</Link>
            </Button>

            <div className="flex w-full gap-2 sm:w-auto">
              <ShareButton
                outcome={share.outcome}
                scoreDelta={share.scoreDelta}
                scoreTotal={share.scoreTotal}
                rank={share.rank}
                shareUrl={share.url}
                userId={share.userId}
                handle={share.handle}
                wins={share.wins}
                losses={share.losses}
                streak={share.streak}
              />
              <Button variant="ghost" size="icon" onClick={handleFollowClick} title="Follow Updates">
                <span className="sr-only">Follow</span>
                🐦
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
