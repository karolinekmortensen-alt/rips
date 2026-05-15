import { SEV_PILL, SEV_DOT, SEV_LABEL } from '../constants';
import type { Severity } from '../types';

export function SevPill({ sev }: { sev: Severity }) {
  const c = SEV_PILL[sev] || SEV_PILL.low;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'2px 9px', borderRadius:999, fontSize:12, fontWeight:500, background:c.bg, color:c.fg, whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:SEV_DOT[sev], display:'inline-block', flexShrink:0 }}></span>
      {SEV_LABEL[sev]}
    </span>
  );
}
