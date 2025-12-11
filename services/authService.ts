
import { supabase } from './supabaseClient';
import { AppUser } from '../types';
import { logActivity } from './dataService';

const USERS_TABLE = 'app_users';

/**
 * Hashes a password using SHA-256.
 * Uses the Web Crypto API available in modern browsers.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Authenticates user by username and password.
 */
export const login = async (username: string, password: string): Promise<AppUser | null> => {
  if (!supabase) throw new Error("Supabase not configured");

  // 1. Hash the input password
  const inputHash = await hashPassword(password);

  // 2. Fetch user from DB (Case-insensitive username match)
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .ilike('username', username.trim()) // Use ilike for case-insensitive match and trim whitespace
    .single();

  if (error || !data) {
    console.error("Login failed:", error);
    return null;
  }

  // 3. Compare Hashes
  if (data.password_hash === inputHash) {
    // Log the successful login
    await logActivity(data.username, 'LOGIN', 'Úspěšné přihlášení uživatele');
    
    return {
      id: data.id,
      username: data.username,
      role: data.role
    };
  }

  return null;
};
