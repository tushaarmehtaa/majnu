"use client";

import { motion } from "framer-motion";

import { motionFade } from "@/lib/motion";

type LoadingOverlayProps = {
  active: boolean;
  label?: string;
};

export function LoadingOverlay({ active, label = "Loading..." }: LoadingOverlayProps) {
  if (!active) {
    return null;
  }

  return (
    <motion.div
      variants={motionFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 text-sm font-medium text-red backdrop-blur-sm"
    >
      <span className="animate-pulse">{label}</span>
    </motion.div>
  );
}
