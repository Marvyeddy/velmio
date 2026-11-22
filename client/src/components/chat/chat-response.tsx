import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyResponseProps = {
  text: string;
};

export function CopyResponse({ text }: CopyResponseProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      // Clear the previous timer if the user clicks again.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Return to the copy icon after 2 seconds.
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  // Clean up the timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy response"}
      title={copied ? "Copied" : "Copy response"}
      className="flex items-center gap-1.5 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          <span className="text-xs">Copied</span>
        </>
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}
