import { cn } from "../../utils/cn";

// Single source of truth for the CATOS brand mark. Swap /public/images/logo.png
// to change the logo everywhere it appears across the app.
export function Logo({
  size = 32,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <img
        src="/images/logo.png"
        alt="CATOS"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      {showText && (
        <span className="font-display text-lg font-semibold uppercase tracking-wide text-leather">
          OS
        </span>
      )}
    </span>
  );
}
