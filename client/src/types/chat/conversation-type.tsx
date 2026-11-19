export type Conversation = {
  id: string;
  title: string | null;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationDetail = Conversation & {
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
};
