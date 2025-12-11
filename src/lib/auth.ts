import { supabase } from './supabase-client';

export async function signUpWithEmail(email: string, password: string, data?: Record<string, any>) {
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rkrlaundry.com'}`;
  
  return supabase.auth.signUp({ 
    email, 
    password, 
    options: { 
      data,
      emailRedirectTo: redirectTo,
    } 
  });
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

export async function resetPasswordForEmail(email: string) {
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}/reset-password`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rkrlaundry.com'}/reset-password`;
  
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

