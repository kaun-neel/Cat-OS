import { Paperclip } from "lucide-react";
import { cn } from "../../utils/cn";

export function PolaroidPhoto({
  src,
  alt,
  rotate = -3,
  size = "md",
  className,
}: {
  src: string;
  alt: string;
  rotate?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: "w-20 h-24",
    md: "w-32 h-40",
    lg: "w-44 h-56",
  }[size];

  return (
    <div
      className={cn("relative bg-paper-raised p-2 pb-4 border border-rule shadow-md", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <Paperclip
        className="absolute -top-3 -left-2 text-ink-soft"
        size={22}
        strokeWidth={1.5}
        style={{ transform: "rotate(-25deg)" }}
      />
      <div className={cn("overflow-hidden bg-paper", dims)}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
