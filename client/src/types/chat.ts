import type { UIMessage } from "ai";

export type ChatMetadata = {
    threadId?: string;
}

export type VelmioMessage = UIMessage<ChatMetadata>