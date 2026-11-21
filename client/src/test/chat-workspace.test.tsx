import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import userEvent from "@testing-library/user-event";
import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

const apiUrl = import.meta.env.VITE_API_URL;

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

  it("displays a streamed assistant response", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${apiUrl}/api/v1/chat/stream`, () => {
        const events = [
          {
            type: "start",
            messageId: "assistant-1",
            messageMetadata: {
              threadId: "conversation-123",
            },
          },
          {
            type: "text-start",
            id: "text-1",
          },
          {
            type: "text-delta",
            id: "text-1",
            delta: "Hello from Gemini!",
          },
          {
            type: "text-end",
            id: "text-1",
          },
          {
            type: "finish",
          },
        ];

        const body =
          events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") +
          "data: [DONE]\n\n";

        return new HttpResponse(body, {
          headers: {
            "Content-Type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        });
      }),
    );

    render(<ChatWorkspace />);

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello velmio{Enter}");

    expect(await screen.findByText("Hello from Gemini!")).toBeInTheDocument();
  });
});
