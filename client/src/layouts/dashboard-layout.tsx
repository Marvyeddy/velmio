import { useEffect } from "react";
import { Outlet } from "react-router";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { MobileHeader } from "@/layouts/mobile-header";
import { useSidebarStore } from "@/stores/sidebar-store";

export function DashboardLayout() {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        if (document.querySelector("dialog[open]")) return;

        closeSidebar();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeSidebar]);

  return (
    <main className="relative flex h-dvh overflow-hidden bg-white text-zinc-950 dark:bg-[#0e0e13] dark:text-zinc-100">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Responsive sidebar */}
      <div
        id="dashboard-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 shrink-0
          transition-transform duration-300 ease-in-out
          motion-reduce:transition-none
          lg:visible lg:static lg:z-auto lg:translate-x-0
          ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}
        `}
      >
        <ChatSidebar />
      </div>

      {/* Main content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader />

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
