import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { useSignin } from "@/hooks/use-signin";
import { useAuth } from "@/hooks/use-auth";

export function SigninPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoading: authLoading } = useAuth();
  const signin = useSignin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = location.state?.from;
  const redirectTo =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
      ? from
      : "/chat";

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await signin.mutateAsync({ email, password });
      navigate(redirectTo, { replace: true });
    } catch {
      // The mutation exposes the error through signin.error.
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p role="status">Checking your session...</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue using Velmio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Enter your password"
            />
          </div>

          {signin.isError && (
            <p role="alert" className="text-sm text-destructive">
              {signin.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={signin.isPending}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {signin.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
