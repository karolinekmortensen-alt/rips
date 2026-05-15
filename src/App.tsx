import { useState, useEffect } from 'react';
import { db } from './supabase';
import { AppShell } from './AppShell';
import { WelcomePage } from './views/WelcomePage';
import { LoginPage } from './views/LoginPage';
import { RipsLogo } from './components/RipsLogo';

type Screen = 'loading' | 'welcome' | 'login' | 'app' | 'reset-password';

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user,   setUser]   = useState<any>(null);

  useEffect(() => {
    // If the URL contains a recovery token, let onAuthStateChange handle it
    // (PASSWORD_RECOVERY fires before SIGNED_IN). Skip getSession() to avoid
    // a race where we navigate to 'app' before the recovery event arrives.
    const isRecovery = window.location.hash.includes('type=recovery') ||
                       window.location.search.includes('type=recovery');

    if (!isRecovery) {
      db.auth.getSession().then(({ data: { session } }: any) => {
        if (session) { setUser(session.user); setScreen('app'); }
        else           setScreen('welcome');
      });
    }

    const { data: { subscription } } = db.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null);
        setScreen('reset-password');
      } else if (session) {
        setUser(session.user);
        setScreen('app');
      } else {
        setUser(null);
        setScreen('welcome');
      }
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
  if (screen === 'welcome')        return <WelcomePage onLogin={() => setScreen('login')} />;
  if (screen === 'login')          return <LoginPage onBack={() => setScreen('welcome')} />;
  if (screen === 'reset-password') return <LoginPage onBack={() => setScreen('welcome')} initialMode="new-password" />;
  return <AppShell user={user} onLogout={handleLogout} />;
}
