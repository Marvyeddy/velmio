import { useLocation, useParams } from "react-router";

import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { SEO } from "@/components/seo/seo";

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
    <>
      <SEO
        title="Chat"
        description="Explore intelligent AI conversations with Velmio."
      />
      <div className="h-full min-w-0 overflow-hidden">
        <ChatWorkspace
          key={sessionKey}
          sessionKey={sessionKey}
          conversationId={conversationId ?? null}
          shouldLoadHistory={shouldLoadHistory}
        />
      </div>
    </>
  );
}
