import {
  getCachedHint,
  saveHint,
  type HintRecord,
} from "@/lib/instantdb";
import { getCachedHints, loadHints, primeHints, type HintDomainRecord, type HintsMap } from "@/lib/static-data";

type GenerateHintInput = {
  word: string;
  domain: string;
};

type GenerateHintResult = {
  hint: string;
  source: "curated" | "cache" | "openai" | "fallback";
};

const FALLBACK_HINTS: Record<string, string> = {
  bollywood: "Think cult Bollywood chaos",
  cinema: "Think cult Bollywood chaos",
  movies: "Think cult Bollywood chaos",
  startups: "Boardroom buzzword for founders",
  web: "A tool used on the modern web",
  webdev: "A tool used on the modern web",
  "web dev": "A tool used on the modern web",
  crypto: "Something the on-chain crowd says",
  fitness: "Gym-lingo you hear from trainers",
};

const HINT_MIN_LENGTH = 5;

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

async function resolveCuratedHints(): Promise<HintsMap> {
  const cached = getCachedHints();
  if (cached) {
    return cached;
  }
  const loaded = await loadHints();
  primeHints(loaded);
  return loaded;
}

async function lookupCurated(domain: string, word: string): Promise<string | undefined> {
  const hints = await resolveCuratedHints();
  const domainHints: HintDomainRecord | undefined = hints[domain];
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
  const base = FALLBACK_HINTS[domainKey];
  const descriptor = base ?? `A clue pulled from ${domainKey}`;
  return `${descriptor}. ${word.length}-letter answer.`;
}

export async function generateHintForWord({
  domain,
  word,
}: GenerateHintInput): Promise<GenerateHintResult> {
  const normalizedDomain = normaliseKey(domain);
  const normalizedWord = normaliseKey(word);

  const curated = await lookupCurated(normalizedDomain, normalizedWord);
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
