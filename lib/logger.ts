import { captureException, withScope } from "@sentry/nextjs";

type LogLevel = "info" | "error";

type LogContext = Record<string, unknown>;

const SENTRY_ENABLED = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

function emit(level: LogLevel, event: string, context?: LogContext) {
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...((context && Object.keys(context).length > 0) ? { context } : {}),
  };

  if (level === "error") {
    console.error("[majnu]", payload);
  } else {
    console.log("[majnu]", payload);
  }

}

function reportError(event: string, error: unknown, context?: LogContext) {
  if (!SENTRY_ENABLED) {
    return;
  }

  const throwable =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : JSON.stringify(error));

  withScope((scope) => {
    scope.setTag("event", event);
    scope.setLevel("error");
    if (context) {
      scope.setContext("context", scrubContext(context));
    }
    captureException(throwable);
  });
}

function scrubContext(context: LogContext): LogContext {
  const entries = Object.entries(context ?? {}).slice(0, 12);
  return Object.fromEntries(
    entries.map(([key, value]) => {
      if (value && typeof value === "object") {
        try {
          return [key, JSON.parse(JSON.stringify(value))];
        } catch {
          return [key, "[unserializable]"];
        }
      }
      return [key, value];
    }),
  );
}

export function logServerEvent(event: string, context?: LogContext) {
  emit("info", event, context);
}

export function logServerError(
  event: string,
  error: unknown,
  context?: LogContext,
) {
  const details: LogContext = {
    ...(context ?? {}),
  };
  if (error instanceof Error) {
    details.message = error.message;
    details.stack = error.stack;
  } else if (error) {
    details.error = error;
  }
  emit("error", event, details);
  reportError(event, error, details);
}
