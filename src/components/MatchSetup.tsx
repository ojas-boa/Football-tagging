import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { FORMATIONS, TEAM_COLORS } from '../constants';
import { Match, Player, Team, TeamSide } from '../types';

interface MatchSetupProps {
  match: Match;
  onChange: (updater: (m: Match) => Match) => void;
  onFormation: (side: TeamSide, formation: string) => void;
  onClose: () => void;
}

export default function MatchSetup({ match, onChange, onFormation, onClose }: MatchSetupProps) {
  const [tab, setTab] = useState<'details' | TeamSide>('details');

  const updateTeam = (side: TeamSide, fn: (t: Team) => Team) => onChange(m => ({ ...m, [side]: fn(m[side]) }));

  const updatePlayer = (side: TeamSide, id: number, patch: Partial<Player>) =>
    updateTeam(side, t => ({ ...t, players: t.players.map(p => (p.id === id ? { ...p, ...patch } : p)) }));

  /** Put player `id` in `slot`; whoever was there goes to the bench (or swaps). */
  const setSlot = (side: TeamSide, id: number, slot: number | undefined) =>
    updateTeam(side, t => {
      const me = t.players.find(p => p.id === id);
      return {
        ...t,
        players: t.players.map(p => {
          if (p.id === id) return { ...p, slot };
          if (slot !== undefined && p.slot === slot) return { ...p, slot: me?.slot };
          return p;
        }),
      };
    });

  const addPlayer = (side: TeamSide) =>
    updateTeam(side, t => {
      const id = Math.max(0, ...t.players.map(p => p.id)) + 1;
      return { ...t, players: [...t.players, { id, number: String(id), name: '' }] };
    });

  const removePlayer = (side: TeamSide, id: number) =>
    updateTeam(side, t => ({ ...t, players: t.players.filter(p => p.id !== id) }));

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded text-sm ${tab === id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
    >
      {label}
    </button>
  );

  const input = 'bg-gray-700 text-white px-2 py-1.5 rounded text-sm w-full';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-gray-700">
          {tabBtn('details', 'Match details')}
          {tabBtn('home', match.home.name || 'Home')}
          {tabBtn('away', match.away.name || 'Away')}
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {tab === 'details' ? (
            <div className="grid grid-cols-2 gap-3 text-gray-300 text-xs">
              <label className="col-span-2">
                Competition
                <input className={input} value={match.competition} onChange={e => onChange(m => ({ ...m, competition: e.target.value }))} />
              </label>
              <label>
                Date
                <input type="date" className={input} value={match.date} onChange={e => onChange(m => ({ ...m, date: e.target.value }))} />
              </label>
              <div />
              {(['home', 'away'] as TeamSide[]).map(side => (
                <div key={side} className="space-y-1">
                  <label>
                    {side === 'home' ? 'Home team' : 'Away team'}
                    <input className={input} value={match[side].name} onChange={e => updateTeam(side, t => ({ ...t, name: e.target.value }))} />
                  </label>
                  <div className="flex gap-1 pt-1">
                    {TEAM_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => updateTeam(side, t => ({ ...t, color: c }))}
                        className={`w-6 h-6 rounded-full border-2 ${match[side].color === c ? 'border-white' : 'border-transparent'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                Formation
                <select
                  value={match[tab].formation}
                  onChange={e => onFormation(tab, e.target.value)}
                  className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                >
                  {Object.keys(FORMATIONS).map(f => (
                    <option key={f} value={f}>
                      {f.split('').join('-')}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">Changing position mid-game records a substitution.</span>
              </div>
              <div className="grid grid-cols-[60px_1fr_110px_28px] gap-1 text-xs text-gray-400 px-1">
                <span>No.</span>
                <span>Name</span>
                <span>Position</span>
                <span />
              </div>
              {[...match[tab].players]
                .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99) || a.id - b.id)
                .map(p => (
                  <div key={p.id} className="grid grid-cols-[60px_1fr_110px_28px] gap-1">
                    <input className={input} value={p.number} maxLength={3} onChange={e => updatePlayer(tab, p.id, { number: e.target.value })} />
                    <input className={input} value={p.name} placeholder="Name" onChange={e => updatePlayer(tab, p.id, { name: e.target.value })} />
                    <select
                      className={input}
                      value={p.slot === undefined ? 'bench' : String(p.slot)}
                      onChange={e => setSlot(tab, p.id, e.target.value === 'bench' ? undefined : parseInt(e.target.value, 10))}
                    >
                      {Array.from({ length: 11 }).map((_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? 'GK' : `Slot ${i + 1}`}
                        </option>
                      ))}
                      <option value="bench">Bench</option>
                    </select>
                    <button
                      title="Remove player"
                      disabled={match.tags.some(t => t.team === tab && (t.playerId === p.id || t.receiverId === p.id))}
                      onClick={() => removePlayer(tab, p.id)}
                      className="text-gray-500 hover:text-red-400 disabled:opacity-20"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              <button onClick={() => addPlayer(tab)} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 pt-1">
                <Plus size={14} /> Add substitute
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
