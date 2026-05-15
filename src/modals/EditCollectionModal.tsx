import { useState } from 'react';
import { Icon } from '../components/Icon';
import { OwnerSelect } from '../components/OwnerSelect';
import type { Collection, Profile } from '../types';

interface Props {
  collection: Collection;
  onClose: () => void;
  onSave: (col: Collection) => void;
  profiles?: Profile[];
}

export function EditCollectionModal({ collection, onClose, onSave, profiles = [] }: Props) {
  const [name,   setName]   = useState(collection.name);
  const [desc,   setDesc]   = useState(collection.description || '');
  const [owner,  setOwner]  = useState(collection.owner);
  const [period, setPeriod] = useState(collection.period || '');
  const [scale,  setScale]  = useState(collection.scale || 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !owner.trim()) return;
    const newScale = Number(scale);
    const risks = collection.risks.map(r => ({
      ...r,
      p: Math.min(r.p, newScale),
      c: Math.min(r.c, newScale),
    }));
    onSave({ ...collection, name: name.trim(), description: desc.trim(), owner: owner.trim(), period: period.trim(), scale: newScale, risks });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ margin:0, fontWeight:500, fontSize:17 }}>Rediger samling</h3>
          <button className="rips-btn-ghost" style={{ padding:6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Navn *</label>
            <input className="rips-input" value={name} onChange={e => setName(e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Beskrivelse</label>
            <textarea className="rips-input" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
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
              {Number(scale) < (collection.scale || 5) && (
                <span style={{ fontSize:11, color:'var(--amber)', marginTop:3 }}>
                  Reduksjon vil kappe risikoverdier til nytt maksimum.
                </span>
              )}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" className="rips-btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="rips-btn">Lagre endringer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
