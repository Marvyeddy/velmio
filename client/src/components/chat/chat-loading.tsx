import type { UIMessage } from "ai";
import { Loader2 } from "lucide-react";

type ToolStatusData = {
  tool: string;
  label: string;
  status: "running" | "completed" | "failed";
};

function isToolStatusData(value: unknown): value is ToolStatusData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.tool === "string" &&
    typeof data.label === "string" &&
    (data.status === "running" ||
      data.status === "completed" ||
      data.status === "failed")
  );
}

export function getLoadingLabel(
  messages: UIMessage[],
  isLoading: boolean,
): string | null {
  if (!isLoading) return null;

  const lastUserIndex = messages.findLastIndex(
    (message) => message.role === "user",
  );

  const assistantMessages = messages
    .slice(lastUserIndex + 1)
    .filter((message) => message.role === "assistant");

  const hasText = assistantMessages.some((message) =>
    message.parts.some(
      (part) => part.type === "text" && part.text.trim().length > 0,
    ),
  );

  if (hasText) return null;

  const latestByTool = new Map<string, ToolStatusData>();

  for (const message of assistantMessages) {
    for (const part of message.parts) {
      if (part.type === "data-tool-status" && isToolStatusData(part.data)) {
        latestByTool.set(part.data.tool, part.data);
      }
    }
  }

  const statuses = [...latestByTool.values()];

  const runningTool = statuses.find((tool) => tool.status === "running");

  if (runningTool) {
    return `${runningTool.label}...`;
  }

  if (statuses.length > 0) {
    return "Preparing response...";
  }

  return "Velmio is thinking...";
}

export function ChatLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
