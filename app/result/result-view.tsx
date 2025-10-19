"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { ResultEffects } from "@/app/result/result-effects";
import { ShareButton } from "@/app/result/share-button";
import { COPY } from "@/lib/copy";

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
  statusLabel,
  outcome,
  streak,
  heroImage,
  gameInfo,
  share,
  throttled,
  playerHandle,
  avatar,
}: ResultViewProps) {
  const bgClass = outcome === "win" ? "bg-success/20" : "bg-red/10";
  const borderClass = outcome === "win" ? "border-success/40" : "border-red/40";
  const headlineBadge = outcome === "win" ? "bg-success/20 text-success" : "bg-red/20 text-red";
  const title = outcome === "win" ? COPY.result.title.win : COPY.result.title.loss;
  const description = outcome === "win" ? COPY.result.winDescription : COPY.result.lossDescription;
  const subtitle = outcome === "win" ? COPY.result.subtitle.win : COPY.result.subtitle.loss;

  return (
    <div className="relative">
      <ResultEffects outcome={outcome} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className={`container relative z-20 max-w-3xl rounded-3xl py-16 ${bgClass} shadow-[0_30px_80px_-30px_rgba(192,57,43,0.5)]`}
      >
        <Card className={`border ${borderClass} bg-white/85 backdrop-blur`}>
          <CardContent className="space-y-8 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Badge className={`${headlineBadge} px-4 py-1 uppercase tracking-[0.4em]`}>
                {statusLabel}
              </Badge>
              {playerHandle ? (
                <div className="flex items-center gap-2">
                  {avatar ? (
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: avatar.color }}
                    >
                      {avatar.initials}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-foreground/80">@{playerHandle}</span>
                </div>
              ) : null}
              <h1 className="font-display text-4xl uppercase tracking-[0.2em] text-red sm:text-5xl">
                {title}
              </h1>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">
                {subtitle}
              </p>
              <p className="text-base text-foreground/80">{description}</p>
              {streak ? (
                <div className="grid gap-2 text-xs uppercase tracking-[0.3em] text-foreground/60 sm:grid-cols-2">
                  <span className="rounded-full border border-red/30 bg-white/70 px-3 py-1 text-center font-semibold">
                    Current streak: {streak.current}
                  </span>
                  <span className="rounded-full border border-red/30 bg-white/70 px-3 py-1 text-center font-semibold">
                    Best streak: {streak.best}
                  </span>
                </div>
              ) : null}
              {throttled ? (
                <p className="rounded-full border border-red/30 bg-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red">
                  Slow down, hero. This finish didn&apos;t count.
                </p>
              ) : null}
              <div className="mt-2 flex justify-center">
                <Image
                  src={heroImage}
                  alt={outcome === "win" ? "Majnu celebrating" : "Majnu hanging"}
                  width={320}
                  height={260}
                  className="rounded-2xl shadow-[0_20px_40px_-20px_rgba(30,30,30,0.45)]"
                />
              </div>
            </div>

            {gameInfo ? (
              <div
                className={`rounded-2xl border ${borderClass} bg-white/90 p-6 text-left text-foreground shadow-[0_12px_24px_-16px_rgba(0,0,0,0.35)]`}
              >
                {gameInfo.mode === "daily" ? (
                  <Badge className="mb-3 bg-red/10 text-red">Daily Word</Badge>
                ) : null}
                <p className="text-lg font-semibold">Domain: {gameInfo.domainLabel}</p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-red">
                  {COPY.result.answerLabel(gameInfo.answer)}
                </p>
                {outcome === "loss" ? (
                  <p className="text-xs italic text-foreground/60">Remember it. Majnu didn’t.</p>
                ) : null}
                <p className="mt-2 text-sm text-foreground/70">Wrong guesses: {gameInfo.wrongGuesses}</p>
                <p className="text-sm font-semibold text-foreground/80">
                  Hint: {gameInfo.hint}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-red/30 bg-white/80 p-6 text-center text-foreground/80">
                We could not load the final scene. Start a new round to rewrite Majnu’s fate.
              </div>
            )}

            <div className="grid gap-4 rounded-2xl border border-dashed border-red/20 bg-white/60 p-4 text-sm text-foreground/80 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Score Change</p>
                <p className="mt-1 text-lg font-semibold text-red">
                  {share.scoreDelta !== null && share.scoreDelta !== undefined
                    ? `${share.scoreDelta >= 0 ? "+" : ""}${share.scoreDelta}`
                    : "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Total Score</p>
                <p className="mt-1 text-lg font-semibold text-red">
                  {share.scoreTotal ?? "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Rank</p>
                <p className="mt-1 text-lg font-semibold text-red">
                  {share.rank ?? "Unranked"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-3 bg-white/70 p-6">
            <Button size="lg" className="bg-red text-beige hover:bg-red/90" asChild>
              <Link href="/play">Play Again</Link>
            </Button>
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
            <Button variant="outline" className="border-red/40 text-red hover:bg-red/10" asChild>
              <Link href="/leaderboard">View Leaderboards</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
