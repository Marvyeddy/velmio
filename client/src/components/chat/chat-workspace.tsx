import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

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

import { conversationKeys, useConversation } from "@/hooks/use-conversations";

import { CopyResponse } from "./chat-response";
import { ChatComposer } from "./chat-composer";
import velmioLogo from "@/assets/velmio-logo.svg";
import { useChatScroll } from "@/hooks/use-chat-scroll";

type ChatWorkspaceProps = {
  conversationId: string | null;
  sessionKey: string;
  shouldLoadHistory: boolean;
};

export function ChatWorkspace({
  conversationId,
  sessionKey,
  shouldLoadHistory,
}: ChatWorkspaceProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Backend conversation ID.
  // This is separate from the frontend chat session key.
  const threadIdRef = useRef<string | null>(conversationId);

  // Prevent navigating more than once for a newly created chat.
  const hasNavigatedRef = useRef(false);

  // Track which saved conversation has been restored.
  const [restoredConversationId, setRestoredConversationId] = useState<
    string | null
  >(null);

  // Fetch history only when opening an existing conversation.
  // A newly created conversation already has messages in useChat.
  const {
    data: savedConversation,
    isLoading: isLoadingConversation,
    isError: isConversationError,
    refetch: refetchConversation,
  } = useConversation(shouldLoadHistory ? conversationId : null);

  const { messages, sendMessage, status, error, stop, setMessages } =
    useChat<VelmioMessage>({
      id: sessionKey,
      transport: ChatTransport,
    });

  const { containerRef, handleScroll, scrollToBottom, showScrollButton } =
    useChatScroll(messages);

  const isLoading = status === "submitted" || status === "streaming";

  const lastMessage = messages.at(-1);

  const showThinking =
    status === "submitted" && lastMessage?.role !== "assistant";

  const isHistoryReady =
    !shouldLoadHistory ||
    (Boolean(savedConversation) && restoredConversationId === conversationId);

  const isComposerDisabled =
    !isHistoryReady ||
    (shouldLoadHistory && isLoadingConversation) ||
    (shouldLoadHistory && isConversationError);

  // ----------------------------------
  // Restore saved conversation history
  // ----------------------------------

  useEffect(() => {
    if (!shouldLoadHistory) return;
    if (!conversationId || !savedConversation) return;
    if (savedConversation.id !== conversationId) return;
    if (restoredConversationId === conversationId) return;

    const restoredMessages: VelmioMessage[] = savedConversation.messages.map(
      (message, index) => ({
        id: `${conversationId}-${index}`,
        role: message.role,
        parts: [
          {
            type: "text" as const,
            text: message.content,
          },
        ],
      }),
    );

    threadIdRef.current = conversationId;

    setMessages(restoredMessages);
    setRestoredConversationId(conversationId);
  }, [
    shouldLoadHistory,
    conversationId,
    savedConversation,
    restoredConversationId,
    setMessages,
  ]);

  // ----------------------------------
  // Track thread ID from streamed metadata
  // ----------------------------------

  useEffect(() => {
    // Do not allow historical messages to override
    // the ID of the currently opened conversation.
    if (shouldLoadHistory) return;

    for (const message of messages) {
      const id = message.metadata?.threadId;

      if (id) {
        threadIdRef.current = id;
      }
    }
  }, [messages, shouldLoadHistory]);

  // ----------------------------------
  // Update URL after creating a conversation
  // ----------------------------------

  useEffect(() => {
    // Only new chats need a URL assigned.
    if (conversationId) return;

    // Never navigate during streaming.
    if (isLoading) return;

    // Prevent duplicate navigation.
    if (hasNavigatedRef.current) return;

    const newThreadId = messages.find((message) => message.metadata?.threadId)
      ?.metadata?.threadId;

    if (!newThreadId) return;

    hasNavigatedRef.current = true;
    threadIdRef.current = newThreadId;

    // Refresh sidebar independently of workspace messages.
    void queryClient.invalidateQueries({
      queryKey: conversationKeys.all,
    });

    // Preserve the frontend session when the URL changes.
    navigate(`/chat/${newThreadId}`, {
      replace: true,
      state: {
        preserveSessionKey: sessionKey,
      },
    });
  }, [conversationId, isLoading, messages, navigate, queryClient, sessionKey]);

  // ----------------------------------
  // Send message
  // ----------------------------------

  function handleSend(message: string, documentId: string | null) {
    const text = message.trim();

    if (!text || isLoading || isComposerDisabled) {
      return;
    }

    void sendMessage(
      { text },
      {
        body: {
          thread_id: threadIdRef.current,
          document_id: documentId,
        },
      },
    );
  }

  // ----------------------------------
  // Render
  // ----------------------------------

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
          {/* Loading existing conversation */}
          {shouldLoadHistory && !isHistoryReady && !isConversationError ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <LoaderCircle className="size-4 animate-spin text-violet-500" />
              Loading conversation...
            </div>
          ) : shouldLoadHistory && isConversationError ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <p role="alert" className="text-sm text-red-500">
                Unable to load this conversation.
              </p>

              <button
                type="button"
                onClick={() => void refetchConversation()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            /* Empty conversation */
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="absolute -inset-5 rounded-full bg-violet-500/10 blur-2xl" />

                <img
                  src={velmioLogo}
                  alt="Velmio logo"
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-xl shadow-lg shadow-violet-600/20"
                />
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

              const showInlineThinking =
                isLoading && isLastAssistant && !hasText && !hasToolStatus;

              const showCopyButton =
                message.role === "assistant" &&
                hasText &&
                !(isLastAssistant && isLoading);

              return (
                <div
                  key={message.id}
                  className={
                    isUser ? "flex justify-end" : "flex items-start gap-3"
                  }
                >
                  {/* Assistant avatar */}
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
                      // Tool execution status
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

                      // Message text
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

                    {/* Inline thinking */}
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

          {/* Thinking before assistant message exists */}
          {isHistoryReady && !isConversationError && showThinking && (
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
            disabled={isComposerDisabled}
          />

          <p className="mt-3 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
            Velmio can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </section>
  );
}
