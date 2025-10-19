"use client";

import { useEffect, useState } from "react";

type OfflineState = {
  offline: boolean;
  lastChangedAt: number | null;
};

export function useOffline(): OfflineState {
  const [state, setState] = useState<OfflineState>(() => ({
    offline: typeof navigator !== "undefined" ? !navigator.onLine : false,
    lastChangedAt: null,
  }));

  useEffect(() => {
    const handleOnline = () => {
      setState({ offline: false, lastChangedAt: Date.now() });
    };
    const handleOffline = () => {
      setState({ offline: true, lastChangedAt: Date.now() });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return state;
}
