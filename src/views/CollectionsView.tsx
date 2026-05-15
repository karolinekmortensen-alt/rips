import { Icon } from '../components/Icon';
import { SevPill } from '../components/SevPill';
import { getSev } from '../constants';
import type { Collection } from '../types';

interface Props {
  collections: Collection[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

export function CollectionsView({ collections, onSelect, onAdd, onDelete, canEdit }: Props) {
  return (
    <div className="app-page">
      <header className="page-head">
        <div className="page-title-block">
          <div className="rips-cap">Workspace</div>
          <h1 className="page-title">Risikosamlinger</h1>
        </div>
        {canEdit && (
          <button className="rips-btn" onClick={onAdd}>
            <Icon name="plus" size={14} /> Ny samling
          </button>
        )}
      </header>

      {collections.length === 0 ? (
        <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, padding:'60px 24px', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--ink-2)', marginBottom:14, fontStyle:'italic' }}>Ingen samlinger ennå</div>
          {canEdit
            ? <><p style={{ fontSize:14, color:'var(--ink-2)', marginBottom:20 }}>Opprett den første risikosamlingen for å komme i gang.</p>
                <button className="rips-btn" onClick={onAdd}><Icon name="plus" size={14} /> Ny samling</button></>
            : <p style={{ fontSize:14, color:'var(--ink-2)' }}>Ingen samlinger er opprettet i dette workspacet ennå.</p>
          }
        </div>
      ) : (
        <table className="rips-table">
          <thead>
            <tr>
              <th>Navn</th>
              <th style={{ width:130 }}>Eier</th>
              <th style={{ width:100 }}>Periode</th>
              <th style={{ width:90, textAlign:'center' }}>Risikoer</th>
              <th style={{ width:120 }}>Høyeste alvor</th>
              <th style={{ width:110, textAlign:'center' }}>Åpne tiltak</th>
              {canEdit && <th style={{ width:50 }}></th>}
            </tr>
          </thead>
          <tbody>
            {collections.map(col => {
              const sevs = col.risks.map(r => getSev(r.p,r.c,col.scale||5));
              const worstSev = (['critical','high','medium','low'] as const).find(s => sevs.includes(s));
              const openMits = col.risks.reduce((s,r) => s + r.mitigations.filter(m => !m.done).length, 0);
              return (
                <tr key={col.id} onClick={() => onSelect(col.id)}>
                  <td>
                    <div style={{ fontWeight:500 }}>{col.name}</div>
                    {col.description && <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{col.description.length > 70 ? col.description.slice(0,70)+'…' : col.description}</div>}
                  </td>
                  <td>{col.owner}</td>
                  <td className="muted">{col.period || '—'}</td>
                  <td className="mono" style={{ textAlign:'center' }}>{col.risks.length}</td>
                  <td>{worstSev ? <SevPill sev={worstSev} /> : <span style={{ color:'var(--ink-3)', fontSize:12 }}>—</span>}</td>
                  <td className="mono" style={{ textAlign:'center', color: openMits > 0 ? 'var(--amber)' : col.risks.length > 0 ? 'var(--leaf)' : 'var(--ink-3)' }}>
                    {col.risks.length === 0 ? '—' : openMits > 0 ? openMits : 'Alle lukket'}
                  </td>
                  {canEdit && (
                    <td style={{ textAlign:'center' }} onClick={e => { e.stopPropagation(); if (confirm(`Slett "${col.name}"?`)) onDelete(col.id); }}>
                      <span style={{ color:'var(--ink-3)', cursor:'pointer', display:'inline-flex' }}><Icon name="trash" size={14} /></span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
