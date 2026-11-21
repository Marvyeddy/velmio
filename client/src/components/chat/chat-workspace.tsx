"use client";

import { useState } from "react";
import { ChatComposer } from "./chat-composer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);

  function handleSend(message: string) {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    setMessages((previous) => [...previous, newMessage]);
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
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto max-w-3xl">
          <ChatComposer onSend={handleSend} />
        </div>
      </div>
    </section>
  );
}
