import { useState, useEffect, useRef } from 'react';
import { db, getUserName } from './supabase';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { DashboardView } from './views/DashboardView';
import { CollectionsView } from './views/CollectionsView';
import { CollectionView } from './views/CollectionView';
import { ProfileView } from './views/ProfileView';
import { TeamView } from './views/TeamView';
import { AddCollectionModal } from './modals/AddCollectionModal';
import { RipsLogo } from './components/RipsLogo';
import { INITIAL_TAGS } from './constants';
import {
  loadMyOrgs, createPersonalOrg, loadWorkspace,
  dbInsertCollection, dbUpdateCollection, dbDeleteCollection,
  dbInsertRisk, dbDeleteRisk, dbSyncRisk,
  dbEnsureTag, dbDeleteTag,
  dbAcceptInvitations,
} from './lib/data';
import type { OrgInfo } from './lib/data';
import type { Collection, Risk, Profile } from './types';

interface Props {
  user: any;
  onLogout: () => void;
}

export function AppShell({ user, onLogout }: Props) {
  const [view,          setViewRaw]      = useState('dashboard');
  const [collections,   setCollections]  = useState<Collection[]>([]);
  const [selectedId,    setSelectedId]   = useState<string | null>(null);
  const [showAddCol,    setShowAddCol]   = useState(false);
  const [availableTags, setAvailableTags]= useState<string[]>(INITIAL_TAGS);
  const [loading,       setLoading]      = useState(true);
  const [profiles,      setProfiles]     = useState<Profile[]>([]);
  const [displayName,   setDisplayName]  = useState(getUserName(user));
  const [orgs,          setOrgs]         = useState<OrgInfo[]>([]);
  const [activeOrgId,   setActiveOrgId]  = useState('');

  const orgId   = useRef('');
  const tagRows = useRef<{ id: string; name: string }[]>([]);
  const idMap   = useRef(new Map<string, string>());

  const applyWorkspace = async (id: string) => {
    orgId.current = id;
    const ws = await loadWorkspace(id);
    tagRows.current = ws.tagRows;
    setCollections(ws.collections);
    setAvailableTags(ws.tagRows.length ? ws.tagRows.map(t => t.name) : INITIAL_TAGS);
    idMap.current = new Map();
  };

  useEffect(() => {
    const init = async () => {
      await dbAcceptInvitations().catch(() => {});
      const name = getUserName(user);

      let myOrgs = await loadMyOrgs(user.id);

      // Always ensure a personal org exists — separate from any team memberships
      const hasPersonal = myOrgs.some(o => o.isPersonal);
      if (!hasPersonal) {
        await createPersonalOrg(name);
        myOrgs = await loadMyOrgs(user.id);
      }

      // Personal org first, then teams alphabetically
      myOrgs.sort((a, b) => {
        if (a.isPersonal !== b.isPersonal) return a.isPersonal ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setOrgs(myOrgs);

      const savedId = localStorage.getItem(`rips-active-org-${user.id}`);
      const active  = myOrgs.find(o => o.id === savedId)
                   ?? myOrgs.find(o => o.isPersonal)
                   ?? myOrgs[0];
      setActiveOrgId(active.id);
      await applyWorkspace(active.id);
      setLoading(false);
    };
    init().catch(err => { console.error('Init error:', err); setLoading(false); });

    loadProfiles();
  }, []);

  const loadProfiles = () => {
    db.from('profiles').select('*').then(({ data }: any) => { if (data) setProfiles(data); });
  };

  const switchOrg = async (id: string) => {
    if (id === orgId.current) return;
    const target = orgs.find(o => o.id === id);
    setActiveOrgId(id);
    setView(target?.isPersonal && view === 'team' ? 'dashboard' : 'dashboard');
    setCollections([]);
    localStorage.setItem(`rips-active-org-${user.id}`, id);
    await applyWorkspace(id);
  };

  const myRole  = orgs.find(o => o.id === activeOrgId)?.role ?? 'viewer';
  const canEdit = myRole !== 'viewer';

  const setView = (v: string) => {
    setViewRaw(v);
    if (v !== 'collection') setSelectedId(null);
  };

  const selectedCollection = collections.find(c => c.id === selectedId);

  const crumbs =
    view === 'dashboard'   ? ['Workspace', 'Oversikt'] :
    view === 'collections' ? ['Workspace', 'Samlinger'] :
    view === 'team'        ? ['Workspace', 'Team'] :
    view === 'profile'     ? ['Konto', 'Brukerprofil'] :
    ['Workspace', 'Samlinger', selectedCollection?.name || '…'];

  // ── Collections ─────────────────────────────────────────────

  const addCollection = async (input: Omit<Collection, 'id' | 'risks'>) => {
    const id = await dbInsertCollection(orgId.current, input).catch(console.error);
    if (!id) return;
    setCollections(prev => [...prev, { ...input, id, risks: [] }]);
  };

  const updateCollection = (updated: Collection) => {
    setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
    dbUpdateCollection(updated.id, updated).catch(console.error);
  };

  const deleteCollection = async (id: string) => {
    await dbDeleteCollection(id).catch(console.error);
    setCollections(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setView('collections');
  };

  // ── Risks ────────────────────────────────────────────────────

  const addRisk = async (risk: Risk) => {
    const id = await dbInsertRisk(
      selectedId!, orgId.current,
      { title: risk.title, description: risk.description, owner: risk.owner, tags: risk.tags || [], p: risk.p, c: risk.c },
      tagRows.current,
    ).catch(console.error);
    if (!id) return;
    setCollections(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, risks: [...c.risks, { ...risk, id, mitigations: [], comments: [], log: [] }] }
        : c
    ));
  };

  const updateRisk = (updated: Risk) => {
    const col = collections.find(c => c.id === selectedId);
    const oldRisk = col?.risks.find(r => r.id === updated.id);
    if (!oldRisk) return;
    setCollections(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, risks: c.risks.map(r => r.id === updated.id ? updated : r) }
        : c
    ));
    dbSyncRisk(oldRisk, updated, orgId.current, user.id, getUserName(user), tagRows.current, idMap.current)
      .catch(console.error);
  };

  const deleteRisk = async (riskId: string) => {
    await dbDeleteRisk(riskId).catch(console.error);
    setCollections(prev => prev.map(c =>
      c.id === selectedId
        ? { ...c, risks: c.risks.filter(r => r.id !== riskId) }
        : c
    ));
  };

  // ── Tags ─────────────────────────────────────────────────────

  const createTag = async (name: string) => {
    const id = await dbEnsureTag(orgId.current, name, tagRows.current).catch(console.error);
    if (!id) return;
    tagRows.current = [...tagRows.current, { id, name }];
    setAvailableTags(prev => prev.includes(name) ? prev : [...prev, name]);
  };

  const deleteTag = async (name: string) => {
    await dbDeleteTag(orgId.current, name).catch(console.error);
    tagRows.current = tagRows.current.filter(t => t.name !== name);
    setAvailableTags(prev => prev.filter(t => t !== name));
  };

  // ── Render ───────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--paper)', flexDirection:'column', gap:16 }}>
      <RipsLogo size={42} bg="var(--paper)" />
      <div style={{ fontSize:13, color:'var(--ink-3)' }}>Laster workspace…</div>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        collections={collections}
        user={user}
        displayName={displayName}
        orgs={orgs}
        activeOrgId={activeOrgId}
        onSwitchOrg={switchOrg}
        onLogout={onLogout}
      />
      <main className="app-main">
        <TopBar crumbs={crumbs} user={user} />

        {view === 'dashboard' && (
          <DashboardView
            collections={collections}
            setView={setViewRaw}
            setSelectedCollectionId={setSelectedId}
            onAddCollection={() => setShowAddCol(true)}
          />
        )}
        {view === 'collections' && (
          <CollectionsView
            collections={collections}
            onSelect={id => { setSelectedId(id); setViewRaw('collection'); }}
            onAdd={() => setShowAddCol(true)}
            onDelete={deleteCollection}
            canEdit={canEdit}
          />
        )}
        {view === 'collection' && selectedCollection && (
          <CollectionView
            collection={selectedCollection}
            onBack={() => setView('collections')}
            onAddRisk={addRisk}
            onUpdateRisk={updateRisk}
            onDeleteRisk={deleteRisk}
            onUpdateCollection={updateCollection}
            availableTags={availableTags}
            onCreateTag={createTag}
            onDeleteTag={deleteTag}
            user={user}
            profiles={profiles}
            canEdit={canEdit}
          />
        )}
        {view === 'team' && (
          <TeamView orgId={activeOrgId} myUserId={user.id} myRole={myRole} />
        )}
        {view === 'profile' && (
          <ProfileView
            user={user}
            collections={collections}
            onUserUpdated={newName => setDisplayName(newName)}
          />
        )}
      </main>

      {showAddCol && (
        <AddCollectionModal
          onClose={() => setShowAddCol(false)}
          onAdd={col => { addCollection(col); setShowAddCol(false); }}
          profiles={profiles}
        />
      )}
    </div>
  );
}
