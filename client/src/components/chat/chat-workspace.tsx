import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { CheckCircleIcon, CircleX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatTransport } from "@/lib/chat-transport";
import type { VelmioMessage } from "@/types/chat";
import { CopyResponse } from "./chat-response";
import { ChatComposer } from "./chat-composer";

export function ChatWorkspace() {
  const threadIdRef = useRef<string | null>(null);

  const { messages, sendMessage, status, error, stop } = useChat<VelmioMessage>(
    {
      transport: ChatTransport,
    },
  );

  const isLoading = status === "submitted" || status === "streaming";

  function handleSend(message: string) {
    if (isLoading) return;

    sendMessage(
      { text: message },
      {
        body: {
          thread_id: threadIdRef.current,
        },
      },
    );
  }

  useEffect(() => {
    for (const message of messages) {
      const id = message.metadata?.threadId;

      if (id) {
        threadIdRef.current = id;
      }
    }
  }, [messages]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="text-2xl font-semibold">Welcome to Velmio</h2>

              <p className="mt-2 text-muted-foreground">
                How can I help you today?
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const responseText = message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("\n\n");

              const showCopyButton =
                message.role === "assistant" &&
                responseText.length > 0 &&
                !(isLoading && message.id === messages.at(-1)?.id);

              return (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[80%] rounded-2xl bg-muted px-4 py-3"
                        : "max-w-[90%] px-2 py-3"
                    }
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "data-tool-status") {
                        const hasNewerStatus = message.parts
                          .slice(index + 1)
                          .some(
                            (next) =>
                              next.type === "data-tool-status" &&
                              next.data.tool === part.data.tool,
                          );

                        if (hasNewerStatus) return null;

                        return (
                          <div
                            key={part.data.tool}
                            role="status"
                            className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
                          >
                            {part.data.status === "running" ? (
                              <span className="size-2 animate-pulse rounded-full bg-current" />
                            ) : part.data.status === "completed" ? (
                              <CheckCircleIcon
                                size={18}
                                className="text-green-600"
                              />
                            ) : (
                              <CircleX size={18} className="text-destructive" />
                            )}

                            <span>{part.data.label}</span>

                            <span className="text-xs">
                              {part.data.status === "running"
                                ? "Running"
                                : part.data.status === "completed"
                                  ? "Completed"
                                  : "Failed"}
                            </span>
                          </div>
                        );
                      }

                      if (part.type === "text") {
                        if (message.role === "user") {
                          return (
                            <p
                              key={index}
                              className="whitespace-pre-wrap text-sm"
                            >
                              {part.text}
                            </p>
                          );
                        }

                        return (
                          <div
                            key={index}
                            className="prose prose-sm dark:prose-invert max-w-none"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );
                      }

                      return null;
                    })}

                    {showCopyButton && (
                      <div className="mt-2">
                        <CopyResponse text={responseText} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

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

      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-3xl">
          <ChatComposer
            onSend={handleSend}
            onStop={stop}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
