import { useState } from 'react';
import { Icon } from '../components/Icon';
import { SevPill } from '../components/SevPill';
import { CommentThread } from '../components/CommentThread';
import { TagInput } from '../components/TagInput';
import { OwnerSelect } from '../components/OwnerSelect';
import { MitEffectEditor } from '../matrix/MitEffectEditor';
import { getSev, probLabel, consLabel, uid, formatDate, formatTs } from '../constants';
import { getUserName } from '../supabase';
import type { Risk, Profile } from '../types';

interface Props {
  risk: Risk;
  onClose: () => void;
  onUpdate: ((r: Risk) => void) | undefined;
  onDelete: (id: string) => void;
  scale?: number;
  availableTags?: string[];
  onCreateTag?: (t: string) => void;
  onDeleteTag?: (t: string) => void;
  user: any;
  profiles?: Profile[];
  canEdit?: boolean;
}

export function RiskDrawer({ risk, onClose, onUpdate, onDelete, scale = 5, availableTags = [], onCreateTag = () => {}, onDeleteTag = () => {}, user, profiles = [], canEdit = true }: Props) {
  const [addingMit,      setAddingMit]      = useState(false);
  const [mitLabel,       setMitLabel]       = useState('');
  const [mitDue,         setMitDue]         = useState('');
  const [mitOwner,       setMitOwner]       = useState('');
  const [editMitId,      setEditMitId]      = useState<string | null>(null);
  const [eMitLabel,      setEMitLabel]      = useState('');
  const [eMitOwner,      setEMitOwner]      = useState('');
  const [eMitDue,        setEMitDue]        = useState('');
  const [mitDeltaP,      setMitDeltaP]      = useState(0);
  const [mitDeltaC,      setMitDeltaC]      = useState(0);
  const [eMitDeltaP,     setEMitDeltaP]     = useState(0);
  const [eMitDeltaC,     setEMitDeltaC]     = useState(0);
  const [editing,        setEditing]        = useState(false);
  const [eTitle,         setETitle]         = useState('');
  const [eOwner,         setEOwner]         = useState('');
  const [eTags,          setETags]          = useState<string[]>([]);
  const [eP,             setEP]             = useState(1);
  const [eC,             setEC]             = useState(1);
  const [eDesc,          setEDesc]          = useState('');
  const [riskCmtText,    setRiskCmtText]    = useState('');
  const [expandedMitIds, setExpandedMitIds] = useState(new Set<string>());
  const [mitCmtTexts,    setMitCmtTexts]    = useState<Record<string, string>>({});

  const sev   = getSev(risk.p, risk.c, scale);
  const ticks = Array.from({ length: scale }, (_, i) => i + 1);
  const tags  = risk.tags || (risk.category ? [risk.category] : []);
  const log   = risk.log || [];
  const who   = getUserName(user);

  const startEdit = () => {
    setETitle(risk.title); setEOwner(risk.owner); setETags(tags);
    setEP(risk.p); setEC(risk.c); setEDesc(risk.description || '');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!eTitle.trim() || !eOwner.trim()) return;
    const newLog = [...log];
    const pChanged = eP !== risk.p, cChanged = eC !== risk.c;
    if (pChanged || cChanged) {
      newLog.push({
        id: uid('L'), ts: Date.now(), user: who,
        prevP: risk.p, prevC: risk.c, newP: eP, newC: eC,
        text: [
          pChanged && `Sannsynlighet endret fra ${risk.p} (${probLabel(risk.p, scale)}) til ${eP} (${probLabel(eP, scale)})`,
          cChanged && `Konsekvens endret fra ${risk.c} (${consLabel(risk.c, scale)}) til ${eC} (${consLabel(eC, scale)})`,
        ].filter(Boolean).join('. '),
      });
    }
    if (eTitle.trim() !== risk.title) newLog.push({ id: uid('L'), ts: Date.now(), user: who, text: 'Tittel endret.' });
    if (eOwner.trim() !== risk.owner) newLog.push({ id: uid('L'), ts: Date.now(), user: who, text: `Eier endret til ${eOwner.trim()}.` });
    onUpdate({ ...risk, title: eTitle.trim(), owner: eOwner.trim(), tags: eTags, p: eP, c: eC, description: eDesc.trim(), log: newLog });
    setEditing(false);
  };

  const toggleMit = (id: string) => {
    const m = risk.mitigations.find(m => m.id === id)!;
    const markingDone = !m.done;
    if (markingDone && (m.deltaP || m.deltaC)) {
      const projP = Math.max(1, Math.min(scale, risk.p + (m.deltaP || 0)));
      const projC = Math.max(1, Math.min(scale, risk.c + (m.deltaC || 0)));
      const changes = [m.deltaP && `S: ${risk.p} → ${projP}`, m.deltaC && `K: ${risk.c} → ${projC}`].filter(Boolean).join(', ');
      if (confirm(`Tiltaket har forventet effekt (${changes}).\nVil du oppdatere risikoen nå?`)) {
        const newLog = [...(risk.log || []), { id: uid('L'), ts: Date.now(), user: who, prevP: risk.p, prevC: risk.c, newP: projP, newC: projC, text: `Risiko oppdatert basert på tiltak: «${m.label}»` }];
        onUpdate({ ...risk, p: projP, c: projC, log: newLog, mitigations: risk.mitigations.map(mit => mit.id === id ? { ...mit, done: true } : mit) });
        return;
      }
    }
    onUpdate({ ...risk, mitigations: risk.mitigations.map(mit => mit.id === id ? { ...mit, done: !mit.done } : mit) });
  };

  const removeMit = (id: string) => onUpdate({ ...risk, mitigations: risk.mitigations.filter(m => m.id !== id) });

  const saveMit = () => {
    if (!mitLabel.trim()) return;
    onUpdate({ ...risk, mitigations: [...risk.mitigations, { id: uid('M'), label: mitLabel.trim(), due: mitDue.trim(), owner: mitOwner.trim(), done: false, comments: [], deltaP: mitDeltaP, deltaC: mitDeltaC }] });
    setMitLabel(''); setMitDue(''); setMitOwner(''); setMitDeltaP(0); setMitDeltaC(0); setAddingMit(false);
  };

  const toggleMitExpand = (id: string) => setExpandedMitIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const startEditMit = (m: any) => { setEditMitId(m.id); setEMitLabel(m.label); setEMitOwner(m.owner || ''); setEMitDue(m.due || ''); setEMitDeltaP(m.deltaP || 0); setEMitDeltaC(m.deltaC || 0); };
  const saveEditMit  = () => {
    if (!eMitLabel.trim()) return;
    onUpdate({ ...risk, mitigations: risk.mitigations.map(m => m.id === editMitId ? { ...m, label: eMitLabel.trim(), owner: eMitOwner.trim(), due: eMitDue, deltaP: eMitDeltaP, deltaC: eMitDeltaC } : m) });
    setEditMitId(null);
  };

  const addRiskComment = () => {
    if (!riskCmtText.trim()) return;
    onUpdate({ ...risk, comments: [...(risk.comments || []), { id: uid('C'), ts: Date.now(), user: who, text: riskCmtText.trim() }] });
    setRiskCmtText('');
  };
  const delRiskComment = (cid: string) => onUpdate({ ...risk, comments: (risk.comments || []).filter(c => c.id !== cid) });

  const addMitComment = (mid: string) => {
    const text = (mitCmtTexts[mid] || '').trim();
    if (!text) return;
    onUpdate({ ...risk, mitigations: risk.mitigations.map(m => m.id === mid ? { ...m, comments: [...(m.comments || []), { id: uid('C'), ts: Date.now(), user: who, text }] } : m) });
    setMitCmtTexts(p => ({ ...p, [mid]: '' }));
  };
  const delMitComment = (mid: string, cid: string) => onUpdate({ ...risk, mitigations: risk.mitigations.map(m => m.id === mid ? { ...m, comments: (m.comments || []).filter(c => c.id !== cid) } : m) });

  const doneCount = risk.mitigations.filter(m => m.done).length;

  return (
    <>
      <div className="rips-scrim" onClick={editing ? undefined : onClose}></div>
      <aside className="rips-drawer">
        <header className="rips-drawer-head">
          <div style={{ flex:1, minWidth:0 }}>
            <div className="rips-cap">Risiko · <span className="mono">{risk.id}</span></div>
            {editing
              ? <input className="rips-input" value={eTitle} onChange={e => setETitle(e.target.value)} style={{ marginTop:6, fontWeight:500 }} autoFocus />
              : <h2 className="rips-drawer-title">{risk.title}</h2>
            }
          </div>
          <div style={{ display:'flex', gap:4, flexShrink:0 }}>
            {canEdit && !editing && <>
              <button className="rips-btn-ghost rips-small" style={{ color:'var(--ink-2)' }} onClick={startEdit} title="Rediger risiko"><Icon name="edit" size={13} /></button>
              <button className="rips-btn-ghost rips-small" style={{ color:'var(--ink-3)' }} onClick={() => { if (confirm(`Slett risiko "${risk.title}"?`)) onDelete(risk.id); }} title="Slett risiko"><Icon name="trash" size={13} /></button>
            </>}
            <button className="rips-btn-ghost" style={{ padding:6 }} onClick={editing ? () => setEditing(false) : onClose} title={editing ? 'Avbryt' : 'Lukk'}><Icon name="x" size={16} /></button>
          </div>
        </header>

        {editing ? (
          <div style={{ padding:'4px 20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Eier</label>
              <OwnerSelect value={eOwner} onChange={setEOwner} profiles={profiles} />
            </div>
            <div className="form-group">
              <label className="form-label">Tagger</label>
              <TagInput selected={eTags} onChange={setETags} available={availableTags} onCreateTag={onCreateTag} onDeleteTag={onDeleteTag} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, alignItems:'start' }}>
              <div className="form-group">
                <label className="form-label">Sannsynlighet (1–{scale})</label>
                <select className="rips-input rips-select" value={eP} onChange={e => setEP(Number(e.target.value))}>
                  {ticks.map(v => <option key={v} value={v}>{v} — {probLabel(v, scale)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Konsekvens (1–{scale})</label>
                <select className="rips-input rips-select" value={eC} onChange={e => setEC(Number(e.target.value))}>
                  {ticks.map(v => <option key={v} value={v}>{v} — {consLabel(v, scale)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Beregnet alvor</label>
                <div style={{ paddingTop:8 }}><SevPill sev={getSev(eP, eC, scale)} /></div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Beskrivelse</label>
              <textarea className="rips-input" value={eDesc} onChange={e => setEDesc(e.target.value)} rows={4} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="rips-btn" onClick={saveEdit}>Lagre endringer</button>
              <button className="rips-btn-secondary" onClick={() => setEditing(false)}>Avbryt</button>
            </div>
          </div>
        ) : (
          <>
            <div className="rips-drawer-grid">
              <div className="rips-field">
                <div className="rips-cap">Alvor</div>
                <SevPill sev={sev} />
              </div>
              <div className="rips-field">
                <div className="rips-cap">Eier</div>
                <div style={{ fontSize:14 }}>{risk.owner}</div>
              </div>
              <div className="rips-field" style={{ gridColumn:'1 / -1' }}>
                <div className="rips-cap" style={{ marginBottom:6 }}>Tagger</div>
                <TagInput selected={tags} onChange={newTags => onUpdate({ ...risk, tags: newTags })} available={availableTags} onCreateTag={onCreateTag} onDeleteTag={onDeleteTag} />
              </div>
              <div className="rips-field">
                <div className="rips-cap">Sannsynlighet</div>
                <div className="mono">{risk.p} — {probLabel(risk.p, scale)}</div>
              </div>
              <div className="rips-field">
                <div className="rips-cap">Konsekvens</div>
                <div className="mono">{risk.c} — {consLabel(risk.c, scale)}</div>
              </div>
              <div className="rips-field">
                <div className="rips-cap">Risikoscore</div>
                <div className="mono" style={{ fontSize:18, fontFamily:'var(--font-display)', letterSpacing:'-0.01em' }}>{risk.p * risk.c}</div>
              </div>
            </div>

            <section className="rips-section">
              <div className="rips-cap" style={{ marginBottom:8 }}>Beskrivelse</div>
              <p className="rips-body">
                {risk.description || <em style={{ color:'var(--ink-3)' }}>Ingen beskrivelse ennå. Legg til kontekst slik at neste eier kan handle uten å spørre.</em>}
              </p>
            </section>

            <section className="rips-section">
              <div className="rips-cap" style={{ marginBottom:10 }}>
                Kommentarer
                {(risk.comments || []).length > 0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6 }}>({risk.comments!.length})</span>}
              </div>
              <CommentThread
                comments={risk.comments || []}
                onAdd={addRiskComment}
                onDelete={delRiskComment}
                inputValue={riskCmtText}
                onInputChange={setRiskCmtText}
              />
            </section>

            <section className="rips-section">
              <div className="rips-section-head">
                <div className="rips-cap">
                  Tiltak <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>({doneCount}/{risk.mitigations.length})</span>
                </div>
                {canEdit && !addingMit && (
                  <button className="rips-btn-secondary rips-small" onClick={() => setAddingMit(true)}>
                    <Icon name="plus" size={12} /> Nytt tiltak
                  </button>
                )}
              </div>

              {addingMit && (
                <div className="mit-add-form">
                  <input className="rips-input" placeholder="Beskriv tiltaket…" value={mitLabel} onChange={e => setMitLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setAddingMit(false); }} autoFocus />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, marginTop:8, alignItems:'center' }}>
                    <OwnerSelect value={mitOwner} onChange={setMitOwner} profiles={profiles} placeholder="Ansvarlig…" />
                    <input className="rips-input" type="date" value={mitDue} onChange={e => setMitDue(e.target.value)} style={{ width:148 }} />
                  </div>
                  <MitEffectEditor
                    deltaP={mitDeltaP} deltaC={mitDeltaC}
                    onChangeP={setMitDeltaP} onChangeC={setMitDeltaC}
                    riskP={risk.p} riskC={risk.c} scale={scale}
                  />
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button className="rips-btn rips-small" onClick={saveMit}>Legg til</button>
                    <button className="rips-btn-ghost rips-small" onClick={() => { setAddingMit(false); setMitLabel(''); setMitDue(''); setMitOwner(''); setMitDeltaP(0); setMitDeltaC(0); }}>Avbryt</button>
                  </div>
                </div>
              )}

              <ul className="rips-mitigations">
                {risk.mitigations.length === 0 && !addingMit && (
                  <li style={{ color:'var(--ink-3)', fontStyle:'italic', border:'none', paddingTop:8 }}>Ingen tiltak registrert ennå.</li>
                )}
                {risk.mitigations.map(m => {
                  const cmtCount   = (m.comments || []).length;
                  const isExpanded = expandedMitIds.has(m.id);
                  const isEditing  = editMitId === m.id;
                  return (
                    <li key={m.id} style={{ flexDirection:'column', alignItems:'stretch', gap:0 }}>
                      {isEditing ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'6px 0' }}>
                          <input className="rips-input" value={eMitLabel} onChange={e => setEMitLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditMit(); if (e.key === 'Escape') setEditMitId(null); }} autoFocus />
                          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
                            <OwnerSelect value={eMitOwner} onChange={setEMitOwner} profiles={profiles} placeholder="Ansvarlig…" />
                            <input className="rips-input" type="date" value={eMitDue} onChange={e => setEMitDue(e.target.value)} style={{ width:148 }} />
                          </div>
                          <MitEffectEditor
                            deltaP={eMitDeltaP} deltaC={eMitDeltaC}
                            onChangeP={setEMitDeltaP} onChangeC={setEMitDeltaC}
                            riskP={risk.p} riskC={risk.c} scale={scale}
                          />
                          <div style={{ display:'flex', gap:8, marginTop:10 }}>
                            <button className="rips-btn rips-small" onClick={saveEditMit}>Lagre</button>
                            <button className="rips-btn-ghost rips-small" onClick={() => setEditMitId(null)}>Avbryt</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'2px 0' }}>
                          <span className={`rips-check ${m.done ? 'done' : ''}`} onClick={() => toggleMit(m.id)} title={m.done ? 'Marker som åpen' : 'Marker som fullført'}>
                            {m.done && <Icon name="check" size={10} />}
                          </span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className={m.done ? 'done' : ''}>{m.label}</div>
                            {m.owner && <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:1 }}>{m.owner}</div>}
                          </div>
                          {(m.deltaP || m.deltaC) && (
                            <span style={{ fontSize:10, color: 'var(--leaf)', background:'var(--leaf-wash)', borderRadius:3, padding:'1px 5px', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                              {[m.deltaP && `ΔS${m.deltaP > 0 ? '+' : ''}${m.deltaP}`, m.deltaC && `ΔK${m.deltaC > 0 ? '+' : ''}${m.deltaC}`].filter(Boolean).join(' ')}
                            </span>
                          )}
                          {m.due && <span className="rips-due">{formatDate(m.due)}</span>}
                          <button className="rips-btn-ghost" style={{ padding:'2px 4px', height:'auto', color:'var(--ink-2)' }} onClick={() => startEditMit(m)} title="Rediger tiltak">
                            <Icon name="edit" size={11} />
                          </button>
                          <button className="rips-btn-ghost" style={{ padding:'2px 5px', height:'auto', color: cmtCount > 0 ? 'var(--currant)' : 'var(--ink-3)', fontSize:11, display:'flex', alignItems:'center', gap:3 }} onClick={() => toggleMitExpand(m.id)} title="Kommentarer">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/></svg>
                            {cmtCount > 0 && <span style={{ fontFamily:'var(--font-mono)' }}>{cmtCount}</span>}
                          </button>
                          <button className="rips-btn-ghost" style={{ padding:'2px 4px', height:'auto', color:'var(--ink-3)' }} onClick={() => removeMit(m.id)}>
                            <Icon name="x" size={12} />
                          </button>
                        </div>
                      )}
                      {isExpanded && !isEditing && (
                        <CommentThread
                          comments={m.comments || []}
                          onAdd={() => addMitComment(m.id)}
                          onDelete={(cid) => delMitComment(m.id, cid)}
                          inputValue={mitCmtTexts[m.id] || ''}
                          onInputChange={val => setMitCmtTexts(p => ({ ...p, [m.id]: val }))}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {log.length > 0 && (
              <section className="rips-section">
                <div className="rips-cap" style={{ marginBottom:10 }}>Endringslogg</div>
                <ol className="rips-activity">
                  {[...log].reverse().map(entry => (
                    <li key={entry.id}>
                      <span className="rips-when mono">{formatTs(entry.ts)}</span>
                      <span><b>{entry.user}</b> — {entry.text}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </aside>
    </>
  );
}
