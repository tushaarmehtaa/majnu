"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MajnuHangmanProps = {
    mistakes: number;
    className?: string;
};

export function MajnuHangman({ mistakes, className }: MajnuHangmanProps) {
    // Animation variants for drawing strokes
    const draw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { duration: 0.5, bounce: 0 },
                opacity: { duration: 0.01 }
            }
        }
    };

    return (
        <div className={cn("relative flex items-center justify-center w-full h-full", className)}>
            <svg
                viewBox="0 0 200 200"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full max-w-[300px] text-primary"
            >
                {/* Scaffold - Always Visible */}
                <path d="M20 190H180" className="opacity-50" /> {/* Base */}
                <path d="M50 190V20" className="opacity-50" />  {/* Pole */}
                <path d="M50 20H120" className="opacity-50" />  {/* Top */}
                <path d="M120 20V40" className="opacity-50" />  {/* Rope */}

                {/* 1. Head (with Sunglasses) */}
                {mistakes >= 1 && (
                    <motion.g initial="hidden" animate="visible">
                        {/* Head Circle */}
                        <motion.circle cx="120" cy="60" r="20" variants={draw} />
                        {/* Sunglasses (The "Welcome" Vibe) */}
                        <motion.path d="M110 58H130" strokeWidth="6" className="text-primary" variants={draw} />
                        <motion.path d="M112 62V58" strokeWidth="1" variants={draw} />
                        <motion.path d="M128 62V58" strokeWidth="1" variants={draw} />
                    </motion.g>
                )}

                {/* 2. Body (The Floral Shirt / Gold Chain Vibe) */}
                {mistakes >= 2 && (
                    <motion.g initial="hidden" animate="visible">
                        <motion.line x1="120" y1="80" x2="120" y2="140" variants={draw} />
                        {/* Gold Chain Detail */}
                        <motion.path d="M115 80Q120 95 125 80" strokeWidth="2" className="text-yellow-600" variants={draw} />
                    </motion.g>
                )}

                {/* 3. Left Arm */}
                {mistakes >= 3 && (
                    <motion.line x1="120" y1="100" x2="90" y2="130" variants={draw} />
                )}

                {/* 4. Right Arm (Holding Paintbrush) */}
                {mistakes >= 4 && (
                    <motion.g initial="hidden" animate="visible">
                        <motion.line x1="120" y1="100" x2="150" y2="130" variants={draw} />
                        {/* Paintbrush Tip */}
                        <motion.path d="M150 130L155 135" strokeWidth="2" variants={draw} />
                        <motion.circle cx="158" cy="138" r="3" fill="currentColor" className="text-red-500" />
                    </motion.g>
                )}

                {/* 5. Legs (The End) */}
                {mistakes >= 5 && (
                    <motion.g initial="hidden" animate="visible">
                        <motion.line x1="120" y1="140" x2="100" y2="180" variants={draw} />
                        <motion.line x1="120" y1="140" x2="140" y2="180" variants={draw} />
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
