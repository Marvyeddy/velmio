import { Link } from "react-router";
import {
  MessageSquarePlus,
  PanelLeft,
  Orbit,
  Sun,
  Moon,
  Monitor,
  Settings2,
  UserRound,
  ChevronDown,
  Check,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatSidebar() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  const activeTheme = themes.find((item) => item.value === theme) ?? themes[2];

  const ActiveThemeIcon = activeTheme.icon;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-[#f8f8fb] text-zinc-900 transition-colors duration-300 dark:border-white/[0.07] dark:bg-[#111116] dark:text-zinc-100">
      {/* Brand */}
      <div className="flex h-18 items-center justify-between px-4">
        <Link to="/chat" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
            <Orbit className="size-5" />
          </div>

          <span className="text-lg font-bold tracking-tight">Velmio</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sidebar options"
          className="rounded-lg text-zinc-500 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-white/6"
          disabled
        >
          <PanelLeft className="size-4.5" />
        </Button>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <Button className="h-11 w-full justify-start gap-3 rounded-xl bg-violet-600 px-4 font-medium text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-500">
          <MessageSquarePlus className="size-4.5" />
          New chat
        </Button>
      </div>

      {/* Conversations */}
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-3">
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Your conversations
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center dark:border-white/8">
          <MessageSquarePlus className="mx-auto mb-3 size-5 text-zinc-400 dark:text-zinc-600" />

          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
            Your conversations will appear here.
          </p>
        </div>
      </div>

      {/* Bottom settings */}
      <div className="space-y-1 border-t border-zinc-200 p-3 dark:border-white/[0.07]">
        {/* Appearance dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-white/6"
              />
            }
          >
            <ActiveThemeIcon className="size-4.5" />

            <span className="flex-1 text-left text-sm">Appearance</span>

            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {activeTheme.label}
            </span>

            <ChevronDown className="size-3.5 text-zinc-400" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="top"
            className="w-60 rounded-xl border-zinc-200 p-1.5 shadow-xl dark:border-white/10"
          >
            {themes.map((item) => {
              const Icon = item.icon;

              return (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => setTheme(item.value)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
                >
                  <Icon className="size-4" />

                  <span className="flex-1 text-sm">{item.label}</span>

                  {theme === item.value && (
                    <Check className="size-4 text-violet-500" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings - visual placeholder */}
        <div className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Settings2 className="size-4.5" />
          Settings
          <span className="ml-auto text-[10px] text-zinc-400">Soon</span>
        </div>

        {/* Account */}
        <Link
          to="/profile"
          className="flex h-12 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-zinc-200/70 dark:hover:bg-white/6"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
            <UserRound className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">My account</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              View profile
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
