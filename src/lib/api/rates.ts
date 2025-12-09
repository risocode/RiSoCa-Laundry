import { supabase } from '../supabase-client';

export type ServiceRate = {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'delivery';
  is_active: boolean;
};

export async function fetchServiceRates() {
  return supabase
    .from('service_rates')
    .select('*')
    .eq('is_active', true)
    .order('type', { ascending: true });
}

export async function updateServiceRate(id: string, price: number) {
  return supabase
    .from('service_rates')
    .update({ price })
    .eq('id', id)
    .select()
    .single();
}

