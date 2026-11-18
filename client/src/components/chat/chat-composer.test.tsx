import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatComposer } from "./chat-composer";

describe("ChatComposer", () => {
  it("renders the message input", () => {
    render(<ChatComposer onSend={vi.fn()} />);

    expect(
      screen.getByRole("textbox", {
        name: "Message Velmio",
      }),
    ).toBeInTheDocument();
  });

  it("disables sending an empty message", () => {
    render(<ChatComposer onSend={vi.fn()} />);

    expect(
      screen.getByRole("button", {
        name: "Send message",
      }),
    ).toBeDisabled();
  });

  it("sends a message when the user clicks Send", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<ChatComposer onSend={onSend} />);

    await user.type(
      screen.getByRole("textbox", {
        name: "Message Velmio",
      }),
      "Hello Velmio",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send message",
      }),
    );

    expect(onSend).toHaveBeenCalledWith("Hello Velmio");
  });

  it("sends a message when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<ChatComposer onSend={onSend} />);

    await user.type(
      screen.getByRole("textbox", {
        name: "Message Velmio",
      }),
      "Hello{Enter}",
    );

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("does not send when Shift+Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<ChatComposer onSend={onSend} />);

    await user.type(
      screen.getByRole("textbox", {
        name: "Message Velmio",
      }),
      "Hello{Shift>}{Enter}{/Shift}",
    );

    expect(onSend).not.toHaveBeenCalled();
  });
});
