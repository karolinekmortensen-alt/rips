import { useState } from 'react';
import { db } from '../supabase';
import { Icon } from '../components/Icon';
import { RipsLogo } from '../components/RipsLogo';

interface Props {
  onBack: () => void;
}

export function LoginPage({ onBack }: Props) {
  const [mode,     setMode]     = useState<'login' | 'signup'>('login');
  const [email,    setEmail]    = useState('');
  const [name,     setName]     = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await db.auth.signUp({
          email, password,
          options: { data: { full_name: name.trim() || email.split('@')[0] } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo('Sjekk e-posten din og klikk bekreftelseslenken, så kan du logge inn.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="rips-btn-ghost" style={{ position:'absolute', top:24, left:24, display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={onBack}>
        <Icon name="back" size={14} /> Tilbake
      </button>
      <div className="login-card">
        <div style={{ textAlign:'center', marginBottom:28 }}><RipsLogo size={38} bg="var(--paper)" /></div>
        <h2 style={{ fontSize:22, fontWeight:500, letterSpacing:'-0.005em', margin:'0 0 6px', textAlign:'center' }}>
          {mode === 'login' ? 'Logg inn' : 'Opprett konto'}
        </h2>
        <p style={{ fontSize:13, color:'var(--ink-2)', margin:'0 0 24px', textAlign:'center' }}>
          {mode === 'login' ? 'Logg inn med e-post og passord.' : 'Opprett en ny Rips-konto.'}
        </p>
        {error && <div className="login-error" style={{ marginBottom:12 }}>{error}</div>}
        {info  && <div style={{ background:'var(--leaf-wash,#e4ede4)', color:'var(--leaf)', border:'1px solid var(--leaf)', borderRadius:4, padding:'10px 14px', fontSize:13, marginBottom:12 }}>{info}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Navn</label>
              <input className="rips-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Fornavn Etternavn" autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-post</label>
            <input className="rips-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="deg@bedrift.no" autoFocus={mode === 'login'} required />
          </div>
          <div className="form-group">
            <label className="form-label">Passord</label>
            <input className="rips-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required minLength={6} />
          </div>
          <button className="rips-btn" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', height:40, fontSize:14, marginTop:8, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Venter…' : mode === 'login' ? 'Logg inn' : 'Opprett konto'}
          </button>
        </form>
        <p style={{ fontSize:13, color:'var(--ink-2)', marginTop:20, textAlign:'center' }}>
          {mode === 'login'
            ? <span>Ny bruker? <button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--currant)', padding:0, height:'auto' }} onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Opprett konto</button></span>
            : <span>Har konto? <button className="rips-btn-ghost" style={{ fontSize:13, color:'var(--currant)', padding:0, height:'auto' }} onClick={() => { setMode('login'); setError(''); setInfo(''); }}>Logg inn</button></span>
          }
        </p>
      </div>
    </div>
  );
}
