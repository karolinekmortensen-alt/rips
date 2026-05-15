import { getSev, probLabel, consLabel } from '../constants';
import { SevPill } from '../components/SevPill';
import type { Risk } from '../types';

interface Props {
  risks: Risk[];
  onOpen: (id: string) => void;
  scale?: number;
}

export function RiskTable({ risks, onOpen, scale = 5 }: Props) {
  return (
    <table className="rips-table">
      <thead>
        <tr>
          <th style={{ width:84 }}>ID</th>
          <th>Tittel</th>
          <th style={{ width:120 }}>Eier</th>
          <th style={{ width:150 }}>Tagger</th>
          <th style={{ width:100, textAlign:'center' }}>Sannsynlighet</th>
          <th style={{ width:100, textAlign:'center' }}>Konsekvens</th>
          <th style={{ width:100 }}>Alvor</th>
          <th style={{ width:80, textAlign:'center' }}>Tiltak</th>
        </tr>
      </thead>
      <tbody>
        {risks.map((r, i) => {
          const sev = getSev(r.p, r.c, scale);
          const done = r.mitigations.filter(m => m.done).length;
          const total = r.mitigations.length;
          const tags = r.tags || (r.category ? [r.category] : []);
          return (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td className="mono accent">#{i + 1}</td>
              <td><span style={{ fontWeight:500 }}>{r.title}</span></td>
              <td>{r.owner}</td>
              <td>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {tags.map(t => <span key={t} className="tag-pill-sm">{t}</span>)}
                  {tags.length === 0 && <span style={{ color:'var(--ink-3)', fontSize:12 }}>—</span>}
                </div>
              </td>
              <td className="mono" style={{ textAlign:'center' }}>
                {r.p} <span style={{ color:'var(--ink-3)', fontFamily:'var(--font-sans)', fontSize:11 }}>{probLabel(r.p, scale)}</span>
              </td>
              <td className="mono" style={{ textAlign:'center' }}>
                {r.c} <span style={{ color:'var(--ink-3)', fontFamily:'var(--font-sans)', fontSize:11 }}>{consLabel(r.c, scale)}</span>
              </td>
              <td><SevPill sev={sev} /></td>
              <td className="mono" style={{ textAlign:'center', color: total > 0 && done === total ? 'var(--leaf)' : total > 0 ? 'var(--ink-2)' : 'var(--ink-3)' }}>
                {total > 0 ? `${done}/${total}` : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
