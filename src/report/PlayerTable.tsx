import { Tag, Team } from '../types';
import { playerRows } from '../lib/stats';
import { RatioCell } from './common';

export default function PlayerTable({ team, tags }: { team: Team; tags: Tag[] }) {
  const rows = playerRows(tags);
  if (rows.length === 0) return <div className="text-sm text-slate-400">No events tagged.</div>;
  const p = (id: number) => team.players.find(pl => pl.id === id);
  const th = 'font-normal px-1.5 py-1 text-right whitespace-nowrap';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-slate-200 align-bottom">
            <th className="font-normal text-left py-1">Player</th>
            <th className={th}>Actions</th>
            <th className={th}>Passes / acc.</th>
            <th className={th}>Progressive</th>
            <th className={th}>Received</th>
            <th className={th}>Key passes</th>
            <th className={th}>Assists</th>
            <th className={th}>Crosses / acc.</th>
            <th className={th}>Shots / on target</th>
            <th className={th}>Goals</th>
            <th className={th}>xG</th>
            <th className={th}>Dribbles / succ.</th>
            <th className={th}>Tackles / won</th>
            <th className={th}>Aerials / won</th>
            <th className={th}>Interc.</th>
            <th className={th}>Clear.</th>
            <th className={th}>Fouls</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map(r => (
            <tr key={r.playerId} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-1 whitespace-nowrap">
                <span
                  className="inline-flex w-5 h-5 rounded-full text-white text-[10px] items-center justify-center mr-1.5"
                  style={{ background: team.color }}
                >
                  {p(r.playerId)?.number}
                </span>
                {p(r.playerId)?.name}
              </td>
              <td className="text-right px-1.5">{r.actions}</td>
              <td className="text-right px-1.5"><RatioCell r={r.passes} /></td>
              <td className="text-right px-1.5"><RatioCell r={r.progressive} showPct={false} /></td>
              <td className="text-right px-1.5">{r.received}</td>
              <td className="text-right px-1.5">{r.keyPasses}</td>
              <td className="text-right px-1.5">{r.assists}</td>
              <td className="text-right px-1.5"><RatioCell r={r.crosses} /></td>
              <td className="text-right px-1.5"><RatioCell r={r.shots} showPct={false} /></td>
              <td className="text-right px-1.5">{r.goals}</td>
              <td className="text-right px-1.5">{r.xg ? r.xg.toFixed(2) : '-'}</td>
              <td className="text-right px-1.5"><RatioCell r={r.dribbles} showPct={false} /></td>
              <td className="text-right px-1.5"><RatioCell r={r.tackles} showPct={false} /></td>
              <td className="text-right px-1.5"><RatioCell r={r.aerials} showPct={false} /></td>
              <td className="text-right px-1.5">{r.interceptions}</td>
              <td className="text-right px-1.5">{r.clearances}</td>
              <td className="text-right px-1.5">{r.fouls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
