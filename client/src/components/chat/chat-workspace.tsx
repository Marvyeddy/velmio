"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { ChatComposer } from "./chat-composer";
import { ChatMessage } from "./chat-message";
import { ChatLoading } from "./chat-loading";

import { useVelmioChat } from "../../hooks/use-velmio-chat";

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
    handleConversationDeleted,
    isOpeningConversation,
    conversationError,
  } = useVelmioChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const wasOpeningRef = useRef(false);

  useEffect(() => {
    function handleOpenConversation(event: Event) {
      const conversationId = (event as CustomEvent<string>).detail;

      void openConversation(conversationId);
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

  useEffect(() => {
    function onConversationDeleted(event: Event) {
      const conversationId = (event as CustomEvent<string>).detail;

      handleConversationDeleted(conversationId);
    }

    window.addEventListener(
      "velmio:conversation-deleted",
      onConversationDeleted,
    );

    return () => {
      window.removeEventListener(
        "velmio:conversation-deleted",
        onConversationDeleted,
      );
    };
  }, [handleConversationDeleted]);

  function handleScroll() {
    const container = scrollContainerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 100;
  }

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) return;

    const lastMessage = messages.at(-1);
    const lastMessageId = lastMessage?.id ?? null;

    const isNewMessage =
      lastMessageId !== null && lastMessageId !== lastMessageIdRef.current;

    const finishedOpening = wasOpeningRef.current && !isOpeningConversation;

    if (isNewMessage || finishedOpening || messages.length === 0) {
      shouldAutoScrollRef.current = true;
    }

    lastMessageIdRef.current = lastMessageId;
    wasOpeningRef.current = isOpeningConversation;

    if (shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loadingLabel, isOpeningConversation, conversationError, error]);

  const composerDisabled = isLoading || isOpeningConversation;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* MESSAGE AREA */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {isOpeningConversation && (
            <p role="status" className="text-sm text-muted-foreground">
              Opening conversation...
            </p>
          )}

          {!isOpeningConversation && messages.length === 0 && (
            <div className="py-20 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome to Velmio
              </h1>

              <p className="mt-2 text-muted-foreground">
                How can I help you today?
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {loadingLabel && <ChatLoading label={loadingLabel} />}

          {conversationError && (
            <p role="alert" className="text-sm text-destructive">
              {conversationError}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* FIXED CHAT COMPOSER */}
      <div className="shrink-0 bg-background px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          <ChatComposer
            onSend={(text) => {
              if (composerDisabled) return;

              shouldAutoScrollRef.current = true;

              void sendMessage({ text });
            }}
            onStop={() => void stop()}
            isLoading={isLoading}
            disabled={isOpeningConversation}
          />
        </div>
      </div>
    </div>
  );
}
