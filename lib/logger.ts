type LogLevel = "info" | "error";

type LogContext = Record<string, unknown>;

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
}
