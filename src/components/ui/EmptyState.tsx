import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export function EmptyState({
  icon: Icon = FileText,
  message,
}: {
  icon?: LucideIcon;
  message: string;
}) {
  return (
    <div className="border border-dashed border-rule bg-paper-raised/60 px-6 py-10 text-center">
      <Icon className="mx-auto mb-3 text-ink-soft" size={26} strokeWidth={1.5} />
      <p className="font-mono text-sm text-ink-soft">{message}</p>
    </div>
  );
}
