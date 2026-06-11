export function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const p: any = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color || 'currentColor',
    strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'block', flexShrink: 0 },
  };
  switch (name) {
    case 'grid':    return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    case 'folder':  return <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
    case 'plus':    return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x':       return <svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'back':    return <svg {...p}><path d="m15 18-6-6 6-6"/></svg>;
    case 'forward': return <svg {...p}><path d="m9 18 6-6-6-6"/></svg>;
    case 'search':  return <svg {...p}><path d="M21 21l-4.3-4.3"/><circle cx="11" cy="11" r="7"/></svg>;
    case 'bell':    return <svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
    case 'check':   return <svg {...p} strokeWidth={2.5}><path d="M5 12l5 5L20 7"/></svg>;
    case 'logout':  return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>;
    case 'trash':   return <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
    case 'edit':    return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>;
    case 'user':    return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'users':   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'move':    return <svg {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/></svg>;
    case 'printer': return <svg {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
    default:        return null;
  }
}
