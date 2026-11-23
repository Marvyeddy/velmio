import { useRef, useState } from "react";
import type { SubmitEvent, KeyboardEvent, ChangeEvent } from "react";

import {
  ArrowUp,
  Paperclip,
  Square,
  FileText,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUploadDocument } from "@/hooks/use-upload-documents";
import { useDocumentStatus } from "@/hooks/use-document-status";

type ChatComposerProps = {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".csv"];

export function ChatComposer({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadDocument();
  const documentStatus = useDocumentStatus(documentId);

  const canSend = message.trim().length > 0;
  const canSubmit = canSend && !isLoading && !disabled;

  const processingStatus = documentStatus.data?.status;

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

    if (!canSubmit) return;

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

      if (canSubmit) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = "";

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileError("Only PDF, DOCX, and CSV files are supported.");
      return;
    }

    setFileError(null);
    setDocumentId(null);
    setFilename(file.name);

    try {
      const result = await upload.mutateAsync(file);
      setDocumentId(result.document_id);
    } catch {
      setFileError("Unable to upload document. Please try again.");
    }
  }

  function clearDocument() {
    setDocumentId(null);
    setFilename(null);
    setFileError(null);
    upload.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="group w-full rounded-[24px] border border-zinc-200 bg-white p-3 shadow-[0_4px_30px_rgba(0,0,0,0.04)] transition-all duration-200 focus-within:border-violet-400/60 focus-within:shadow-[0_4px_35px_rgba(124,58,237,0.08)] dark:border-white/10 dark:bg-[#1a1a22] dark:shadow-[0_4px_30px_rgba(0,0,0,0.15)] dark:focus-within:border-violet-500/40"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.csv"
        className="hidden"
        aria-label="Choose document"
        onChange={handleFileChange}
      />

      {/* Document attachment */}
      {filename && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <FileText className="size-5 shrink-0 text-violet-500" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{filename}</p>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              {upload.isPending ? (
                <>
                  <LoaderCircle className="size-3 animate-spin" />
                  Uploading...
                </>
              ) : documentStatus.isError ? (
                <>
                  <AlertCircle className="size-3 text-red-500" />
                  Unable to check processing status
                </>
              ) : processingStatus === "completed" ? (
                <>
                  <CheckCircle2 className="size-3 text-green-500" />
                  Ready
                </>
              ) : processingStatus === "failed" || upload.isError ? (
                <>
                  <AlertCircle className="size-3 text-red-500" />
                  Processing failed
                </>
              ) : (
                <>
                  <LoaderCircle className="size-3 animate-spin" />
                  Processing document...
                </>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearDocument}
            disabled={upload.isPending}
            aria-label="Dismiss document"
            className="size-7 shrink-0 rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {fileError && (
        <p role="alert" className="mb-3 text-xs text-red-500">
          {fileError}
        </p>
      )}

      {/* Message textarea */}
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={
          disabled ? "Loading conversation..." : "Ask Velmio anything..."
        }
        aria-label="Message Velmio"
        rows={1}
        className="max-h-48 min-h-12 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 py-3 text-sm leading-6 text-zinc-900 shadow-none outline-none placeholder:text-zinc-400 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      {/* Bottom toolbar */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || upload.isPending}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach document"
            title="Attach PDF, DOCX, or CSV"
            className="size-9 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/6"
          >
            {upload.isPending ? (
              <LoaderCircle className="size-4.5 animate-spin" />
            ) : (
              <Paperclip className="size-4.5" />
            )}
          </Button>

          <span className="hidden text-[11px] text-zinc-400 dark:text-zinc-600 sm:inline">
            Shift + Enter for new line
          </span>
        </div>

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
            disabled={!canSubmit}
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
