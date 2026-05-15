import type { Severity } from './types';

export const PROB_BANK = ['Svært liten','Liten','Lav','Under middels','Moderat','Over middels','Stor','Høy','Svært stor','Nesten sikkert'];
export const CONS_BANK = ['Ubetydelig','Liten','Lav','Under middels','Moderat','Over middels','Alvorlig','Kritisk','Svært alvorlig','Katastrofalt'];

export const probLabel = (p: number, scale: number) =>
  scale <= 1 ? PROB_BANK[9] : PROB_BANK[Math.round((p - 1) / (scale - 1) * (PROB_BANK.length - 1))];
export const consLabel = (c: number, scale: number) =>
  scale <= 1 ? CONS_BANK[9] : CONS_BANK[Math.round((c - 1) / (scale - 1) * (CONS_BANK.length - 1))];

export const INITIAL_TAGS = ['IT-sikkerhet','Operasjonell','Finansiell','Compliance','HR','Prosjekt','Strategisk'];

export const SEV_LABEL: Record<Severity, string> = {
  low: 'Lav', medium: 'Moderat', high: 'Høy', critical: 'Kritisk',
};

export const getSev = (p: number, c: number, scale = 5): Severity => {
  const ratio = (p * c) / (scale * scale);
  if (ratio <= 0.16) return 'low';
  if (ratio <= 0.36) return 'medium';
  if (ratio <= 0.64) return 'high';
  return 'critical';
};

export const ZONE_BG: Record<Severity, string> = {
  low: '#DDE7D5', medium: '#F5E5C3', high: '#F3D9DD', critical: '#E4A5AE',
};
export const SEV_DOT: Record<Severity, string> = {
  low: '#2F5236', medium: '#B8761C', high: '#B11E3A', critical: '#7A1226',
};
export const SEV_BG_PRINT: Record<Severity, string> = {
  low: '#DDE7D5', medium: '#F5E5C3', high: '#F3D9DD', critical: '#E4A5AE',
};
export const SEV_FG_PRINT: Record<Severity, string> = {
  low: '#1A3320', medium: '#6B420A', high: '#6B0F20', critical: '#4A0A14',
};
export const SEV_PILL: Record<Severity, { bg: string; fg: string }> = {
  low:      { bg: '#DDE7D5', fg: '#1F381F' },
  medium:   { bg: '#F5E5C3', fg: '#7A4E0F' },
  high:     { bg: '#F3D9DD', fg: '#7A1226' },
  critical: { bg: '#1A1612', fg: '#F3D9DD' },
};

let _uid = 200;
export const uid = (prefix: string) => `${prefix}-${String(++_uid).padStart(4,'0')}`;

export const formatDate = (s: string) => {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s))
    return new Date(s + 'T00:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
  return s;
};

export const formatTs = (ts: number) =>
  new Date(ts).toLocaleString('nb-NO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

export const INITIAL_COLLECTIONS: never[] = [];
