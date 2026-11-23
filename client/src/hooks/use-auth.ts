
import { getCurrentUser } from "@/lib/auth-api";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
