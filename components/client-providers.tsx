"use client";

import { OfflineIndicator } from "@/components/offline-indicator";
import { SoundProvider } from "@/components/sound/sound-provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
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
