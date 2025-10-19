import { buildAvatar } from "@/lib/avatar";
import { getGameById, getUserById, getUserRank, getUserStats } from "@/lib/instantdb";

import { ResultView } from "@/app/result/result-view";

const SITE_URL = "https://savemajnu.live";

type ResultSearchParams = Record<string, string | string[] | undefined>;

type ResultOutcome = "win" | "loss";

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseNumber(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const formatTopic = (value?: string | null) => {
  if (!value) return "";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<ResultSearchParams>;
}) {
  const params = await searchParams;
  const statusParam = asString(params.status)?.toLowerCase();
  const gameId = asString(params.gameId);
  const scoreDeltaParam = parseNumber(asString(params.scoreDelta));
  const scoreTotalParam = parseNumber(asString(params.scoreTotal));
  const rankParam = parseNumber(asString(params.rank));
  const throttledParam = asString(params.throttled) === "true";

  const outcome: ResultOutcome = statusParam === "won" ? "win" : "loss";
  const heroImage = outcome === "win" ? "/majnu-states/win.webp" : "/majnu-states/loss.webp";

  const game = gameId ? await getGameById(gameId) : undefined;
  const stats = game ? await getUserStats(game.user_id) : null;
  const userRecord = game ? await getUserById(game.user_id) : null;

  const scoreTotal = scoreTotalParam ?? stats?.score_total ?? null;
  const scoreDelta = scoreDeltaParam;
  const rank = rankParam ?? (game ? await getUserRank("weekly", game.user_id) : null);
  const playerHandle = userRecord?.handle ?? null;

  const shareUrl = new URL("/result", SITE_URL);
  if (statusParam) shareUrl.searchParams.set("status", statusParam);
  if (gameId) shareUrl.searchParams.set("gameId", gameId);
  if (game?.domain) shareUrl.searchParams.set("domain", game.domain);
  if (typeof scoreDelta === "number") shareUrl.searchParams.set("scoreDelta", String(scoreDelta));
  if (typeof scoreTotal === "number") shareUrl.searchParams.set("scoreTotal", String(scoreTotal));
  if (typeof rank === "number") shareUrl.searchParams.set("rank", String(rank));
  if (game?.word_answer) shareUrl.searchParams.set("word", game.word_answer);
  if (throttledParam) shareUrl.searchParams.set("throttled", "true");
  if (playerHandle) shareUrl.searchParams.set("handle", playerHandle);
  if (stats) {
    shareUrl.searchParams.set("wins", String(stats.wins_all));
    shareUrl.searchParams.set("losses", String(stats.losses_all));
    shareUrl.searchParams.set("streak", String(stats.streak_current));
  }
  shareUrl.searchParams.set("utm_source", "twitter");
  shareUrl.searchParams.set("utm_medium", "share");
  shareUrl.searchParams.set("utm_campaign", "v1");

  const avatar = buildAvatar(playerHandle ?? game?.user_id ?? "majnu");

  return (
    <ResultView
      statusLabel={statusParam ? statusParam.toUpperCase() : "UNKNOWN"}
      outcome={outcome}
      heroImage={heroImage}
      streak={
        stats
          ? {
              current: stats.streak_current,
              best: stats.streak_best,
            }
          : null
      }
      gameInfo={
        game
          ? {
              domainLabel: formatTopic(game.domain) || game.domain,
              domainRaw: game.domain,
              answer: game.word_answer,
              wrongGuesses: game.wrong_guesses_count,
              hint: game.hint,
              mode: game.mode ?? "standard",
            }
          : null
      }
      share={{
        url: shareUrl.toString(),
        outcome,
        scoreDelta,
        scoreTotal,
        rank,
        userId: game?.user_id,
        handle: playerHandle,
        wins: stats?.wins_all ?? null,
        losses: stats?.losses_all ?? null,
        streak: stats?.streak_current ?? null,
      }}
      throttled={throttledParam}
      playerHandle={playerHandle}
      avatar={avatar}
    />
  );
}
