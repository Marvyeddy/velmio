import { useLocation, useParams } from "react-router";

import { ChatWorkspace } from "@/components/chat/chat-workspace";

type ChatRouteState = {
  preserveSessionKey?: string;
};

export function ChatPage() {
  const { conversationId } = useParams<{
    conversationId: string;
  }>();

  const location = useLocation();
  const routeState = location.state as ChatRouteState | null;

  const sessionKey =
    routeState?.preserveSessionKey ?? conversationId ?? location.key;

  const shouldLoadHistory =
    Boolean(conversationId) && !routeState?.preserveSessionKey;

  return (
    <div className="h-full min-w-0 overflow-hidden">
      <ChatWorkspace
        key={sessionKey}
        sessionKey={sessionKey}
        conversationId={conversationId ?? null}
        shouldLoadHistory={shouldLoadHistory}
      />
    </div>
  );
}
