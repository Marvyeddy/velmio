import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { useSignin } from "@/hooks/use-signin";
import { useAuth } from "@/hooks/use-auth";
import { signinSchema, type SigninFormValues } from "@/schemas/auth.schema";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputStyles =
  "h-12 rounded-xl border-zinc-200 bg-zinc-50/80 px-4 text-sm " +
  "placeholder:text-zinc-400 focus-visible:border-violet-500 " +
  "focus-visible:ring-violet-500/20 " +
  "dark:border-white/10 dark:bg-white/[0.04] " +
  "dark:placeholder:text-zinc-600";

export function SigninPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoading: authLoading } = useAuth();

  const signin = useSignin();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const from = location.state?.from;

  const redirectTo =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/chat";

  async function onSubmit(data: SigninFormValues) {
    try {
      await signin.mutateAsync(data);

      navigate(redirectTo, { replace: true });
    } catch {
      // The mutation exposes errors through signin.error.
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#09090e]">
        <LoaderCircle className="size-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const isPending = isSubmitting || signin.isPending;

  return (
    <AuthLayout
      title="Welcome back."
      description="Sign in to your account and pick up right where you left off."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>

          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputStyles}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />

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

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>

            <Link
              to="/forgot-password"
              className="text-xs font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-400"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        {/* API error */}
        {signin.isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {signin.error.message}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="group mt-3 h-12 w-full rounded-xl bg-violet-600 font-semibold text-white shadow-[0_8px_30px_rgba(124,58,237,0.2)] transition-all hover:bg-violet-500 hover:shadow-[0_8px_35px_rgba(124,58,237,0.35)]"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      {/* Signup link */}
      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-6 text-zinc-400 dark:text-zinc-600">
        Your ideas are waiting. Let's make something great.
      </p>
    </AuthLayout>
  );
}
