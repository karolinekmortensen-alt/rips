import { useState } from 'react';
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
  onLogout: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Eier', admin: 'Admin', editor: 'Redaktør', viewer: 'Leser',
};

export function Sidebar({ view, setView, collections, displayName, orgs, activeOrgId, onSwitchOrg, onLogout }: Props) {
  const [orgOpen, setOrgOpen] = useState(false);

  const activeOrg  = orgs.find(o => o.id === activeOrgId);
  const isCollectionActive = view === 'collection' || view === 'collections';

  const navItems = [
    { id:'dashboard',   label:'Oversikt',   icon:'grid'   },
    { id:'collections', label:'Samlinger',  icon:'folder', count: collections.length },
    { id:'team',        label:'Team',       icon:'users'  },
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
          onClick={() => setOrgOpen(o => !o)}
          title={orgs.length > 1 ? 'Bytt workspace' : activeOrg?.name}
        >
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left' }}>
            {activeOrg?.name ?? '…'}
          </span>
          {orgs.length > 1 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink:0, transform: orgOpen ? 'rotate(180deg)' : 'none', transition:'transform 150ms' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          )}
        </button>
        {orgOpen && orgs.length > 1 && (
          <div className="rips-org-dropdown" onClick={() => setOrgOpen(false)}>
            {orgs.map(o => (
              <div
                key={o.id}
                className={`rips-org-option ${o.id === activeOrgId ? 'active' : ''}`}
                onClick={() => onSwitchOrg(o.id)}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight: o.id === activeOrgId ? 500 : 400, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:1 }}>{ROLE_LABEL[o.role] ?? o.role}</div>
                </div>
                {o.id === activeOrgId && <Icon name="check" size={13} color="var(--leaf)" />}
              </div>
            ))}
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
