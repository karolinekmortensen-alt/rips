import { useState, useRef } from 'react';
import { Icon } from '../components/Icon';
import { RipsLogo } from '../components/RipsLogo';
import type { Collection } from '../types';
import type { OrgInfo } from '../lib/data';

interface Props {
  view: string;
  setView: (v: string) => void;
  collections: Collection[];
  user: any;
  displayName: string;
  orgs: OrgInfo[];
  activeOrgId: string;
  onSwitchOrg: (id: string) => void;
  onCreateOrg: (name: string) => Promise<void>;
  onLogout: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Eier', admin: 'Admin', editor: 'Redaktør', viewer: 'Leser',
};

export function Sidebar({ view, setView, collections, displayName, orgs, activeOrgId, onSwitchOrg, onCreateOrg, onLogout }: Props) {
  const [orgOpen,     setOrgOpen]     = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgName,  setNewOrgName]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeOrg  = orgs.find(o => o.id === activeOrgId);
  const isCollectionActive = view === 'collection' || view === 'collections';

  const navItems = [
    { id:'dashboard',   label:'Oversikt',   icon:'grid'   },
    { id:'collections', label:'Samlinger',  icon:'folder', count: collections.length },
    ...(!activeOrg?.isPersonal ? [{ id:'team', label:'Team', icon:'users' }] : []),
  ];

  return (
    <aside className="rips-sidebar">
      <div className="rips-brand">
        <RipsLogo size={30} bg="var(--paper-2)" />
        <span className="rips-org">{displayName}</span>
      </div>

      {/* Org switcher */}
      <div style={{ position:'relative', margin:'0 0 4px' }}>
        <button
          className="rips-org-btn"
          onClick={() => { setOrgOpen(o => !o); setCreatingOrg(false); setNewOrgName(''); }}
          title="Administrer workspaces"
        >
          <Icon name={activeOrg?.isPersonal ? 'user' : 'users'} size={13} color="var(--ink-3)" />
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left' }}>
            {activeOrg?.name ?? '…'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink:0, transform: orgOpen ? 'rotate(180deg)' : 'none', transition:'transform 150ms' }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        {orgOpen && (
          <div className="rips-org-dropdown">
            {orgs.map(o => (
              <div
                key={o.id}
                className={`rips-org-option ${o.id === activeOrgId ? 'active' : ''}`}
                onClick={() => { onSwitchOrg(o.id); setOrgOpen(false); setCreatingOrg(false); }}
              >
                <Icon name={o.isPersonal ? 'user' : 'users'} size={13} color="var(--ink-3)" />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight: o.id === activeOrgId ? 500 : 400, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:1 }}>
                    {o.isPersonal ? 'Personlig' : ROLE_LABEL[o.role] ?? o.role}
                  </div>
                </div>
                {o.id === activeOrgId && <Icon name="check" size={13} color="var(--leaf)" />}
              </div>
            ))}
            <div style={{ borderTop:'1px solid var(--rule)', marginTop:4, paddingTop:4 }}>
              {creatingOrg ? (
                <form
                  style={{ display:'flex', gap:4, padding:'4px 8px' }}
                  onSubmit={async e => {
                    e.preventDefault();
                    const name = newOrgName.trim();
                    if (!name) return;
                    setSaving(true);
                    try {
                      await onCreateOrg(name);
                      setOrgOpen(false);
                      setCreatingOrg(false);
                      setNewOrgName('');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <input
                    ref={inputRef}
                    className="rips-input"
                    style={{ flex:1, fontSize:12, height:26, padding:'0 6px' }}
                    placeholder="Navn på team…"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    disabled={saving}
                    autoFocus
                  />
                  <button className="rips-btn" style={{ fontSize:11, padding:'0 8px', height:26 }} disabled={saving || !newOrgName.trim()}>
                    {saving ? '…' : 'Opprett'}
                  </button>
                  <button type="button" className="rips-btn-ghost" style={{ padding:'0 5px', height:26, color:'var(--ink-3)' }}
                    onClick={() => { setCreatingOrg(false); setNewOrgName(''); }}>
                    <Icon name="x" size={12} />
                  </button>
                </form>
              ) : (
                <div
                  className="rips-org-option"
                  style={{ color:'var(--ink-2)' }}
                  onClick={e => { e.stopPropagation(); setCreatingOrg(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                >
                  <Icon name="plus" size={13} color="var(--ink-3)" />
                  <span style={{ fontSize:12 }}>Nytt team-workspace</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rips-sec">Workspace</div>
      {navItems.map(item => (
        <div
          key={item.id}
          className={`rips-item ${(view === item.id || (item.id === 'collections' && isCollectionActive)) ? 'sel' : ''}`}
          onClick={() => { setView(item.id); setOrgOpen(false); }}
        >
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
          {item.count != null && <span className="rips-count">{item.count}</span>}
        </div>
      ))}

      <div className="rips-sec" style={{ marginTop:8 }}>Konto</div>
      <div
        className={`rips-item ${view === 'profile' ? 'sel' : ''}`}
        onClick={() => { setView('profile'); setOrgOpen(false); }}
      >
        <Icon name="user" size={16} />
        <span>Profil</span>
      </div>

      <div style={{ flex:1 }}></div>
      <div className="rips-item" style={{ color:'var(--ink-2)', marginTop:'auto' }} onClick={onLogout}>
        <Icon name="logout" size={16} />
        <span>Logg ut</span>
      </div>
    </aside>
  );
}
