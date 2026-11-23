import { Navigate, Outlet, useSearchParams } from "react-router";

export function VerifyEmailGuard() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  if (!token?.trim()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
