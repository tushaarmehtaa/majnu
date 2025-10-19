import type { Metadata } from "next";

const SITE_URL = "https://savemajnu.live";

type ResultSearchParams = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ResultSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const statusParam = asString(params.status)?.toLowerCase();
  const isWin = statusParam === "won";
  const title = isWin ? "Majnu Lives | Save Majnu Bhai" : "Majnu Dies | Save Majnu Bhai";
  const description = isWin
    ? "I just saved Majnu Bhai from the rope. Can you do better?"
    : "Majnu Bhai is dead. Think you can save him?";

  const ogParams = new URLSearchParams();
  ogParams.set("outcome", isWin ? "win" : "loss");
  const scoreDelta = asString(params.scoreDelta) ?? "0";
  const scoreTotal = asString(params.scoreTotal) ?? "0";
  const rank = asString(params.rank) ?? "";
  const word = asString(params.word) ?? "";
  const domain = asString(params.domain) ?? "";
  const handle = asString(params.handle) ?? "";
  const wins = asString(params.wins) ?? "";
  const losses = asString(params.losses) ?? "";
  const streak = asString(params.streak) ?? "";

  ogParams.set("score_delta", scoreDelta);
  ogParams.set("score_total", scoreTotal);
  if (rank) ogParams.set("rank", rank);
  if (word) ogParams.set("word", word);
  if (domain) ogParams.set("domain", domain);
  if (handle) ogParams.set("handle", handle.startsWith("@") ? handle : `@${handle}`);
  if (wins) ogParams.set("wins", wins);
  if (losses) ogParams.set("losses", losses);
  if (streak) ogParams.set("streak", streak);

  const image = `${SITE_URL}/api/og/result?${ogParams.toString()}`;
  const canonical = new URL("/result", SITE_URL);
  if (statusParam) canonical.searchParams.set("status", statusParam);
  if (asString(params.gameId)) canonical.searchParams.set("gameId", asString(params.gameId)!);
  if (domain) canonical.searchParams.set("domain", domain);
  if (scoreDelta) canonical.searchParams.set("scoreDelta", scoreDelta);
  if (scoreTotal) canonical.searchParams.set("scoreTotal", scoreTotal);
  if (rank) canonical.searchParams.set("rank", rank);
  if (word) canonical.searchParams.set("word", word);
  if (handle) canonical.searchParams.set("handle", handle.startsWith("@") ? handle : `@${handle}`);
  if (wins) canonical.searchParams.set("wins", wins);
  if (losses) canonical.searchParams.set("losses", losses);
  if (streak) canonical.searchParams.set("streak", streak);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical.toString(),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: isWin
            ? `Majnu Bhai saved by ${handle || "an anonymous savior"}.`
            : `Majnu Bhai lost today. ${handle || "Someone"} hesitated.`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
