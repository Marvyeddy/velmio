import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatWorkspace } from "./chat-workspace";

describe("ChatWorkspace", () => {
  it("sends a message and displays the streamed response", async () => {
    const user = userEvent.setup();

    render(<ChatWorkspace />);

    // 1. Check the initial screen.
    expect(screen.getByText("Welcome to Velmio")).toBeInTheDocument();

    // 2. Type a message.
    const textbox = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(textbox, "Hello");

    // 3. Submit the message.
    await user.click(
      screen.getByRole("button", {
        name: /send message/i,
      }),
    );

    // 4. Verify the user message appears.
    expect(await screen.findByText("Hello")).toBeInTheDocument();

    // 5. Verify the assistant response appears.
    expect(await screen.findByText("Hello from Velmio!")).toBeInTheDocument();
  });
});
