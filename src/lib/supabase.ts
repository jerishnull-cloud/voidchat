import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'void_miner_supabase_config';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

export function normalizeSupabaseUrl(url: string): string {
  let cleaned = url.trim();
  // Strip trailing slashes and common subpath suffixes like /rest/v1 or /auth/v1
  cleaned = cleaned.replace(/\/(rest|auth)\/v[0-9]+\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getStoredSupabaseConfig(): SupabaseCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: normalizeSupabaseUrl(parsed.url),
          anonKey: parsed.anonKey.trim(),
        };
      }
    }
  } catch (e) {
    console.error('Failed to read Supabase config from storage', e);
  }

  // Fall back to environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project-id') && !envKey.includes('your-anon-public-key')) {
    return {
      url: normalizeSupabaseUrl(envUrl),
      anonKey: envKey.trim(),
    };
  }

  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  const normalizedUrl = normalizeSupabaseUrl(url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: normalizedUrl, anonKey: anonKey.trim() }));
  window.location.reload();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

let supabaseInstance: SupabaseClient | null = null;
const config = getStoredSupabaseConfig();

if (config) {
  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

export const supabase = supabaseInstance;

export function isSupabaseConnected(): boolean {
  return supabaseInstance !== null;
}
