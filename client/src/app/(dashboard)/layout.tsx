import type { ReactNode } from "react";
import { ConversationSidebar } from "../../components/chat/chat-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <ConversationSidebar />

      <main className="min-w-0 min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
