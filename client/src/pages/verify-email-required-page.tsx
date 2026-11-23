import { Navigate } from "react-router";
import { MailCheck } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useResendVerification } from "@/hooks/use-resend-verification";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/ui/pageloader";

export function VerifyEmailRequiredPage() {
  const { user, isLoading, isError, refetch, isFetching } = useAuth();
  const resend = useResendVerification();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4"
      >
        <p>Unable to load your account.</p>

        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Retrying..." : "Try again"}
        </Button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.verified) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <MailCheck className="mb-2 size-12 text-primary" />

          <CardTitle className="text-2xl">Verify your email</CardTitle>

          <CardDescription>
            We've sent a verification link to your email address.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-center text-sm font-medium">{user.email}</p>

          <p className="text-center text-sm text-muted-foreground">
            Check your inbox and click the verification link. The link expires
            after 30 minutes.
          </p>

          <Button
            className="w-full"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "Checking..." : "I've verified my email"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {resend.isPending ? "Sending..." : "Resend verification email"}
          </Button>

          {resend.isSuccess && (
            <p role="status" className="text-center text-sm text-green-600">
              Verification email sent successfully.
            </p>
          )}

          {resend.isError && (
            <p role="alert" className="text-center text-sm text-destructive">
              {resend.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
