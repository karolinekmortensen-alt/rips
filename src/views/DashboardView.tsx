import { Icon } from '../components/Icon';
import { SevPill } from '../components/SevPill';
import { getSev } from '../constants';
import type { Collection } from '../types';

interface Props {
  collections: Collection[];
  setView: (v: string) => void;
  setSelectedCollectionId: (id: string) => void;
  onAddCollection: () => void;
}

export function DashboardView({ collections, setView, setSelectedCollectionId, onAddCollection }: Props) {
  const totalRisks = collections.reduce((s,c) => s + c.risks.length, 0);
  const highOrCrit = collections.reduce((s,col) => s + col.risks.filter(r => ['high','critical'].includes(getSev(r.p,r.c,col.scale||5))).length, 0);
  const critCount  = collections.reduce((s,col) => s + col.risks.filter(r => getSev(r.p,r.c,col.scale||5) === 'critical').length, 0);
  const openMits   = collections.reduce((s,c) => s + c.risks.reduce((s2,r) => s2 + r.mitigations.filter(m => !m.done).length, 0), 0);

  const kpis = [
    { cap:'Risikosamlinger',    num: collections.length, sub:'totalt i workspace' },
    { cap:'Registrerte risikoer', num: totalRisks,       sub:'på tvers av samlinger' },
    { cap:'Høy eller kritisk',  num: highOrCrit,         sub:`${critCount} kritiske` },
    { cap:'Åpne tiltak',        num: openMits,           sub:'ikke fullført' },
  ];

  return (
    <div className="app-page">
      <header className="page-head">
        <div className="page-title-block">
          <div className="rips-cap">Dashboard · {new Date().getFullYear()}</div>
          <h1 className="page-title">Oversikt, <em>som det står nå</em></h1>
        </div>
        <button className="rips-btn" onClick={onAddCollection}>
          <Icon name="plus" size={14} /> Ny samling
        </button>
      </header>

      <section className="rips-kpis" style={{ marginBottom:28 }}>
        {kpis.map((k,i) => (
          <div key={i} className="rips-kpi">
            <div className="rips-cap">{k.cap}</div>
            <div className="rips-num">{k.num}</div>
            <div className="rips-sub-text">{k.sub}</div>
          </div>
        ))}
      </section>

      <div className="rips-cap" style={{ marginBottom:10 }}>Samlinger</div>
      <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:6, overflow:'hidden' }}>
        {collections.length === 0 ? (
          <div style={{ padding:'40px 24px', textAlign:'center', color:'var(--ink-3)', fontStyle:'italic' }}>
            Ingen risikosamlinger ennå. Gå til Samlinger og opprett den første.
          </div>
        ) : collections.map((col, idx) => {
          const sevs = col.risks.map(r => getSev(r.p,r.c,col.scale||5));
          const worstSev = (['critical','high','medium','low'] as const).find(s => sevs.includes(s));
          const openM = col.risks.reduce((s,r) => s + r.mitigations.filter(m => !m.done).length, 0);
          return (
            <div
              key={col.id}
              style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom: idx < collections.length - 1 ? '1px solid var(--rule)' : 'none', cursor:'pointer', transition:'background 80ms' }}
              onMouseEnter={e => (e.currentTarget.style.background='var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background='')}
              onClick={() => { setSelectedCollectionId(col.id); setView('collection'); }}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:14 }}>{col.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2 }}>{col.owner} · {col.period} · {col.risks.length} risikoer</div>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                {worstSev && <SevPill sev={worstSev} />}
                {openM > 0 && <span style={{ fontSize:12, color:'var(--amber)', fontFamily:'var(--font-mono)' }}>{openM} åpne tiltak</span>}
                <Icon name="forward" size={14} color="var(--ink-3)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
