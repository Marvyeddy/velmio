import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { useForgetPassword } from "@/hooks/use-forget-password";
import {
  forgetPasswordSchema,
  type ForgetPasswordValues,
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

  if (forgetPassword.isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <MailCheck className="mx-auto mb-2 size-12 text-primary" />

            <CardTitle className="text-2xl">Check your email</CardTitle>

            <CardDescription>
              If an account exists with that email address, you'll receive a
              password-reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              render={<Link to="/signin" />}
              className="w-full"
            >
              Back to sign in
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
            Forgot your password?
          </CardTitle>

          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />

              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {forgetPassword.isError && (
              <p role="alert" className="text-sm text-destructive">
                {forgetPassword.error.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || forgetPassword.isPending}
            >
              {forgetPassword.isPending ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/signin"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
