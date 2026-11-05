import { EventType, PlayerPosition, ShotResult } from './types';

/** Pitch size in metres, used to turn 0-100 coordinates into distances. */
export const PITCH_L = 105;
export const PITCH_W = 68;

export const FORMATIONS: Record<string, PlayerPosition[]> = {
  '442': [
    { x: 6, y: 50 },
    { x: 25, y: 15 }, { x: 22, y: 38 }, { x: 22, y: 62 }, { x: 25, y: 85 },
    { x: 50, y: 15 }, { x: 46, y: 40 }, { x: 46, y: 60 }, { x: 50, y: 85 },
    { x: 72, y: 38 }, { x: 72, y: 62 },
  ],
  '433': [
    { x: 6, y: 50 },
    { x: 25, y: 15 }, { x: 22, y: 38 }, { x: 22, y: 62 }, { x: 25, y: 85 },
    { x: 45, y: 30 }, { x: 40, y: 50 }, { x: 45, y: 70 },
    { x: 72, y: 20 }, { x: 75, y: 50 }, { x: 72, y: 80 },
  ],
  '4231': [
    { x: 6, y: 50 },
    { x: 25, y: 15 }, { x: 22, y: 38 }, { x: 22, y: 62 }, { x: 25, y: 85 },
    { x: 40, y: 38 }, { x: 40, y: 62 },
    { x: 60, y: 18 }, { x: 58, y: 50 }, { x: 60, y: 82 },
    { x: 76, y: 50 },
  ],
  '352': [
    { x: 6, y: 50 },
    { x: 22, y: 28 }, { x: 20, y: 50 }, { x: 22, y: 72 },
    { x: 48, y: 10 }, { x: 42, y: 32 }, { x: 40, y: 50 }, { x: 42, y: 68 }, { x: 48, y: 90 },
    { x: 72, y: 38 }, { x: 72, y: 62 },
  ],
  '343': [
    { x: 6, y: 50 },
    { x: 22, y: 28 }, { x: 20, y: 50 }, { x: 22, y: 72 },
    { x: 48, y: 12 }, { x: 44, y: 38 }, { x: 44, y: 62 }, { x: 48, y: 88 },
    { x: 72, y: 22 }, { x: 75, y: 50 }, { x: 72, y: 78 },
  ],
  '451': [
    { x: 6, y: 50 },
    { x: 25, y: 15 }, { x: 22, y: 38 }, { x: 22, y: 62 }, { x: 25, y: 85 },
    { x: 50, y: 12 }, { x: 46, y: 32 }, { x: 44, y: 50 }, { x: 46, y: 68 }, { x: 50, y: 88 },
    { x: 74, y: 50 },
  ],
  '532': [
    { x: 6, y: 50 },
    { x: 28, y: 10 }, { x: 22, y: 30 }, { x: 20, y: 50 }, { x: 22, y: 70 }, { x: 28, y: 90 },
    { x: 46, y: 30 }, { x: 44, y: 50 }, { x: 46, y: 70 },
    { x: 72, y: 38 }, { x: 72, y: 62 },
  ],
};

export interface EventDef {
  key: string;
  color: string;
  label: string;
  /** Needs a second click for the end point (passes, crosses). */
  hasEnd?: boolean;
  /** Ask won/lost (Y/N) after placing. */
  hasOutcome?: boolean;
}

export const EVENTS: Record<EventType, EventDef> = {
  PASS: { key: 'P', color: '#3b82f6', label: 'Pass', hasEnd: true, hasOutcome: true },
  CROSS: { key: 'X', color: '#14b8a6', label: 'Cross', hasEnd: true, hasOutcome: true },
  SHOT: { key: 'S', color: '#ef4444', label: 'Shot' },
  DRIBBLE: { key: 'D', color: '#10b981', label: 'Dribble', hasOutcome: true },
  TACKLE: { key: 'T', color: '#f59e0b', label: 'Tackle', hasOutcome: true },
  AERIAL: { key: 'A', color: '#6366f1', label: 'Aerial duel', hasOutcome: true },
  INTERCEPT: { key: 'I', color: '#8b5cf6', label: 'Interception' },
  CLEARANCE: { key: 'C', color: '#ec4899', label: 'Clearance' },
  FOUL: { key: 'F', color: '#dc2626', label: 'Foul' },
  SAVE: { key: 'V', color: '#f97316', label: 'Save' },
};

export const EVENT_TYPES = Object.keys(EVENTS) as EventType[];

export const SHOT_RESULTS: { value: ShotResult; key: string }[] = [
  { value: 'Goal', key: 'G' },
  { value: 'Saved', key: 'O' },
  { value: 'Off Target', key: 'W' },
  { value: 'Blocked', key: 'B' },
  { value: 'Post', key: 'P' },
];

export const BODY_PARTS: { value: string; key: string }[] = [
  { value: 'Right Foot', key: 'R' },
  { value: 'Left Foot', key: 'L' },
  { value: 'Head', key: 'H' },
  { value: 'Other', key: 'Y' },
];

export const SUBTAGS = [
  'Key_Pass', 'Assist', 'Through_Ball', 'Long_Ball',
  'Under_Pressure', 'Set_Piece', 'Corner', 'Free_Kick',
  'Counter', 'Loose_Ball', 'Anticipation', 'Ball_Lost',
  'Blocked', 'Low', 'High', 'Own_Goal',
  'Left', 'Right', 'Plus', 'Minus',
  'Yellow_Card', 'Red_Card', 'Penalty', 'Neutral',
];

export const TEAM_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#0f172a', '#ec4899', '#0891b2'];
