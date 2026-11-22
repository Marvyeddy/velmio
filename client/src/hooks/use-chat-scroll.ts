
import { useEffect, useRef, useState } from "react";

export function useChatScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !shouldAutoScroll.current) return;

    container.scrollTop = container.scrollHeight;
  }, [dependency]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const isNearBottom = distanceFromBottom < 100;

    shouldAutoScroll.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }

  function scrollToBottom() {
    const container = containerRef.current;
    if (!container) return;

    shouldAutoScroll.current = true;
    setShowScrollButton(false);

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    showScrollButton,
  };
}
