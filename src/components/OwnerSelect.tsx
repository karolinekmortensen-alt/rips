import { useState, useEffect, useRef } from 'react';
import type { Profile } from '../types';

interface Props {
  value: string;
  onChange: (val: string) => void;
  profiles?: Profile[];
  placeholder?: string;
}

export function OwnerSelect({ value, onChange, profiles = [], placeholder = 'Søk bruker eller skriv navn…' }: Props) {
  const [query, setQuery] = useState(value || '');
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const filtered = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.email     || '').toLowerCase().includes(query.toLowerCase())
  );

  const initials = (n: string) => (n || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const select   = (name: string) => { onChange(name); setQuery(name); setOpen(false); };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="rips-input"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="tag-dropdown">
          {filtered.map(p => (
            <div key={p.id} className="tag-option" onMouseDown={() => select(p.full_name || p.email)}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:28, height:28, borderRadius:'50%', background:'var(--leaf)', color:'var(--leaf-skin)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>
                  {initials(p.full_name || p.email)}
                </span>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{p.full_name || p.email}</div>
                  {p.full_name && <div style={{ fontSize:11, color:'var(--ink-3)' }}>{p.email}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
