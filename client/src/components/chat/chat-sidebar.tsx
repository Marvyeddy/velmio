"use client";

import { useEffect, useState } from "react";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";

import {
  deleteConversation,
  fetchConversations,
  renameConversation,
} from "../../lib/api/conversations";
import type { Conversation } from "../../types/chat/conversation-type";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { ThemeToggle } from "../theme-toggle";

export function ConversationSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function loadConversations() {
      const currentRequest = ++requestId;

      setIsLoading(true);
      setError(false);

      try {
        const data = await fetchConversations();

        if (active && currentRequest === requestId) {
          setConversations(data);
        }
      } catch {
        if (active && currentRequest === requestId) {
          setError(true);
        }
      } finally {
        if (active && currentRequest === requestId) {
          setIsLoading(false);
        }
      }
    }

    function handleConversationCreated() {
      void loadConversations();
    }

    function handleActiveConversation(event: Event) {
      const conversationId = (event as CustomEvent<string | null>).detail;

      setActiveConversationId(conversationId);
    }

    window.addEventListener(
      "velmio:conversation-created",
      handleConversationCreated,
    );

    window.addEventListener(
      "velmio:active-conversation",
      handleActiveConversation,
    );

    void loadConversations();

    return () => {
      active = false;

      window.removeEventListener(
        "velmio:conversation-created",
        handleConversationCreated,
      );

      window.removeEventListener(
        "velmio:active-conversation",
        handleActiveConversation,
      );
    };
  }, []);

  function startRenaming(conversation: Conversation) {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title ?? "");
    setRenameError(null);
  }

  function cancelRenaming() {
    if (isSaving) return;

    setEditingId(null);
    setEditingTitle("");
    setRenameError(null);
  }

  async function saveRename(conversationId: string) {
    const title = editingTitle.trim();

    if (!title || title.length > 255 || isSaving) return;

    setIsSaving(true);
    setRenameError(null);

    try {
      const updated = await renameConversation(conversationId, title);

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, title: updated.title }
            : conversation,
        ),
      );

      setEditingId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      setRenameError("Unable to rename conversation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(conversationId: string) {
    if (deletingId !== null) return;

    setDeletingId(conversationId);
    setDeleteError(null);

    try {
      await deleteConversation(conversationId);

      setConversations((previous) =>
        previous.filter((conversation) => conversation.id !== conversationId),
      );

      setDeleteDialogId(null);

      window.dispatchEvent(
        new CustomEvent("velmio:conversation-deleted", {
          detail: conversationId,
        }),
      );
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setDeleteError("Unable to delete conversation. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r p-4">
      <h2 className="mb-4 text-xl font-semibold">Velmio</h2>

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event("velmio:new-chat"));
        }}
        className="mb-6 flex cursor-pointer items-center gap-2 rounded-full border p-3 hover:bg-muted"
      >
        <Plus className="size-4" />
        New chat
      </button>

      <p className="mb-3 text-xs text-muted-foreground">Your conversations</p>

      {isLoading && (
        <p className="text-sm text-muted-foreground">
          Loading conversations...
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          Unable to load conversations.
        </p>
      )}

      {!isLoading && !error && conversations.length === 0 && (
        <p className="text-sm text-muted-foreground">No conversations yet.</p>
      )}

      <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group flex items-center gap-2 rounded-lg p-2 hover:bg-muted ${
              activeConversationId === conversation.id ? "bg-muted" : ""
            }`}
          >
            {editingId === conversation.id ? (
              <div className="min-w-0 flex-1">
                <input
                  autoFocus
                  type="text"
                  maxLength={255}
                  value={editingTitle}
                  disabled={isSaving}
                  onChange={(event) => {
                    setEditingTitle(event.target.value);
                    setRenameError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void saveRename(conversation.id);
                    }

                    if (event.key === "Escape") {
                      cancelRenaming();
                    }
                  }}
                  onBlur={() => {
                    if (!renameError) cancelRenaming();
                  }}
                  className="w-full rounded bg-muted px-2 py-1 text-sm outline-none"
                />

                {renameError && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {renameError}
                  </p>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-current={
                    activeConversationId === conversation.id
                      ? "page"
                      : undefined
                  }
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("velmio:open-conversation", {
                        detail: conversation.id,
                      }),
                    );
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                >
                  <MessageSquare className="size-4 shrink-0" />

                  <span className="truncate">
                    {conversation.title || "New conversation"}
                  </span>
                </button>

                <button
                  type="button"
                  title="Rename conversation"
                  aria-label="Rename conversation"
                  disabled={isSaving || deletingId !== null}
                  onClick={() => startRenaming(conversation)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Pencil className="size-4" />
                </button>

                <AlertDialog
                  open={deleteDialogId === conversation.id}
                  onOpenChange={(open) => {
                    if (deletingId !== null) return;

                    setDeleteDialogId(open ? conversation.id : null);
                    setDeleteError(null);
                  }}
                >
                  <AlertDialogTrigger
                    render={
                      <button
                        type="button"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                        disabled={deletingId !== null}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    }
                  />

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete conversation?</AlertDialogTitle>

                      <AlertDialogDescription>
                        This will permanently delete &quot;
                        {conversation.title || "New conversation"}
                        &quot;. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteError && (
                      <p role="alert" className="text-sm text-destructive">
                        {deleteError}
                      </p>
                    )}

                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingId !== null}>
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        disabled={deletingId !== null}
                        onClick={(event) => {
                          event.preventDefault();
                          void handleDelete(conversation.id);
                        }}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {deletingId === conversation.id
                          ? "Deleting..."
                          : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-auto flex shrink-0 items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">Appearance</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
