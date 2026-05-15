import { useState, useEffect } from 'react';
import { db } from './supabase';
import { AppShell } from './AppShell';
import { WelcomePage } from './views/WelcomePage';
import { LoginPage } from './views/LoginPage';
import { RipsLogo } from './components/RipsLogo';

type Screen = 'loading' | 'welcome' | 'login' | 'app';

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user,   setUser]   = useState<any>(null);

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }: any) => {
      if (session) { setUser(session.user); setScreen('app'); }
      else           setScreen('welcome');
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) { setUser(session.user); setScreen('app'); }
      else          { setUser(null); setScreen('welcome'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await db.auth.signOut(); };

  if (screen === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--paper)', flexDirection:'column', gap:16 }}>
      <RipsLogo size={42} bg="var(--paper)" />
      <div style={{ fontSize:13, color:'var(--ink-3)' }}>Laster…</div>
    </div>
  );
  if (screen === 'welcome') return <WelcomePage onLogin={() => setScreen('login')} />;
  if (screen === 'login')   return <LoginPage onBack={() => setScreen('welcome')} />;
  return <AppShell user={user} onLogout={handleLogout} />;
}
