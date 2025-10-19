import domainData from "@/data/domains.json";
import { primeDomains, type DomainsMap } from "@/lib/static-data";

export type GameStatus = "active" | "won" | "lost";

const domains = domainData as DomainsMap;
primeDomains(domains);

export type DomainKey = keyof typeof domains;

export type DomainDefinition = {
  hint: string;
  words: string[];
};

export const MAX_WRONG_GUESSES = 5;

export const DOMAIN_KEYS = Object.keys(domains) as DomainKey[];

export function listDomains(): Array<{
  key: DomainKey;
  hint: string;
  words: number;
}> {
  return DOMAIN_KEYS.map((key) => ({
    key,
    hint: domains[key].hint,
    words: domains[key].words.length,
  }));
}

export function getDomain(domain: string): DomainDefinition {
  if (!Object.prototype.hasOwnProperty.call(domains, domain)) {
    throw new Error(`Unknown domain "${domain}"`);
  }
  return domains[domain as DomainKey];
}

export function maskWord(answer: string): string {
  return answer
    .split("")
    .map((char) => (/[a-z]/.test(char) ? "_" : char))
    .join("");
}

export function reveal(mask: string, answer: string, letter: string): string {
  if (!letter || letter.length !== 1) {
    return mask;
  }

  const normalizedLetter = letter.toLowerCase();
  const answerChars = answer.split("");
  const maskChars = mask.split("");

  return maskChars
    .map((char, index) =>
      answerChars[index] === normalizedLetter ? normalizedLetter : char,
    )
    .join("");
}

export function isWin(mask: string, answer: string): boolean {
  return mask === answer;
}

export function isLoss(wrong: number): boolean {
  return wrong >= MAX_WRONG_GUESSES;
}
