export function RipsLogo({ size = 32, bg = 'var(--paper-2)' }: { size?: number; bg?: string }) {
  const berrySize = Math.round(size * 0.22);
  const maskW    = Math.round(size * 0.28);
  const maskH    = Math.round(size * 0.26);
  const topOff   = Math.round(size * 0.09);
  return (
    <span style={{ fontFamily:'var(--font-display)', fontSize:size, lineHeight:1, color:'var(--ink)', letterSpacing:'-0.02em', position:'relative', whiteSpace:'nowrap', userSelect:'none' }}>
      r
      <span style={{ position:'relative', display:'inline-block' }}>
        i
        <span style={{ position:'absolute', top:1, left:'50%', transform:'translateX(-50%)', width:maskW, height:maskH, background:bg }}></span>
        <span style={{ position:'absolute', top:topOff, left:'50%', transform:'translateX(-50%)', width:berrySize, height:berrySize, borderRadius:'50%', background:'var(--currant)', boxShadow:'inset 1px 1px 0 0 var(--currant-skin)' }}></span>
      </span>
      ps
    </span>
  );
}
