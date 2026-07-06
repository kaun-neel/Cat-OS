import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, CheckCircle2, AlertTriangle, Eye, ImageOff, ScanEye } from "lucide-react";
import { Typewriter } from "../components/ui/Typewriter";
import { RiskGauge } from "../components/ui/RiskGauge";
import { IndexCard } from "../components/ui/IndexCard";
import { Reveal } from "../components/ui/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { useActiveCat } from "../context/ActiveCatContext";
import { api, ApiError } from "../lib/api";

type ScanStatus = "idle" | "reading" | "result" | "error";

interface ScanFinding {
  label: string;
  value: string;
}

interface ScanResult {
  riskScore: number;
  level: "monitor" | "stable" | "attention";
  findings: ScanFinding[];
  recommendation: string;
  source?: string;
}

const levelMeta = {
  stable: { label: "Stable", color: "text-positive", icon: CheckCircle2 },
  monitor: { label: "Monitor", color: "text-clay", icon: Eye },
  attention: { label: "Attention", color: "text-stamp-red", icon: AlertTriangle },
};

export default function Scan() {
  const { activeCat, refreshCats } = useActiveCat();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  function handleUploadClick() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeCat) return;

    setResult(null);
    setErrorMsg(null);
    setStatus("reading");

    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    try {
      const form = new FormData();
      form.set("photo", file);
      const res = await api.postForm(`/cats/${activeCat.id}/scan`, form);
      if (res.error) {
        setErrorMsg(res.error);
        setStatus("error");
        return;
      }
      setImage(res.photoUrl);
      setResult(res.result);
      setStatus("result");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Something went wrong reading this photo.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setImage(null);
    setResult(null);
    setErrorMsg(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addToFile() {
    if (!activeCat || !result || !image) return;
    setSaving(true);
    try {
      await api.post(`/cats/${activeCat.id}/scan/save`, {
        photoUrl: image,
        riskScore: result.riskScore,
        findings: result.findings,
        recommendation: result.recommendation,
      });
      await refreshCats();
      notify(`Entry added to ${activeCat.name}'s file.`);
      reset();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't save this entry.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeCat) {
    return <EmptyState message="Open a cat file before scanning a photo." />;
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <p className="stamp-label border-ink-soft text-ink-soft">Photo health check</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Scan a photo</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Upload a clear, well-lit photo of {activeCat.name}. CATOS reads posture, coat
          condition, and eye clarity, and flags anything that warrants a closer look.
        </p>
      </Reveal>

      {status === "idle" && (
        <Reveal>
          <IndexCard className="p-8" dogEar={false}>
            <button
              onClick={handleUploadClick}
              className="flex w-full flex-col items-center justify-center gap-3 border border-dashed border-rule bg-paper px-6 py-16 text-center transition-colors hover:bg-paper-raised"
            >
              <UploadCloud size={30} strokeWidth={1.5} className="text-ink-soft" />
              <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
                Clip a photo, or drag one here
              </p>
              <p className="text-xs text-ink-soft">Accepts JPG, PNG. Camera capture supported on mobile.</p>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </IndexCard>
        </Reveal>
      )}

      <AnimatePresence mode="wait">
        {status === "reading" && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dog-ear border border-rule bg-paper-raised p-10 text-center"
          >
            <ScanEye size={26} strokeWidth={1.5} className="mx-auto mb-4 text-leather" />
            <p className="font-mono text-sm text-ink-soft">
              <Typewriter text="Reading file..." speed={55} cursor />
            </p>
          </motion.div>
        )}

        {status === "error" && errorMsg && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="dog-ear border border-rule bg-paper-raised p-8"
          >
            <ImageOff size={24} strokeWidth={1.5} className="text-stamp-red" />
            <p className="mt-3 text-sm text-ink">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-5 border border-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-leather hover:bg-leather hover:text-paper-raised"
            >
              Try another photo
            </button>
          </motion.div>
        )}

        {status === "result" && result && image && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            <div className="dog-ear relative border border-rule bg-paper-raised p-4">
              <div className="relative overflow-hidden">
                <img src={image} alt="Scanned cat" className="w-full object-cover" />
                {result.findings.some((f) => f.label === "Flagged region" && f.value !== "None") && (
                  <span className="absolute left-4 top-4 border border-stamp-red bg-paper-raised/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-stamp-red">
                    Region flagged
                  </span>
                )}
              </div>
              <p className="mt-3 font-mono text-[11px] text-ink-soft">
                Read on {new Date().toISOString().slice(0, 10)}
                {result.source === "fallback" && " — offline heuristic (Ollama not reachable)"}
              </p>
            </div>

            <div className="border border-rule bg-paper-raised p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-ink">Findings</h2>
                {(() => {
                  const meta = levelMeta[result.level];
                  const Icon = meta.icon;
                  return (
                    <span className={`stamp-label ${meta.color}`} style={{ borderColor: "currentColor" }}>
                      <Icon size={12} />
                      {meta.label}
                    </span>
                  );
                })()}
              </div>

              <dl className="mt-4 space-y-3">
                {result.findings.map((f) => (
                  <div key={f.label} className="flex justify-between gap-4 border-b border-rule/60 pb-2 text-sm">
                    <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{f.label}</dt>
                    <dd className="text-right text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5">
                <RiskGauge score={result.riskScore} />
              </div>

              <div className="stitch-line mt-5 pt-4">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Recommended next step</p>
                <p className="mt-1 text-sm text-ink">{result.recommendation}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={addToFile}
                  disabled={saving}
                  className="bg-leather px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-paper-raised disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add to file"}
                </button>
                <button
                  onClick={reset}
                  className="border border-rule px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-ink-soft hover:bg-paper"
                >
                  Scan another photo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
