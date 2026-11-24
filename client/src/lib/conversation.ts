
import { apiFetch } from "./api-client";

import type {
  Conversation,
  ConversationDetail,
  RenameConversationPayload,
} from "@/types/conversation";

const BASE_URL = "/api/v1/conversations";

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      `Conversation request failed: ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

// Get all conversations belonging to the current user
export async function getConversations(): Promise<Conversation[]> {
  const response = await apiFetch(BASE_URL);

  return handleResponse<Conversation[]>(response);
}

// Get a conversation and its messages
export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail> {
  const response = await apiFetch(
    `${BASE_URL}/${conversationId}`,
  );

  return handleResponse<ConversationDetail>(response);
}

// Rename an existing conversation

export async function renameConversation(
  conversationId: string,
  payload: RenameConversationPayload,
): Promise<Conversation> {
  const title = payload.title.trim();

  if (!title || title.length > 255) {
    throw new Error(
      "Conversation title must be between 1 and 255 characters.",
    );
  }

  const response = await apiFetch(
    `${BASE_URL}/${conversationId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );

  return handleResponse<Conversation>(response);
}


// Delete an existing conversation
export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const response = await apiFetch(
    `${BASE_URL}/${conversationId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete conversation: ${response.status}`,
    );
  }
}
