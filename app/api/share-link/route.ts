import { NextResponse } from "next/server";

import { createShortLink } from "@/lib/instantdb";

export async function POST(request: Request) {
  let payload: { target?: string } = {};
  try {
    payload = (await request.json()) as { target?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const target = payload.target?.toString().trim();
  if (!target) {
    return NextResponse.json({ error: "target is required" }, { status: 400 });
  }

  try {
    const validationUrl = new URL(target);
    if (!/^https?:$/.test(validationUrl.protocol)) {
      return NextResponse.json({ error: "target must be http or https" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "target must be a valid URL" }, { status: 400 });
  }

  const record = await createShortLink(target);
  const base = new URL(request.url);
  base.pathname = `/s/${record.id}`;
  base.search = "";
  base.hash = "";

  return NextResponse.json({ id: record.id, url: base.toString() });
}
