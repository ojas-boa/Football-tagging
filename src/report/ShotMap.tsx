import { ReactNode } from 'react';
import PitchSvg, { px, py } from '../components/PitchSvg';
import { ShotResult, Tag, Team } from '../types';
import { onTarget, shotDistance, shotXG } from '../lib/stats';
import { formatClock, playerLabel } from '../lib/match';

const RESULT_COLOR: Record<ShotResult, string> = {
  Goal: '#16a34a',
  Saved: '#2563eb',
  'Off Target': '#f8fafc',
  Blocked: '#94a3b8',
  Post: '#f59e0b',
};

function Marker({ result, x, y, r, label }: { result?: ShotResult; x: number; y: number; r: number; label: ReactNode }) {
  const fill = RESULT_COLOR[result ?? 'Off Target'];
  const common = { fill, stroke: '#111827', strokeWidth: 0.25 };
  let shape: ReactNode;
  if (result === 'Goal') {
    shape = <polygon points={`${x},${y - r * 1.3} ${x + r * 1.3},${y} ${x},${y + r * 1.3} ${x - r * 1.3},${y}`} {...common} />;
  } else if (result === 'Blocked') {
    shape = <rect x={x - r} y={y - r} width={r * 2} height={r * 2} {...common} />;
  } else if (result === 'Post') {
    shape = <polygon points={`${x},${y - r * 1.2} ${x + r * 1.1},${y + r * 0.8} ${x - r * 1.1},${y + r * 0.8}`} {...common} />;
  } else {
    shape = <circle cx={x} cy={y} r={r} {...common} strokeDasharray={result === 'Off Target' ? '0.6 0.4' : undefined} />;
  }
  return (
    <g>
      {shape}
      <text x={x} y={y + 0.55} textAnchor="middle" fontSize={1.5} fontWeight={700} fill={result === 'Off Target' || result === 'Blocked' ? '#111827' : 'white'}>
        {label}
      </text>
    </g>
  );
}

const LegendShape = ({ result }: { result: ShotResult }) => (
  <svg width={14} height={14} viewBox="-2 -2 4 4">
    <Marker result={result} x={0} y={0} r={1.4} label="" />
  </svg>
);

export default function ShotMap({ team, tags }: { team: Team; tags: Tag[] }) {
  const shots = tags.filter(t => t.event === 'SHOT');
  if (shots.length === 0) return <div className="text-sm text-slate-400">No shots tagged.</div>;
  const count = (r: ShotResult) => shots.filter(s => s.shotResult === r).length;
  const xg = shots.reduce((s, t) => s + shotXG(t), 0);
  const summary: [string, number | string, ShotResult | null][] = [
    ['Total', shots.length, null],
    ['On target', shots.filter(onTarget).length, 'Saved'],
    ['Off target', count('Off Target'), 'Off Target'],
    ['Blocked', count('Blocked'), 'Blocked'],
    ['Post', count('Post'), 'Post'],
    ['Goals', count('Goal'), 'Goal'],
    ['xG (est.)', xg.toFixed(2), null],
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-4 text-center">
        {summary.map(([label, value, r]) => (
          <div key={label}>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              {r && <LegendShape result={r} />}
              {label}
            </div>
            <div className="text-xl font-light text-slate-800">{value}</div>
            {typeof value === 'number' && label !== 'Total' && (
              <div className="text-[10px] text-slate-400">{Math.round((value / shots.length) * 100)}%</div>
            )}
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-[2fr_3fr] gap-5 print:grid-cols-[2fr_3fr]">
        <div>
          <PitchSvg view="attack" className="w-full">
            {shots.map((s, i) => {
              const r = 0.9 + shotXG(s) * 2.2;
              return (
                <g key={s.id}>
                  <line x1={px(s.x)} y1={py(s.y)} x2={105} y2={34} stroke="white" strokeOpacity={0.25} strokeWidth={0.2} />
                  <Marker result={s.shotResult} x={px(s.x)} y={py(s.y)} r={r} label={i + 1} />
                  <title>
                    {playerLabel(team, s.playerId)} · {s.shotResult} · xG {shotXG(s).toFixed(2)}
                  </title>
                </g>
              );
            })}
          </PitchSvg>
          <div className="text-[11px] text-slate-400 mt-1">Marker size = estimated xG (simple distance and angle model).</div>
        </div>
        <table className="w-full text-xs self-start">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="text-left font-normal py-1">#</th>
              <th className="text-left font-normal">Player</th>
              <th className="text-left font-normal">Time</th>
              <th className="text-left font-normal">Shot type</th>
              <th className="text-left font-normal">Result</th>
              <th className="text-right font-normal">Dist.</th>
              <th className="text-right font-normal">xG</th>
            </tr>
          </thead>
          <tbody>
            {shots.map((s, i) => (
              <tr key={s.id} className={`border-b border-slate-100 ${s.shotResult === 'Goal' ? 'font-semibold' : ''}`}>
                <td className="py-1">{i + 1}</td>
                <td>{playerLabel(team, s.playerId)}</td>
                <td>
                  {s.half}H {formatClock(s.t)}
                </td>
                <td>
                  {s.bodyPart}
                  {s.subtags.filter(x => ['Penalty', 'Free_Kick', 'Corner', 'Counter'].includes(x)).map(x => `, ${x.replace('_', ' ').toLowerCase()}`)}
                </td>
                <td>{s.shotResult}</td>
                <td className="text-right">{shotDistance(s).toFixed(0)}m</td>
                <td className="text-right">{shotXG(s).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="text-right py-1 text-slate-500">
                Total xG:
              </td>
              <td className="text-right font-semibold">{xg.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
