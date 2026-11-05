import { useState } from 'react';
import { EVENTS, FORMATIONS } from '../constants';
import { onPitch } from '../lib/match';
import { Tag, Team } from '../types';
import PitchSvg, { px, py } from './PitchSvg';

export type Stage = 'idle' | 'shot' | 'start' | 'end' | 'outcome';

interface PitchPanelProps {
  team: Team;
  attacksRight: boolean;
  stage: Stage;
  pending: Partial<Tag> | null;
  selectedPlayer: number | null;
  recentTags: Tag[];
  onPlayerClick: (id: number) => void;
  /** Coordinates already normalised to the team's attacking direction. */
  onPitchClick: (x: number, y: number) => void;
}

export default function PitchPanel({
  team,
  attacksRight,
  stage,
  pending,
  selectedPlayer,
  recentTags,
  onPlayerClick,
  onPitchClick,
}: PitchPanelProps) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const positions = FORMATIONS[team.formation] || FORMATIONS['442'];
  const players = onPitch(team);
  // Display <-> normalised coordinates (rotate 180° when the team attacks left).
  const d = (x: number, y: number) => (attacksRight ? { x, y } : { x: 100 - x, y: 100 - y });

  const picking = stage === 'start' || stage === 'end';
  const showPlayers = stage === 'idle' || stage === 'outcome' || stage === 'shot';

  const rel = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const start = pending?.x !== undefined && pending?.y !== undefined ? d(pending.x, pending.y) : null;
  const end = pending?.endX !== undefined && pending?.endY !== undefined ? d(pending.endX, pending.endY) : null;
  const color = pending?.event ? EVENTS[pending.event].color : '#fff';

  const prompt =
    stage === 'start'
      ? pending?.event && EVENTS[pending.event].hasEnd
        ? 'Click where the pass starts'
        : 'Click where it happened'
      : stage === 'end'
        ? 'Click where the ball ended up'
        : null;

  return (
    <div
      className={`relative rounded overflow-hidden select-none ${picking ? 'cursor-crosshair' : ''}`}
      style={{ aspectRatio: '105 / 68' }}
      onMouseMove={e => picking && setHover(rel(e))}
      onMouseLeave={() => setHover(null)}
      onClick={e => {
        if (!picking) return;
        const p = rel(e);
        const n = d(p.x, p.y);
        onPitchClick(n.x, n.y);
      }}
    >
      <PitchSvg variant="tagging" className="absolute inset-0 w-full h-full" arrowColors={{ pending: color }}>
        {/* faint trail of recent actions for this team */}
        {recentTags.map(t => {
          const a = d(t.x, t.y);
          const b = t.endX !== undefined && t.endY !== undefined ? d(t.endX, t.endY) : null;
          return (
            <g key={t.id} opacity={0.35}>
              {b && (
                <line
                  x1={px(a.x)}
                  y1={py(a.y)}
                  x2={px(b.x)}
                  y2={py(b.y)}
                  stroke={EVENTS[t.event].color}
                  strokeWidth={0.4}
                  strokeDasharray={t.outcome === 'fail' ? '1 0.8' : undefined}
                />
              )}
              <circle cx={px(a.x)} cy={py(a.y)} r={0.9} fill={EVENTS[t.event].color} />
            </g>
          );
        })}
        {start && (
          <circle cx={px(start.x)} cy={py(start.y)} r={1.2} fill={color} stroke="#fff" strokeWidth={0.3} />
        )}
        {start && (end || (stage === 'end' && hover)) && (
          <line
            x1={px(start.x)}
            y1={py(start.y)}
            x2={px((end || hover)!.x)}
            y2={py((end || hover)!.y)}
            stroke={color}
            strokeWidth={0.6}
            markerEnd="url(#arrow-pending)"
          />
        )}
        <g>
          <polygon
            points={attacksRight ? '96,64 100,66 96,68' : '9,64 5,66 9,68'}
            transform="translate(0,-1)"
            fill="rgba(255,255,255,0.6)"
          />
        </g>
      </PitchSvg>

      {showPlayers &&
        players.map(p => {
          const pos = positions[p.slot ?? 0];
          const dp = d(pos.x, pos.y);
          const isSel = selectedPlayer === p.id;
          const isReceiverPick = stage === 'outcome' && pending?.event && EVENTS[pending.event].hasEnd;
          const isPasser = pending?.playerId === p.id;
          return (
            <button
              key={p.id}
              title={p.name}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-transform ${
                isSel || isPasser
                  ? 'bg-yellow-400 border-yellow-200 text-gray-900 scale-110 z-10'
                  : isReceiverPick
                    ? 'text-white border-white hover:scale-110 animate-pulse'
                    : 'text-white border-white/70 hover:scale-110'
              }`}
              style={{
                left: `${dp.x}%`,
                top: `${dp.y}%`,
                width: 34,
                height: 34,
                background: isSel || isPasser ? undefined : team.color,
              }}
              onClick={e => {
                e.stopPropagation();
                onPlayerClick(p.id);
              }}
            >
              {p.number}
            </button>
          );
        })}

      {prompt && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-semibold bg-gray-900/80 px-3 py-1 rounded pointer-events-none">
          {prompt} · Esc to cancel
        </div>
      )}
    </div>
  );
}
