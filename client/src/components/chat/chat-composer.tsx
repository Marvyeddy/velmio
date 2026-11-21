import { useState } from "react";
import type { SubmitEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
};

export function ChatComposer({ onSend, onStop, isLoading }: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const canSend = message.trim().length > 0;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend || isLoading) return;

    onSend(message.trim());
    setMessage("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      if (event.nativeEvent.isComposing) return;

      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-3xl border bg-card px-3 py-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label="Attach document"
      >
        <Paperclip className="size-5" />
      </Button>

      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Velmio anything..."
        aria-label="Message Velmio"
        rows={1}
        className="max-h-48 min-h-10 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
      />

      {isLoading ? (
        <Button
          type="button"
          size="icon"
          onClick={onStop}
          aria-label="Stop generating"
          className="shrink-0 rounded-full"
        >
          <Square className="size-4 fill-current" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 rounded-full"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </form>
  );
}
