import { useState } from 'react';
import PitchSvg, { px, py } from '../components/PitchSvg';
import { Tag, Team } from '../types';
import { passNetwork } from '../lib/stats';
import { shortName } from '../lib/match';

export default function PassNetwork({ team, tags }: { team: Team; tags: Tag[] }) {
  const [minPasses, setMinPasses] = useState(3);
  const { nodes, edges } = passNetwork(tags);
  const byId = new Map(nodes.map(n => [n.playerId, n]));
  const shown = edges.filter(e => e.count >= minPasses);
  const maxCount = Math.max(1, ...edges.map(e => e.count));
  const maxTouch = Math.max(1, ...nodes.map(n => n.touches));
  const player = (id: number) => team.players.find(p => p.id === id);
  const arrowId = `net-${team.color.replace('#', '')}`;

  // Share of actions per third, as on the Wyscout pitch header.
  const thirds = [0, 0, 0];
  tags.forEach(t => thirds[Math.min(2, Math.floor(t.x / (100 / 3)))]++);
  const tot = thirds.reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <div className="flex items-center gap-3 text-xs text-slate-600 mb-2 print:hidden">
        Show combinations with at least
        <input
          type="range"
          min={1}
          max={Math.max(3, maxCount)}
          value={minPasses}
          onChange={e => setMinPasses(parseInt(e.target.value, 10))}
        />
        <span className="font-semibold w-16">{minPasses} pass{minPasses > 1 ? 'es' : ''}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2">
        Dots sit at each player's average action position; dot size = touches. Lines show completed passes between
        players ({minPasses}+ in one direction); thicker = more passes.
      </div>
      <PitchSvg thirds arrowColors={{ [arrowId]: '#1f2937', white: '#ffffff' }} className="w-full">
        {thirds.map((n, i) => (
          <text key={i} x={(105 / 6) * (2 * i + 1)} y={4} textAnchor="middle" fontSize={2.6} fill="white" fontWeight={600}>
            {Math.round((n / tot) * 100)}%
          </text>
        ))}
        {shown.map(e => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const x1 = px(a.x);
          const y1 = py(a.y);
          const x2 = px(b.x);
          const y2 = py(b.y);
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          // offset each direction to its own side so A->B and B->A don't overlap
          const ox = (-(y2 - y1) / len) * 0.7;
          const oy = ((x2 - x1) / len) * 0.7;
          const rA = 1.6 + (a.touches / maxTouch) * 2.2;
          const rB = 1.6 + (b.touches / maxTouch) * 2.2;
          const sx = x1 + ((x2 - x1) / len) * rA + ox;
          const sy = y1 + ((y2 - y1) / len) * rA + oy;
          const ex = x2 - ((x2 - x1) / len) * (rB + 0.6) + ox;
          const ey = y2 - ((y2 - y1) / len) * (rB + 0.6) + oy;
          const w = 0.2 + (e.count / maxCount) * 0.9;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="#1f2937"
              strokeOpacity={0.3 + (e.count / maxCount) * 0.55}
              strokeWidth={w}
              markerEnd={`url(#arrow-${arrowId})`}
            >
              <title>
                {player(e.from)?.number} → {player(e.to)?.number}: {e.count} passes
              </title>
            </line>
          );
        })}
        {nodes.map(n => {
          const r = 1.6 + (n.touches / maxTouch) * 2.2;
          const p = player(n.playerId);
          return (
            <g key={n.playerId}>
              <circle cx={px(n.x)} cy={py(n.y)} r={r} fill="white" stroke={team.color} strokeWidth={0.5} />
              <text x={px(n.x)} y={py(n.y) + 0.9} textAnchor="middle" fontSize={2.4} fontWeight={700} fill="#111827">
                {p?.number ?? n.playerId}
              </text>
              <title>
                {p?.name} · {n.touches} touches
              </title>
            </g>
          );
        })}
        <path d="M 4 63 L 14 63" stroke="white" strokeWidth={0.8} markerEnd="url(#arrow-white)" opacity={0.8} />
      </PitchSvg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
        {nodes
          .sort((a, b) => b.touches - a.touches)
          .map(n => (
            <span key={n.playerId}>
              <b>{player(n.playerId)?.number}</b> {shortName(player(n.playerId)?.name || '')}
            </span>
          ))}
      </div>
    </div>
  );
}
