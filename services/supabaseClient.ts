
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Podpora pro různé prostředí (Vite vs standardní process.env)
const getEnv = (key: string) => {
  // 1. Zkusíme import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // 2. Fallback pro process.env (pokud je dostupný)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // process is not defined
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
  }
} else {
  console.warn('Supabase URL or Key is missing. App will run in Setup Mode.');
}

export const supabase = client;
