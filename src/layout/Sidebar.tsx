import { Icon } from '../components/Icon';
import { RipsLogo } from '../components/RipsLogo';
import { getUserName } from '../supabase';
import type { Collection } from '../types';

interface Props {
  view: string;
  setView: (v: string) => void;
  collections: Collection[];
  user: any;
  onLogout: () => void;
}

export function Sidebar({ view, setView, collections, user, onLogout }: Props) {
  const navItems = [
    { id:'dashboard',   label:'Oversikt',   icon:'grid'   },
    { id:'collections', label:'Samlinger',  icon:'folder', count: collections.length },
    { id:'profile',     label:'Profil',     icon:'user'   },
  ];
  const isCollectionActive = view === 'collection' || view === 'collections';

  return (
    <aside className="rips-sidebar">
      <div className="rips-brand">
        <RipsLogo size={30} bg="var(--paper-2)" />
        <span className="rips-org">{getUserName(user)}</span>
      </div>
      <div className="rips-sec">Workspace</div>
      {navItems.map(item => (
        <div
          key={item.id}
          className={`rips-item ${(view === item.id || (item.id === 'collections' && isCollectionActive)) ? 'sel' : ''}`}
          onClick={() => setView(item.id)}
        >
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
          {item.count != null && <span className="rips-count">{item.count}</span>}
        </div>
      ))}
      <div style={{ flex:1 }}></div>
      <div className="rips-item" style={{ color:'var(--ink-2)', marginTop:'auto' }} onClick={onLogout}>
        <Icon name="logout" size={16} />
        <span>Logg ut</span>
      </div>
    </aside>
  );
}
