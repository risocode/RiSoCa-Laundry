import { supabase } from './supabase-client';

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role || 'customer';
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function isEmployee(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'employee';
}

