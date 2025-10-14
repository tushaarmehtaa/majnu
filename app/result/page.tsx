import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RESULT_COPY } from "@/lib/copy";
import { getGameById, getUserStats } from "@/lib/instantdb";

type ResultPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const formatTopic = (value?: string | null) => {
  if (!value) return undefined;
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;
  const statusParam = asString(params.status)?.toLowerCase();
  const gameId = asString(params.gameId);
  const domain = asString(params.domain);

  const game = gameId ? await getGameById(gameId) : undefined;
  const stats = game ? await getUserStats(game.user_id) : null;

  const isWin = statusParam === "won";
  const copy = isWin ? RESULT_COPY.win : RESULT_COPY.loss;
  const bgClass = isWin ? "bg-success/20" : "bg-red/10";
  const borderClass = isWin ? "border-success/40" : "border-red/40";
  const headlineBadge = isWin ? "bg-success/20 text-success" : "bg-red/20 text-red";
  const heroImage = isWin ? "/majnu-states/win.png" : "/majnu-states/loss.png";

  return (
    <div
      className={`container max-w-3xl rounded-3xl py-16 animate-in fade-in duration-500 ${bgClass} shadow-[0_30px_80px_-30px_rgba(192,57,43,0.5)]`}
    >
      <Card className={`border ${borderClass} bg-white/85 backdrop-blur`}>
        <CardContent className="space-y-8 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Badge className={`${headlineBadge} px-4 py-1 uppercase tracking-[0.4em]`}>
              {statusParam ? statusParam.toUpperCase() : "UNKNOWN"}
            </Badge>
            <h1 className="font-display text-4xl uppercase tracking-[0.2em] text-red sm:text-5xl">
              {copy.title}
            </h1>
            <p className="text-base text-foreground/80">{copy.description}</p>
            {stats ? (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-foreground/60">
                <span className="rounded-full border border-red/30 bg-white/70 px-3 py-1 font-semibold">
                  Current streak: {stats.streak_current}
                </span>
                <span className="rounded-full border border-red/30 bg-white/70 px-3 py-1 font-semibold">
                  Best streak: {stats.streak_best}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-center">
              <Image
                src={heroImage}
                alt={isWin ? "Majnu celebrating" : "Majnu hanging"}
                width={320}
                height={260}
                className="rounded-2xl shadow-[0_20px_40px_-20px_rgba(30,30,30,0.45)]"
              />
            </div>
          </div>

          {game ? (
            <div
              className={`rounded-2xl border ${borderClass} bg-white/90 p-6 text-left text-foreground shadow-[0_12px_24px_-16px_rgba(0,0,0,0.35)]`}
            >
              <p className="text-lg font-semibold">
                Domain: {formatTopic(game.domain) ?? game.domain}
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-red">
                Answer: {game.word_answer}
              </p>
              <p className="mt-2 text-sm text-foreground/70">
                Wrong guesses: {game.wrong_guesses_count}
              </p>
              <p className="text-sm text-foreground/70">Hint: {game.hint}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red/30 bg-white/80 p-6 text-center text-foreground/80">
              We could not load the final scene. Start a new round to rewrite Majnu’s fate.
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-red/20 bg-white/60 p-4 text-sm text-foreground/70">
            Score delta placeholder · Sprint 3 will honor the fallen.
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-3 bg-white/70 p-6">
          <Button size="lg" className="bg-red text-beige hover:bg-red/90" asChild>
            <Link href="/play">Try Again</Link>
          </Button>
          {domain && (
            <Button variant="outline" className="border-red/40 text-red hover:bg-red/10" asChild>
              <Link href={`/play?domain=${encodeURIComponent(domain)}`}>
                Replay Domain
              </Link>
            </Button>
          )}
          <Button variant="ghost" className="text-foreground/60" disabled>
            Mourn on Twitter (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
