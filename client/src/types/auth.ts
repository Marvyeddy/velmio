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

  export type SignupCredentials = {
    email: string,
    password: string,
    username: string
  }

  export type ResetPasswordPayload = {
    password: string;
    token: string;
  };