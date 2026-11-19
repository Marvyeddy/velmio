
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";

import { createChatTransport } from "../lib/ai/chat-transport";
import { getLoadingLabel } from "../components/chat/chat-loading";
import type { VelmioMetadata } from "../types/chat/chat-type";
import { fetchConversation } from "@/lib/api/conversations";

function notifyActiveConversation(conversationId: string | null) {
  window.dispatchEvent(
    new CustomEvent("velmio:active-conversation", {
      detail: conversationId,
    }),
  );
}

export function useVelmioChat() {
  const threadIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const [isOpeningConversation, setIsOpeningConversation] =
    useState(false);
  const [conversationError, setConversationError] =
    useState<string | null>(null);

  const transport = useMemo(
    () =>
      createChatTransport({
        getThreadId: () => threadIdRef.current,
      }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop,
  } = useChat({
    transport,

    onFinish: ({ message }) => {
      const metadata = message.metadata as VelmioMetadata | undefined;

      if (metadata?.threadId) {
        const isNewConversation = threadIdRef.current === null;

        threadIdRef.current = metadata.threadId;
        notifyActiveConversation(metadata.threadId);

        if (isNewConversation) {
          window.dispatchEvent(
            new Event("velmio:conversation-created"),
          );
        }
      }
    },

    onError: (error) => {
      console.error("Chat failed:", error);
    },
  });

  const startNewChat = useCallback(() => {
    if (status === "submitted" || status === "streaming") {
      return;
    }

    requestIdRef.current += 1;
    setIsOpeningConversation(false);
    setConversationError(null);

    threadIdRef.current = null;
    setMessages([]);

    notifyActiveConversation(null);
  }, [status, setMessages]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (status === "submitted" || status === "streaming") {
        return;
      }

      const requestId = ++requestIdRef.current;

      setIsOpeningConversation(true);
      setConversationError(null);

      try {
        const conversation = await fetchConversation(conversationId);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const savedMessages: UIMessage[] = conversation.messages.map(
          (message, index) => ({
            id: `${conversationId}-${index}`,
            role: message.role,
            parts: [
              {
                type: "text",
                text: message.content,
              },
            ],
          }),
        );

        threadIdRef.current = conversation.id;
        setMessages(savedMessages);

        notifyActiveConversation(conversation.id);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("Failed to open conversation:", error);
        setConversationError(
          "Unable to open conversation. Please try again.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setIsOpeningConversation(false);
        }
      }
    },
    [status, setMessages],
  );

  const handleConversationDeleted = useCallback(
    (conversationId: string) => {
      if (threadIdRef.current !== conversationId) {
        return;
      }

      requestIdRef.current += 1;
      setIsOpeningConversation(false);
      setConversationError(null);

      if (status === "submitted" || status === "streaming") {
        void stop();
      }

      threadIdRef.current = null;
      setMessages([]);

      notifyActiveConversation(null);
    },
    [status, stop, setMessages],
  );

  const isLoading =
    status === "submitted" || status === "streaming";

  const loadingLabel = getLoadingLabel(messages, isLoading);

  return {
    messages,
    sendMessage,
    status,
    error,
    stop,
    isLoading,
    loadingLabel,
    startNewChat,
    openConversation,
    handleConversationDeleted,
    isOpeningConversation,
    conversationError,
  };
}
