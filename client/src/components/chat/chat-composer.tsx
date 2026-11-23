import { useRef, useState } from "react";
import type { SubmitEvent, KeyboardEvent, ChangeEvent } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = message.trim().length > 0;

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setMessage(event.target.value);
    resizeTextarea();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend || isLoading) return;

    onSend(message.trim());
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
      className="group w-full rounded-[24px] border border-zinc-200 bg-white p-3 shadow-[0_4px_30px_rgba(0,0,0,0.04)] transition-all duration-200 focus-within:border-violet-400/60 focus-within:shadow-[0_4px_35px_rgba(124,58,237,0.08)] dark:border-white/10 dark:bg-[#1a1a22] dark:shadow-[0_4px_30px_rgba(0,0,0,0.15)] dark:focus-within:border-violet-500/40"
    >
      {/* Message textarea */}
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask Velmio anything..."
        aria-label="Message Velmio"
        rows={1}
        className="max-h-48 min-h-12 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 py-3 text-sm leading-6 text-zinc-900 shadow-none outline-none placeholder:text-zinc-400 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      {/* Bottom toolbar */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Document upload - coming later */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attach document"
            title="Document uploads coming soon"
            className="size-9 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/6"
          >
            <Paperclip className="size-4.5" />
          </Button>

          <span className="hidden text-[11px] text-zinc-400 dark:text-zinc-600 sm:inline">
            Shift + Enter for new line
          </span>
        </div>

        {/* Send / Stop button */}
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
            className="size-9 shrink-0 rounded-xl bg-zinc-900 text-white transition-all hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className="size-9 shrink-0 rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-500 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none dark:disabled:bg-white/8 dark:disabled:text-zinc-600"
          >
            <ArrowUp className="size-4.5" />
          </Button>
        )}
      </div>
    </form>
  );
}
