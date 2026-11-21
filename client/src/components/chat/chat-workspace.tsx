import { ArrowUp, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatWorkspace() {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Welcome to Velmio</h2>

          <p className="mt-2 text-muted-foreground">
            How can I help you today?
          </p>
        </div>
      </div>

      <div className="w-full shrink-0 px-4 pb-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-3xl border p-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attach document"
          >
            <Paperclip className="size-5" />
          </Button>

          <div className="flex-1 text-sm text-muted-foreground">
            Ask Velmio anything...
          </div>

          <Button
            type="button"
            size="icon"
            disabled
            aria-label="Send message"
            className="rounded-full"
          >
            <ArrowUp className="size-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
