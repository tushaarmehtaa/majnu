import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DOMAIN_KEYS, maskWord, pickWord } from "@/lib/game";
import { generateHintForWord } from "@/lib/hint-service";
import { createGame, getOrCreateAnonymousUser, now } from "@/lib/instantdb";

const USER_COOKIE = "majnu-user-id";

type AllowedDomain = (typeof DOMAIN_KEYS)[number];

const allowedDomains = new Set<AllowedDomain>(DOMAIN_KEYS);

type NewGamePayload = {
  domain?: string;
  word?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as NewGamePayload;
  const domain = body.domain;

  if (!domain || !allowedDomains.has(domain as AllowedDomain)) {
    return NextResponse.json({ error: "invalid domain" }, { status: 400 });
  }

  const domainKey = domain as AllowedDomain;

  try {
    const cookieStore = await cookies();
    const existingUserId = cookieStore.get(USER_COOKIE)?.value;
    const user = await getOrCreateAnonymousUser(existingUserId);

    cookieStore.set(USER_COOKIE, user.id, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const requestedWord = typeof body.word === "string" ? body.word.toLowerCase().trim() : undefined;
    const { answer, domainHint } = pickWord(domainKey, requestedWord);
    const initialHint = domainHint;
    const hintResult = await generateHintForWord({
      domain: domainKey,
      word: answer,
    });
    const hint = hintResult.hint ?? initialHint;
    const masked = maskWord(answer);

    const game = await createGame({
      userId: user.id,
      domain: domainKey,
      answer,
      hint,
      masked,
    });

    return NextResponse.json({
      gameId: game.id,
      userId: user.id,
      domain: game.domain,
      masked: game.word_masked,
      hint: game.hint,
      status: game.status,
      wrong_guesses_count: game.wrong_guesses_count,
      guessed_letters: game.guessed_letters,
      wrong_letters: game.wrong_letters,
      created_at: game.created_at,
      finished_at: game.finished_at,
      updated_at: now(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create game";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
