import { supabase } from '../supabase-client';

export async function fetchBranches() {
  return supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
}

export async function createBranch(branch: { name: string; address?: string | null; latitude?: number | null; longitude?: number | null; phone?: string | null; is_active?: boolean }) {
  return supabase
    .from('branches')
    .insert({
      name: branch.name,
      address: branch.address ?? null,
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      phone: branch.phone ?? null,
      is_active: branch.is_active ?? true,
    })
    .select()
    .single();
}

export async function updateBranch(id: string, patch: Partial<{ name: string; address: string | null; latitude: number | null; longitude: number | null; phone: string | null; is_active: boolean }>) {
  return supabase.from('branches').update(patch).eq('id', id).select().single();
}

export async function deleteBranch(id: string) {
  return supabase.from('branches').delete().eq('id', id);
}

