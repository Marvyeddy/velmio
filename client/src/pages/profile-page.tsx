import { Link } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/seo";

export function ProfilePage() {
  const { user, isLoading, isError, refetch } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0e0e13]">
        <p className="text-sm text-zinc-500">Loading your profile...</p>
      </main>
    );
  }

  if (isError || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-[#0e0e13]">
        <p className="text-sm text-zinc-500">Unable to load your profile.</p>

        <Button variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </main>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-10 text-zinc-900 dark:bg-[#0e0e13] dark:text-zinc-100 sm:px-8">
      <SEO
        title="My profile"
        description="Manage your Velmio account and personal information."
      />
      <div className="mx-auto max-w-3xl">
        <Link
          to="/chat"
          className="mb-10 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-violet-600 dark:text-zinc-400"
        >
          <ArrowLeft className="size-4" />
          Back to workspace
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">My profile</h1>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            View your account information and preferences.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#16161d]">
          <div className="flex items-center gap-5 border-b border-zinc-100 p-7 dark:border-white/10">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-xl font-semibold text-white">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {user.username}
              </h2>

              <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-7 p-7">
            <div className="flex items-start gap-4">
              <UserRound className="mt-0.5 size-5 text-violet-500" />

              <div>
                <p className="text-xs text-zinc-500">Username</p>

                <p className="mt-1 text-sm font-medium">{user.username}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="mt-0.5 size-5 text-violet-500" />

              <div>
                <p className="text-xs text-zinc-500">Email address</p>

                <p className="mt-1 text-sm font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 size-5 text-violet-500" />

              <div>
                <p className="text-xs text-zinc-500">Email verification</p>

                <div className="mt-1 flex items-center gap-2">
                  {user.verified ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-sm font-medium">Verified</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-amber-500">
                      Not verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CalendarDays className="mt-0.5 size-5 text-violet-500" />

              <div>
                <p className="text-xs text-zinc-500">Member since</p>

                <p className="mt-1 text-sm font-medium">{joinedDate}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Your Velmio account information is securely managed.
        </p>
      </div>
    </main>
  );
}
