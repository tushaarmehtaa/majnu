"use client";

import { useEffect } from "react";

import { OfflineIndicator } from "@/components/offline-indicator";
import { SoundProvider } from "@/components/sound/sound-provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user-context";
import { initAnalytics } from "@/lib/analytics";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch (error) {
        console.warn("[pwa] service worker registration failed", error);
      }
    };

    register().catch(() => null);
  }, []);

  return (
    <SoundProvider>
      <UserProvider>
        <OfflineIndicator />
        {children}
        <Toaster />
      </UserProvider>
    </SoundProvider>
  );
}
