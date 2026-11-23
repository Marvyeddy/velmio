
export type AuthUser = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
};


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