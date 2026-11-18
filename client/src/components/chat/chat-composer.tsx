"use client";

import { useState } from "react";
import type { SubmitEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip } from "lucide-react";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ChatComposerProps } from "@/types/chat/chat-type";

export function ChatComposer({ onSend, isLoading = false }: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const canSend = message.trim().length > 0 && !isLoading;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) return;

    onSend(message.trim());
    setMessage("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (canSend) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-3xl rounded-2xl border bg-background p-3 shadow-sm"
    >
      <Textarea
        aria-label="Message Velmio"
        placeholder="Ask Velmio anything..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={2}
        className="min-h-16 resize-none border-0 shadow-none focus-visible:ring-0"
      />

      <div className="mt-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach document"
          disabled
        >
          <Paperclip className="size-5" />
        </Button>

        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!canSend}
          className="rounded-full"
        >
          <ArrowUp className="size-5" />
        </Button>
      </div>
    </form>
  );
}
