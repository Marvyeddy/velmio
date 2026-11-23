import { Navigate, Outlet, useSearchParams } from "react-router";

export function ResetPasswordGuard() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  if (!token?.trim()) {
    return <Navigate to="/forgot-password" replace />;
  }

  return <Outlet />;
}
