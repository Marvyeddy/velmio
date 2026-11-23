import { LoaderCircle } from "lucide-react";

export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center"
    >
      <LoaderCircle className="size-8 animate-spin text-primary" />
    </div>
  );
}
