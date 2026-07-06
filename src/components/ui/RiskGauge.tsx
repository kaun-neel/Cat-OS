import { cn } from "../../utils/cn";

const bands = [
  { label: "Low", max: 33, color: "bg-positive" },
  { label: "Moderate", max: 66, color: "bg-clay" },
  { label: "Elevated", max: 100, color: "bg-stamp-red" },
];

export function RiskGauge({ score }: { score: number }) {
  const band = bands.find((b) => score <= b.max) ?? bands[bands.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Risk score</span>
        <span className="font-mono text-sm text-ink">{score}/100 — {band.label}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden border border-rule bg-paper">
        <div
          className={cn("h-full transition-all duration-500", band.color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-soft">
        <span>Low</span>
        <span>Moderate</span>
        <span>Elevated</span>
      </div>
    </div>
  );
}
