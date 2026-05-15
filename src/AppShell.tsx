import { useState, useEffect } from 'react';
import { db } from './supabase';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { DashboardView } from './views/DashboardView';
import { CollectionsView } from './views/CollectionsView';
import { CollectionView } from './views/CollectionView';
import { ProfileView } from './views/ProfileView';
import { AddCollectionModal } from './modals/AddCollectionModal';
import { INITIAL_TAGS, INITIAL_COLLECTIONS } from './constants';
import type { Collection, Profile } from './types';

interface Props {
  user: any;
  onLogout: () => void;
}

export function AppShell({ user, onLogout }: Props) {
  const [view,          setViewRaw]      = useState('dashboard');
  const [collections,   setCollections]  = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [selectedId,    setSelectedId]   = useState<string | null>(null);
  const [showAddCol,    setShowAddCol]   = useState(false);
  const [availableTags, setAvailableTags]= useState<string[]>(INITIAL_TAGS);
  const [dbReady,       setDbReady]      = useState(false);
  const [profiles,      setProfiles]     = useState<Profile[]>([]);

  useEffect(() => {
    db.from('workspaces').select('*').eq('id', user.id).single().then(({ data, error }: any) => {
      if (error && error.code !== 'PGRST116') console.error('Rips load error:', error);
      if (data) {
        if (Array.isArray(data.collections)) setCollections(data.collections);
        if (Array.isArray(data.tags) && data.tags.length) setAvailableTags(data.tags);
      }
      setDbReady(true);
    });
    db.from('profiles').select('*').then(({ data }: any) => { if (data) setProfiles(data); });
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    const t = setTimeout(() => {
      db.from('workspaces')
        .upsert({ id: user.id, collections, tags: availableTags, updated_at: new Date().toISOString() })
        .then(({ error }: any) => { if (error) console.error('Rips save error:', error); });
    }, 800);
    return () => clearTimeout(t);
  }, [collections, availableTags, dbReady]);

  const createTag = (name: string) => setAvailableTags(prev => prev.includes(name) ? prev : [...prev, name]);
  const deleteTag = (name: string) => setAvailableTags(prev => prev.filter(t => t !== name));

  const setView = (v: string) => {
    setViewRaw(v);
    if (v !== 'collection') setSelectedId(null);
  };

  const selectedCollection = collections.find(c => c.id === selectedId);

  const crumbs =
    view === 'dashboard'   ? ['Workspace', 'Oversikt'] :
    view === 'collections' ? ['Workspace', 'Samlinger'] :
    view === 'profile'     ? ['Konto', 'Brukerprofil'] :
    ['Workspace', 'Samlinger', selectedCollection?.name || '…'];

  const addCollection    = (col: Collection) => setCollections(prev => [...prev, col]);
  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setView('collections');
  };
  const addRisk    = (risk: any) => setCollections(prev => prev.map(c => c.id === selectedId ? { ...c, risks: [...c.risks, risk] } : c));
  const updateRisk = (updated: any) => setCollections(prev => prev.map(c => c.id === selectedId ? { ...c, risks: c.risks.map(r => r.id === updated.id ? updated : r) } : c));
  const deleteRisk = (riskId: string) => setCollections(prev => prev.map(c => c.id === selectedId ? { ...c, risks: c.risks.filter(r => r.id !== riskId) } : c));
  const updateCollection = (updated: Collection) => setCollections(prev => prev.map(col => col.id === updated.id ? updated : col));

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} collections={collections} user={user} onLogout={onLogout} />
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
          />
        )}
        {view === 'profile' && (
          <ProfileView user={user} collections={collections} />
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
