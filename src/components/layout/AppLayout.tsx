import { Outlet } from "react-router-dom";
import { FolderNav } from "./FolderNav";
import { Footer } from "./Footer";

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-paper">
      <div className="paw-print-bg" />
      <div className="paper-grain" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <FolderNav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
