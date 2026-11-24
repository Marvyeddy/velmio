import { describe, it, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";

function renderChatComposer(
  props: Partial<ComponentProps<typeof ChatComposer>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const onSend = vi.fn();
  const onStop = vi.fn();

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatComposer
        onSend={onSend}
        onStop={onStop}
        isLoading={false}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("ChatComposer", () => {
  it("renders the message input", () => {
    renderChatComposer();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    expect(input).toBeInTheDocument();
  });

  it("disables the send button when the input is empty", () => {
    renderChatComposer();

    const sendButton = screen.getByRole("button", {
      name: /send message/i,
    });

    expect(sendButton).toBeDisabled();
  });

  it("sends the typed message and clears the input", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderChatComposer({ onSend });

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    const sendButton = screen.getByRole("button", {
      name: /send message/i,
    });

    await user.type(input, "Hello velmio");
    await user.click(sendButton);

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Hello velmio", null);

    expect(input).toHaveValue("");
  });

  it("sends the typed message through the enter key", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderChatComposer({ onSend });

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello Velmio{Enter}");

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Hello Velmio", null);

    expect(input).toHaveValue("");
  });

  it("creates a new line with Shift + enter key", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderChatComposer({ onSend });

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello Velmio{Shift>}{Enter}{/Shift}Help");

    expect(input).toHaveValue("Hello Velmio\nHelp");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onStop when the stop button is clicked", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();

    renderChatComposer({
      onStop,
      isLoading: true,
    });

    await user.click(
      screen.getByRole("button", {
        name: /stop generating/i,
      }),
    );

    expect(onStop).toHaveBeenCalledOnce();
  });
});
