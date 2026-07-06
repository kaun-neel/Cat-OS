import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { cardHover } from "../../lib/motion";

interface IndexCardProps {
  children: ReactNode;
  className?: string;
  dogEar?: boolean;
  hover?: boolean;
}

export function IndexCard({ children, className, dogEar = true, hover = false }: IndexCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover={hover ? "hover" : undefined}
      animate="rest"
      variants={cardHover}
      className={cn(
        "relative border border-rule bg-paper-raised",
        dogEar && "dog-ear",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
