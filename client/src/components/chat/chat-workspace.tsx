import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

import {
  ArrowDown,
  CheckCircle2,
  CircleX,
  LoaderCircle,
  Orbit,
  Sparkles,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatTransport } from "@/lib/chat-transport";
import type { VelmioMessage } from "@/types/chat";

import { CopyResponse } from "./chat-response";
import { ChatComposer } from "./chat-composer";
import { useChatScroll } from "@/hooks/use-chat-scroll";

export function ChatWorkspace() {
  const threadIdRef = useRef<string | null>(null);

  const { messages, sendMessage, status, error, stop } = useChat<VelmioMessage>(
    {
      transport: ChatTransport,
    },
  );

  const { containerRef, handleScroll, scrollToBottom, showScrollButton } =
    useChatScroll(messages);

  const isLoading = status === "submitted" || status === "streaming";

  const lastMessage = messages.at(-1);

  // Show a separate thinking indicator only before
  // the assistant message has been created.
  const showThinking =
    status === "submitted" && lastMessage?.role !== "assistant";

  function handleSend(message: string) {
    if (isLoading || !message.trim()) return;

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
    <section className="relative flex h-full min-h-0 flex-col bg-white text-zinc-900 transition-colors duration-300 dark:bg-[#0e0e13] dark:text-zinc-100">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-6 dark:border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
            <Sparkles className="size-4" />
          </div>

          <div>
            <h1 className="text-sm font-semibold tracking-tight">Velmio AI</h1>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Your intelligent workspace
            </p>
          </div>
        </div>

        <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          AI Assistant
        </span>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-7">
          {messages.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="absolute -inset-5 rounded-full bg-violet-500/10 blur-2xl" />

                <div className="relative flex size-18 items-center justify-center rounded-3xl border border-violet-500/15 bg-violet-500/10 text-violet-600 shadow-lg shadow-violet-500/5 dark:bg-violet-500/15 dark:text-violet-400">
                  <Orbit className="size-9" />
                </div>
              </div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your mind,{" "}
                <span className="bg-linear-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  without limits.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                Ask a question, explore an idea, or create something
                extraordinary. Velmio is here to help you think further.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";

              const isLastAssistant =
                message.role === "assistant" && message.id === lastMessage?.id;

              const responseText = message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("\n\n");

              const hasText = responseText.trim().length > 0;

              const hasToolStatus = message.parts.some(
                (part) => part.type === "data-tool-status",
              );

              // Only display the inline thinking indicator
              // when the assistant has no visible content.
              const showInlineThinking =
                isLoading && isLastAssistant && !hasText && !hasToolStatus;

              const showCopyButton = isLastAssistant
                ? hasText && !isLoading
                : message.role === "assistant" && hasText;

              return (
                <div
                  key={message.id}
                  className={
                    isUser ? "flex justify-end" : "flex items-start gap-3"
                  }
                >
                  {/* One assistant avatar per message */}
                  {!isUser && (
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/20">
                      <Orbit className="size-4" />
                    </div>
                  )}

                  <div
                    className={
                      isUser
                        ? "max-w-[85%] rounded-2xl rounded-tr-md border border-violet-200/60 bg-violet-50 px-4 py-3 text-zinc-900 dark:border-violet-500/15 dark:bg-violet-500/10 dark:text-zinc-100 sm:max-w-[75%]"
                        : "min-w-0 max-w-[calc(100%-3rem)] flex-1 py-1"
                    }
                  >
                    {message.parts.map((part, index) => {
                      // -----------------------------
                      // Tool execution status
                      // -----------------------------
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
                            key={`tool-${index}`}
                            role="status"
                            className="flex w-fit flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:border-white/[0.07] dark:bg-white/3 dark:text-zinc-400"
                          >
                            {part.data.status === "running" ? (
                              <LoaderCircle className="size-4 animate-spin text-violet-500" />
                            ) : part.data.status === "completed" ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <CircleX className="size-4 text-red-500" />
                            )}

                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {part.data.label}
                            </span>

                            <span className="text-[11px]">
                              {part.data.status === "running"
                                ? "Running..."
                                : part.data.status === "completed"
                                  ? "Completed"
                                  : "Failed"}
                            </span>
                          </div>
                        );
                      }

                      // -----------------------------
                      // Message text
                      // -----------------------------
                      if (part.type === "text") {
                        if (isUser) {
                          return (
                            <p
                              key={index}
                              className="whitespace-pre-wrap wrap-break-word text-sm leading-7"
                            >
                              {part.text}
                            </p>
                          );
                        }

                        return (
                          <div
                            key={index}
                            className="prose prose-zinc prose-sm max-w-none wrap-break-word dark:prose-invert prose-p:leading-7 prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-pre:text-zinc-100 dark:prose-pre:bg-[#191920]"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        );
                      }

                      return null;
                    })}

                    {/* Thinking inside the existing assistant message */}
                    {showInlineThinking && (
                      <div
                        role="status"
                        className="flex items-center gap-2 py-2 text-sm text-zinc-500 dark:text-zinc-400"
                      >
                        <LoaderCircle className="size-4 animate-spin text-violet-500" />
                        Velmio is thinking...
                      </div>
                    )}

                    {/* Copy response */}
                    {showCopyButton && (
                      <div className="mt-3">
                        <CopyResponse text={responseText} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking before an assistant message exists */}
          {showThinking && (
            <div role="status" className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Orbit className="size-4" />
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <LoaderCircle className="size-4 animate-spin text-violet-500" />
                Velmio is thinking...
              </div>
            </div>
          )}

          {/* Request error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400"
            >
              Something went wrong. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
          className="absolute bottom-28 left-1/2 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-[#202027] dark:text-zinc-300 dark:hover:bg-[#292932]"
        >
          <ArrowDown className="size-4" />
        </button>
      )}

      {/* Composer */}
      <div className="shrink-0 bg-linear-to-t from-white via-white to-transparent px-4 pb-4 pt-4 dark:from-[#0e0e13] dark:via-[#0e0e13] sm:px-6">
        <div className="mx-auto max-w-3xl">
          <ChatComposer
            onSend={handleSend}
            onStop={stop}
            isLoading={isLoading}
          />

          <p className="mt-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Velmio can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </section>
  );
}
