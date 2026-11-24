import type { AuthUser, SigninCredentials, SignupCredentials } from "@/types/auth";
import { apiFetch } from "./api-client";

const apiUrl = import.meta.env.VITE_API_URL

export async function getCurrentUser(): Promise<AuthUser | null>{
    const response = await apiFetch(`/api/v1/users/me`)

    if(response.status == 401){
        return null
    }

    if(!response.ok){
        throw new Error("Failed to fetch current user")
    }

    return response.json() as Promise<AuthUser>
}

  
export async function signin(
    credentials: SigninCredentials,
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/signin`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      },
    );
  
    if (response.status === 401 || response.status === 400) {
      throw new Error("Invalid email or password");
    }
  
    if (!response.ok) {
      throw new Error("Unable to sign in. Please try again.");
    }
  }
  
export async function signup(
  credentials: SignupCredentials,
): Promise<void>{
  const response = await fetch(`${apiUrl}/api/v1/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  })

  if (response.status === 409) {
    throw new Error("An account with these details already exists.");
  }

  if (!response.ok) {
    throw new Error("Unable to create your account. Please try again.");
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/auth/resend-email-verification`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to resend verification email.");
  }
}

export async function verifyEmail(token: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Verification link is invalid or has expired.");
  }
}

export async function forgetPassword(email: string): Promise<void>{
  const response = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
    method: "POST", 
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }, 
    body: JSON.stringify({email})
  })

  if (!response.ok) {
    throw new Error(
      "Unable to process your request. Please try again.",
    );
  }
}

export async function resetPassword(
  password: string,
  token: string,
): Promise<void> {
  const response = await fetch(
    `${apiUrl}/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to reset your password.");
  }
}

