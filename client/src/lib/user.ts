import { apiFetch } from "./api-client";


export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/users/me");

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return (await response.json()) as CurrentUser;
}
