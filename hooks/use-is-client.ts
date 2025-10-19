"use client";

import { useEffect, useState } from "react";

export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const frame = window.requestAnimationFrame(() => setIsClient(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return isClient;
}
