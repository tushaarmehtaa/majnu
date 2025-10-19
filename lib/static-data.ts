type DomainRecord = {
  hint: string;
  words: string[];
};

type HintDomainRecord = Record<string, string>;

type DomainsMap = Record<string, DomainRecord>;
type HintsMap = Record<string, HintDomainRecord>;

let domainsCache: DomainsMap | null = null;
let domainsPromise: Promise<DomainsMap> | null = null;

let hintsCache: HintsMap | null = null;
let hintsPromise: Promise<HintsMap> | null = null;

async function importDomains(): Promise<DomainsMap> {
  const mod = await import("@/data/domains.json");
  const data = (mod as { default?: DomainsMap }).default ?? ((mod as unknown) as DomainsMap);
  return data;
}

async function importHints(): Promise<HintsMap> {
  const mod = await import("@/data/hints.json");
  const data = (mod as { default?: HintsMap }).default ?? ((mod as unknown) as HintsMap);
  return data;
}

export function getCachedDomains(): DomainsMap | null {
  return domainsCache;
}

export async function loadDomains(): Promise<DomainsMap> {
  if (domainsCache) {
    return domainsCache;
  }
  if (!domainsPromise) {
    domainsPromise = importDomains()
      .then((data) => {
        domainsCache = data;
        return data;
      })
      .catch((error) => {
        domainsPromise = null;
        throw error;
      });
  }
  return domainsPromise;
}

export function primeDomains(data: DomainsMap) {
  domainsCache = data;
}

export function clearDomains() {
  domainsCache = null;
  domainsPromise = null;
}

export function getCachedHints(): HintsMap | null {
  return hintsCache;
}

export async function loadHints(): Promise<HintsMap> {
  if (hintsCache) {
    return hintsCache;
  }
  if (!hintsPromise) {
    hintsPromise = importHints()
      .then((data) => {
        hintsCache = data;
        return data;
      })
      .catch((error) => {
        hintsPromise = null;
        throw error;
      });
  }
  return hintsPromise;
}

export function primeHints(data: HintsMap) {
  hintsCache = data;
}

export function clearHints() {
  hintsCache = null;
  hintsPromise = null;
}

export type { DomainsMap, DomainRecord, HintsMap, HintDomainRecord };
