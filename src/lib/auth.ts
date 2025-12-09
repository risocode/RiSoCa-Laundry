import { supabase } from './supabase-client';

export async function signUpWithEmail(email: string, password: string, data?: Record<string, any>) {
  return supabase.auth.signUp({ email, password, options: { data } });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}

