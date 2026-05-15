import { getUserName } from '../supabase';
import type { Collection } from '../types';

interface Props {
  user: any;
  collections: Collection[];
}

export function ProfileView({ user, collections }: Props) {
  const totalRisks = collections.reduce((s, c) => s + c.risks.length, 0);
  const totalMits  = collections.reduce((s, c) => s + c.risks.reduce((s2, r) => s2 + r.mitigations.length, 0), 0);
  const displayName = getUserName(user);
  const initials    = (n: string) => (n || 'B').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="app-page">
      <header className="page-head">
        <div className="page-title-block">
          <div className="rips-cap">Konto</div>
          <h1 className="page-title">Brukerprofil</h1>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' }}>
        <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, padding:28, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--leaf)', color:'var(--leaf-skin)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:600, letterSpacing:'-0.01em' }}>
            {initials(displayName)}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:500, fontSize:17 }}>{displayName}</div>
            <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:4 }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, padding:'20px 24px' }}>
            <div className="rips-cap" style={{ marginBottom:16 }}>Aktivitet i workspace</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              {[
                { cap:'Samlinger', val: collections.length },
                { cap:'Risikoer', val: totalRisks },
                { cap:'Tiltak', val: totalMits },
              ].map(k => (
                <div key={k.cap}>
                  <div style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500 }}>{k.cap}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:36, lineHeight:1.1, letterSpacing:'-0.015em', marginTop:4 }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:8, padding:'20px 24px' }}>
            <div className="rips-cap" style={{ marginBottom:12 }}>Eksport</div>
            <p style={{ fontSize:13, color:'var(--ink-2)', margin:'0 0 16px' }}>
              Last ned en sikkerhetskopi av alle samlinger og risikoer som JSON.
            </p>
            <button
              className="rips-btn-secondary"
              onClick={() => {
                const json = JSON.stringify({ collections, exportedAt: new Date().toISOString() }, null, 2);
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([json], { type:'application/json' }));
                a.download = `rips-backup-${new Date().toISOString().slice(0,10)}.json`;
                a.click();
              }}
            >
              Eksporter JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
