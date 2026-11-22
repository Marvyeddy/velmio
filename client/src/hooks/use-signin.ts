
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { signin } from "@/lib/auth-api";

export function useSignin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signin,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth", "user"],
      });
    },
  });
}
