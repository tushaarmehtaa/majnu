"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-4 rounded-3xl border border-red/30 bg-white/80 p-8 shadow-[0_25px_60px_-28px_rgba(192,57,43,0.45)]">
        <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-red">The rope snarled.</h2>
        <p className="text-sm text-foreground/70">Try again.</p>
        <pre className="max-h-40 overflow-auto rounded-md bg-red/5 p-3 text-left text-xs font-mono text-red/80">
          {error.message}
        </pre>
        <Button className="w-full bg-red text-beige hover:bg-red/90" onClick={() => reset()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
