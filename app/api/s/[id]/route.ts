import { NextResponse } from "next/server";

import { getShortLink } from "@/lib/instantdb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getShortLink(id);
  if (!record) {
    return NextResponse.json({ error: "link not found" }, { status: 404 });
  }

  return NextResponse.redirect(record.target, { status: 307 });
}
