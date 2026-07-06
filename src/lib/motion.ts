import type { Variants } from "framer-motion";

// Centralized animation variants — reused across pages instead of
// re-invented per component. Keep motion vocabulary small and consistent.

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const cardHover: Variants = {
  rest: { y: 0, boxShadow: "0 1px 2px rgba(43,33,24,0.08)" },
  hover: {
    y: -3,
    boxShadow: "0 10px 20px rgba(43,33,24,0.12)",
    transition: { duration: 0.12, ease: "easeOut" },
  },
};

export const stampIn: Variants = {
  hidden: { opacity: 0, scale: 1.15 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
};

export const crossFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeInOut" } },
};

export const pullFromStack: Variants = {
  rest: { rotate: 0, scale: 1 },
  active: { rotate: -1, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } },
};
