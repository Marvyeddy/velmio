import { Menu } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";
import velmioLogo from "@/assets/velmio-logo.svg";

export function MobileHeader() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const openSidebar = useSidebarStore((state) => state.openSidebar);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden dark:border-white/10 dark:bg-[#0e0e13]">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={openSidebar}
        aria-label="Open sidebar"
        aria-expanded={isOpen}
        aria-controls="dashboard-sidebar"
        className="size-10 rounded-xl text-zinc-600 dark:text-zinc-300"
      >
        <Menu className="size-5" />
      </Button>

      <Link to="/chat" className="flex items-center gap-2">
        <img
          src={velmioLogo}
          alt="Velmio logo"
          width={20}
          height={20}
          className="size-10 shrink-0 rounded-xl shadow-lg shadow-violet-600/20"
        />

        <span className="text-base font-bold tracking-tight">Velmio</span>
      </Link>
    </header>
  );
}
