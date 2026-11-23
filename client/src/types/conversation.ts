
export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationDetail = Conversation & {
  messages: ConversationMessage[];
};

export type RenameConversationPayload = {
  title: string;
};
