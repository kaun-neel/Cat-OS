import { Link } from "react-router-dom";
import { ArrowRight, ScanEye, FolderOpen, CalendarClock } from "lucide-react";
import { HeroIndexCard } from "../components/landing/HeroIndexCard";
import { CaseFileCard } from "../components/landing/CaseFileCard";
import { Reveal, RevealGroup } from "../components/ui/Reveal";
import { Footer } from "../components/layout/Footer";
import { Logo } from "../components/ui/Logo";

const caseFiles = [
  {
    photo: "/images/cat-clementine.jpg",
    concern: "Mild redness near the left ear, coat otherwise normal",
    action: "Logged to file. Recommended monitoring for one week.",
    fileNumber: "FILE #014",
  },
  {
    photo: "/images/case-eye.jpg",
    concern: "Slight cloudiness in left eye, no discharge present",
    action: "Flagged as elevated. Recommended a vet visit within 48 hours.",
    fileNumber: "FILE #041",
  },
  {
    photo: "/images/case-coat.jpg",
    concern: "Posture and coat condition within normal range",
    action: "No action needed. Added to timeline for trend tracking.",
    fileNumber: "FILE #052",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-paper">
      <div className="paw-print-bg" />
      <div className="paper-grain" />
      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Logo size={30} />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-ink"
            >
              Log in
            </Link>
            <Link
              to="/login"
              state={{ from: "/onboarding" }}
              className="border border-leather px-4 py-2 font-mono text-xs uppercase tracking-wide text-leather transition-colors hover:bg-leather hover:text-paper-raised"
            >
              Open a file
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="stamp-label border-ink-soft text-ink-soft">Digitized record catalog</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
              Every cat's health, behavior and care, kept like a file, not a feed.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
              The CATOS system will analyze a photo for any indication of a problem, turn strange behaviors into common language, and keep feeding logs and veterinary history together. The CATOS system seems to be something similar to an old index card system that was used by veterinarians before.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                state={{ from: "/onboarding" }}
                className="group flex items-center gap-2 bg-leather px-5 py-3 font-mono text-xs uppercase tracking-wide text-paper-raised transition-transform hover:-translate-y-0.5"
              >
                Open a file
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="font-mono text-xs uppercase tracking-wide text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink"
              >
                Log in
              </Link>
            </div>
          </div>

          <HeroIndexCard />
        </section>

        <section className="stitch-line mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <p className="stamp-label border-ink-soft text-ink-soft">How it works</p>
            <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">Three ways in, one file out</h2>
          </Reveal>
          <RevealGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3" stagger={0.08}>
            {[
              { icon: ScanEye, title: "Photo becomes a health read", body: "Upload a photo or short video. CATOS reads posture, coat, and eye clarity and flags anything worth watching." },
              { icon: FolderOpen, title: "Behavior becomes a plain answer", body: "Describe what you're seeing. CATOS turns it into a likely explanation and a next step, not a guess." },
              { icon: CalendarClock, title: "Care becomes a schedule", body: "Feeding times and vaccination due dates live on the file, with reminders that fire before they're missed." },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="border border-rule bg-paper-raised p-5">
                  <item.icon size={22} strokeWidth={1.5} className="text-leather" />
                  <h3 className="mt-3 font-display text-lg text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </section>

        <section className="stitch-line mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Reveal>
            <p className="stamp-label border-ink-soft text-ink-soft">Case files</p>
            <h2 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
              What a scan actually returns
            </h2>
          </Reveal>
          <RevealGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3" stagger={0.08}>
            {caseFiles.map((cf) => (
              <Reveal key={cf.fileNumber}>
                <CaseFileCard {...cf} />
              </Reveal>
            ))}
          </RevealGroup>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal className="border border-rule bg-paper-raised px-6 py-10 text-center sm:px-12">
            <h2 className="font-display text-3xl text-ink">Start this cat's file</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
              Name, breed, and one photo is enough to open a file. Everything else can be added
              as you go.
            </p>
            <Link
              to="/login"
              state={{ from: "/onboarding" }}
              className="mt-6 inline-flex items-center gap-2 bg-leather px-5 py-3 font-mono text-xs uppercase tracking-wide text-paper-raised transition-transform hover:-translate-y-0.5"
            >
              Open a file
              <ArrowRight size={14} />
            </Link>
          </Reveal>
        </section>

        <Footer />
      </div>
    </div>
  );
}
