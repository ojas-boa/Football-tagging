import { FORMATIONS, TEAM_COLORS } from '../constants';
import { Match, Player, Team, TeamSide } from '../types';

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function createTeam(name: string, color: string, formation = '442'): Team {
  const players: Player[] = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    number: String(i + 1),
    name: `Player ${i + 1}`,
    slot: i,
  }));
  return { name, color, formation, players };
}

export function createMatch(): Match {
  const now = Date.now();
  return {
    id: uid(),
    competition: '',
    date: new Date().toISOString().slice(0, 10),
    home: createTeam('Home', TEAM_COLORS[0]),
    away: createTeam('Away', TEAM_COLORS[1], '433'),
    tags: [],
    formationHistory: [],
    homeAttacksRight: true,
    createdAt: now,
    updatedAt: now,
  };
}

export const otherSide = (s: TeamSide): TeamSide => (s === 'home' ? 'away' : 'home');

export function playerLabel(team: Team, id: number | undefined): string {
  if (id === undefined) return '';
  const p = team.players.find(pl => pl.id === id);
  if (!p) return `#${id}`;
  return p.name ? `${p.number}. ${p.name}` : `#${p.number}`;
}

export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export function onPitch(team: Team): Player[] {
  const positions = FORMATIONS[team.formation] || FORMATIONS['442'];
  return team.players
    .filter(p => p.slot !== undefined && p.slot < positions.length)
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
}

export function bench(team: Team): Player[] {
  return team.players.filter(p => p.slot === undefined);
}

export function goals(match: Match): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const t of match.tags) {
    if (t.event !== 'SHOT' || t.shotResult !== 'Goal') continue;
    const ownGoal = t.subtags.includes('Own_Goal');
    const side = ownGoal ? (t.team === 'home' ? 'away' : 'home') : t.team;
    if (side === 'home') home++;
    else away++;
  }
  return { home, away };
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export function matchTitle(m: Match): string {
  const g = goals(m);
  return `${m.home.name} ${g.home}–${g.away} ${m.away.name}`;
}
