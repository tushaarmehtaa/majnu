"use client";

const USER_STORAGE_KEY = "majnu-analytics-user";

type AnalyticsPayload = {
  event: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export function setAnalyticsUserId(userId: string) {
  try {
    window.localStorage.setItem(USER_STORAGE_KEY, userId);
  } catch (error) {
    console.warn("Unable to persist analytics user id", error);
  }
}

function getStoredUserId(): string | null {
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

  const resolvedUserId = userId ?? getStoredUserId() ?? "anonymous";
  const payload = {
    event,
    user_id: resolvedUserId,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
  console.info("[majnu-metrics]", payload);
}

export { USER_STORAGE_KEY };
