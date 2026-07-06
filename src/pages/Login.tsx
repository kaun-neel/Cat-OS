import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { cn } from "../utils/cn";

type Mode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: string })?.from || "/app/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper px-4 py-14 sm:px-6">
      <div className="paw-print-bg" />
      <div className="paper-grain" />
      <div className="relative z-10 w-full max-w-md">
        <Reveal>
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex">
              <Logo size={34} />
            </Link>
            <p className="mt-2 text-sm text-ink-soft">
              {mode === "login" ? "Welcome back. Open your files." : "Create an account to start a file."}
            </p>
          </div>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="dog-ear relative border border-rule bg-paper-raised p-6 sm:p-8"
        >
          <div className="flex gap-0.5">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "flex-1 border px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors",
                  mode === m ? "border-leather bg-leather text-paper-raised" : "border-rule text-ink-soft hover:bg-paper"
                )}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full border-b border-rule bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-leather"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-stamp-red/40 bg-stamp-red/5 px-3 py-2 text-sm text-stamp-red">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 bg-leather px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-paper-raised transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
              {submitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-soft">
            {mode === "login" ? "New here?" : "Already have a file?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-leather underline decoration-rule underline-offset-4"
            >
              {mode === "login" ? "Create an account" : "Log in instead"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
