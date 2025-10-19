"use client";

import { useEffect, useState } from "react";

import { useOffline } from "@/hooks/use-offline";
import { useIsClient } from "@/hooks/use-is-client";

export function OfflineIndicator() {
  const isClient = useIsClient();
  const { offline } = useOffline();
  const [visible, setVisible] = useState(offline);

  useEffect(() => {
    if (!isClient) return;
    if (offline) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const timeout = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [isClient, offline]);

  if (!isClient || !visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-[min(90vw,360px)] -translate-x-1/2 justify-center">
      <div className="pointer-events-auto w-full rounded-full border border-red/30 bg-red/90 px-4 py-3 text-center text-sm font-semibold text-beige shadow-[0_18px_50px_-18px_rgba(192,57,43,0.6)]">
        No Internet. Majnu waits patiently.
      </div>
    </div>
  );
}
