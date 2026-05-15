/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;flex-direction:column;gap:12px;color:#5C544A;background:#F7F3EE"><b style="font-size:18px">Konfigurasjonsfeil</b><p style="font-size:14px;margin:0">Miljøvariablene VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY mangler.<br>Legg dem inn under Settings → Environment Variables i Vercel, og redeploy.</p></div>`;
  throw new Error('Missing Supabase environment variables');
}

// Capture BEFORE createClient — the SDK clears the hash during initialisation
const _h = window.location.hash + window.location.search;
export const isPasswordRecovery = _h.includes('type=recovery');

export const db = createClient(url, key);

export const getUserName = (u: any): string =>
  u?.user_metadata?.full_name || u?.email?.split('@')[0] || 'Bruker';
