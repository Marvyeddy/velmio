import { Link, Navigate, useLocation } from "react-router";

import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { AuthLayout } from "@/layouts/auth-layout";

import { useAuth } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-resend-verification";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/pageloader";

export function VerifyEmailRequiredPage() {
  const { user, isLoading, isError, refetch, isFetching } = useAuth();

  const location = useLocation();

  const registrationState = location.state as {
    email?: string;
    registered?: boolean;
  } | null;

  const email = user?.email ?? registrationState?.email;

  const justRegistered =
    registrationState?.registered === true && Boolean(registrationState.email);

  const resend = useResendVerification();

  if (isLoading && !justRegistered) {
    return <PageLoader />;
  }

  // ---------------------------------------
  // ERROR LOADING ACCOUNT
  // ---------------------------------------

  if (isError && !justRegistered) {
    return (
      <AuthLayout
        title="Something went wrong."
        description="We couldn't load your account information."
      >
        <div className="space-y-6">
          <p
            role="alert"
            className="text-sm leading-7 text-zinc-500 dark:text-zinc-400"
          >
            Please check your connection and try again.
          </p>

          <Button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-12 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-500"
          >
            {isFetching ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Try again
              </>
            )}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!user && !justRegistered) {
    return <Navigate to="/signin" replace />;
  }

  if (user?.verified) {
    return <Navigate to="/chat" replace />;
  }

  // ---------------------------------------
  // VERIFICATION REQUIRED
  // ---------------------------------------

  return (
    <AuthLayout
      title="Check your inbox."
      description="One last step before your Velmio journey begins."
    >
      <div className="space-y-7">
        {/* Email icon */}
        <div className="relative flex size-20 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10">
          <MailCheck className="size-10 text-violet-500 dark:text-violet-400" />

          <div className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Email information */}
        <div className="space-y-4">
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            We've sent a verification link to:
          </p>

          <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-4">
            <p className="break-all text-center text-sm font-semibold text-zinc-950 dark:text-white">
              {email}
            </p>
          </div>

          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            Open your inbox and click the verification link to activate your
            account. The link expires after 30 minutes.
          </p>
        </div>

        {user && (
          <>
            {/* Check verification */}
            <Button
              onClick={() => void refetch()}
              disabled={isFetching}
              className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.2)] transition-all hover:bg-violet-500"
            >
              {isFetching ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Checking verification...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  I've verified my email
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            {/* Resend verification */}
            <div className="space-y-4">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-zinc-200 bg-transparent font-medium hover:bg-violet-500/5 dark:border-white/10"
                disabled={resend.isPending}
                onClick={() => resend.mutate()}
              >
                {resend.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Sending verification email...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    Resend verification email
                  </>
                )}
              </Button>

              {/* Resend success */}
              {resend.isSuccess && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />A new
                  verification email has been sent.
                </div>
              )}

              {/* Resend error */}
              {resend.isError && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {resend.error.message}
                </div>
              )}
            </div>
          </>
        )}

        {!user && (
          <Link
            to="/signin"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 font-semibold text-white transition hover:bg-violet-500"
          >
            Continue to sign in
            <ArrowRight className="size-4" />
          </Link>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-6 dark:border-white/10">
          <p className="text-center text-xs leading-6 text-zinc-400 dark:text-zinc-500">
            Didn't receive the email? Check your spam folder or request a new
            verification link.
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
        >
          Back to homepage
        </Link>
      </div>
    </AuthLayout>
  );
}
