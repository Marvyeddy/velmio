import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export function ChatPage() {
  return (
    <main className="flex h-screen overflow-hidden">
      <ChatSidebar />

      <div className="min-w-0 flex-1">
        <ChatWorkspace />
      </div>
    </main>
  );
}
