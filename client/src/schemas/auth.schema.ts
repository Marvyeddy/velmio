
import { X } from "lucide-react";
import { z } from "zod";

export const signinSchema = z.object({
  email: z.email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password is required"),
});

export type SigninFormValues = z.infer<typeof signinSchema>;


export const signupSchema = z.object({
  email: z.email("Please enter a valid email address"),
  username: z.string().trim().min(3, "Username must contain at least 3 characters").max(30, "Username must not exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain numbers, letters and underscores."),
  password: z.string().min(8, "Password is required"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(
  (data) => data.password == data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  }
)

export type SignupFormValues = z.infer<typeof signupSchema>

export const forgetPasswordSchema = z.object({
  email: z.email("Please enter yout email address")
})

export type ForgetPasswordValues = z.infer<typeof forgetPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must contain at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;