import { getSupabaseClient } from "@/lib/supabase";

import type {
  AuthResult,
  AuthSession,
  AuthUser,
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "./types";

export async function signUpWithEmail({
  email,
  password,
  firstName,
  lastName,
  company,
  jobTitle,
  phone,
}: SignUpWithEmailInput): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        company,
        job_title: jobTitle,
        phone,
      },
    },
  });

  return {
    data: data
      ? {
          user: data.user,
          session: data.session,
        }
      : null,
    error,
  };
}

export async function signInWithEmail({
  email,
  password,
}: SignInWithEmailInput): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    data: data
      ? {
          user: data.user,
          session: data.session,
        }
      : null,
    error,
  };
}

export async function signOut(): Promise<AuthResult<null>> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  return {
    data: null,
    error,
  };
}

export async function getCurrentUser(): Promise<AuthResult<AuthUser>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  return {
    data: data.user,
    error,
  };
}

export async function getSession(): Promise<AuthResult<AuthSession>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  return {
    data: data.session,
    error,
  };
}
