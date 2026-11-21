import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export default function App() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <ChatSidebar />

      <main className="min-h-0 min-w-0 flex-1">
        <ChatWorkspace />
      </main>
    </div>
  );
}
