import type { AuthError, Session, User } from "@supabase/supabase-js";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpWithEmailInput extends AuthCredentials {
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
}

export interface SignInWithEmailInput extends AuthCredentials {}

export interface AuthResult<T> {
  data: T | null;
  error: AuthError | null;
}

export type AuthUser = User;
export type AuthSession = Session;
