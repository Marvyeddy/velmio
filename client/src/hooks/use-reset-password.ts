import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/auth-api";

type ResetPasswordPayload = {
  password: string;
  token: string;
};

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ password, token }: ResetPasswordPayload) =>
      resetPassword(password, token),
  });
}