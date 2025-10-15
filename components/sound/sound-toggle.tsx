"use client";

import { useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { useSoundSettings } from "@/components/sound/sound-provider";
import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/analytics";

export function SoundToggle() {
  const { muted, toggleMuted } = useSoundSettings();

  const handleClick = useCallback(() => {
    const nextState = !muted;
    logEvent({
      event: "sound_toggle",
      metadata: {
        muted: nextState,
      },
    });
    toggleMuted();
  }, [muted, toggleMuted]);

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={!muted}
      aria-label={muted ? "Enable sound effects" : "Mute sound effects"}
      onClick={handleClick}
      className="flex items-center gap-2 rounded-full border border-red/20 bg-white/60 px-3 py-1.5 text-sm font-semibold text-red shadow-sm transition hover:bg-red/10"
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>Sound</span>
    </Button>
  );
}
