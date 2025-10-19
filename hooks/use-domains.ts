"use client";

import { useEffect, useState, useTransition } from "react";

import { getCachedDomains, loadDomains, primeDomains, type DomainsMap } from "@/lib/static-data";

type UseDomainsResult = {
  domains: DomainsMap | null;
  loading: boolean;
  error: Error | null;
};

async function ensureDomains(): Promise<DomainsMap> {
  const cached = getCachedDomains();
  if (cached) {
    return cached;
  }
  const loaded = await loadDomains();
  primeDomains(loaded);
  return loaded;
}

export function useDomains(): UseDomainsResult {
  const [domains, setDomains] = useState<DomainsMap | null>(() => getCachedDomains());
  const [loading, setLoading] = useState(() => domains === null);
  const [error, setError] = useState<Error | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    if (domains) {
      return () => {
        cancelled = true;
      };
    }
    startTransition(() => setLoading(true));
    ensureDomains()
      .then((data) => {
        if (cancelled) return;
        setDomains(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [domains]);

  return { domains, loading, error };
}

export async function preloadDomains(): Promise<DomainsMap> {
  const cached = getCachedDomains();
  if (cached) {
    return cached;
  }
  const data = await loadDomains();
  primeDomains(data);
  return data;
}
