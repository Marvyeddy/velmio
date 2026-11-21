import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyResponseProps = {
  text: string;
};

export function CopyResponse({ text }: CopyResponseProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

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
