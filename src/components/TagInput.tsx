import { useState, useRef } from 'react';
import { Icon } from './Icon';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  available: string[];
  onCreateTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export function TagInput({ selected, onChange, available, onCreateTag, onDeleteTag }: Props) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered  = available.filter(t => t.toLowerCase().includes(query.toLowerCase()) && !selected.includes(t));
  const canCreate = query.trim() && !available.some(t => t.toLowerCase() === query.trim().toLowerCase());

  const addTag = (tag: string) => {
    if (!selected.includes(tag)) onChange([...selected, tag]);
    setQuery('');
    inputRef.current?.focus();
  };
  const removeTag = (tag: string) => onChange(selected.filter(t => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canCreate) {
      e.preventDefault();
      const t = query.trim();
      onCreateTag(t);
      addTag(t);
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="tag-input-wrap">
      <div className="tag-input-field" onClick={() => { setOpen(true); inputRef.current?.focus(); }}>
        {selected.map(tag => (
          <span key={tag} className="tag-pill-sel">
            {tag}
            <button type="button" onMouseDown={e => { e.stopPropagation(); removeTag(tag); }} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, display:'inline-flex', lineHeight:1 }}>
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Velg eller opprett…' : ''}
          style={{ border:'none', outline:'none', background:'transparent', fontSize:13, minWidth:80, flex:1, padding:0 }}
        />
      </div>
      {open && (filtered.length > 0 || canCreate) && (
        <div className="tag-dropdown">
          {filtered.map(tag => (
            <div key={tag} className="tag-option" onMouseDown={() => addTag(tag)}>
              <span>{tag}</span>
              <button type="button" className="tag-option-del" onMouseDown={e => { e.stopPropagation(); onDeleteTag(tag); }} title="Slett tag">
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}
          {canCreate && (
            <div className="tag-option tag-option-new" onMouseDown={() => { const t = query.trim(); onCreateTag(t); addTag(t); }}>
              + Opprett «{query.trim()}»
            </div>
          )}
        </div>
      )}
    </div>
  );
}
