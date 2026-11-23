import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleX,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "@/layouts/auth-layout";

import { useResetPassword } from "@/hooks/use-reset-password";

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputStyles =
  "h-12 rounded-xl border-zinc-200 bg-zinc-50/80 px-4 text-sm " +
  "placeholder:text-zinc-400 focus-visible:border-violet-500 " +
  "focus-visible:ring-violet-500/20 " +
  "dark:border-white/10 dark:bg-white/[0.04] " +
  "dark:placeholder:text-zinc-600";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const resetPassword = useResetPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) return;

    try {
      await resetPassword.mutateAsync({
        password: data.password,
        token,
      });
    } catch {
      // The mutation error is displayed below.
    }
  }

  const isPending = isSubmitting || resetPassword.isPending;

  // -----------------------------------------
  // INVALID RESET LINK
  // -----------------------------------------

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link."
        description="We couldn't find a valid reset token in your link."
      >
        <div className="space-y-7">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <CircleX className="size-8 text-red-500" />
          </div>

          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            This password reset link is incomplete. Request a new link to
            securely reset your password.
          </p>

          <Button
            render={<Link to="/forgot-password" />}
            className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500"
          >
            Request a new link
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Link
            to="/signin"
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-violet-600 dark:text-zinc-400"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // -----------------------------------------
  // SUCCESSFUL PASSWORD RESET
  // -----------------------------------------

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout
        title="Password updated."
        description="Your account is ready. Welcome back to Velmio."
      >
        <div className="space-y-7">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>

          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            Your password has been successfully reset. You can now sign in using
            your new password.
          </p>

          <Button
            render={<Link to="/signin" />}
            className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500"
          >
            Continue to sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // -----------------------------------------
  // RESET PASSWORD FORM
  // -----------------------------------------

  return (
    <AuthLayout
      title="Create a new password."
      description="Choose a strong password to keep your Velmio account secure."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* New password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            New password
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your new password"
              className={`${inputStyles} pr-12`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-violet-500"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </Label>

          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              className={`${inputStyles} pr-12`}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmPassword")}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              aria-pressed={showConfirmPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-violet-500"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* API error */}
        {resetPassword.isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {resetPassword.error.message}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isPending}
          className="group mt-3 h-12 w-full rounded-xl bg-violet-600 font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.2)] transition-all hover:bg-violet-500"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            <>
              <LockKeyhole className="size-4" />
              Reset password
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <Link
        to="/signin"
        className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
