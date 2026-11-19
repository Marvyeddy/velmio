"use client";

import { useCallback, useMemo, useRef } from "react";
import { UIMessage, useChat } from "@ai-sdk/react";

import { createChatTransport } from "../lib/ai/chat-transport";
import { getLoadingLabel } from "../components/chat/chat-loading";
import type { VelmioMetadata } from "../types/chat/chat-type";
import { fetchConversation } from "@/lib/api/conversations";

export function useVelmioChat() {
  const threadIdRef = useRef<string | null>(null);

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
      const metadata = message.metadata as
        | VelmioMetadata
        | undefined;

        if (metadata?.threadId) {
          const isNewConversation = threadIdRef.current === null;
        
          threadIdRef.current = metadata.threadId;
        
          if (isNewConversation) {
            window.dispatchEvent(new Event("velmio:conversation-created"));
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
  
    threadIdRef.current = null;
    setMessages([]);
  }, [status, setMessages]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (status === "submitted" || status === "streaming") {
        return;
      }
  
      const conversation = await fetchConversation(conversationId);
  
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
    },
    [status, setMessages],
  );

  const isLoading =
    status === "submitted" || status === "streaming";

  const loadingLabel = getLoadingLabel(
    messages,
    isLoading,
  );

  return {
    messages,
    sendMessage,
    status,
    error,
    stop,
    isLoading,
    loadingLabel,
    startNewChat,
    openConversation
  };
}