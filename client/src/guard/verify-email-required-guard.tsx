import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/pageloader";

export function VerificationRequiredGuard() {
  const location = useLocation();

  const { user, isLoading, isError } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  // Allow the page to handle account-loading errors
  // and display its existing retry button.
  if (isError) {
    return <Outlet />;
  }

  if (!user) {
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  }

  if (user.verified) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
