import { EVENT_TYPES } from '../constants';
import { EventType, Match, Outcome, ShotResult, Tag, Team, TeamSide } from '../types';
import { createTeam, formatTime, uid } from './match';

const HEADERS = [
  'Competition', 'Date', 'Half', 'Time', 'Seconds',
  'Team', 'Team Name', 'Formation',
  'Player Id', 'Player Number', 'Player Name',
  'Event', 'Outcome',
  'X', 'Y', 'End X', 'End Y',
  'Receiver Id', 'Receiver Number', 'Receiver Name',
  'Shot Result', 'Body Part', 'Subtags',
];

function esc(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const num = (n: number | undefined) => (n === undefined ? '' : n.toFixed(2));

export function matchToCSV(match: Match): string {
  const rows: string[] = [HEADERS.join(',')];
  const sorted = [...match.tags].sort((a, b) => a.half - b.half || a.t - b.t);
  for (const tag of sorted) {
    const team = match[tag.team];
    const p = team.players.find(pl => pl.id === tag.playerId);
    const r = tag.receiverId !== undefined ? team.players.find(pl => pl.id === tag.receiverId) : undefined;
    rows.push(
      [
        match.competition,
        match.date,
        tag.half,
        formatTime(tag.t),
        tag.t.toFixed(2),
        tag.team,
        team.name,
        tag.formation || team.formation,
        tag.playerId,
        p?.number ?? '',
        p?.name ?? '',
        tag.event,
        tag.outcome ?? '',
        num(tag.x),
        num(tag.y),
        num(tag.endX),
        num(tag.endY),
        tag.receiverId ?? '',
        r?.number ?? '',
        r?.name ?? '',
        tag.shotResult ?? '',
        tag.bodyPart ?? '',
        tag.subtags.join(';'),
      ]
        .map(esc)
        .join(','),
    );
  }
  return rows.join('\n');
}

/** Minimal RFC 4180 parser. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.some(f => f.trim() !== ''));
}

function ensurePlayer(team: Team, id: number, number: string, name: string) {
  if (!Number.isFinite(id)) return;
  const existing = team.players.find(p => p.id === id);
  if (existing) {
    if (number) existing.number = number;
    if (name) existing.name = name;
  } else {
    team.players.push({ id, number: number || String(id), name });
  }
}

const optNum = (s: string | undefined) => {
  if (s === undefined || s.trim() === '') return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Rebuilds a match from a CSV produced by matchToCSV. */
export function csvToMatch(text: string): Match {
  const rows = parseCSV(text);
  if (rows.length === 0) throw new Error('The file is empty.');
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  const need = ['Team', 'Player Id', 'Event', 'X', 'Y'];
  const missing = need.filter(n => col(n) < 0);
  if (missing.length) {
    throw new Error(`This CSV was not exported by the tagging app (missing: ${missing.join(', ')}).`);
  }
  const get = (r: string[], name: string) => {
    const i = col(name);
    return i >= 0 ? (r[i] ?? '').trim() : '';
  };

  const home = createTeam('Home', '#2563eb');
  const away = createTeam('Away', '#dc2626');
  home.players = [];
  away.players = [];
  const teams: Record<TeamSide, Team> = { home, away };
  const tags: Tag[] = [];
  let competition = '';
  let date = '';

  for (const r of rows.slice(1)) {
    const side = get(r, 'Team') === 'away' ? 'away' : 'home';
    const team = teams[side];
    const teamName = get(r, 'Team Name');
    if (teamName) team.name = teamName;
    const formation = get(r, 'Formation');
    if (formation) team.formation = formation;
    competition ||= get(r, 'Competition');
    date ||= get(r, 'Date');

    const event = get(r, 'Event').toUpperCase() as EventType;
    if (!EVENT_TYPES.includes(event)) continue;
    const playerId = parseInt(get(r, 'Player Id'), 10);
    ensurePlayer(team, playerId, get(r, 'Player Number'), get(r, 'Player Name'));
    const receiverId = optNum(get(r, 'Receiver Id'));
    if (receiverId !== undefined) {
      ensurePlayer(team, receiverId, get(r, 'Receiver Number'), get(r, 'Receiver Name'));
    }
    const outcome = get(r, 'Outcome');
    tags.push({
      id: uid(),
      t: optNum(get(r, 'Seconds')) ?? 0,
      half: get(r, 'Half') === '2' ? 2 : 1,
      team: side,
      playerId,
      event,
      x: optNum(get(r, 'X')) ?? 50,
      y: optNum(get(r, 'Y')) ?? 50,
      endX: optNum(get(r, 'End X')),
      endY: optNum(get(r, 'End Y')),
      outcome: outcome === 'success' || outcome === 'fail' ? (outcome as Outcome) : undefined,
      receiverId,
      shotResult: (get(r, 'Shot Result') || undefined) as ShotResult | undefined,
      bodyPart: get(r, 'Body Part') || undefined,
      subtags: get(r, 'Subtags').split(';').filter(Boolean),
      formation: formation || undefined,
    });
  }

  // Put the first eleven players of each team on the pitch so the roster is usable.
  for (const team of [home, away]) {
    team.players.sort((a, b) => a.id - b.id);
    team.players.forEach((p, i) => (p.slot = i < 11 ? i : undefined));
  }

  const now = Date.now();
  return {
    id: uid(),
    competition,
    date: date || new Date().toISOString().slice(0, 10),
    home,
    away,
    tags,
    formationHistory: [],
    homeAttacksRight: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(s: string) {
  return s.replace(/[–—]/g, '-').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'match';
}
