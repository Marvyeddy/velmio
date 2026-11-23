import { Files } from "lucide-react";

import { useDocuments } from "@/hooks/use-documents";

type DocumentSelectorProps = {
  selectedDocumentId: string | null;
  onSelect: (documentId: string, filename: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function DocumentSelector({
  selectedDocumentId,
  onSelect,
  onClear,
  disabled = false,
}: DocumentSelectorProps) {
  const { data: documents, isLoading, isError } = useDocuments();

  const readyDocuments =
    documents?.filter((document) => document.status === "completed") ?? [];

  function handleSelect(value: string) {
    if (!value) {
      onClear();
      return;
    }

    const document = readyDocuments.find((document) => document.id === value);

    if (!document) return;

    onSelect(document.id, document.filename);
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Files className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" />

      <select
        aria-label="Select document"
        value={selectedDocumentId ?? ""}
        onChange={(event) => handleSelect(event.target.value)}
        disabled={disabled || isLoading || isError}
        className="h-9 max-w-44 cursor-pointer truncate rounded-xl border border-zinc-200 bg-transparent px-2 text-xs text-zinc-600 outline-none transition-colors focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-300"
      >
        <option value="">
          {isLoading
            ? "Loading documents..."
            : isError
              ? "Documents unavailable"
              : "All documents"}
        </option>

        {readyDocuments.map((document) => (
          <option key={document.id} value={document.id}>
            {document.filename}
          </option>
        ))}
      </select>
    </div>
  );
}
