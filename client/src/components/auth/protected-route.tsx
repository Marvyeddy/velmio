import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "../ui/pageloader";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    );
  }

  if (!user.verified) {
    return <Navigate to={"/verify-email-required"} replace />;
  }

  return <Outlet />;
}
