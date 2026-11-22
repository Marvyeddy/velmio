import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { user, isLoading, isError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-screen items-center justify-center"
      >
        Checking your session...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center"
      >
        Unable to verify your session. Please try again.
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
