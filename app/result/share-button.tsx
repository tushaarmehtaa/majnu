"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logEvent } from "@/lib/analytics";
import { buildShareCopy } from "@/lib/share";

type ShareButtonProps = {
  outcome: "win" | "loss";
  scoreDelta?: number | null;
  scoreTotal?: number | null;
  rank?: number | null;
  shareUrl: string;
  userId?: string;
  className?: string;
};

export function ShareButton({
  outcome,
  scoreDelta,
  scoreTotal,
  rank,
  shareUrl,
  userId,
  className,
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const shortLinkRef = useRef<string | null>(null);
  const handleShare = useCallback(async () => {
    const copy = buildShareCopy({
      outcome,
      scoreDelta: scoreDelta ?? null,
      scoreTotal: scoreTotal ?? null,
      rank: rank ?? null,
    });
    let targetUrl = shareUrl;
    if (!shortLinkRef.current && !isCreating) {
      try {
        setIsCreating(true);
        const response = await fetch("/api/share-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: shareUrl }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { url?: string };
          if (payload.url) {
            shortLinkRef.current = payload.url;
            targetUrl = payload.url;
          }
        }
      } catch {
        // ignore failure, fall back to long URL
      } finally {
        setIsCreating(false);
      }
    } else if (shortLinkRef.current) {
      targetUrl = shortLinkRef.current;
    }

    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      copy,
    )}&url=${encodeURIComponent(targetUrl)}`;

    logEvent({
      event: "share_click",
      userId,
      metadata: {
        outcome,
        score_delta: scoreDelta ?? null,
        score_total: scoreTotal ?? null,
        rank: rank ?? null,
      },
    });

    if (typeof window !== "undefined") {
      const popup = window.open(intentUrl, "_blank", "noopener,noreferrer");
      if (popup) {
        toast({
          title: "Tweet ready — copy looks killer.",
          description: "Preview the card and send it into the timeline.",
        });
      } else {
        toast({
          title: "Pop-up blocked.",
          description: "Allow pop-ups for Save Majnu Bhai and try again.",
          variant: "destructive",
        });
      }
    }
  }, [isCreating, outcome, rank, scoreDelta, scoreTotal, shareUrl, toast, userId]);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleShare}
      className={className}
    >
      Share Your Score
    </Button>
  );
}
