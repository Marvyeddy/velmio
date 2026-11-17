import type { ReactNode } from "react";

import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ChatSidebar />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
