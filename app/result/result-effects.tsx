"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

import { useSound } from "@/hooks/use-sound";
import { SOUNDS, SOUND_VOLUMES } from "@/lib/sounds";

type ResultEffectsProps = {
  outcome: "win" | "loss";
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  color: string;
};

const CONFETTI_COLORS = ["#8B0000", "#D4AF37", "#F5E6D3", "#1A1A1A", "#B80000"];

export function ResultEffects({ outcome }: ResultEffectsProps) {
  const { play } = useSound(
    outcome === "win" ? SOUNDS.win : SOUNDS.loss,
    { volume: SOUND_VOLUMES.outcome }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      play();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [play]);

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    if (outcome !== "win") {
      return [];
    }
    return Array.from({ length: 26 }).map((_, index) => {
      const base = index + 1;
      return {
        id: index,
        left: ((base * 37) % 100) + 1,
        delay: ((base * 13) % 20) / 100,
        duration: 0.9 + (((base * 17) % 7) / 10),
        rotation: (base * 53) % 360,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      };
    });
  }, [outcome]);

  if (outcome === "win") {
    return (
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.span
            key={piece.id}
            className="absolute h-2 w-3 rounded-sm"
            style={{
              left: `${piece.left}%`,
              top: "-10%",
              backgroundColor: piece.color,
            }}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{
              y: "120vh",
              opacity: [0, 1, 1, 0],
              rotate: piece.rotation,
            }}
            transition={{
              delay: piece.delay,
              duration: piece.duration,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-10 bg-red-900/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    />
  );
}
