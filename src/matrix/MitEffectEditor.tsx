import { getSev } from '../constants';
import { SevPill } from '../components/SevPill';

interface Props {
  deltaP: number;
  deltaC: number;
  onChangeP: (v: number) => void;
  onChangeC: (v: number) => void;
  riskP: number;
  riskC: number;
  scale: number;
}

export function MitEffectEditor({ deltaP, deltaC, onChangeP, onChangeC, riskP, riskC, scale }: Props) {
  const clamp = (v: number, d: number) => Math.max(-(scale - 1), Math.min(scale - 1, v + d));
  const projP = Math.max(1, Math.min(scale, riskP + deltaP));
  const projC = Math.max(1, Math.min(scale, riskC + deltaC));
  const hasEffect = deltaP !== 0 || deltaC !== 0;

  const Stepper = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:0, border:'1px solid var(--rule)', borderRadius:5, overflow:'hidden', width:'fit-content' }}>
        <button
          type="button"
          onClick={() => onChange(clamp(value, -1))}
          style={{ width:28, height:30, background:'var(--paper)', border:'none', cursor:'pointer', fontSize:16, color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', borderRight:'1px solid var(--rule)' }}
        >−</button>
        <span style={{ width:36, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, color: value < 0 ? 'var(--leaf)' : value > 0 ? 'var(--currant)' : 'var(--ink-3)' }}>
          {value > 0 ? `+${value}` : value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value, +1))}
          style={{ width:28, height:30, background:'var(--paper)', border:'none', cursor:'pointer', fontSize:16, color:'var(--ink-2)', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px solid var(--rule)' }}
        >+</button>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop:10, padding:'10px 12px', background:'var(--paper-2, #F0EBE2)', borderRadius:6, border:'1px solid var(--rule)' }}>
      <div style={{ fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
        Forventet effekt på risikoen
      </div>
      <div style={{ display:'flex', gap:20, alignItems:'flex-end', flexWrap:'wrap' }}>
        <Stepper label="Sannsynlighet" value={deltaP} onChange={onChangeP} />
        <Stepper label="Konsekvens"    value={deltaC} onChange={onChangeC} />
        {hasEffect && (
          <div style={{ fontSize:12, color:'var(--ink-2)', paddingBottom:4, display:'flex', alignItems:'center', gap:6 }}>
            <span>→</span>
            <span>S: <b>{riskP}</b> → <b style={{ color: projP < riskP ? 'var(--leaf)' : projP > riskP ? 'var(--currant)' : 'inherit' }}>{projP}</b></span>
            <span style={{ color:'var(--ink-3)' }}>·</span>
            <span>K: <b>{riskC}</b> → <b style={{ color: projC < riskC ? 'var(--leaf)' : projC > riskC ? 'var(--currant)' : 'inherit' }}>{projC}</b></span>
            <span style={{ color:'var(--ink-3)' }}>·</span>
            <SevPill sev={getSev(projP, projC, scale)} />
          </div>
        )}
      </div>
    </div>
  );
}
