import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessageProps = {
  message: UIMessage;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const textParts = message.parts.filter((part) => part.type === "text");

  if (textParts.length === 0) return null;

  return (
    <div
      className={
        isUser
          ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
          : "mr-auto w-full"
      }
    >
      {textParts.map((part, index) => (
        <div key={index} className="min-w-0 text-sm leading-7">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="my-3 text-2xl font-bold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="my-3 text-xl font-semibold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="my-2 text-lg font-semibold">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="my-2 whitespace-pre-wrap">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-3 list-disc pl-6">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-3 list-decimal pl-6">{children}</ol>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-4 pl-4 italic">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-4">
                  {children}
                </pre>
              ),
              code: ({ children, className }) => (
                <code
                  className={
                    className
                      ? `${className} font-mono text-sm`
                      : "rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                  }
                >
                  {children}
                </code>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border px-3 py-2 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border px-3 py-2">{children}</td>
              ),
              hr: () => <hr className="my-5 border-border" />,
            }}
          >
            {part.text}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}
