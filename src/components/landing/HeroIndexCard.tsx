import { useState } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "../ui/Typewriter";
import { StampBadge } from "../ui/StampBadge";

const lines = [
  { label: "Name", value: "Clementine" },
  { label: "Species", value: "Domestic shorthair, 4 yrs" },
  { label: "Behavior noted", value: "Excessive grooming, flank licking, day 3" },
  { label: "Photo read", value: "Mild redness near left ear, coat otherwise normal" },
];

export function HeroIndexCard() {
  const [step, setStep] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [watermark, setWatermark] = useState("DRAFT");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="dog-ear relative mx-auto w-full max-w-md border border-rule bg-paper-raised p-6 shadow-xl"
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-6xl font-semibold uppercase tracking-widest text-ink/5">
        {watermark}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="stamp-label border-leather text-leather">FILE #014</span>
        <span className="font-mono text-[11px] text-ink-soft">2025-12-02</span>
      </div>

      <div className="relative mt-5 space-y-4">
        {lines.map((line, i) => (
          <div key={line.label} className="min-h-[2.6rem]">
            {step >= i && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{line.label}</p>
                <p className="font-body text-sm text-ink">
                  {step === i ? (
                    <Typewriter
                      text={line.value}
                      speed={26}
                      onDone={() => {
                        setStep((s) => s + 1);
                        if (i === lines.length - 1) {
                          setTimeout(() => setShowBadge(true), 200);
                          setTimeout(() => setWatermark("OPEN"), 300);
                        }
                      }}
                    />
                  ) : (
                    line.value
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="stitch-line relative mt-5 flex items-center justify-between pt-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Status</p>
          {showBadge ? (
            <StampBadge status="MONITOR" animate />
          ) : (
            <span className="inline-block h-5 w-24 bg-rule/40" />
          )}
        </div>
        <p className="max-w-[9rem] text-right text-xs text-ink-soft">
          {showBadge && "Recommended: schedule a vet check within one week"}
        </p>
      </div>
    </motion.div>
  );
}
