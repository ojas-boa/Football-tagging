import { Tag, Team } from '../types';

export default function PassMatrix({ team, tags }: { team: Team; tags: Tag[] }) {
  const passes = tags.filter(
    t => (t.event === 'PASS' || t.event === 'CROSS') && t.outcome === 'success' && t.receiverId !== undefined,
  );
  const ids = [...new Set(passes.flatMap(p => [p.playerId, p.receiverId as number]))];
  const order = (id: number) => team.players.find(p => p.id === id)?.slot ?? 100 + id;
  ids.sort((a, b) => order(a) - order(b));
  if (ids.length === 0) {
    return <div className="text-sm text-slate-400">No completed passes with a receiver tagged yet.</div>;
  }
  const count = (from: number, to: number) => passes.filter(p => p.playerId === from && p.receiverId === to).length;
  const max = Math.max(1, ...ids.flatMap(a => ids.map(b => count(a, b))));
  const label = (id: number) => team.players.find(p => p.id === id);
  const shade = (n: number) => (n ? `rgba(22, 163, 74, ${0.12 + (n / max) * 0.6})` : undefined);

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-slate-400 font-normal pr-2">from ↓ to →</th>
            {ids.map(id => (
              <th key={id} className="w-7 text-center">
                <span className="inline-flex w-5 h-5 rounded-full border border-slate-400 items-center justify-center text-[10px]">
                  {label(id)?.number}
                </span>
              </th>
            ))}
            <th className="w-9 text-center">Σ</th>
          </tr>
        </thead>
        <tbody>
          {ids.map(from => {
            const rowTotal = ids.reduce((s, to) => s + count(from, to), 0);
            return (
              <tr key={from}>
                <td className="pr-2 py-0.5 whitespace-nowrap">
                  <b>{label(from)?.number}</b> {label(from)?.name}
                </td>
                {ids.map(to => {
                  const n = from === to ? 0 : count(from, to);
                  return (
                    <td
                      key={to}
                      className="text-center border border-white"
                      style={{ background: from === to ? '#e2e8f0' : shade(n) }}
                    >
                      {n || ''}
                    </td>
                  );
                })}
                <td className="text-center font-semibold bg-slate-100">{rowTotal}</td>
              </tr>
            );
          })}
          <tr>
            <td className="pr-2 text-slate-400">received</td>
            {ids.map(to => (
              <td key={to} className="text-center font-semibold bg-slate-100">
                {ids.reduce((s, from) => s + count(from, to), 0)}
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
