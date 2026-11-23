import { forgetPassword } from "@/lib/auth-api";
import { useMutation } from "@tanstack/react-query";

export function useForgetPassword(){
    return useMutation({
        mutationFn: forgetPassword
    })
}