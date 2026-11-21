import { MessageSquarePlus, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatSidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r p-4">
      <div className="mb-6 flex items-center gap-2">
        <PanelLeft className="size-5" />

        <h1 className="text-xl font-semibold">Velmio</h1>
      </div>

      <Button variant="outline" className="w-full justify-start">
        <MessageSquarePlus className="size-4" />
        New chat
      </Button>

      <div className="mt-8 flex-1">
        <p className="mb-4 text-sm text-muted-foreground">Your conversations</p>

        <p className="text-sm text-muted-foreground">No conversations yet.</p>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm">My account</p>
      </div>
    </aside>
  );
}
