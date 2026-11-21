import { describe, it, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { userEvent } from "@testing-library/user-event";

describe("ChatComposer", () => {
  it("renders the message input", () => {
    render(
      <ChatComposer onSend={vi.fn()} onStop={vi.fn()} isLoading={false} />,
    );

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    expect(input).toBeInTheDocument();
  });

  it("disables the send button when the input is empty", () => {
    render(
      <ChatComposer onSend={vi.fn()} onStop={vi.fn()} isLoading={false} />,
    );

    const sendButton = screen.getByRole("button", {
      name: /send message/i,
    });

    expect(sendButton).toBeDisabled();
  });

  it("sends the typed message and clears the input", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} onStop={vi.fn()} isLoading={false} />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    const sendButton = screen.getByRole("button", {
      name: /send message/i,
    });

    await user.type(input, "Hello velmio");
    await user.click(sendButton);

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Hello velmio");

    expect(input).toHaveValue("");
  });

  it("sends the typed message through the enter key", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<ChatComposer onSend={onSend} onStop={vi.fn()} isLoading={false} />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello Velmio{Enter}");

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Hello Velmio");
    expect(input).toHaveValue("");
  });

  it("creates a new line with Shift + enter key", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<ChatComposer onSend={onSend} onStop={vi.fn()} isLoading={false} />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello Velmio{Shift>}{Enter}{/Shift}Help");
    expect(input).toHaveValue("Hello Velmio\nHelp");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onStop when the stop button is clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onStop = vi.fn();

    render(<ChatComposer onStop={onStop} onSend={onSend} isLoading={true} />);

    await user.click(
      screen.getByRole("button", {
        name: /stop generating/i,
      }),
    );

    expect(onStop).toHaveBeenCalledOnce();
  });
});
