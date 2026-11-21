import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import userEvent from "@testing-library/user-event";

describe("ChatWorkspace", () => {
  it("displays welcome message when there are no messages typed", () => {
    render(<ChatWorkspace />);

    expect(
      screen.getByRole("heading", {
        name: /welcome to velmio/i,
      }),
    ).toBeInTheDocument();
  });

  it("displays a user message after submitting it", async () => {
    const user = userEvent.setup();

    render(<ChatWorkspace />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello{Enter}");

    expect(screen.getByText("Hello")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: /welcome to velmio/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("preserves previous message while sending a new message", async () => {
    const user = userEvent.setup();

    render(<ChatWorkspace />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello{Enter}");
    await user.type(input, "What is your name{Enter}");

    expect(screen.getByText("Hello")).toBeInTheDocument();

    expect(screen.getByText("What is your name")).toBeInTheDocument();
  });
});
