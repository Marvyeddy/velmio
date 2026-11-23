import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyEmail } from "@/lib/auth-api";

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmail,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth", "user"],
      });
    },
  });
}