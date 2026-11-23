import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export function ChatPage() {
  return (
    <main className="flex h-screen overflow-hidden bg-white text-zinc-950 transition-colors duration-300 dark:bg-[#0e0e13] dark:text-zinc-100">
      <ChatSidebar />

      <div className="min-w-0 flex-1">
        <ChatWorkspace />
      </div>
    </main>
  );
}
