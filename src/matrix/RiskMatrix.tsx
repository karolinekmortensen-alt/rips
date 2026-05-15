import { useState } from 'react';
import { ZONE_BG, SEV_DOT, SEV_LABEL, getSev, probLabel, consLabel } from '../constants';
import type { Risk } from '../types';

export function getMitEffectTrajectory(risk: Risk, scale: number) {
  const pending = risk.mitigations.filter(m => !m.done && (m.deltaP || m.deltaC));
  if (pending.length === 0) return null;
  const dP = pending.reduce((s, m) => s + (m.deltaP || 0), 0);
  const dC = pending.reduce((s, m) => s + (m.deltaC || 0), 0);
  const projP = Math.max(1, Math.min(scale, risk.p + dP));
  const projC = Math.max(1, Math.min(scale, risk.c + dC));
  if (projP === risk.p && projC === risk.c) return null;
  return [{ p: risk.p, c: risk.c }, { p: projP, c: projC }];
}

export function getRiskTrajectory(risk: Risk) {
  const entries = (risk.log || [])
    .filter(e => e.prevP !== undefined)
    .sort((a, b) => a.ts - b.ts);
  if (entries.length === 0) return null;
  const points = [{ p: entries[0].prevP!, c: entries[0].prevC! }];
  for (const e of entries) points.push({ p: e.newP!, c: e.newC! });
  return points;
}

interface Props {
  risks: Risk[];
  onRiskClick: (id: string) => void;
  scale?: number;
  trajectories?: Record<string, { p: number; c: number }[]> | null;
  mitTrajectories?: Record<string, { p: number; c: number }[]> | null;
}

export function RiskMatrix({ risks, onRiskClick, scale = 5, trajectories = null, mitTrajectories = null }: Props) {
  const [hovered, setHovered] = useState<Risk | null>(null);
  const n = scale;

  const ML = 66, MR = 16, MT = 16, MB = 54;
  const GRID_W = 400, GRID_H = 290;
  const CW = GRID_W / n;
  const CH = GRID_H / n;
  const W  = ML + GRID_W + MR;
  const H  = MT + GRID_H + MB;
  const dotR = Math.max(10, Math.min(13, CW * 0.25));
  const lblSize = Math.max(8, Math.min(11, 11 * 5 / n));

  const cx = (p: number) => ML + (p - 1) * CW + CW / 2;
  const cy = (c: number) => MT + (n - c) * CH + CH / 2;

  const ticks = Array.from({ length: n }, (_, i) => i + 1);

  const riskIndex = Object.fromEntries(risks.map((r, i) => [r.id, i + 1]));

  function groupOffsets(count: number) {
    if (count === 1) return [{ dx: 0, dy: 0 }];
    const cols = count <= 2 ? 2 : count <= 4 ? 2 : count <= 6 ? 3 : Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const pad  = dotR + 3;
    const sx = Math.min((CW - 2 * pad) / Math.max(cols - 1, 1), dotR * 2.6);
    const sy = Math.min((CH - 2 * pad) / Math.max(rows - 1, 1), dotR * 2.6);
    return Array.from({ length: count }, (_, i) => {
      const col      = i % cols;
      const row      = Math.floor(i / cols);
      const rowCount = Math.min(cols, count - row * cols);
      return { dx: (col - (rowCount - 1) / 2) * sx, dy: (row - (rows - 1) / 2) * sy };
    });
  }

  const groups: Record<string, Risk[]> = {};
  risks.forEach(r => {
    const key = `${r.p},${r.c}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block', maxWidth: W }}>
      {ticks.flatMap(c =>
        ticks.map(p => (
          <rect
            key={`bg-${p}-${c}`}
            x={ML + (p-1)*CW} y={MT + (n-c)*CH}
            width={CW} height={CH}
            fill={ZONE_BG[getSev(p, c, n)]}
            stroke="rgba(255,255,255,0.7)" strokeWidth={1}
          />
        ))
      )}

      <rect x={ML} y={MT} width={GRID_W} height={GRID_H} fill="none" stroke="var(--rule-strong)" strokeWidth={1} />

      {trajectories && (
        <defs>
          <marker id="rips-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="#5C544A" />
          </marker>
        </defs>
      )}
      {trajectories && risks.map(r => {
        const traj = trajectories[r.id];
        if (!traj || traj.length < 2) return null;
        return (
          <g key={`traj-${r.id}`} pointerEvents="none">
            {traj.map((pt, i) => {
              if (i === traj.length - 1) return null;
              const x1 = cx(pt.p), y1 = cy(pt.c);
              const x2 = cx(traj[i+1].p), y2 = cy(traj[i+1].c);
              const dx = x2 - x1, dy = y2 - y1;
              const len = Math.sqrt(dx*dx + dy*dy);
              if (len < 1) return null;
              const shrink = dotR + 3;
              const ux = dx / len, uy = dy / len;
              return (
                <line key={i}
                  x1={x1 + ux * shrink} y1={y1 + uy * shrink}
                  x2={x2 - ux * (shrink + 4)} y2={y2 - uy * (shrink + 4)}
                  stroke="#5C544A" strokeWidth={1.5} strokeDasharray="5,3"
                  markerEnd="url(#rips-arrow)"
                />
              );
            })}
            {traj.slice(0, -1).map((pt, i) => (
              <circle key={`ghost-${i}`}
                cx={cx(pt.p)} cy={cy(pt.c)} r={dotR}
                fill={SEV_DOT[getSev(pt.p, pt.c, n)]} opacity={0.28}
                stroke="white" strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}

      {mitTrajectories && (
        <defs>
          <marker id="rips-mit-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="#2F5236" />
          </marker>
        </defs>
      )}
      {mitTrajectories && risks.map(r => {
        const traj = mitTrajectories[r.id];
        if (!traj || traj.length < 2) return null;
        const x1 = cx(traj[0].p), y1 = cy(traj[0].c);
        const x2 = cx(traj[1].p), y2 = cy(traj[1].c);
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) return null;
        const shrink = dotR + 3;
        const ux = dx/len, uy = dy/len;
        return (
          <g key={`mit-${r.id}`} pointerEvents="none">
            <line
              x1={x1 + ux*shrink} y1={y1 + uy*shrink}
              x2={x2 - ux*(shrink+4)} y2={y2 - uy*(shrink+4)}
              stroke="#2F5236" strokeWidth={1.5} strokeDasharray="3,3"
              markerEnd="url(#rips-mit-arrow)"
            />
            <circle cx={x2} cy={y2} r={dotR} fill={SEV_DOT[getSev(traj[1].p, traj[1].c, n)]}
              opacity={0.35} stroke="#2F5236" strokeWidth={1.5} strokeDasharray="3,2" />
          </g>
        );
      })}

      {ticks.map(p => (
        <text key={`xl-${p}`} x={cx(p)} y={H - MB + 16} textAnchor="middle" fontSize={lblSize} fill="#5C544A" fontFamily="Geist,system-ui">{p}</text>
      ))}
      {n <= 6 && ticks.map(p => (
        <text key={`xs-${p}`} x={cx(p)} y={H - MB + 30} textAnchor="middle" fontSize={Math.max(7, lblSize - 2)} fill="#8A8275" fontFamily="Geist,system-ui">
          {probLabel(p, n).split(' ')[0]}
        </text>
      ))}
      <text x={ML + GRID_W/2} y={H - 4} textAnchor="middle" fontSize={10} fill="#8A8275" fontFamily="Geist,system-ui" letterSpacing="0.06em">
        SANNSYNLIGHET
      </text>

      {ticks.map(c => (
        <text key={`yl-${c}`} x={ML - 8} y={cy(c) + 4} textAnchor="end" fontSize={lblSize} fill="#5C544A" fontFamily="Geist,system-ui">{c}</text>
      ))}
      <text transform={`translate(13,${MT + GRID_H/2}) rotate(-90)`} textAnchor="middle" fontSize={10} fill="#8A8275" fontFamily="Geist,system-ui" letterSpacing="0.06em">
        KONSEKVENS
      </text>

      {Object.entries(groups).map(([key, grp]) => {
        const [p, c] = key.split(',').map(Number);
        const offsets = groupOffsets(grp.length);
        return grp.map((r, idx) => {
          const sev   = getSev(r.p, r.c, n);
          const dotX  = cx(p) + offsets[idx].dx;
          const dotY  = cy(c) + offsets[idx].dy;
          const isHov = hovered?.id === r.id;
          const num   = riskIndex[r.id];
          const r2    = isHov ? dotR + 2 : dotR;
          const fs    = num > 9 ? Math.max(6, r2 * 0.62) : Math.max(7, r2 * 0.75);
          return (
            <g key={r.id} style={{ cursor:'pointer' }} onClick={() => onRiskClick(r.id)} onMouseEnter={() => setHovered(r)} onMouseLeave={() => setHovered(null)}>
              <circle cx={dotX} cy={dotY} r={r2} fill={SEV_DOT[sev]} stroke="white" strokeWidth={1.5} opacity={hovered && !isHov ? 0.45 : 1} style={{ transition:'r 80ms, opacity 80ms' }} />
              <text x={dotX} y={dotY + fs * 0.37} textAnchor="middle" fontSize={fs} fill="white" fontFamily="Geist,system-ui" fontWeight="600" style={{ pointerEvents:'none', userSelect:'none' }}>{num}</text>
            </g>
          );
        });
      })}

      {hovered && (() => {
        const sev = getSev(hovered.p, hovered.c, n);
        const tipW = 206, tipH = 50;
        const rawX = cx(hovered.p) - tipW / 2;
        const rawY = cy(hovered.c) > MT + GRID_H / 2 ? cy(hovered.c) - tipH - 14 : cy(hovered.c) + dotR + 6;
        const tipX = Math.max(ML, Math.min(rawX, W - MR - tipW));
        return (
          <g pointerEvents="none">
            <rect x={tipX} y={rawY} width={tipW} height={tipH} rx={4} fill="var(--ink)" />
            <text x={tipX + 12} y={rawY + 18} fontSize={12} fill="var(--paper)" fontFamily="Geist,system-ui" fontWeight="500">
              {hovered.title.length > 26 ? hovered.title.slice(0,26) + '…' : hovered.title}
            </text>
            <text x={tipX + 12} y={rawY + 35} fontSize={10.5} fill="#8A8275" fontFamily="Geist,system-ui">
              {`S:${hovered.p} · K:${hovered.c} · Score ${hovered.p * hovered.c} · ${SEV_LABEL[sev]}`}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
