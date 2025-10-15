import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getOrCreateAnonymousUser,
  isHandleAvailable,
  setUserHandle,
} from "@/lib/instantdb";

const USER_COOKIE = "majnu-user-id";
const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,15}$/;

function sanitise(handle: string): string {
  return handle.replace(/^@/, "");
}

export async function POST(request: Request) {
  let payload: { handle?: string } = {};
  try {
    payload = (await request.json()) as { handle?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const raw = payload.handle?.trim();
  if (!raw) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  const handle = sanitise(raw);
  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: "handle must be 3-15 letters, numbers, or _" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = await getOrCreateAnonymousUser(existingUserId);

  cookieStore.set(USER_COOKIE, user.id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  });

  if (user.handle && user.handle.toLowerCase() !== handle.toLowerCase()) {
    return NextResponse.json({ error: "handle locked" }, { status: 400 });
  }

  const available = await isHandleAvailable(handle, user.id);
  if (!available) {
    return NextResponse.json({ error: "handle taken" }, { status: 409 });
  }

  try {
    const updated = await setUserHandle(user.id, handle);
    return NextResponse.json({ handle: updated.handle });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = sanitise(searchParams.get("handle") ?? "");
  if (!HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(USER_COOKIE)?.value;
  const user = existingUserId ? await getOrCreateAnonymousUser(existingUserId) : null;

  const available = await isHandleAvailable(handle, user?.id);
  return NextResponse.json({ available });
}
