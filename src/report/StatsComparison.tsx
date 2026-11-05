import { Match } from '../types';
import { Ratio, TeamStats, pct } from '../lib/stats';

type Row = [string, (s: TeamStats) => number | Ratio | string, ((s: TeamStats) => number)?];

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'General',
    rows: [
      ['Goals', s => s.goals],
      ['xG (estimate)', s => s.xg.toFixed(2), s => s.xg],
      ['Shots / on target', s => s.shots],
      ['Shots blocked / wide / post', s => `${s.shotsBlocked}/${s.shotsWide}/${s.shotsPost}`, s => s.shots.total - s.shots.ok],
      ['Average shot distance (m)', s => (s.avgShotDistance ? s.avgShotDistance.toFixed(1) : '-'), s => s.avgShotDistance],
      ['Fouls', s => s.fouls],
      ['Yellow / red cards', s => `${s.yellow}/${s.red}`, s => s.yellow + s.red * 2],
    ],
  },
  {
    title: 'Passes',
    rows: [
      ['Total passes / accurate', s => s.passes],
      ['Forward passes / accurate', s => s.forward],
      ['Back passes / accurate', s => s.back],
      ['Lateral passes / accurate', s => s.lateral],
      ['Progressive passes / accurate', s => s.progressive],
      ['Long passes / accurate', s => s.long],
      ['Passes to final third / accurate', s => s.finalThird],
      ['Passes to penalty area / accurate', s => s.penaltyArea],
      ['Deep completions', s => s.deep],
      ['Key passes', s => s.keyPasses],
      ['Average pass length (m)', s => s.avgPassLength.toFixed(1), s => s.avgPassLength],
    ],
  },
  {
    title: 'Crosses & attacking',
    rows: [
      ['Crosses / accurate', s => s.crosses],
      ['Dribbles / successful', s => s.dribbles],
    ],
  },
  {
    title: 'Defence & duels',
    rows: [
      ['Tackles / won', s => s.tackles],
      ['Aerial duels / won', s => s.aerials],
      ['Interceptions', s => s.interceptions],
      ['Clearances', s => s.clearances],
      ['Saves', s => s.saves],
    ],
  },
];

function display(v: number | Ratio | string) {
  if (typeof v === 'object') {
    return (
      <>
        {v.total}/{v.ok}
        {v.total > 0 && <span className="text-slate-400 text-[10px] ml-1">{pct(v)}%</span>}
      </>
    );
  }
  return v;
}

const numeric = (v: number | Ratio | string) => (typeof v === 'object' ? v.total : typeof v === 'number' ? v : parseFloat(v) || 0);

export default function StatsComparison({ match, home, away }: { match: Match; home: TeamStats; away: TeamStats }) {
  return (
    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 print:grid-cols-2">
      {GROUPS.map(g => (
        <div key={g.title}>
          <div className="flex text-xs font-semibold text-slate-700 mb-1">
            <span className="flex-1">{g.title}</span>
            <span className="w-24 text-right" style={{ color: match.home.color }}>
              {match.home.name}
            </span>
            <span className="w-24 text-right" style={{ color: match.away.color }}>
              {match.away.name}
            </span>
          </div>
          {g.rows.map(([label, get, val]) => {
            const h = get(home);
            const a = get(away);
            const hn = val ? val(home) : numeric(h);
            const an = val ? val(away) : numeric(a);
            const total = hn + an || 1;
            return (
              <div key={label} className="py-1 border-b border-slate-100 text-xs">
                <div className="flex">
                  <span className="flex-1 text-slate-600">{label}</span>
                  <span className="w-24 text-right tabular-nums">{display(h)}</span>
                  <span className="w-24 text-right tabular-nums">{display(a)}</span>
                </div>
                <div className="flex h-1 mt-1 rounded overflow-hidden bg-slate-100">
                  <div style={{ width: `${(hn / total) * 100}%`, background: match.home.color, opacity: 0.7 }} />
                  <div style={{ width: `${(an / total) * 100}%`, background: match.away.color, opacity: 0.7 }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
