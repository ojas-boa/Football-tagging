import { Match } from '../types';

const CURRENT = 'ft.current';
const LIBRARY = 'ft.library';
const matchKey = (id: string) => `ft.match.${id}`;

export interface LibraryEntry {
  id: string;
  title: string;
  date: string;
  competition: string;
  tagCount: number;
  updatedAt: number;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Could not save to local storage', err);
  }
}

export const loadCurrent = () => read<Match>(CURRENT);
export const saveCurrent = (m: Match) => write(CURRENT, m);

export const listLibrary = (): LibraryEntry[] =>
  (read<LibraryEntry[]>(LIBRARY) || []).sort((a, b) => b.updatedAt - a.updatedAt);

export const loadMatch = (id: string) => read<Match>(matchKey(id));

export function saveToLibrary(m: Match, title: string) {
  write(matchKey(m.id), m);
  const entries = listLibrary().filter(e => e.id !== m.id);
  entries.unshift({
    id: m.id,
    title,
    date: m.date,
    competition: m.competition,
    tagCount: m.tags.length,
    updatedAt: Date.now(),
  });
  write(LIBRARY, entries);
}

export function deleteFromLibrary(id: string) {
  try {
    localStorage.removeItem(matchKey(id));
  } catch {
    /* ignore */
  }
  write(LIBRARY, listLibrary().filter(e => e.id !== id));
}
