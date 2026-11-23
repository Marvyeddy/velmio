import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Mail,
  MailCheck,
} from "lucide-react";

import { AuthLayout } from "@/layouts/auth-layout";
import { useForgetPassword } from "@/hooks/use-forget-password";

import {
  forgetPasswordSchema,
  type ForgetPasswordValues,
} from "@/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordPage() {
  const forgetPassword = useForgetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgetPasswordValues>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgetPasswordValues) {
    try {
      await forgetPassword.mutateAsync(data.email);
    } catch {
      // The mutation error is displayed in the form.
    }
  }

  const isPending = isSubmitting || forgetPassword.isPending;

  // -----------------------------------------
  // SUCCESS STATE
  // -----------------------------------------

  if (forgetPassword.isSuccess) {
    return (
      <AuthLayout
        title="Check your inbox."
        description="You're one step closer to getting back into your account."
      >
        <div className="space-y-7">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
            <MailCheck className="size-8 text-violet-500 dark:text-violet-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
              Reset instructions are on their way
            </h2>

            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              If an account exists with that email address, you'll receive a
              password-reset link with instructions to create a new password.
            </p>

            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              The reset link expires after 30 minutes. Remember to check your
              spam folder if you don't see the email.
            </p>
          </div>

          <Button
            render={<Link to="/signin" />}
            className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.2)] transition-all hover:bg-violet-500"
          >
            Back to sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // -----------------------------------------
  // FORGOT PASSWORD FORM
  // -----------------------------------------

  return (
    <AuthLayout
      title="Forgot your password?"
      description="No worries. Enter your email address and we'll help you get back into your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 rounded-xl border-zinc-200 bg-zinc-50/80 pl-11 pr-4 text-sm placeholder:text-zinc-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 dark:border-white/10 dark:bg-white/4 dark:placeholder:text-zinc-600"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </div>

          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* API error */}
        {forgetPassword.isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {forgetPassword.error.message}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isPending}
          className="group h-12 w-full rounded-xl bg-violet-600 font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.2)] transition-all hover:bg-violet-500 hover:shadow-[0_8px_35px_rgba(124,58,237,0.35)]"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      {/* Signin navigation */}
      <Link
        to="/signin"
        className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>

      <p className="mt-8 text-center text-xs leading-6 text-zinc-400 dark:text-zinc-600">
        Your security matters. We'll help you get back safely.
      </p>
    </AuthLayout>
  );
}
