import { Fragment } from 'react';
import { Icon } from '../components/Icon';
import { getUserName } from '../supabase';

interface Props {
  crumbs: string[];
  user: any;
}

export function TopBar({ crumbs, user }: Props) {
  const initials = (name: string) => (name || 'B').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <header className="rips-topbar">
      <nav className="rips-crumbs">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="rips-sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'rips-current' : ''}>{c}</span>
          </Fragment>
        ))}
      </nav>
      <div className="rips-search">
        <Icon name="search" size={14} />
        <input placeholder="Søk risiko, samling, eier…" readOnly />
        <kbd>⌘K</kbd>
      </div>
      <div className="rips-topright">
        <button className="rips-btn-ghost" style={{ padding:6, borderRadius:6, height:32, width:32, justifyContent:'center' }}>
          <Icon name="bell" size={16} />
        </button>
        <div className="rips-avatar">{initials(getUserName(user))}</div>
      </div>
    </header>
  );
}
