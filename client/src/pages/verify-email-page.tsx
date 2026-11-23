import { useEffect, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { CheckCircle2, CircleX, LoaderCircle } from "lucide-react";

import { useVerifyEmail } from "@/hooks/use-verify-email";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function VerifyEmailPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const verify = useVerifyEmail();
  const submittedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || submittedToken.current === token) return;

    submittedToken.current = token;
    verify.mutate(token);
  }, [token, verify.mutate]);

  const isMissingToken = !token;
  const isVerifying = !!token && (verify.isIdle || verify.isPending);

  if (user?.verified) {
    return <Navigate to={"/chat"} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          {isMissingToken || verify.isError ? (
            <CircleX className="size-12 text-destructive mx-auto" />
          ) : verify.isSuccess ? (
            <CheckCircle2 className="size-12 text-green-600 mx-auto" />
          ) : (
            <LoaderCircle className="size-12 animate-spin mx-auto" />
          )}

          <CardTitle className="text-2xl">
            {isMissingToken
              ? "Invalid verification link"
              : isVerifying
                ? "Verifying your email..."
                : verify.isSuccess
                  ? "Email verified!"
                  : "Verification failed"}
          </CardTitle>

          <CardDescription className="text-center">
            {isMissingToken
              ? "The verification token is missing."
              : isVerifying
                ? "Please wait while we verify your account."
                : verify.isSuccess
                  ? "Your Velmio account has been verified successfully."
                  : "This verification link may be invalid or expired."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {verify.isSuccess && (
            <Button render={<Link to="/chat" />} className="w-full">
              Continue to Velmio
            </Button>
          )}

          {(isMissingToken || verify.isError) && (
            <Button
              variant="outline"
              render={<Link to="/verify-email-required" />}
              className="w-full"
            >
              Back to verification
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
