import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useMatch, useNavigate } from "react-router";

import {
  MessageSquarePlus,
  Orbit,
  Sun,
  Moon,
  Monitor,
  Settings2,
  UserRound,
  ChevronDown,
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  LoaderCircle,
  AlertTriangle,
  X,
  Files,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useConversations,
  useRenameConversation,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import { useSidebarStore } from "@/stores/sidebar-store";

type SelectedConversation = {
  id: string;
  title: string;
};

type DialogMode = "rename" | "delete" | null;

export function ChatSidebar() {
  const navigate = useNavigate();
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  const conversationMatch = useMatch("/chat/:conversationId");
  const conversationId = conversationMatch?.params.conversationId;

  const { theme, setTheme } = useTheme();

  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useConversations();

  const renameMutation = useRenameConversation();
  const deleteMutation = useDeleteConversation();

  const [selectedConversation, setSelectedConversation] =
    useState<SelectedConversation | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const [title, setTitle] = useState("");
  const [dialogError, setDialogError] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isSaving = renameMutation.isPending || deleteMutation.isPending;

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const activeTheme = themes.find((item) => item.value === theme) ?? themes[2];

  const ActiveThemeIcon = activeTheme.icon;

  // ----------------------------------
  // Dialog lifecycle
  // ----------------------------------

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (dialogMode) {
      if (!dialog.open) {
        dialog.showModal();
      }

      if (dialogMode === "rename") {
        requestAnimationFrame(() => {
          titleInputRef.current?.focus();
          titleInputRef.current?.select();
        });
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [dialogMode]);

  function closeDialog() {
    if (isSaving) return;

    setDialogMode(null);
    setSelectedConversation(null);
    setTitle("");
    setDialogError("");
  }

  function openRename(conversation: SelectedConversation) {
    setSelectedConversation(conversation);
    setTitle(conversation.title);
    setDialogError("");
    setDialogMode("rename");
  }

  function openDelete(conversation: SelectedConversation) {
    setSelectedConversation(conversation);
    setDialogError("");
    setDialogMode("delete");
  }

  // ----------------------------------
  // Rename
  // ----------------------------------

  async function handleRename() {
    if (!selectedConversation || isSaving) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setDialogError("Please enter a conversation title.");
      return;
    }

    if (trimmedTitle.length > 255) {
      setDialogError("The title cannot exceed 255 characters.");
      return;
    }

    if (trimmedTitle === selectedConversation.title) {
      closeDialog();
      return;
    }

    setDialogError("");

    try {
      await renameMutation.mutateAsync({
        id: selectedConversation.id,
        title: trimmedTitle,
      });

      setDialogMode(null);
      setSelectedConversation(null);
      setTitle("");
    } catch {
      setDialogError("Unable to rename this conversation. Please try again.");
    }
  }

  // ----------------------------------
  // Delete
  // ----------------------------------

  async function handleDelete() {
    if (!selectedConversation || isSaving) return;

    const id = selectedConversation.id;

    setDialogError("");

    try {
      await deleteMutation.mutateAsync(id);

      setDialogMode(null);
      setSelectedConversation(null);
      setTitle("");

      if (conversationId === id) {
        closeSidebar();
        navigate("/chat");
      }
    } catch {
      setDialogError("Unable to delete this conversation. Please try again.");
    }
  }

  function handleNewChat() {
    closeSidebar();
    navigate("/chat");
  }

  return (
    <>
      <aside className="flex h-full w-72 max-w-[85vw] shrink-0 flex-col border-r border-zinc-200 bg-[#f8f8fb] text-zinc-900 transition-colors duration-300 lg:w-64 dark:border-white/[0.07] dark:bg-[#111116] dark:text-zinc-100">
        {/* Brand */}
        <div className="flex h-18 items-center justify-between px-4 shrink-0">
          <Link
            to="/chat"
            onClick={closeSidebar}
            className="flex items-center gap-2.5"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
              <Orbit className="size-5" />
            </div>

            <span className="text-lg font-bold tracking-tight">Velmio</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="size-10 rounded-lg text-zinc-500 hover:bg-zinc-200/70 lg:hidden dark:text-zinc-400 dark:hover:bg-white/6"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* New chat */}
        <div className="px-3 pt-3">
          <Button
            type="button"
            onClick={handleNewChat}
            className="h-11 w-full justify-start gap-3 rounded-xl bg-violet-600 px-4 font-medium text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-500"
          >
            <MessageSquarePlus className="size-4.5" />
            New chat
          </Button>
        </div>

        {/* Documents navigation */}
        <div className="mt-3 px-3">
          <NavLink
            to="/documents"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-white/6"
              }`
            }
          >
            <Files className="size-4.5" />
            <span>Documents</span>
          </NavLink>
        </div>

        {/* Conversations */}
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-3">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Your conversations
            </span>

            {!isLoading && conversations.length > 0 && (
              <span className="text-[11px] text-zinc-400">
                {conversations.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-500"
            >
              <LoaderCircle className="size-4 animate-spin text-violet-500" />
              Loading conversations...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-500/15 p-4 text-center">
              <p className="text-xs text-red-500">
                Could not load conversations.
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void refetch()}
                className="mt-2 text-xs"
              >
                Try again
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center dark:border-white/8">
              <MessageSquarePlus className="mx-auto mb-3 size-5 text-zinc-400 dark:text-zinc-600" />

              <p className="text-xs leading-5 text-zinc-500">
                Your conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = conversationId === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                        : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Link
                      to={`/chat/${conversation.id}`}
                      onClick={closeSidebar}
                      className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3"
                      title={conversation.title}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <MessageSquare className="size-4 shrink-0" />

                      <span className="truncate text-sm">
                        {conversation.title}
                      </span>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Options for ${conversation.title}`}
                            className="mr-1 size-8 shrink-0 rounded-lg opacity-60 hover:bg-zinc-300/60 group-hover:opacity-100 dark:hover:bg-white/10"
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            openRename({
                              id: conversation.id,
                              title: conversation.title,
                            })
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Rename
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            openDelete({
                              id: conversation.id,
                              title: conversation.title,
                            })
                          }
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom settings */}
        <div className="shrink-0 space-y-1 border-t border-zinc-200 p-3 dark:border-white/[0.07]">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/6"
                />
              }
            >
              <ActiveThemeIcon className="size-4.5" />

              <span className="flex-1 text-left text-sm">Appearance</span>

              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {activeTheme.label}
              </span>

              <ChevronDown className="size-3.5 text-zinc-400" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              side="top"
              className="w-60 rounded-xl border-zinc-200 p-1.5 shadow-xl dark:border-white/10"
            >
              {themes.map((item) => {
                const Icon = item.icon;

                return (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => setTheme(item.value)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <Icon className="size-4" />

                    <span className="flex-1 text-sm">{item.label}</span>

                    {theme === item.value && (
                      <Check className="size-4 text-violet-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Settings2 className="size-4.5" />
            Settings
            <span className="ml-auto text-[10px] text-zinc-400">Soon</span>
          </div>

          <Link
            to="/profile"
            onClick={closeSidebar}
            className="flex h-12 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-zinc-200/70 dark:hover:bg-white/6"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
              <UserRound className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">My account</p>

              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                View profile
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Rename / Delete dialog */}
      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          if (isSaving) {
            event.preventDefault();
            return;
          }

          setDialogMode(null);
          setSelectedConversation(null);
          setDialogError("");
        }}
        onClose={() => {
          if (!isSaving) {
            setDialogMode(null);
            setSelectedConversation(null);
            setDialogError("");
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !isSaving) {
            closeDialog();
          }
        }}
        aria-labelledby="conversation-dialog-title"
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-[#1a1a22] dark:text-zinc-100"
      >
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                  dialogMode === "delete"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                }`}
              >
                {dialogMode === "delete" ? (
                  <AlertTriangle className="size-5" />
                ) : (
                  <Pencil className="size-5" />
                )}
              </div>

              <div>
                <h2
                  id="conversation-dialog-title"
                  className="text-base font-semibold"
                >
                  {dialogMode === "rename"
                    ? "Rename conversation"
                    : "Delete conversation"}
                </h2>

                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {dialogMode === "rename"
                    ? "Give this conversation a new name."
                    : "This action cannot be undone."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeDialog}
              disabled={isSaving}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            >
              <X className="size-4" />
            </button>
          </div>

          {dialogMode === "rename" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleRename();
              }}
            >
              <label
                htmlFor="conversation-title"
                className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
              >
                Conversation title
              </label>

              <input
                ref={titleInputRef}
                id="conversation-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDialogError("");
                }}
                maxLength={255}
                disabled={isSaving}
                aria-invalid={Boolean(dialogError)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#111116] dark:focus:border-violet-500"
              />

              <div className="mt-2 text-right text-[11px] text-zinc-400">
                {title.length}/255
              </div>

              {dialogError && (
                <p role="alert" className="mt-2 text-xs text-red-500">
                  {dialogError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isSaving ||
                    !title.trim() ||
                    title.trim() === selectedConversation?.title
                  }
                  className="min-w-30 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                >
                  {renameMutation.isPending && (
                    <LoaderCircle className="size-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold wrap-break-word text-zinc-900 dark:text-zinc-100">
                  {selectedConversation?.title}
                </span>
                ? This conversation and its history will be permanently deleted.
              </p>

              {dialogError && (
                <p role="alert" className="mt-4 text-xs text-red-500">
                  {dialogError}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isSaving}
                  className="rounded-xl bg-red-600 text-white hover:bg-red-500"
                >
                  {deleteMutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Delete conversation
                </Button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
