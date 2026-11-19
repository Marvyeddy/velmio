import { ConversationSidebar } from "../../components/chat/chat-sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ConversationSidebar />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
