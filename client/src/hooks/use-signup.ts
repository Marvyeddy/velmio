import { signup } from "@/lib/auth-api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useSignup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: signup,

        onSuccess: async() => {
            await queryClient.invalidateQueries({
                queryKey: ["auth", "user"]
            })
        }
    })
}