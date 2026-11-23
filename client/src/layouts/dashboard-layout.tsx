import { Outlet } from "react-router";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export function DashboardLayout() {
  return (
    <main className="flex h-screen overflow-hidden bg-white text-zinc-950 dark:bg-[#0e0e13] dark:text-zinc-100">
      <ChatSidebar />

      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}
