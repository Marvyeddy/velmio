import type { UIMessage } from "ai";

export type ChatMetadata = {
  threadId?: string;
  title?: string;
};

export type ToolStatus = {
  tool: string;
  label: string;
  status: "running" | "completed" | "failed";
};

export type VelmioDataParts = {
  "tool-status": ToolStatus;
};

export type VelmioMessage = UIMessage<
  ChatMetadata,
  VelmioDataParts
>;