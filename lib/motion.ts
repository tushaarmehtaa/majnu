import type { Transition, Variants } from "framer-motion";

const easeCurve: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export const motionTransition: Transition = {
  duration: 0.35,
  ease: easeCurve,
};

export const motionSpring = {
  type: "spring" as const,
  damping: 18,
  stiffness: 120,
};

export const motionFade: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: motionTransition },
  exit: { opacity: 0, y: -12, transition: motionTransition },
};

export const motionListItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: motionTransition },
  exit: { opacity: 0, y: -8, transition: motionTransition },
};
