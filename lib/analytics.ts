"use client";

import posthog from "posthog-js";

export const USER_STORAGE_KEY = "majnu-analytics-user";
const SESSION_REFERRER_KEY = "majnu-session-referrer";
const EVENT_LIMIT = 12;

type AnalyticsPayload = {
  event: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

type AnalyticsEntry = {
  event: string;
  user: string;
  timestamp: string;
  metadata?: string;
};

const eventBuffer: AnalyticsEntry[] = [];
let posthogInitialised = false;
let sessionProperties: Record<string, string | number | null> | null = null;

function ensureSessionProperties(): Record<string, string | number | null> {
  if (sessionProperties) {
    return sessionProperties;
  }
  const deviceType = typeof navigator !== "undefined" ? detectDeviceType() : "unknown";
  const referrer = typeof document !== "undefined" ? resolveReferrer() : null;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  sessionProperties = {
    device_type: deviceType,
    referrer: referrer ?? "direct",
    timezone,
  };
  return sessionProperties;
}

export function initAnalytics() {
  if (typeof window === "undefined" || posthogInitialised) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    return;
  }

  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
  });
  posthogInitialised = true;
  const props = ensureSessionProperties();
  posthog.register({
    ...props,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "v1.0.0",
  });
  const storedUserId = getStoredUserId();
  if (storedUserId) {
    posthog.identify(storedUserId);
  }
}

export function setAnalyticsUserId(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(USER_STORAGE_KEY, userId);
  } catch (error) {
    console.warn("Unable to persist analytics user id", error);
  }

  initAnalytics();

  if (posthogInitialised) {
    posthog.identify(userId);
  }
}

function getStoredUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(USER_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to read analytics user id", error);
    return null;
  }
}

export function logEvent({ event, userId, metadata }: AnalyticsPayload) {
  if (typeof window === "undefined") {
    return;
  }

  initAnalytics();

  const resolvedUserId = userId ?? getStoredUserId() ?? "anonymous";
  const context = ensureSessionProperties();
  const payload: Record<string, unknown> = {
    ...context,
    path: window.location.pathname,
    timestamp: Date.now(),
    ...(metadata ?? {}),
  };

  const entry: AnalyticsEntry = {
    event,
    user: resolvedUserId,
    timestamp: new Date().toISOString(),
    ...(Object.keys(payload).length > 0
      ? {
          metadata: JSON.stringify(payload).slice(0, 160),
        }
      : {}),
  };

  eventBuffer.push(entry);
  if (eventBuffer.length > EVENT_LIMIT) {
    eventBuffer.shift();
  }

  // Keep debug console table for quick inspection
  console.table(eventBuffer);

  if (posthogInitialised) {
    posthog.capture(event, sanitizePayload(payload));
  }
}

function sanitizePayload(payload: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

function detectDeviceType(): string {
  const ua = navigator.userAgent || "";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua) || /ipad/i.test(ua)) return "tablet";
  if (/android/i.test(ua) && !/mobile/i.test(ua)) return "tablet";
  return "desktop";
}

function resolveReferrer(): string | null {
  try {
    const stored = window.sessionStorage.getItem(SESSION_REFERRER_KEY);
    if (stored) {
      return stored;
    }
    const referrer = document.referrer;
    const cleaned =
      referrer && referrer.length > 0
        ? new URL(referrer).host.replace(/^www\./, "")
        : "direct";
    window.sessionStorage.setItem(SESSION_REFERRER_KEY, cleaned);
    return cleaned;
  } catch {
    return "direct";
  }
}
