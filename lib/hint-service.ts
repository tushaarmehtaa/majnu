import curatedHints from "@/data/hints.json";
import {
  getCachedHint,
  saveHint,
  type HintRecord,
} from "@/lib/instantdb";

type GenerateHintInput = {
  word: string;
  domain: string;
};

type GenerateHintResult = {
  hint: string;
  source: "curated" | "cache" | "openai" | "fallback";
};

const FALLBACK_HINTS: Record<string, string> = {
  bollywood: "A film term",
  cinema: "A film term",
  movies: "A film term",
  startups: "A startup term",
  web: "A web term",
  webdev: "A web term",
  "web dev": "A web term",
  crypto: "An onchain term",
  fitness: "A training term",
};

const HINT_MIN_LENGTH = 5;

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

function lookupCurated(domain: string, word: string): string | undefined {
  const domainHints = (curatedHints as Record<string, Record<string, string>>)[domain];
  if (!domainHints) return undefined;
  return domainHints[word];
}

async function cacheHint(domain: string, word: string, hint: string) {
  await saveHint(domain, word, hint);
}

async function fetchOpenAIHint(domain: string, word: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY_MAJNU;
  if (!apiKey) {
    return null;
  }

  const prompt = `You are helping players in a dark-comedy hangman game.\nWord: "${word}"\nDomain: "${domain}".\nReturn a single short hint between 5 and 8 words. Avoid using the word itself or obvious rhymes. Respond JSON like {"hint": ""}.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.warn("[generate-hint] OpenAI request failed", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content) as { hint?: string };
      const candidate = parsed.hint?.trim();
      if (candidate && candidate.length >= HINT_MIN_LENGTH) {
        return candidate;
      }
    } catch {
      // ignore JSON parse errors
    }
  } catch (error) {
    console.warn("[generate-hint] OpenAI fetch threw", error);
  }

  return null;
}

function fallbackHint(domain: string, word: string): string {
  const domainKey = normaliseKey(domain);
  if (FALLBACK_HINTS[domainKey]) {
    return FALLBACK_HINTS[domainKey];
  }
  return `Clue from ${domain} without naming ${word.length}-letters.`;
}

export async function generateHintForWord({
  domain,
  word,
}: GenerateHintInput): Promise<GenerateHintResult> {
  const normalizedDomain = normaliseKey(domain);
  const normalizedWord = normaliseKey(word);

  const curated = lookupCurated(normalizedDomain, normalizedWord);
  if (curated) {
    await cacheHint(normalizedDomain, normalizedWord, curated);
    return { hint: curated, source: "curated" };
  }

  const cached: HintRecord | undefined = await getCachedHint(normalizedDomain, normalizedWord);
  if (cached?.hint) {
    return { hint: cached.hint, source: "cache" };
  }

  const openAIHint = await fetchOpenAIHint(normalizedDomain, normalizedWord);
  if (openAIHint) {
    await cacheHint(normalizedDomain, normalizedWord, openAIHint);
    return { hint: openAIHint, source: "openai" };
  }

  const fallback = fallbackHint(normalizedDomain, normalizedWord);
  await cacheHint(normalizedDomain, normalizedWord, fallback);
  return { hint: fallback, source: "fallback" };
}
