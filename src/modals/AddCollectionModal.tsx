import { useState } from 'react';
import { Icon } from '../components/Icon';
import { OwnerSelect } from '../components/OwnerSelect';
import type { Collection, Profile } from '../types';

interface Props {
  onClose: () => void;
  onAdd: (col: Omit<Collection, 'id' | 'risks'>) => void;
  profiles?: Profile[];
}

export function AddCollectionModal({ onClose, onAdd, profiles = [] }: Props) {
  const [name,   setName]   = useState('');
  const [desc,   setDesc]   = useState('');
  const [owner,  setOwner]  = useState('');
  const [period, setPeriod] = useState('');
  const [scale,  setScale]  = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !owner.trim()) return;
    onAdd({ name: name.trim(), description: desc.trim(), owner: owner.trim(), period: period.trim(), scale: Number(scale) });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ margin:0, fontWeight:500, fontSize:17 }}>Ny risikosamling</h3>
          <button className="rips-btn-ghost" style={{ padding:6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Navn *</label>
            <input className="rips-input" value={name} onChange={e => setName(e.target.value)} placeholder="IT-sikkerhet 2026" autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Beskrivelse</label>
            <textarea className="rips-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kort beskrivelse av hva samlingen dekker…" rows={3} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Eier *</label>
              <OwnerSelect value={owner} onChange={setOwner} profiles={profiles} />
            </div>
            <div className="form-group">
              <label className="form-label">Periode</label>
              <input className="rips-input" value={period} onChange={e => setPeriod(e.target.value)} placeholder="Q3 2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Skala (1–n)</label>
              <select className="rips-input rips-select" value={scale} onChange={e => setScale(Number(e.target.value))}>
                {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}×{n}</option>)}
              </select>
              <span style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>Standard er 5×5</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" className="rips-btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="rips-btn">Opprett samling</button>
          </div>
        </form>
      </div>
    </div>
  );
}
