import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '../components/Icon';
import { RipsLogo } from '../components/RipsLogo';
import { SevPill } from '../components/SevPill';
import { RiskMatrix, getRiskTrajectory, getMitEffectTrajectory } from '../matrix/RiskMatrix';
import { RiskTable } from '../matrix/RiskTable';
import { RiskDrawer } from '../drawer/RiskDrawer';
import { AddRiskModal } from '../modals/AddRiskModal';
import { EditCollectionModal } from '../modals/EditCollectionModal';
import { getSev, SEV_DOT, SEV_LABEL, SEV_BG_PRINT, SEV_FG_PRINT, formatDate, probLabel, consLabel } from '../constants';
import type { Collection, Risk, Profile } from '../types';

interface Props {
  collection: Collection;
  onBack: () => void;
  onAddRisk: (r: Omit<Risk, 'id' | 'comments' | 'log'>) => void;
  onUpdateRisk: (r: Risk) => void;
  onDeleteRisk: (id: string) => void;
  onUpdateCollection: (c: Collection) => void;
  availableTags: string[];
  onCreateTag: (t: string) => void;
  onDeleteTag: (t: string) => void;
  user: any;
  profiles?: Profile[];
  canEdit: boolean;
}

export function CollectionView({ collection, onBack, onAddRisk, onUpdateRisk, onDeleteRisk, onUpdateCollection, availableTags, onCreateTag, onDeleteTag, user, profiles = [], canEdit }: Props) {
  const [openRiskId,    setOpenRiskId]   = useState<string | null>(null);
  const [showAddRisk,   setShowAddRisk]  = useState(false);
  const [showEditCol,   setShowEditCol]  = useState(false);
  const [showHistory,   setShowHistory]  = useState(false);
  const [showMitEffect, setShowMitEffect]= useState(false);
  const scale = collection.scale || 5;

  const trajectories = showHistory
    ? Object.fromEntries(collection.risks.map(r => [r.id, getRiskTrajectory(r)]).filter(([, t]) => t) as [string, any][])
    : null;
  const mitTrajectories = showMitEffect
    ? Object.fromEntries(collection.risks.map(r => [r.id, getMitEffectTrajectory(r, scale)]).filter(([, t]) => t) as [string, any][])
    : null;
  const hasHistory    = collection.risks.some(r => getRiskTrajectory(r));
  const hasMitEffects = collection.risks.some(r => getMitEffectTrajectory(r, scale));

  const printTrajectories    = hasHistory
    ? Object.fromEntries(collection.risks.map(r => [r.id, getRiskTrajectory(r)]).filter(([, t]) => t) as [string, any][])
    : null;
  const printMitTrajectories = hasMitEffects
    ? Object.fromEntries(collection.risks.map(r => [r.id, getMitEffectTrajectory(r, scale)]).filter(([, t]) => t) as [string, any][])
    : null;

  const openRisk  = collection.risks.find(r => r.id === openRiskId);
  const sevCounts = collection.risks.reduce((acc, r) => {
    const s = getSev(r.p, r.c, scale);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="app-page">
        <header className="page-head">
          <div>
            <button
              className="rips-btn-ghost"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--ink-2)', padding:'4px 8px 4px 4px', marginBottom:10 }}
              onClick={onBack}
            >
              <Icon name="back" size={14} /> Alle samlinger
            </button>
            <div className="page-title-block">
              <div className="rips-cap">{collection.owner}{collection.period ? ` · ${collection.period}` : ''}</div>
              <h1 className="page-title">{collection.name}</h1>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className="rips-btn-secondary" onClick={() => window.print()} title="Skriv ut / Lagre som PDF">
              <Icon name="printer" size={14} /> Skriv ut
            </button>
            {canEdit && <>
              <button className="rips-btn-secondary" onClick={() => setShowEditCol(true)}>
                <Icon name="edit" size={14} /> Rediger
              </button>
              <button className="rips-btn" onClick={() => setShowAddRisk(true)}>
                <Icon name="plus" size={14} /> Ny risiko
              </button>
            </>}
          </div>
        </header>

        {collection.description && (
          <p style={{ fontSize:14, color:'var(--ink-2)', margin:'0 0 24px', maxWidth:640 }}>{collection.description}</p>
        )}

        {collection.risks.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:20, marginBottom:28, alignItems:'start' }}>
            <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div className="rips-cap">Risikomatrise — sannsynlighet × konsekvens ({scale}×{scale})</div>
                <div style={{ display:'flex', gap:6 }}>
                  {hasHistory && (
                    <button
                      className="rips-btn-ghost rips-small"
                      style={{ fontSize:11, color: showHistory ? 'var(--currant)' : 'var(--ink-2)', display:'flex', alignItems:'center', gap:5 }}
                      onClick={() => setShowHistory(h => !h)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      {showHistory ? 'Skjul historikk' : 'Vis historikk'}
                    </button>
                  )}
                  {hasMitEffects && (
                    <button
                      className="rips-btn-ghost rips-small"
                      style={{ fontSize:11, color: showMitEffect ? 'var(--leaf)' : 'var(--ink-2)', display:'flex', alignItems:'center', gap:5 }}
                      onClick={() => setShowMitEffect(h => !h)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                      {showMitEffect ? 'Skjul tiltakseffekt' : 'Vis tiltakseffekt'}
                    </button>
                  )}
                </div>
              </div>
              <RiskMatrix risks={collection.risks} onRiskClick={id => setOpenRiskId(id)} scale={scale} trajectories={trajectories} mitTrajectories={mitTrajectories} />
              <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
                {(['low','medium','high','critical'] as const).map(s => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-2)' }}>
                    <span style={{ width:9, height:9, borderRadius:'50%', background:SEV_DOT[s], display:'inline-block' }}></span>
                    {SEV_LABEL[s]} ({sevCounts[s] || 0})
                  </div>
                ))}
                {showHistory && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-2)', marginLeft:'auto' }}>
                    <svg width="22" height="10" viewBox="0 0 22 10"><line x1="0" y1="5" x2="16" y2="5" stroke="#5C544A" strokeWidth="1.5" strokeDasharray="4,3"/><path d="M13,1 L13,9 L21,5 z" fill="#5C544A"/><circle cx="0" cy="5" r="4" fill="#5C544A" opacity="0.28"/></svg>
                    Tidligere → nåværende
                  </div>
                )}
                {showMitEffect && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--leaf)', marginLeft: showHistory ? 0 : 'auto' }}>
                    <svg width="22" height="10" viewBox="0 0 22 10"><line x1="0" y1="5" x2="14" y2="5" stroke="#2F5236" strokeWidth="1.5" strokeDasharray="3,3"/><path d="M12,1 L12,9 L21,5 z" fill="#2F5236"/><circle cx="21" cy="5" r="4" fill="#2F5236" opacity="0.35" stroke="#2F5236" strokeWidth="1.5"/></svg>
                    Nåværende → etter tiltak
                  </div>
                )}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(['critical','high','medium','low'] as const).map(s => (
                <div key={s} style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, padding:'12px 16px' }}>
                  <div className="rips-cap" style={{ marginBottom:4 }}>{SEV_LABEL[s]}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:32, lineHeight:1, letterSpacing:'-0.015em', color:SEV_DOT[s] }}>
                    {sevCounts[s] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {collection.risks.length === 0 ? (
          <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, padding:'56px 24px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--ink-2)', marginBottom:12, fontStyle:'italic' }}>Ingen risikoer ennå</div>
            {canEdit
              ? <><p style={{ fontSize:14, color:'var(--ink-2)', marginBottom:20 }}>Legg til den første risikoen for å begynne.</p>
                  <button className="rips-btn" onClick={() => setShowAddRisk(true)}><Icon name="plus" size={14} /> Legg til risiko</button></>
              : <p style={{ fontSize:14, color:'var(--ink-2)' }}>Ingen risikoer er lagt til i denne samlingen ennå.</p>
            }
          </div>
        ) : (
          <>
            <div className="table-toolbar">
              <div className="left">
                {(['critical','high','medium','low'] as const).map(s => sevCounts[s] ? (
                  <span key={s} className="chip">
                    <span style={{ width:7, height:7, borderRadius:'50%', background:SEV_DOT[s], display:'inline-block' }}></span>
                    {SEV_LABEL[s]}: {sevCounts[s]}
                  </span>
                ) : null)}
              </div>
              <span style={{ color:'var(--ink-2)', fontSize:12, fontFamily:'var(--font-mono)' }}>
                {collection.risks.length} risikoer
              </span>
            </div>
            <RiskTable risks={collection.risks} onOpen={id => setOpenRiskId(id)} scale={scale} />
          </>
        )}
      </div>

      {openRisk && (
        <RiskDrawer
          risk={openRisk}
          onClose={() => setOpenRiskId(null)}
          onUpdate={updated => canEdit ? onUpdateRisk(updated) : undefined}
          onDelete={id => { onDeleteRisk(id); setOpenRiskId(null); }}
          scale={scale}
          availableTags={availableTags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          user={user}
          profiles={profiles}
          canEdit={canEdit}
        />
      )}

      {canEdit && showAddRisk && (
        <AddRiskModal
          onClose={() => setShowAddRisk(false)}
          onAdd={risk => { onAddRisk(risk); setShowAddRisk(false); }}
          scale={scale}
          availableTags={availableTags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          profiles={profiles}
        />
      )}

      {canEdit && showEditCol && (
        <EditCollectionModal
          collection={collection}
          onClose={() => setShowEditCol(false)}
          onSave={updated => { onUpdateCollection(updated); setShowEditCol(false); }}
          profiles={profiles}
        />
      )}

      {ReactDOM.createPortal(
        <div className="print-report">
          {/* ── Header ──────────────────────────────────────── */}
          <div className="print-header">
            <div className="print-logo-row">
              <RipsLogo size={28} bg="var(--paper)" />
              <span className="print-app-name">Rips</span>
            </div>
            <div className="print-meta">
              {collection.owner && <span>{collection.owner}</span>}
              {collection.period && <span>{collection.period}</span>}
              <span>Skala {scale}×{scale}</span>
              <span>{new Date().toLocaleDateString('nb-NO', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
          </div>
          <h1 className="print-title">{collection.name}</h1>
          {collection.description && <p className="print-desc">{collection.description}</p>}

          {/* ── Matrix ──────────────────────────────────────── */}
          <div className="print-matrix-section">
            <div className="print-section-label">Risikomatrise — sannsynlighet × konsekvens ({scale}×{scale})</div>
            <div className="print-matrix-wrap">
              <RiskMatrix
                risks={collection.risks}
                onRiskClick={() => {}}
                scale={scale}
                trajectories={printTrajectories}
                mitTrajectories={printMitTrajectories}
              />
            </div>
            <div className="print-legend">
              {(['low','medium','high','critical'] as const).map(s => (
                <div key={s} className="print-legend-item">
                  <span className="print-dot" style={{ background: SEV_DOT[s] }}></span>
                  {SEV_LABEL[s]} ({sevCounts[s] || 0})
                </div>
              ))}
              {printTrajectories && (
                <div className="print-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10"><line x1="0" y1="5" x2="16" y2="5" stroke="#5C544A" strokeWidth="1.5" strokeDasharray="4,3"/><path d="M13,1 L13,9 L21,5 z" fill="#5C544A"/><circle cx="0" cy="5" r="4" fill="#5C544A" opacity="0.28"/></svg>
                  Tidligere → nåværende
                </div>
              )}
              {printMitTrajectories && (
                <div className="print-legend-item">
                  <svg width="22" height="10" viewBox="0 0 22 10"><line x1="0" y1="5" x2="14" y2="5" stroke="#2F5236" strokeWidth="1.5" strokeDasharray="3,3"/><path d="M12,1 L12,9 L21,5 z" fill="#2F5236"/><circle cx="21" cy="5" r="4" fill="#2F5236" opacity="0.35" stroke="#2F5236" strokeWidth="1.5"/></svg>
                  Nåværende → etter tiltak
                </div>
              )}
            </div>
          </div>

          {/* ── Risk register ───────────────────────────────── */}
          <div className="print-section-label" style={{ marginTop:28, marginBottom:10 }}>Risikoregister</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width:28 }}>#</th>
                <th>Tittel</th>
                <th>Eier</th>
                <th>Sannsynlighet</th>
                <th>Konsekvens</th>
                <th>Alvor</th>
                <th style={{ width:52 }}>Tiltak</th>
              </tr>
            </thead>
            <tbody>
              {collection.risks.map((r, idx) => {
                const sev  = getSev(r.p, r.c, scale);
                const done = r.mitigations.filter(m => m.done).length;
                return (
                  <tr key={r.id}>
                    <td className="print-mono print-center" style={{ fontWeight:600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight:500 }}>{r.title}</div>
                      {r.description && <div className="print-subdesc">{r.description}</div>}
                      {r.tags && r.tags.length > 0 && (
                        <div style={{ marginTop:3, display:'flex', flexWrap:'wrap', gap:3 }}>
                          {r.tags.map(t => <span key={t} className="print-tag">{t}</span>)}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace:'nowrap' }}>{r.owner || '—'}</td>
                    <td>
                      <span className="print-mono" style={{ fontWeight:600 }}>{r.p}</span>
                      <span className="print-sublabel"> {probLabel(r.p, scale)}</span>
                    </td>
                    <td>
                      <span className="print-mono" style={{ fontWeight:600 }}>{r.c}</span>
                      <span className="print-sublabel"> {consLabel(r.c, scale)}</span>
                    </td>
                    <td><span className="print-sev" style={{ background: SEV_BG_PRINT[sev], color: SEV_FG_PRINT[sev] }}>{SEV_LABEL[sev]}</span></td>
                    <td className="print-mono print-center">{r.mitigations.length > 0 ? `${done}/${r.mitigations.length}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Mitigations detail ──────────────────────────── */}
          {collection.risks.some(r => r.mitigations.length > 0) && (
            <>
              <div className="print-section-label" style={{ marginTop:28, marginBottom:10 }}>Tiltak</div>
              {collection.risks.filter(r => r.mitigations.length > 0).map((r, idx) => (
                <div key={r.id} className="print-mit-group">
                  <div className="print-mit-risk">#{collection.risks.indexOf(r) + 1} — {r.title}</div>
                  {r.mitigations.map(m => (
                    <div key={m.id} className="print-mit-row">
                      <span className={`print-check ${m.done ? 'done' : ''}`}>{m.done ? '✓' : '○'}</span>
                      <span className="print-mit-label">{m.label}</span>
                      {(m.deltaP || m.deltaC) && !m.done && (
                        <span className="print-mit-meta print-delta">
                          {m.deltaP ? `S${m.deltaP > 0 ? '+' : ''}${m.deltaP}` : ''}
                          {m.deltaP && m.deltaC ? ' ' : ''}
                          {m.deltaC ? `K${m.deltaC > 0 ? '+' : ''}${m.deltaC}` : ''}
                        </span>
                      )}
                      {m.owner && <span className="print-mit-meta">{m.owner}</span>}
                      {m.due   && <span className="print-mit-meta">{formatDate(m.due)}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* ── Mitigation effect ───────────────────────────── */}
          {collection.risks.some(r => getMitEffectTrajectory(r, scale)) && (
            <>
              <div className="print-section-label" style={{ marginTop:28, marginBottom:10 }}>Tiltakseffekt — projisert posisjon etter gjenstående tiltak</div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width:28 }}>#</th>
                    <th>Tittel</th>
                    <th>Nåværende</th>
                    <th>Projisert</th>
                    <th>Endring</th>
                    <th>Alvor nå</th>
                    <th>Alvor projisert</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.risks.map((r, idx) => {
                    const traj = getMitEffectTrajectory(r, scale);
                    if (!traj) return null;
                    const [from, to] = traj;
                    const sevNow  = getSev(from.p, from.c, scale);
                    const sevProj = getSev(to.p, to.c, scale);
                    const dP = to.p - from.p;
                    const dC = to.c - from.c;
                    return (
                      <tr key={r.id}>
                        <td className="print-mono print-center" style={{ fontWeight:600 }}>{idx + 1}</td>
                        <td style={{ fontWeight:500 }}>{r.title}</td>
                        <td className="print-mono">S{from.p} × K{from.c}</td>
                        <td className="print-mono">S{to.p} × K{to.c}</td>
                        <td className="print-mono print-delta-cell">
                          {dP !== 0 && <span>S{dP > 0 ? '+' : ''}{dP}</span>}
                          {dC !== 0 && <span>K{dC > 0 ? '+' : ''}{dC}</span>}
                        </td>
                        <td><span className="print-sev" style={{ background: SEV_BG_PRINT[sevNow], color: SEV_FG_PRINT[sevNow] }}>{SEV_LABEL[sevNow]}</span></td>
                        <td><span className="print-sev" style={{ background: SEV_BG_PRINT[sevProj], color: SEV_FG_PRINT[sevProj] }}>{SEV_LABEL[sevProj]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* ── History ─────────────────────────────────────── */}
          {collection.risks.some(r => getRiskTrajectory(r)) && (
            <>
              <div className="print-section-label" style={{ marginTop:28, marginBottom:10 }}>Risikohistorikk — endringer over tid</div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width:28 }}>#</th>
                    <th>Tittel</th>
                    <th>Første registrerte</th>
                    <th>Nåværende</th>
                    <th>Endring</th>
                    <th>Alvor da</th>
                    <th>Alvor nå</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.risks.map((r, idx) => {
                    const traj = getRiskTrajectory(r);
                    if (!traj || traj.length < 2) return null;
                    const first = traj[0];
                    const last  = traj[traj.length - 1];
                    const sevFirst = getSev(first.p, first.c, scale);
                    const sevLast  = getSev(last.p,  last.c,  scale);
                    const dP = last.p - first.p;
                    const dC = last.c - first.c;
                    return (
                      <tr key={r.id}>
                        <td className="print-mono print-center" style={{ fontWeight:600 }}>{idx + 1}</td>
                        <td style={{ fontWeight:500 }}>{r.title}</td>
                        <td className="print-mono">S{first.p} × K{first.c}</td>
                        <td className="print-mono">S{last.p} × K{last.c}</td>
                        <td className="print-mono print-delta-cell">
                          {dP !== 0 && <span>S{dP > 0 ? '+' : ''}{dP}</span>}
                          {dC !== 0 && <span>K{dC > 0 ? '+' : ''}{dC}</span>}
                          {dP === 0 && dC === 0 && <span style={{ color:'#8A8275' }}>—</span>}
                        </td>
                        <td><span className="print-sev" style={{ background: SEV_BG_PRINT[sevFirst], color: SEV_FG_PRINT[sevFirst] }}>{SEV_LABEL[sevFirst]}</span></td>
                        <td><span className="print-sev" style={{ background: SEV_BG_PRINT[sevLast], color: SEV_FG_PRINT[sevLast] }}>{SEV_LABEL[sevLast]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <div className="print-footer">
            Generert fra Rips · {new Date().toLocaleString('nb-NO')}
          </div>
        </div>,
        document.getElementById('print-root')!
      )}
    </>
  );
}
