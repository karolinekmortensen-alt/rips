/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const db = createClient(url, key);

export const getUserName = (u: any): string =>
  u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Bruker';
