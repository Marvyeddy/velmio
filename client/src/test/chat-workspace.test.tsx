import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import userEvent from "@testing-library/user-event";
import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

const apiUrl = import.meta.env.VITE_API_URL;

function renderChatWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/chat"]}>
        <ChatWorkspace
          conversationId={null}
          sessionKey="test-session"
          shouldLoadHistory={false}
          key="test-session"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ChatWorkspace", () => {
  it("displays welcome message when there are no messages typed", () => {
    renderChatWorkspace();

    expect(
      screen.getByRole("heading", {
        name: /your mind, without limits\./i,
      }),
    ).toBeInTheDocument();
  });

  it("displays a user message after submitting it", async () => {
    const user = userEvent.setup();

    renderChatWorkspace();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello{Enter}");

    expect(await screen.findByText("Hello")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: /your mind, without limits\./i,
      }),
    ).not.toBeInTheDocument();
  });

  it("preserves previous message while sending a new message", async () => {
    const user = userEvent.setup();

    renderChatWorkspace();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello{Enter}");

    expect(await screen.findByText("Hello")).toBeInTheDocument();

    await screen.findByRole("button", {
      name: /send message/i,
    });

    await user.type(input, "What is your name{Enter}");

    expect(screen.getByText("Hello")).toBeInTheDocument();

    expect(await screen.findByText("What is your name")).toBeInTheDocument();
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

    renderChatWorkspace();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello velmio{Enter}");

    expect(await screen.findByText("Hello from Gemini!")).toBeInTheDocument();
  });

  it("reuses conversation ID for subsequent messages", async () => {
    const user = userEvent.setup();

    const receivedThreadIds: Array<string | null> = [];

    server.use(
      http.post(`${apiUrl}/api/v1/chat/stream`, async ({ request }) => {
        const body = (await request.json()) as {
          message: string;
          thread_id: string | null;
        };

        receivedThreadIds.push(body.thread_id);

        const events = [
          {
            type: "start",
            messageId: crypto.randomUUID(),
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
            delta: `Response to ${body.message}`,
          },
          {
            type: "text-end",
            id: "text-1",
          },
          {
            type: "finish",
          },
        ];

        const stream =
          events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") +
          "data: [DONE]\n\n";

        return new HttpResponse(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        });
      }),
    );

    renderChatWorkspace();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Hello{Enter}");

    expect(await screen.findByText("Response to Hello")).toBeInTheDocument();

    await screen.findByRole("button", {
      name: /send message/i,
    });

    await user.type(input, "Explain FastAPI{Enter}");

    expect(
      await screen.findByText("Response to Explain FastAPI"),
    ).toBeInTheDocument();

    expect(receivedThreadIds).toEqual([null, "conversation-123"]);
  });

  it("displays tool execution status", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${apiUrl}/api/v1/chat/stream`, () => {
        const events = [
          {
            type: "start",
            messageId: "assistant-tool-test",
          },
          {
            type: "data-tool-status",
            id: "tool-123",
            data: {
              tool: "tavily_tool",
              label: "Searching the web...",
              status: "running",
            },
          },
          {
            type: "data-tool-status",
            id: "tool-123",
            data: {
              tool: "tavily_tool",
              label: "Searching the web...",
              status: "completed",
            },
          },
          {
            type: "text-start",
            id: "text-1",
          },
          {
            type: "text-delta",
            id: "text-1",
            delta: "Here is what I found.",
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

    renderChatWorkspace();

    const input = screen.getByRole("textbox", {
      name: /message velmio/i,
    });

    await user.type(input, "Search for React 19 updates{Enter}");

    expect(await screen.findByText("Searching the web...")).toBeInTheDocument();

    expect(await screen.findByText("Completed")).toBeInTheDocument();

    expect(
      await screen.findByText("Here is what I found."),
    ).toBeInTheDocument();
  });
});
