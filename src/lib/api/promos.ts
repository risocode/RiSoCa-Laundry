import { supabase } from '../supabase-client';

export type PromoInsert = {
  start_date: string; // ISO timestamp
  end_date: string; // ISO timestamp
  price_per_load: number;
  display_date: string;
  is_active?: boolean;
  created_by?: string;
};

export type Promo = {
  id: string;
  start_date: string;
  end_date: string;
  price_per_load: number;
  display_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

/**
 * Get the currently active promo (if any)
 * Returns promo if is_active = true and current time is before end_date
 * This includes upcoming promos (before start_date) and active promos (between start and end)
 */
export async function getActivePromo() {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('is_active', true)
    .gte('end_date', now) // Promo hasn't ended yet
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active promo:', error);
    return { data: null, error };
  }

  return { data: data as Promo | null, error: null };
}

/**
 * Get all promos (admin only)
 */
export async function getAllPromos() {
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching promos:', error);
    return { data: null, error };
  }

  return { data: data as Promo[], error: null };
}

/**
 * Create a new promo
 */
export async function createPromo(promo: PromoInsert) {
  const { data, error } = await supabase
    .from('promos')
    .insert(promo)
    .select()
    .single();

  if (error) {
    console.error('Error creating promo:', error);
    return { data: null, error };
  }

  return { data: data as Promo, error: null };
}

/**
 * Update a promo
 */
export async function updatePromo(id: string, updates: Partial<PromoInsert>) {
  const { data, error } = await supabase
    .from('promos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promo:', error);
    return { data: null, error };
  }

  return { data: data as Promo, error: null };
}

/**
 * Delete a promo
 */
export async function deletePromo(id: string) {
  const { error } = await supabase
    .from('promos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promo:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Activate a promo (sets is_active = true and deactivates others)
 */
export async function activatePromo(id: string) {
  // First, deactivate all other promos
  const { error: deactivateError } = await supabase
    .from('promos')
    .update({ is_active: false })
    .neq('id', id);

  if (deactivateError) {
    console.error('Error deactivating other promos:', deactivateError);
    return { error: deactivateError };
  }

  // Then activate this promo
  const { data, error } = await supabase
    .from('promos')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error activating promo:', error);
    return { data: null, error };
  }

  return { data: data as Promo, error: null };
}

