"use client";

import { useState } from "react";
import type { SubmitEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { ChatComposerProps } from "@/types/chat/chat-type";

export function ChatComposer({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
}: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) return;

    onSend(message.trim());
    setMessage("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      if (event.nativeEvent.isComposing) return;

      event.preventDefault();

      if (canSend) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-3xl border border-border bg-card px-3 py-2 shadow-sm transition-colors focus-within:border-ring/50"
    >
      {/* ATTACH DOCUMENT */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Attach document"
        title="Attach document"
        disabled
        className="shrink-0 rounded-full"
      >
        <Paperclip className="size-5" />
      </Button>

      {/* MESSAGE INPUT */}
      <Textarea
        aria-label="Message Velmio"
        placeholder="Ask Velmio anything..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        className="max-h-48 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-card px-2 py-2 shadow-none focus-visible:ring-0"
      />

      {/* SEND / STOP */}
      {isLoading ? (
        <Button
          type="button"
          size="icon"
          aria-label="Stop generating"
          title="Stop generating"
          onClick={onStop}
          className="shrink-0 rounded-full"
        >
          <Square className="size-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          title="Send message"
          disabled={!canSend}
          className="shrink-0 rounded-full"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </form>
  );
}
