import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { loadMembers, loadInvitations, dbInviteMember, dbRemoveMember, dbChangeRole, dbRemoveInvitation } from '../lib/data';
import type { Member, Invitation } from '../lib/data';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Eier', admin: 'Admin', editor: 'Redaktør', viewer: 'Leser',
};
const ROLE_COLOR: Record<string, string> = {
  owner: 'var(--currant)', admin: 'var(--amber)', editor: 'var(--leaf)', viewer: 'var(--ink-3)',
};

function initials(name: string) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface Props {
  orgId: string;
  myUserId: string;
  myRole: string;
}

export function TeamView({ orgId, myUserId, myRole }: Props) {
  const [members,     setMembers]     = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('editor');
  const [inviteMsg,   setInviteMsg]   = useState('');
  const [inviting,    setInviting]    = useState(false);

  const canManage = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    Promise.all([loadMembers(orgId), loadInvitations(orgId)]).then(([m, i]) => {
      setMembers(m);
      setInvitations(i);
      setLoading(false);
    });
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg('');
    try {
      const result = await dbInviteMember(orgId, inviteEmail.trim(), inviteRole, myUserId);
      if (result === 'already_member') {
        setInviteMsg('Denne brukeren er allerede medlem.');
      } else if (result === 'added') {
        setInviteMsg('✓ Bruker lagt til.');
        const updated = await loadMembers(orgId);
        setMembers(updated);
        setInviteEmail('');
      } else {
        setInviteMsg('✓ Invitasjon sendt. Brukeren legges til automatisk når de registrerer seg.');
        const updated = await loadInvitations(orgId);
        setInvitations(updated);
        setInviteEmail('');
      }
    } catch (err) {
      setInviteMsg('Noe gikk galt. Prøv igjen.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (m: Member) => {
    if (m.role === 'owner') return;
    if (!confirm(`Fjern ${m.name} fra workspace?`)) return;
    await dbRemoveMember(m.membershipId);
    setMembers(prev => prev.filter(x => x.membershipId !== m.membershipId));
  };

  const handleChangeRole = async (m: Member, newRole: string) => {
    await dbChangeRole(m.membershipId, newRole);
    setMembers(prev => prev.map(x => x.membershipId === m.membershipId ? { ...x, role: newRole } : x));
  };

  const handleRemoveInvite = async (inv: Invitation) => {
    await dbRemoveInvitation(inv.id);
    setInvitations(prev => prev.filter(i => i.id !== inv.id));
  };

  if (loading) return <div className="app-page"><div style={{ color:'var(--ink-3)', padding:40 }}>Laster…</div></div>;

  return (
    <div className="app-page">
      <header className="page-head">
        <div className="page-title-block">
          <div className="rips-cap">Workspace</div>
          <h1 className="page-title">Team</h1>
        </div>
      </header>

      {/* Member list */}
      <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', marginBottom:24 }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--rule)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="rips-cap">Medlemmer ({members.length})</div>
        </div>
        {members.map(m => (
          <div key={m.membershipId} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--rule)' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--leaf)', color:'var(--leaf-skin)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, flexShrink:0 }}>
              {initials(m.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:500, fontSize:14 }}>
                {m.name}
                {m.userId === myUserId && <span style={{ fontSize:11, color:'var(--ink-3)', marginLeft:6 }}>(deg)</span>}
              </div>
              <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:1 }}>{m.email}</div>
            </div>
            {canManage && m.role !== 'owner' && m.userId !== myUserId ? (
              <select
                className="rips-input rips-select"
                value={m.role}
                onChange={e => handleChangeRole(m, e.target.value)}
                style={{ width:120, fontSize:12, height:30, padding:'0 8px' }}
              >
                <option value="admin">Admin</option>
                <option value="editor">Redaktør</option>
                <option value="viewer">Leser</option>
              </select>
            ) : (
              <span style={{ fontSize:12, fontWeight:500, color: ROLE_COLOR[m.role], background:'var(--paper-2)', borderRadius:4, padding:'2px 8px' }}>
                {ROLE_LABEL[m.role]}
              </span>
            )}
            {canManage && m.role !== 'owner' && m.userId !== myUserId && (
              <button className="rips-btn-ghost" style={{ padding:'4px 6px', color:'var(--ink-3)' }} onClick={() => handleRemoveMember(m)} title="Fjern fra workspace">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, overflow:'hidden', marginBottom:24 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--rule)' }}>
            <div className="rips-cap">Ventende invitasjoner</div>
          </div>
          {invitations.map(inv => (
            <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--rule)' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--paper-2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="user" size={16} color="var(--ink-3)" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14 }}>{inv.email}</div>
                <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:1 }}>Ikke registrert ennå</div>
              </div>
              <span style={{ fontSize:12, fontWeight:500, color: ROLE_COLOR[inv.role], background:'var(--paper-2)', borderRadius:4, padding:'2px 8px' }}>
                {ROLE_LABEL[inv.role]}
              </span>
              {canManage && (
                <button className="rips-btn-ghost" style={{ padding:'4px 6px', color:'var(--ink-3)' }} onClick={() => handleRemoveInvite(inv)} title="Avbryt invitasjon">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {canManage && (
        <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, padding:'20px 24px' }}>
          <div className="rips-cap" style={{ marginBottom:14 }}>Inviter ny bruker</div>
          <form onSubmit={handleInvite} style={{ display:'flex', gap:10, alignItems:'flex-start', flexWrap:'wrap' }}>
            <input
              className="rips-input"
              type="email"
              placeholder="navn@bedrift.no"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteMsg(''); }}
              required
              style={{ flex:1, minWidth:200 }}
            />
            <select
              className="rips-input rips-select"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ width:130 }}
            >
              <option value="admin">Admin</option>
              <option value="editor">Redaktør</option>
              <option value="viewer">Leser</option>
            </select>
            <button className="rips-btn" type="submit" disabled={inviting}>
              {inviting ? 'Sender…' : 'Inviter'}
            </button>
          </form>
          {inviteMsg && (
            <div style={{ marginTop:10, fontSize:13, color: inviteMsg.startsWith('✓') ? 'var(--leaf)' : 'var(--currant)' }}>
              {inviteMsg}
            </div>
          )}
          <div style={{ marginTop:12, fontSize:12, color:'var(--ink-3)' }}>
            Roller: <b>Admin</b> kan invitere/fjerne brukere · <b>Redaktør</b> kan opprette og redigere · <b>Leser</b> kan kun se
          </div>
        </div>
      )}
    </div>
  );
}
