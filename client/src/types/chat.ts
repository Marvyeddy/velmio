import type { UIMessage } from "ai";

export type ChatMetadata = {
    threadid?: string;
}

export type VelmioMessage = UIMessage<ChatMetadata>