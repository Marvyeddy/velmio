export type AuthUser = {
    id: string;
    email: string;
    username: string;
    verified: boolean
}

export type SigninCredentials = {
    email: string;
    password: string;
  };