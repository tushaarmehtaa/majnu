"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logEvent } from "@/lib/analytics";
import { COPY } from "@/lib/copy";
import { buildShareCopy } from "@/lib/share";
import { useOffline } from "@/hooks/use-offline";

type ShareButtonProps = {
  outcome: "win" | "loss";
  scoreDelta?: number | null;
  scoreTotal?: number | null;
  rank?: number | null;
  shareUrl: string;
  userId?: string;
  handle?: string | null;
  wins?: number | null;
  losses?: number | null;
  streak?: number | null;
  className?: string;
};

export function ShareButton({
  outcome,
  scoreDelta,
  scoreTotal,
  rank,
  shareUrl,
  userId,
  handle,
  wins,
  losses,
  streak,
  className,
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const shortLinkRef = useRef<string | null>(null);
  const { offline } = useOffline();
  const handleShare = useCallback(async () => {
    if (offline) {
      setShareError(COPY.game.offline.description);
      toast({
        title: COPY.game.offline.title,
        description: COPY.game.offline.description,
        variant: "destructive",
      });
      return;
    }

    setShareError(null);

    const copy = buildShareCopy({
      outcome,
      scoreDelta: scoreDelta ?? null,
      scoreTotal: scoreTotal ?? null,
      rank: rank ?? null,
      handle: handle ?? null,
      wins: wins ?? null,
      losses: losses ?? null,
      streak: streak ?? null,
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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create share link";
        setShareError(message);
        toast({
          title: "Share link failed",
          description: message,
          variant: "destructive",
        });
        logEvent({
          event: "error",
          userId,
          metadata: {
            source: "share_link",
            message,
          },
        });
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
        handle: handle ?? null,
      },
    });

    if (typeof window !== "undefined") {
      const popup = window.open(intentUrl, "_blank", "noopener,noreferrer");
      if (popup) {
        toast({
          title: COPY.share.successToast.title,
          description: COPY.share.successToast.description,
        });
      } else {
        toast({
          title: COPY.share.blockedToast.title,
          description: COPY.share.blockedToast.description,
          variant: "destructive",
        });
      }
    }
  }, [handle, isCreating, losses, offline, outcome, rank, scoreDelta, scoreTotal, shareUrl, streak, toast, userId, wins]);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleShare}
      className={className}
      disabled={isCreating}
    >
      {shareError ? "Retry Share" : COPY.share.button}
    </Button>
  );
}
