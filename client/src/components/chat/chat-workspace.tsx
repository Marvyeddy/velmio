// src/components/chat/chat-workspace.tsx

"use client";

import { Button } from "../ui/button";

import { ChatComposer } from "./chat-composer";
import { ChatMessage } from "./chat-message";
import { ChatLoading } from "./chat-loading";

import { useVelmioChat } from "../../hooks/use-velmio-chat";
import { useEffect } from "react";

export function ChatWorkspace() {
  const {
    messages,
    sendMessage,
    error,
    stop,
    isLoading,
    loadingLabel,
    startNewChat,
    openConversation,
  } = useVelmioChat();

  useEffect(() => {
    function handleOpenConversation(event: Event) {
      const conversationId = (event as CustomEvent<string>).detail;

      void openConversation(conversationId).catch((error) => {
        console.error("Failed to open conversation:", error);
      });
    }

    window.addEventListener("velmio:open-conversation", handleOpenConversation);

    return () => {
      window.removeEventListener(
        "velmio:open-conversation",
        handleOpenConversation,
      );
    };
  }, [openConversation]);

  useEffect(() => {
    window.addEventListener("velmio:new-chat", startNewChat);

    return () => {
      window.removeEventListener("velmio:new-chat", startNewChat);
    };
  }, [startNewChat]);

  return (
    <div className="flex h-full flex-col">
      {/* MESSAGE AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="py-20 text-center">
              <h1 className="text-2xl font-semibold">Welcome to Velmio</h1>

              <p className="mt-2 text-muted-foreground">
                How can I help you today?
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {loadingLabel && <ChatLoading label={loadingLabel} />}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* CHAT COMPOSER */}
      <div className="p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {isLoading && (
            <Button variant="outline" size="sm" onClick={stop}>
              Stop generating
            </Button>
          )}

          <ChatComposer
            onSend={(text) => sendMessage({ text })}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
