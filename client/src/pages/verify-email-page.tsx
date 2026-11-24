import { useEffect, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router";

import {
  ArrowRight,
  CheckCircle2,
  CircleX,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { AuthLayout } from "@/layouts/auth-layout";
import { useVerifyEmail } from "@/hooks/use-verify-email";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/seo";

export function VerifyEmailPage() {
  const { user, refetch } = useAuth();

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const verify = useVerifyEmail();
  const submittedToken = useRef<string | null>(null);

  const { mutate, isSuccess } = verify;

  useEffect(() => {
    if (!token || submittedToken.current === token) {
      return;
    }

    submittedToken.current = token;
    mutate(token);
  }, [token, mutate]);

  useEffect(() => {
    if (isSuccess) {
      void refetch();
    }
  }, [isSuccess, refetch]);

  const isMissingToken = !token;

  const isVerifying = !!token && (verify.isIdle || verify.isPending);

  if (user?.verified) {
    return <Navigate to="/chat" replace />;
  }

  // ---------------------------------------
  // MISSING OR INVALID TOKEN
  // ---------------------------------------

  if (isMissingToken || verify.isError) {
    return (
      <>
        <SEO
          title="Verify email"
          description="Verify your email to cnotinue"
          noIndex
        />
        <AuthLayout
          title="Verification failed."
          description="We couldn't verify your email address."
        >
          <div className="space-y-7">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <CircleX className="size-8 text-red-500" />
            </div>

            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              {isMissingToken
                ? "This verification link is incomplete. Please request a new verification email."
                : "This verification link may be invalid, expired, or already used. Request a new link to continue."}
            </p>

            <Button
              render={<Link to="/verify-email-required" />}
              className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500"
            >
              Back to verification
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </AuthLayout>
      </>
    );
  }

  // ---------------------------------------
  // SUCCESS
  // ---------------------------------------

  if (verify.isSuccess) {
    return (
      <>
        <SEO
          title="Verify email"
          description="Verify your email to cnotinue"
          noIndex
        />
        <AuthLayout
          title="Email verified!"
          description="Your Velmio account is now verified."
        >
          <div className="space-y-7">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                You're all set!
              </h2>

              <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                Your email address has been verified successfully. You can now
                start exploring Velmio and everything your AI workspace has to
                offer.
              </p>
            </div>

            <Button
              render={<Link to="/chat" />}
              className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500"
            >
              Continue to Velmio
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </AuthLayout>
      </>
    );
  }

  // ---------------------------------------
  // VERIFYING
  // ---------------------------------------

  if (isVerifying) {
    return (
      <>
        <SEO
          title="Verify email"
          description="Verify your email to cnotinue"
          noIndex
        />
        <AuthLayout
          title="Verifying your email..."
          description="Just a moment while we secure your account."
        >
          <div role="status" aria-live="polite" className="space-y-7">
            <div className="relative flex size-20 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-violet-500/10" />

              <LoaderCircle className="relative size-10 animate-spin text-violet-500" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-white">
                <ShieldCheck className="size-4 text-violet-500" />
                Securing your account
              </div>

              <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                We're confirming your verification link. Please keep this page
                open.
              </p>
            </div>
          </div>
        </AuthLayout>
      </>
    );
  }

  return null;
}
