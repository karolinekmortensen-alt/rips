import { useState, useEffect } from 'react';
import { db, isPasswordRecovery } from './supabase';
import { AppShell } from './AppShell';
import { WelcomePage } from './views/WelcomePage';
import { LoginPage } from './views/LoginPage';
import { RipsLogo } from './components/RipsLogo';

type Screen = 'loading' | 'welcome' | 'login' | 'app' | 'reset-password';

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [user,   setUser]   = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = db.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
        setUser(session?.user ?? null);
        setScreen('reset-password');
      } else if (event === 'INITIAL_SESSION') {
        // Recovery flow: PASSWORD_RECOVERY will override this immediately after.
        // Skip navigating to 'app' if we know we're in a recovery flow.
        if (isPasswordRecovery) return;
        if (session) { setUser(session.user); setScreen('app'); }
        else           setScreen('welcome');
      } else if (event === 'SIGNED_IN') {
        if (!isPasswordRecovery) { setUser(session?.user); setScreen('app'); }
      } else if (event === 'USER_UPDATED') {
        if (session) { setUser(session.user); setScreen('app'); }
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setScreen('welcome');
      }
      // USER_UPDATED: stay on current screen
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
