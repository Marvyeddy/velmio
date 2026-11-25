
import { getCurrentUser, signout } from "@/lib/auth-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useSignout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signout,

    onSuccess: async () => {
      await queryClient.cancelQueries();

      queryClient.clear();

      queryClient.setQueryData(["auth", "user"], null);
    },
  });
}