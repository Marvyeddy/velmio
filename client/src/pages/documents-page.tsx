import { useState } from "react";
import {
  FileText,
  Trash2,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { useDocuments } from "@/hooks/use-documents";
import { useDeleteDocument } from "@/hooks/use-delete-document";
import { Button } from "@/components/ui/button";
import { DeleteDocumentDialog } from "@/components/documents/delete-dialog";

import type { Document } from "@/types/documents";
import { SEO } from "@/components/seo/seo";

export function DocumentsPage() {
  const { data: documents = [], isPending, isError, refetch } = useDocuments();

  const deleteMutation = useDeleteDocument();

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );

  async function handleDelete() {
    if (!documentToDelete || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync(documentToDelete.id);
      setDocumentToDelete(null);
    } catch {
      // Error is displayed below.
    }
  }

  function openDeleteDialog(document: Document) {
    deleteMutation.reset();
    setDocumentToDelete(document);
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return;

    setDocumentToDelete(null);
    deleteMutation.reset();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <SEO
        title="Documents"
        description="Upload, manage, and analyze your documents with Velmio AI."
      />
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your documents
          </h1>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage documents uploaded to Velmio.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => void refetch()}
          className="shrink-0 rounded-xl"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-16"
        >
          <LoaderCircle className="size-6 animate-spin text-violet-500" />
          <span className="text-sm text-zinc-500">Loading documents...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <p className="text-sm text-red-500">Unable to load your documents.</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isError && documents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-white/10">
          <FileText className="mx-auto mb-4 size-8 text-zinc-400" />

          <p className="font-medium">No documents yet</p>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Upload a PDF, DOCX, or CSV from the chat composer.
          </p>
        </div>
      )}

      {/* Document list */}
      {!isPending && !isError && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((document) => {
            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables === document.id;

            const cannotDelete =
              document.status === "pending" ||
              document.status === "processing" ||
              document.status === "deleting";

            return (
              <div
                key={document.id}
                className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-violet-200 dark:border-white/10 dark:bg-[#1a1a22] dark:hover:border-violet-500/20"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <FileText className="size-5 text-violet-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    title={document.filename}
                  >
                    {document.filename}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{document.file_type.toUpperCase()}</span>

                    <span>{(document.file_size / 1024).toFixed(1)} KB</span>

                    <span>{document.chunk_count} chunks</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {document.status === "completed" ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">
                          Ready
                        </span>
                      </>
                    ) : document.status === "failed" ? (
                      <>
                        <AlertCircle className="size-3.5 text-red-500" />
                        <span className="text-red-500">Failed</span>
                      </>
                    ) : document.status === "deleting" ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin text-zinc-500" />
                        <span className="text-zinc-500">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin text-violet-500" />
                        <span className="text-zinc-500">
                          {document.status === "pending"
                            ? "Pending"
                            : "Processing..."}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={cannotDelete || deleteMutation.isPending}
                  onClick={() => openDeleteDialog(document)}
                  aria-label={`Delete ${document.filename}`}
                  title={
                    cannotDelete
                      ? "Document cannot be deleted in its current state"
                      : "Delete document"
                  }
                  className="shrink-0 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  {isDeleting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete error */}
      {deleteMutation.isError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
          <p className="text-sm text-red-500">{deleteMutation.error.message}</p>
        </div>
      )}

      {/* Confirmation dialog */}
      <DeleteDocumentDialog
        open={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
        filename={documentToDelete?.filename ?? ""}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
      />
    </main>
  );
}
