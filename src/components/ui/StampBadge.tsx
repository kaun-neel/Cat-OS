import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { cn } from "../../utils/cn";
import { stampIn } from "../../lib/motion";
import type { RiskStatus } from "../../types";

const config: Record<RiskStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  STABLE: { label: "Stable", color: "text-positive", icon: CheckCircle2 },
  MONITOR: { label: "Monitor", color: "text-clay", icon: Eye },
  ATTENTION: { label: "Attention", color: "text-stamp-red", icon: AlertTriangle },
};

export function StampBadge({ status, animate = false }: { status: RiskStatus; animate?: boolean }) {
  const { label, color, icon: Icon } = config[status];
  return (
    <motion.span
      initial={animate ? "hidden" : false}
      animate="show"
      variants={stampIn}
      className={cn("stamp-label", color)}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
    </motion.span>
  );
}
