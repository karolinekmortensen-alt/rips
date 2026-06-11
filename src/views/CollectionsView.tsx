import { useState } from 'react';
import { Icon } from '../components/Icon';
import { SevPill } from '../components/SevPill';
import { getSev } from '../constants';
import type { Collection } from '../types';
import type { OrgInfo } from '../lib/data';

interface Props {
  collections: Collection[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onMove: (collectionId: string, targetOrgId: string) => Promise<void>;
  canEdit: boolean;
  orgs: OrgInfo[];
  activeOrgId: string;
}

export function CollectionsView({ collections, onSelect, onAdd, onDelete, onMove, canEdit, orgs, activeOrgId }: Props) {
  const [movingId,   setMovingId]   = useState<string | null>(null);
  const [moving,     setMoving]     = useState(false);

  const otherOrgs = orgs.filter(o => o.id !== activeOrgId);
  const canMove   = canEdit && otherOrgs.length > 0;

  const handleMove = async (colId: string, targetOrgId: string) => {
    setMoving(true);
    try {
      await onMove(colId, targetOrgId);
    } finally {
      setMoving(false);
      setMovingId(null);
    }
  };

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
              {canEdit && <th style={{ width: canMove ? 80 : 50 }}></th>}
            </tr>
          </thead>
          <tbody>
            {collections.map(col => {
              const sevs = col.risks.map(r => getSev(r.p,r.c,col.scale||5));
              const worstSev = (['critical','high','medium','low'] as const).find(s => sevs.includes(s));
              const openMits = col.risks.reduce((s,r) => s + r.mitigations.filter(m => !m.done).length, 0);
              return (
                <tr key={col.id} onClick={() => movingId !== col.id && onSelect(col.id)}>
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
                    <td style={{ textAlign:'right', paddingRight:8, whiteSpace:'nowrap' }} onClick={e => e.stopPropagation()}>
                      {canMove && (
                        movingId === col.id ? (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                            <select
                              className="rips-input rips-select"
                              style={{ fontSize:11, height:26, padding:'0 6px', width:140 }}
                              defaultValue=""
                              onChange={e => { if (e.target.value) handleMove(col.id, e.target.value); }}
                              disabled={moving}
                              autoFocus
                            >
                              <option value="" disabled>Velg workspace…</option>
                              {otherOrgs.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                              ))}
                            </select>
                            <button className="rips-btn-ghost" style={{ padding:'3px 5px', color:'var(--ink-3)' }}
                              onClick={() => setMovingId(null)}>
                              <Icon name="x" size={12} />
                            </button>
                          </span>
                        ) : (
                          <button className="rips-btn-ghost" style={{ padding:'4px 6px', color:'var(--ink-3)' }}
                            onClick={() => setMovingId(col.id)} title="Flytt til annet workspace">
                            <Icon name="move" size={14} />
                          </button>
                        )
                      )}
                      <button className="rips-btn-ghost" style={{ padding:'4px 6px', color:'var(--ink-3)' }}
                        onClick={() => { if (confirm(`Slett "${col.name}"?`)) onDelete(col.id); }}
                        title="Slett samling">
                        <Icon name="trash" size={14} />
                      </button>
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
