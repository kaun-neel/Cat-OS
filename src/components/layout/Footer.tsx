import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";
import { useAuth } from "../../context/AuthContext";

const productLinks = [
  { label: "Scan", to: "/app/scan" },
  { label: "Behavior translator", to: "/app/behavior" },
  { label: "Health timeline", to: "/app/dashboard" },
];

const recordsLinks = [
  { label: "Vet visits", to: "/app/records" },
  { label: "Vaccinations", to: "/app/records" },
  { label: "Feeding schedules", to: "/app/feeding" },
];

export function Footer() {
  const { user } = useAuth();

  function linkProps(to: string) {
    // Logged-in users go straight to the page; logged-out visitors are
    // routed through login first, then bounced to that same page after.
    return user ? { to } : { to: "/login", state: { from: to } };
  }

  return (
    <footer className="stitch-line mt-16 border-t-0 bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <Logo size={24} />
          <p className="mt-2 max-w-xs text-sm text-ink-soft">
            A record file that will hold everything from the medical history of your feline pet to the photos, feeding habits, behavior and other things
          </p>
        </div>
        <div>
          <p className="stamp-label border-ink-soft text-ink-soft">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {productLinks.map((link) => (
              <li key={link.label}>
                <Link {...linkProps(link.to)} className="transition-colors hover:text-leather hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="stamp-label border-ink-soft text-ink-soft">Records</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {recordsLinks.map((link) => (
              <li key={link.label}>
                <Link {...linkProps(link.to)} className="transition-colors hover:text-leather hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-6 font-mono text-xs text-ink-soft sm:px-6">
        Made with ❤️ for cats
      </div>
    </footer>
  );
}
