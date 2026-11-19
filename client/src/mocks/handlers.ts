
import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:8000";

export const handlers = [
  http.post(`${API_URL}/api/v1/chat/stream`, async ({ request }) => {
    const body = await request.json();

    console.log("Mock FastAPI received:", body);

    const textId = "test-text-1";

    const events = [
      {
        type: "start",
        messageId: "assistant-test-1",
        messageMetadata: {
          threadId: "550e8400-e29b-41d4-a716-446655440000",
        },
      },
      { type: "text-start", id: textId },
      { type: "text-delta", id: textId, delta: "Hello" },
      { type: "text-delta", id: textId, delta: " from Velmio!" },
      { type: "text-end", id: textId },
      { type: "finish" },
    ];

    const sse = events
      .map((event) => `data: ${JSON.stringify(event)}\n\n`)
      .join("") + "data: [DONE]\n\n";

    return new HttpResponse(sse, {
      headers: {
        "Content-Type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  }),
];
