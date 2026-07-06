import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";
import { useActiveCat } from "../../context/ActiveCatContext";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../ui/Logo";

const tabs = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/scan", label: "Scan" },
  { to: "/app/behavior", label: "Behavior" },
  { to: "/app/feeding", label: "Feeding" },
  { to: "/app/records", label: "Records" },
  { to: "/app/vets", label: "Vets & shelters" },
];

export function FolderNav() {
  const { cats, activeCat, setActiveCatId } = useActiveCat();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}>
            <Logo size={28} />
          </button>

          {activeCat ? (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="stamp-label border-leather text-leather hover:bg-paper-raised"
              >
                {activeCat.name}
                <ChevronDown size={12} />
              </button>
              {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-52 border border-rule bg-paper-raised shadow-lg">
                  {cats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCatId(c.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left font-mono text-xs uppercase tracking-wide hover:bg-paper",
                        c.id === activeCat.id ? "text-leather" : "text-ink-soft"
                      )}
                    >
                      {c.name} — {c.fileNumber}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/onboarding");
                    }}
                    className="flex w-full items-center gap-1.5 border-t border-rule px-3 py-2 text-left font-mono text-xs uppercase tracking-wide text-leather hover:bg-paper"
                  >
                    <Plus size={12} /> Add a cat
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/onboarding")}
              className="stamp-label border-leather text-leather hover:bg-paper-raised"
            >
              <Plus size={12} /> Open a file
            </button>
          )}
        </div>

        <nav className="hidden items-end gap-0.5 md:flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "folder-tab -mb-px border border-b-0 border-rule px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors",
                  isActive
                    ? "relative z-10 bg-paper-raised text-ink"
                    : "bg-rule/40 text-ink-soft hover:bg-rule/60"
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              cn(
                "font-mono text-xs uppercase tracking-wide underline-offset-4",
                isActive ? "text-leather underline" : "text-ink-soft hover:text-ink"
              )
            }
          >
            {user?.name?.split(" ")[0] ?? "Settings"}
          </NavLink>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-stamp-red"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>

      <nav className="flex overflow-x-auto border-t border-rule md:hidden">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "shrink-0 whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase tracking-wide",
                isActive ? "bg-paper-raised text-ink" : "text-ink-soft"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
