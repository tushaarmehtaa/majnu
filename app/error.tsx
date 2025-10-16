"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-beige px-4 text-center text-foreground">
      <div className="max-w-md space-y-3 rounded-2xl border border-red/30 bg-white/80 p-8 shadow-[0_25px_60px_-28px_rgba(192,57,43,0.45)]">
        <h1 className="font-display text-3xl uppercase tracking-[0.3em] text-red">
          {COPY.error.title}
        </h1>
        <p className="text-sm text-foreground/70">{COPY.error.description}</p>
      </div>
      <Button size="lg" className="bg-red text-beige hover:bg-red/90" onClick={reset}>
        {COPY.error.retry}
      </Button>
    </div>
  );
}
