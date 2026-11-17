import Link from "next/link";

export function ChatSidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r p-4">
      <Link href="/chat" className="text-xl font-bold">
        Velmio
      </Link>

      <nav className="mt-8 flex flex-col gap-3">
        <Link href="/chat" className="rounded-lg bg-muted px-4 py-2">
          New chat
        </Link>

        <p className="mt-4 text-sm text-muted-foreground">
          Recent conversations
        </p>
      </nav>
    </aside>
  );
}
