import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getGameById, getShortLink } from "@/lib/instantdb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://savemajnu.live";

type ShareParams = {
  id: string;
};

function asNumber(value?: string | null): string | null {
  if (!value) return null;
  return Number.isFinite(Number.parseInt(value, 10)) ? value : null;
}

function inferOutcome(raw?: string | null): "win" | "loss" {
  if (!raw) return "loss";
  return raw.toLowerCase() === "won" || raw.toLowerCase() === "win" ? "win" : "loss";
}

export async function generateMetadata(
  { params }: { params: ShareParams },
): Promise<Metadata> {
  const record = await getShortLink(params.id);
  if (!record) {
    return {
      title: "Majnu is Missing",
      description: "This share link has expired. Play a fresh round instead.",
    };
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(record.target);
  } catch {
    return {
      title: "Save Majnu Bhai",
      description: "Guess the word. Save the man.",
    };
  }

  const outcome = inferOutcome(targetUrl.searchParams.get("status"));
  const gameId = targetUrl.searchParams.get("gameId") ?? undefined;
  const scoreDelta = asNumber(targetUrl.searchParams.get("scoreDelta"));
  const scoreTotal = asNumber(targetUrl.searchParams.get("scoreTotal"));
  const rankParam = asNumber(targetUrl.searchParams.get("rank"));
  const throttled = targetUrl.searchParams.get("throttled") === "true";

  let answer = targetUrl.searchParams.get("word") ?? "";
  let domain = targetUrl.searchParams.get("domain") ?? "";
  if (gameId) {
    const game = await getGameById(gameId);
    if (game) {
      answer = game.word_answer ?? answer;
      domain = game.domain ?? domain;
    }
  }

  const ogParams = new URLSearchParams({
    outcome,
  });
  if (scoreDelta) ogParams.set("score_delta", scoreDelta);
  if (scoreTotal) ogParams.set("score_total", scoreTotal);
  if (rankParam) ogParams.set("rank", rankParam);
  if (answer) ogParams.set("word", answer);
  if (domain) ogParams.set("domain", domain);
  if (throttled) ogParams.set("throttled", "true");

  const ogImageUrl = `${SITE_URL}/api/og/result?${ogParams.toString()}`;
  const title = outcome === "win" ? "Majnu Survived." : "Majnu is Dead.";
  const description = answer
    ? `Correct word: ${answer.toUpperCase()}`
    : "Guess the word. Save the man.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/s/${params.id}`,
      type: "article",
      images: [ogImageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ShareRedirect({ params }: { params: ShareParams }) {
  const record = await getShortLink(params.id);
  if (!record) {
    notFound();
  }
  redirect(record.target);
}
