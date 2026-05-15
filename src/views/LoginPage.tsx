import { useState } from 'react';
import { db } from '../supabase';
import { Icon } from '../components/Icon';
import { RipsLogo } from '../components/RipsLogo';

type Mode = 'login' | 'signup' | 'forgot' | 'new-password';

interface Props {
  onBack: () => void;
  initialMode?: Mode;
}

export function LoginPage({ onBack, initialMode = 'login' }: Props) {
  const [mode,      setMode]      = useState<Mode>(initialMode);
  const [email,     setEmail]     = useState('');
  const [name,      setName]      = useState('');
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [info,      setInfo]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const reset = (m: Mode) => { setMode(m); setError(''); setInfo(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;

      } else if (mode === 'signup') {
        const { data, error } = await db.auth.signUp({
          email, password,
          options: { data: { full_name: name.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        if (data.user && !data.session)
          setInfo('Sjekk e-posten din og klikk bekreftelseslenken, så kan du logge inn.');

      } else if (mode === 'forgot') {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setInfo('Vi har sendt en lenke til ' + email + '. Sjekk innboksen (og søppelpost).');

      } else if (mode === 'new-password') {
        if (password !== password2) { setError('Passordene er ikke like.'); setLoading(false); return; }
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        setInfo('Passordet er oppdatert. Du er nå logget inn.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: 'Logg inn',
    signup: 'Opprett konto',
    forgot: 'Glemt passord',
    'new-password': 'Velg nytt passord',
  };
  const subtitles: Record<Mode, string> = {
    login: 'Logg inn med e-post og passord.',
    signup: 'Opprett en ny Rips-konto.',
    forgot: 'Vi sender deg en lenke for å tilbakestille passordet.',
    'new-password': 'Skriv inn et nytt passord for kontoen din.',
  };

  return (
    <div className="login-page">
      <button className="rips-btn-ghost" style={{ position:'absolute', top:24, left:24, display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={onBack}>
        <Icon name="back" size={14} /> Tilbake
      </button>
      <div className="login-card">
        <div style={{ textAlign:'center', marginBottom:28 }}><RipsLogo size={38} bg="var(--paper)" /></div>
        <h2 style={{ fontSize:22, fontWeight:500, letterSpacing:'-0.005em', margin:'0 0 6px', textAlign:'center' }}>
          {titles[mode]}
        </h2>
        <p style={{ fontSize:13, color:'var(--ink-2)', margin:'0 0 24px', textAlign:'center' }}>
          {subtitles[mode]}
        </p>

        {error && <div className="login-error" style={{ marginBottom:12 }}>{error}</div>}
        {info  && <div style={{ background:'#e4ede4', color:'var(--leaf)', border:'1px solid var(--leaf)', borderRadius:4, padding:'10px 14px', fontSize:13, marginBottom:12 }}>{info}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Navn</label>
              <input className="rips-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Fornavn Etternavn" autoFocus />
            </div>
          )}
          {mode !== 'new-password' && (
            <div className="form-group">
              <label className="form-label">E-post</label>
              <input className="rips-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="deg@bedrift.no" autoFocus={mode === 'login' || mode === 'forgot'} required />
            </div>
          )}
          {(mode === 'login' || mode === 'signup' || mode === 'new-password') && (
            <div className="form-group">
              <label className="form-label">{mode === 'new-password' ? 'Nytt passord' : 'Passord'}</label>
              <input className="rips-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required minLength={6} autoFocus={mode === 'new-password'} />
            </div>
          )}
          {mode === 'new-password' && (
            <div className="form-group">
              <label className="form-label">Gjenta passord</label>
              <input className="rips-input" type="password" value={password2} onChange={e => { setPassword2(e.target.value); setError(''); }} placeholder="••••••••" required minLength={6} />
            </div>
          )}

          <button className="rips-btn" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', height:40, fontSize:14, marginTop:8, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Venter…' : mode === 'login' ? 'Logg inn' : mode === 'signup' ? 'Opprett konto' : mode === 'forgot' ? 'Send tilbakestillingslenke' : 'Oppdater passord'}
          </button>
        </form>

        <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:20, textAlign:'center', display:'flex', flexDirection:'column', gap:6 }}>
          {mode === 'login' && (
            <>
              <span>
                <button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--ink-2)', padding:0, height:'auto' }} onClick={() => reset('forgot')}>
                  Glemt passord?
                </button>
              </span>
              <span>Ny bruker? <button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--currant)', padding:0, height:'auto' }} onClick={() => reset('signup')}>Opprett konto</button></span>
            </>
          )}
          {mode === 'signup' && (
            <span>Har konto? <button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--currant)', padding:0, height:'auto' }} onClick={() => reset('login')}>Logg inn</button></span>
          )}
          {(mode === 'forgot' || mode === 'new-password') && (
            <span><button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--ink-2)', padding:0, height:'auto' }} onClick={() => reset('login')}>← Tilbake til innlogging</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
