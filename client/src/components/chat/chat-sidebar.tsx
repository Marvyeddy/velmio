"use client";

import { useEffect, useState } from "react";
import { Plus, MessageSquare } from "lucide-react";

import { fetchConversations } from "../../lib/api/conversations";
import type { Conversation } from "../../types/chat/conversation-type";

export function ConversationSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      setIsLoading(true);
      setError(false);

      try {
        const data = await fetchConversations();

        if (active) {
          setConversations(data);
        }
      } catch {
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    function handleConversationCreated() {
      loadConversations();
    }

    window.addEventListener(
      "velmio:conversation-created",
      handleConversationCreated,
    );

    loadConversations();

    return () => {
      active = false;

      window.removeEventListener(
        "velmio:conversation-created",
        handleConversationCreated,
      );
    };
  }, []);

  return (
    <aside className="flex h-screen w-64 flex-col border-r p-4">
      <h2 className="mb-4 text-xl font-semibold">Velmio</h2>

      <button
        onClick={() => {
          window.dispatchEvent(new Event("velmio:new-chat"));
        }}
        className="mb-6 flex items-center gap-2 rounded-full border p-3 cursor-pointer hover:bg-muted"
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

      <div className="flex flex-col gap-1">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("velmio:open-conversation", {
                  detail: conversation.id,
                }),
              );
            }}
            className="flex items-center gap-2 rounded-lg p-3 text-left text-sm hover:bg-muted"
          >
            <MessageSquare className="size-4 shrink-0" />

            <span className="truncate">
              {conversation.title || "New conversation"}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
