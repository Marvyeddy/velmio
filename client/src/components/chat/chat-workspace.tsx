import { useChat } from "@ai-sdk/react";

import { ChatComposer } from "./chat-composer";
import { ChatTransport } from "@/lib/chat-transport";
import { useState } from "react";

export function ChatWorkspace() {
  const [threadId] = useState<string | null>(null);
  const { messages, sendMessage, status, error, stop } = useChat({
    transport: ChatTransport,

    onData(datapart) {
      console.log("Data part:", datapart);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  function handleSend(message: string) {
    if (isLoading) return;

    sendMessage(
      {
        text: message,
      },
      {
        body: {
          threadId: threadId,
        },
      },
    );
  }

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
            messages.map((message) => (
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
                    if (part.type !== "text") return null;

                    return (
                      <p key={index} className="whitespace-pre-wrap text-sm">
                        {part.text}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))
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
