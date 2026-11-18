"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { ChatComposer } from "@/components/chat/chat-composer";
import { createChatTransport } from "@/lib/ai/chat-transport";
import { VelmioMetadata } from "@/types/chat/chat-type";

export function ChatWorkspace() {
  const threadIdRef = useRef<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      createChatTransport({
        getThreadId: () => threadIdRef.current,
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,

    onFinish: ({ message }) => {
      const metadata = message.metadata as VelmioMetadata | undefined;

      if (metadata?.threadId) {
        threadIdRef.current = metadata.threadId;
        setThreadId(metadata.threadId);
      }
    },

    onError: (error) => {
      console.error("Chat failed:", error);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
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
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                  : "mr-auto w-full"
              }
            >
              {message.parts.map((part, index) => {
                if (part.type !== "text") return null;

                return (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              })}
            </div>
          ))}

          {status === "submitted" && (
            <p className="text-sm text-muted-foreground">
              Velmio is thinking...
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

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
