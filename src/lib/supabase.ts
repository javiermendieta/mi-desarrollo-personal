import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si no hay credenciales, retorna null (usará localStorage)
export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://tu-proyecto.supabase.co') {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = getSupabase();

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
         supabaseAnonKey !== 'tu-clave-anonima-aqui';
};
