"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/analytics";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    logEvent({
      event: "fatal_error",
      metadata: {
        message: error.message,
        digest: error.digest,
        timestamp: Date.now(),
      },
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-6 rounded-3xl border border-red/30 bg-white/85 p-8 shadow-[0_25px_60px_-28px_rgba(192,57,43,0.45)]">
        <div className="space-y-2">
          <h2 className="font-display text-3xl uppercase tracking-[0.35em] text-red">Oops! Rope snapped.</h2>
          <p className="text-sm text-foreground/70">
            Majnu tripped over the wires. We logged it and the crew is on it. Try again in a second or head back
            home.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button className="w-full bg-red text-beige hover:bg-red/90" onClick={() => reset()}>
            Retry Scene
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to Safety</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
