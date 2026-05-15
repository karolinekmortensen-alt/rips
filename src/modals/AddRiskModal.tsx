import { useState } from 'react';
import { Icon } from '../components/Icon';
import { SevPill } from '../components/SevPill';
import { TagInput } from '../components/TagInput';
import { OwnerSelect } from '../components/OwnerSelect';
import { getSev, probLabel, consLabel } from '../constants';
import type { Risk, Profile } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (risk: Omit<Risk, 'id' | 'comments' | 'log'>) => void;
  scale?: number;
  availableTags?: string[];
  onCreateTag?: (t: string) => void;
  onDeleteTag?: (t: string) => void;
  profiles?: Profile[];
}

export function AddRiskModal({ onClose, onAdd, scale = 5, availableTags = [], onCreateTag = () => {}, onDeleteTag = () => {}, profiles = [] }: Props) {
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [tags,  setTags]  = useState<string[]>([]);
  const [p,     setP]     = useState(Math.ceil(scale / 2));
  const [c,     setC]     = useState(Math.ceil(scale / 2));
  const [desc,  setDesc]  = useState('');

  const ticks = Array.from({ length: scale }, (_, i) => i + 1);
  const previewSev = getSev(Number(p), Number(c), scale);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !owner.trim()) return;
    onAdd({ title: title.trim(), owner: owner.trim(), tags, p: Number(p), c: Number(c), description: desc.trim(), mitigations: [] });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth:600 }}>
        <div className="modal-head">
          <h3 style={{ margin:0, fontWeight:500, fontSize:17 }}>Ny risiko</h3>
          <button className="rips-btn-ghost" style={{ padding:6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Tittel *</label>
            <input className="rips-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Beskriv risikoen kort og presist" autoFocus required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Eier *</label>
              <OwnerSelect value={owner} onChange={setOwner} profiles={profiles} />
            </div>
            <div className="form-group">
              <label className="form-label">Tagger</label>
              <TagInput selected={tags} onChange={setTags} available={availableTags} onCreateTag={onCreateTag} onDeleteTag={onDeleteTag} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, alignItems:'start' }}>
            <div className="form-group">
              <label className="form-label">Sannsynlighet (1–{scale})</label>
              <select className="rips-input rips-select" value={p} onChange={e => setP(Number(e.target.value))}>
                {ticks.map(v => <option key={v} value={v}>{v} — {probLabel(v, scale)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Konsekvens (1–{scale})</label>
              <select className="rips-input rips-select" value={c} onChange={e => setC(Number(e.target.value))}>
                {ticks.map(v => <option key={v} value={v}>{v} — {consLabel(v, scale)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Beregnet alvor</label>
              <div style={{ paddingTop:8 }}><SevPill sev={previewSev} /></div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Beskrivelse</label>
            <textarea className="rips-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kontekst, årsak og mulige konsekvenser…" rows={3} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" className="rips-btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="rips-btn">Legg til risiko</button>
          </div>
        </form>
      </div>
    </div>
  );
}
