
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Export mutable variables
export let supabase: SupabaseClient | null = null;
export let isSupabaseConfigured = false;

// Export initialization function
export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      isSupabaseConfigured = true;
      console.log("Supabase initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      isSupabaseConfigured = false;
    }
  } else {
    console.warn('Supabase URL or Key is missing in config.');
    isSupabaseConfigured = false;
  }
};
