import { useState } from 'react';
import PitchSvg, { px, py } from '../components/PitchSvg';
import { Tag, Team } from '../types';
import { analysePass, PassInfo, Ratio } from '../lib/stats';
import { C_FAIL, C_OK, Legend, RatioCell } from './common';
import { formatClock, playerLabel } from '../lib/match';

interface PassMapProps {
  team: Team;
  tags: Tag[];
  event: 'PASS' | 'CROSS';
}

const ratio = (list: { success: boolean }[]): Ratio => ({ total: list.length, ok: list.filter(x => x.success).length });

export default function PassMap({ team, tags, event }: PassMapProps) {
  const [player, setPlayer] = useState<number | 'all'>('all');
  const [show, setShow] = useState<'all' | 'ok' | 'fail'>('all');
  const [kind, setKind] = useState<'all' | 'forward' | 'progressive' | 'finalThird'>('all');

  const all = tags
    .filter(t => t.event === event)
    .map(analysePass)
    .filter((p): p is PassInfo => !!p);
  const players = [...new Set(all.map(p => p.tag.playerId))];

  const visible = all.filter(
    p =>
      (player === 'all' || p.tag.playerId === player) &&
      (show === 'all' || (show === 'ok' ? p.success : !p.success)) &&
      (kind === 'all' ||
        (kind === 'forward' && p.direction === 'forward') ||
        (kind === 'progressive' && p.progressive) ||
        (kind === 'finalThird' && p.toFinalThird)),
  );

  const rows = players
    .map(id => {
      const mine = all.filter(p => p.tag.playerId === id);
      return {
        id,
        all: ratio(mine),
        h1: ratio(mine.filter(p => p.tag.half === 1)),
        h2: ratio(mine.filter(p => p.tag.half === 2)),
        prog: ratio(mine.filter(p => p.progressive)),
      };
    })
    .sort((a, b) => b.all.total - a.all.total);

  const sel = 'border border-slate-300 rounded px-2 py-1 text-xs bg-white';
  const noun = event === 'PASS' ? 'passes' : 'crosses';

  if (all.length === 0) return <div className="text-sm text-slate-400">No {noun} tagged.</div>;

  return (
    <div className="grid lg:grid-cols-[3fr_2fr] gap-5 print:grid-cols-[3fr_2fr]">
      <div>
        <div className="flex flex-wrap gap-2 mb-2 print:hidden">
          <select className={sel} value={player} onChange={e => setPlayer(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}>
            <option value="all">All players</option>
            {players.map(id => (
              <option key={id} value={id}>
                {playerLabel(team, id)}
              </option>
            ))}
          </select>
          <select className={sel} value={show} onChange={e => setShow(e.target.value as typeof show)}>
            <option value="all">Completed + incomplete</option>
            <option value="ok">Completed only</option>
            <option value="fail">Incomplete only</option>
          </select>
          {event === 'PASS' && (
            <select className={sel} value={kind} onChange={e => setKind(e.target.value as typeof kind)}>
              <option value="all">All directions</option>
              <option value="forward">Forward</option>
              <option value="progressive">Progressive</option>
              <option value="finalThird">Into final third</option>
            </select>
          )}
        </div>
        <Legend
          items={[
            { label: `Completed (${visible.filter(p => p.success).length})`, swatch: <span className="w-5 h-0.5" style={{ background: C_OK }} /> },
            {
              label: `Incomplete (${visible.filter(p => !p.success).length})`,
              swatch: <span className="w-5 border-t-2 border-dashed" style={{ borderColor: C_FAIL }} />,
            },
          ]}
        />
        <PitchSvg thirds arrowColors={{ ok: C_OK, fail: C_FAIL }} className="w-full">
          {visible.map(p => (
            <g key={p.tag.id}>
              <line
                x1={px(p.tag.x)}
                y1={py(p.tag.y)}
                x2={px(p.tag.endX!)}
                y2={py(p.tag.endY!)}
                stroke={p.success ? C_OK : C_FAIL}
                strokeWidth={event === 'CROSS' ? 0.45 : 0.3}
                strokeDasharray={p.success ? undefined : '1 0.7'}
                strokeOpacity={0.85}
                markerEnd={`url(#arrow-${p.success ? 'ok' : 'fail'})`}
              >
                <title>
                  {playerLabel(team, p.tag.playerId)} {p.tag.half}H {formatClock(p.tag.t)}
                  {p.tag.receiverId !== undefined ? ` → ${playerLabel(team, p.tag.receiverId)}` : ''} · {p.length.toFixed(0)}m
                </title>
              </line>
              <circle cx={px(p.tag.x)} cy={py(p.tag.y)} r={0.5} fill={p.success ? C_OK : C_FAIL} />
            </g>
          ))}
          <text x={105 - 1} y={67} textAnchor="end" fontSize={2.2} fill="white" opacity={0.8}>
            attacking →
          </text>
        </PitchSvg>
      </div>
      <div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="text-left font-normal py-1">Player</th>
              <th className="text-right font-normal">Total/acc.</th>
              <th className="text-right font-normal">1st half</th>
              <th className="text-right font-normal">2nd half</th>
              {event === 'PASS' && <th className="text-right font-normal">Progressive</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.id}
                className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${player === r.id ? 'bg-blue-50' : ''}`}
                onClick={() => setPlayer(player === r.id ? 'all' : r.id)}
              >
                <td className="py-1">{playerLabel(team, r.id)}</td>
                <td className="text-right">
                  <RatioCell r={r.all} />
                </td>
                <td className="text-right">
                  <RatioCell r={r.h1} showPct={false} />
                </td>
                <td className="text-right">
                  <RatioCell r={r.h2} showPct={false} />
                </td>
                {event === 'PASS' && (
                  <td className="text-right">
                    <RatioCell r={r.prog} showPct={false} />
                  </td>
                )}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-1">Total</td>
              <td className="text-right">
                <RatioCell r={ratio(all)} />
              </td>
              <td className="text-right">
                <RatioCell r={ratio(all.filter(p => p.tag.half === 1))} showPct={false} />
              </td>
              <td className="text-right">
                <RatioCell r={ratio(all.filter(p => p.tag.half === 2))} showPct={false} />
              </td>
              {event === 'PASS' && (
                <td className="text-right">
                  <RatioCell r={ratio(all.filter(p => p.progressive))} showPct={false} />
                </td>
              )}
            </tr>
          </tbody>
        </table>
        <div className="text-[11px] text-slate-400 mt-2">Click a player to show only their {noun} on the map.</div>
      </div>
    </div>
  );
}
