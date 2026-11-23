import { useMutation } from "@tanstack/react-query";
import { resendVerificationEmail } from "@/lib/auth-api";

export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerificationEmail,
  });
}