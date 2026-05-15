import { useRef } from 'react';
import { Icon } from './Icon';
import { formatTs } from '../constants';
import type { Comment } from '../types';

interface Props {
  comments: Comment[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  inputValue: string;
  onInputChange: (val: string) => void;
}

export function CommentThread({ comments = [], onAdd, onDelete, inputValue, onInputChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="comment-thread">
      {comments.map(c => (
        <div key={c.id} className="comment-item">
          <div className="comment-meta">
            <b>{c.user}</b>
            <span className="mono">{formatTs(c.ts)}</span>
            <button className="rips-btn-ghost" style={{ padding:'1px 3px', height:'auto', color:'var(--ink-3)', marginLeft:'auto' }} onClick={() => onDelete(c.id)}>
              <Icon name="x" size={11} />
            </button>
          </div>
          <div className="comment-text">{c.text}</div>
        </div>
      ))}
      <div className="comment-add">
        <textarea
          ref={ref}
          className="rips-input"
          placeholder="Skriv en kommentar… (Enter for å sende)"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(); ref.current?.focus(); } }}
          rows={2}
        />
        <button className="rips-btn rips-small" onClick={() => { onAdd(); ref.current?.focus(); }} style={{ alignSelf:'flex-end' }}>Legg til</button>
      </div>
    </div>
  );
}
