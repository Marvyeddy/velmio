import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CircleX } from "lucide-react";

import { useResetPassword } from "@/hooks/use-reset-password";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const resetPassword = useResetPassword();

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

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <CircleX className="mx-auto mb-2 size-12 text-destructive" />
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>
              Your password-reset link is missing a token.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              render={<Link to="/forgot-password" />}
              className="w-full"
            >
              Request a new link
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (resetPassword.isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="mx-auto mb-2 size-12 text-green-600" />
            <CardTitle>Password reset successful</CardTitle>
            <CardDescription>
              Your password has been updated. You can now sign in.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button render={<Link to="/signin" />} className="w-full">
              Continue to sign in
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Reset your password
          </CardTitle>

          <CardDescription className="text-center">
            Enter and confirm your new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>

              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />

              {errors.password && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>

              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />

              {errors.confirmPassword && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {resetPassword.isError && (
              <p role="alert" className="text-sm text-destructive">
                {resetPassword.error.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || resetPassword.isPending}
            >
              {resetPassword.isPending
                ? "Resetting password..."
                : "Reset password"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link
              to="/signin"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
