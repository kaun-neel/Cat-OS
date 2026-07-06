import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Paperclip, ImagePlus, AlertCircle } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";
import { useToast } from "../components/ui/Toast";
import { useActiveCat } from "../context/ActiveCatContext";
import { api, ApiError } from "../lib/api";

const fields = [
  { key: "breed", label: "Breed", placeholder: "e.g. Domestic shorthair", type: "text" },
  { key: "age", label: "Age", placeholder: "e.g. 4 yrs", type: "text" },
  { key: "weightLbs", label: "Weight (lb)", placeholder: "e.g. 9.6", type: "text" },
  { key: "sex", label: "Sex", placeholder: "e.g. Spayed female", type: "text" },
  { key: "conditions", label: "Known conditions (optional)", placeholder: "e.g. Mild seasonal allergies", type: "text" },
  { key: "vet", label: "Primary vet (optional)", placeholder: "e.g. Dr. Osei — Elm Street Veterinary", type: "text" },
];

export default function Onboarding() {
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { notify } = useToast();
  const { refreshCats, setActiveCatId } = useActiveCat();

  const filledCount = useMemo(
    () => fields.filter((f) => values[f.key]?.trim()).length + (photoFile ? 1 : 0) + (name.trim() ? 1 : 0),
    [values, photoFile, name]
  );
  const total = fields.length + 2;
  const isComplete = Boolean(name.trim() && values.breed?.trim() && photoFile);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!isComplete || !photoFile) return;
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("breed", values.breed?.trim() ?? "");
      if (values.age) form.set("age", values.age);
      if (values.weightLbs) form.set("weightLbs", values.weightLbs);
      if (values.sex) form.set("sex", values.sex);
      if (values.conditions) form.set("conditions", values.conditions);
      if (values.vet) form.set("vet", values.vet);
      form.set("photo", photoFile);

      const { cat } = await api.postForm("/cats", form);
      await refreshCats();
      setActiveCatId(cat.id);
      notify(`File opened. ${cat.name}'s record is ready.`);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open the file. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-paper">
      <div className="paw-print-bg" />
      <div className="paper-grain" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <Reveal>
          <p className="stamp-label border-ink-soft text-ink-soft">New file</p>
          <h1 className="mt-3 font-display text-3xl text-ink">Open a file for your cat</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Fill in what you know now. Name, breed, and a photo are enough to start and the rest
            can be added later.
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="dog-ear relative mt-8 border border-rule bg-paper-raised p-6 sm:p-8"
        >
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-6xl font-semibold uppercase tracking-widest text-ink/5">
            {isComplete ? "OPEN" : "DRAFT"}
          </span>

          <div className="relative flex items-center justify-between">
            <span className="stamp-label border-leather text-leather">NEW FILE</span>
            <span className="font-mono text-[11px] text-ink-soft">
              {filledCount}/{total} fields
            </span>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[9rem_1fr]">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-soft">Photo</p>
              <label className="relative flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-rule bg-paper text-center transition-colors hover:bg-paper-raised sm:w-36">
                {photoPreview ? (
                  <img src={photoPreview} alt="Uploaded cat" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Paperclip size={20} className="text-ink-soft" strokeWidth={1.5} />
                    <ImagePlus size={16} className="text-ink-soft" strokeWidth={1.5} />
                    <span className="px-3 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                      Clip a photo
                    </span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clementine"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
                />
              </div>
              {fields.map((field) => (
                <div key={field.key} className={field.key === "conditions" || field.key === "vet" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="relative mt-5 flex items-start gap-2 border border-stamp-red/40 bg-stamp-red/5 px-3 py-2 text-sm text-stamp-red">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="stitch-line relative mt-8 flex items-center justify-between pt-5">
            <p className="text-xs text-ink-soft">
              {isComplete ? "Ready to open." : "Name, breed, and a photo are required to open the file."}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!isComplete || submitting}
              className="bg-leather px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-paper-raised transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Opening…" : "Open file"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
