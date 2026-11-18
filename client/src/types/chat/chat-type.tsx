export type ChatComposerProps = {
  onSend: (message: string) => void;
  isLoading?: boolean;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type VelmioMetadata = {
  threadId?: string;
  title?: string;
};
