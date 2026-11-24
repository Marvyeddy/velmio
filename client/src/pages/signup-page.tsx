import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signupSchema, type SignupFormValues } from "@/schemas/auth.schema";

import { useSignup } from "@/hooks/use-signup";
import { SEO } from "@/components/seo/seo";

const inputStyles =
  "h-12 rounded-xl border-zinc-200 bg-zinc-50/80 px-4 text-sm " +
  "placeholder:text-zinc-400 focus-visible:border-violet-500 " +
  "focus-visible:ring-violet-500/20 " +
  "dark:border-white/10 dark:bg-white/[0.04] " +
  "dark:placeholder:text-zinc-600";

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    const { confirmPassword: _confirmPassword, ...credentials } = data;

    try {
      await signup.mutateAsync(credentials);

      navigate("/verify-email-required", {
        replace: true,
        state: {
          email: credentials.email,
          registered: true,
        },
      });
    } catch {
      // Display the mutation error below the form.
    }
  }

  const isPending = isSubmitting || signup.isPending;

  return (
    <>
      <SEO
        title="Sign up"
        description="Create your Velmio account and start exploring intelligent AI conversations, document analysis, and web research."
        noIndex
      />
      <AuthLayout
        title="Create your account."
        description="Join Velmio and give your ideas the space to become something extraordinary."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>

            <Input
              id="username"
              placeholder="Choose a username"
              autoComplete="username"
              className={inputStyles}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...register("username")}
            />

            {errors.username && (
              <p
                id="username-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
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
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={`${inputStyles} pr-12`}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
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
              Confirm password
            </Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="new-password"
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
          {signup.isError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {signup.error.message}
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
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        {/* Signin link */}
        <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400"
          >
            Sign in
          </Link>
        </p>

        {/* Footer */}
        <p className="mt-8 text-center text-xs leading-6 text-zinc-400 dark:text-zinc-600">
          Your journey to extraordinary starts here.
        </p>
      </AuthLayout>
    </>
  );
}
