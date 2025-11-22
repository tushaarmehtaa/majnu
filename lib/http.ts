const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export type FetchRetryOptions = {
  retries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  retryOnStatus?: (status: number) => boolean;
};

export class MajnuFetchError extends Error {
  response?: Response;

  constructor(message: string, response?: Response) {
    super(message);
    this.name = "MajnuFetchError";
    this.response = response;
  }
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 2, retryDelayMs = 350, onRetry, retryOnStatus } = options;
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(input, init);
      if (response.ok) {
        return response;
      }

      const shouldRetry =
        attempt < retries &&
        (retryOnStatus?.(response.status) ?? RETRYABLE_STATUS.has(response.status));

      if (!shouldRetry) {
        throw new MajnuFetchError(
          `Request failed with status ${response.status}`,
          response,
        );
      }

      await delay(retryDelayMs * Math.max(1, attempt + 1));
      onRetry?.(attempt + 1, response);
    } catch (error) {
      const isLastAttempt = attempt >= retries;
      if (error instanceof Response) {
        if (isLastAttempt) {
          throw error;
        }
        await delay(retryDelayMs * Math.max(1, attempt + 1));
        onRetry?.(attempt + 1, error);
      } else if (error instanceof MajnuFetchError) {
        if (isLastAttempt) {
          throw error;
        }
        await delay(retryDelayMs * Math.max(1, attempt + 1));
        onRetry?.(attempt + 1, error);
      } else if (error instanceof Error && !isLastAttempt) {
        await delay(retryDelayMs * Math.max(1, attempt + 1));
        onRetry?.(attempt + 1, error);
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }

    attempt += 1;
  }

  throw new MajnuFetchError("Request retries exhausted");
}

async function delay(duration: number) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

export async function resolveFetchErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof MajnuFetchError && error.response) {
    const statusSuffix = ` (${error.response.status})`;
    try {
      const data = await error.response.clone().json().catch(() => null);
      if (data && typeof data === "object") {
        const errObj = data as { error?: unknown; message?: unknown };
        const candidate =
          (typeof errObj.error === "string" && errObj.error.trim()) ||
          (typeof errObj.message === "string" && errObj.message.trim());
        if (candidate) {
          return candidate;
        }
      }
    } catch {
      // Swallow JSON parsing issues
    }
    try {
      const text = await error.response.clone().text();
      if (text.trim().length > 0 && text.trim().length < 160) {
        return `${text.trim()}${statusSuffix}`;
      }
    } catch {
      // Swallow text parsing issues
    }
    return `${fallback}${statusSuffix}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
