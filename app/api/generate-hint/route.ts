import { NextResponse } from "next/server";

import { generateHintForWord } from "@/lib/hint-service";

type GenerateHintPayload = {
  word?: string;
  domain?: string;
};

export async function POST(request: Request) {
  let payload: GenerateHintPayload = {};
  try {
    payload = (await request.json()) as GenerateHintPayload;
  } catch (error) {
    console.warn("[generate-hint] invalid JSON", error);
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const word = payload.word?.trim();
  const domain = payload.domain?.trim();

  if (!word || !domain) {
    return NextResponse.json(
      { error: "word and domain are required" },
      { status: 400 },
    );
  }

  try {
    const result = await generateHintForWord({ word, domain });
    return NextResponse.json({ hint: result.hint, source: result.source });
  } catch (error) {
    console.error("[generate-hint] failed", error);
    return NextResponse.json(
      { error: "unable to generate hint" },
      { status: 500 },
    );
  }
}
