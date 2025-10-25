import { PlayerPosition } from './types';

export const FORMATIONS: Record<string, PlayerPosition[]> = {
  '442': [
    { x: 10, y: 50 },
    { x: 25, y: 15 }, { x: 25, y: 40 }, { x: 25, y: 60 }, { x: 25, y: 85 },
    { x: 50, y: 20 }, { x: 50, y: 40 }, { x: 50, y: 60 }, { x: 50, y: 80 },
    { x: 75, y: 35 }, { x: 75, y: 65 },
  ],
  '433': [
    { x: 10, y: 50 },
    { x: 25, y: 15 }, { x: 25, y: 40 }, { x: 25, y: 60 }, { x: 25, y: 85 },
    { x: 50, y: 30 }, { x: 50, y: 50 }, { x: 50, y: 70 },
    { x: 75, y: 25 }, { x: 75, y: 50 }, { x: 75, y: 75 },
  ],
  '352': [
    { x: 10, y: 50 },
    { x: 25, y: 25 }, { x: 25, y: 50 }, { x: 25, y: 75 },
    { x: 45, y: 15 }, { x: 45, y: 35 }, { x: 45, y: 50 }, { x: 45, y: 65 }, { x: 45, y: 85 },
    { x: 75, y: 35 }, { x: 75, y: 65 },
  ],
  '343': [
    { x: 10, y: 50 },
    { x: 25, y: 25 }, { x: 25, y: 50 }, { x: 25, y: 75 },
    { x: 50, y: 20 }, { x: 50, y: 40 }, { x: 50, y: 60 }, { x: 50, y: 80 },
    { x: 75, y: 25 }, { x: 75, y: 50 }, { x: 75, y: 75 },
  ],
  '451': [
    { x: 10, y: 50 },
    { x: 25, y: 15 }, { x: 25, y: 40 }, { x: 25, y: 60 }, { x: 25, y: 85 },
    { x: 50, y: 20 }, { x: 50, y: 35 }, { x: 50, y: 50 }, { x: 50, y: 65 }, { x: 50, y: 80 },
    { x: 75, y: 50 },
  ],
  '532': [
    { x: 10, y: 50 },
    { x: 25, y: 15 }, { x: 25, y: 32 }, { x: 25, y: 50 }, { x: 25, y: 68 }, { x: 25, y: 85 },
    { x: 50, y: 30 }, { x: 50, y: 50 }, { x: 50, y: 70 },
    { x: 75, y: 35 }, { x: 75, y: 65 },
  ],
};

export const EVENT_HOTKEYS = {
  PASS: { key: 'P', color: '#3b82f6' },
  SHOT: { key: 'S', color: '#ef4444' },
  TACKLE: { key: 'T', color: '#f59e0b' },
  INTERCEPT: { key: 'I', color: '#8b5cf6' },
  CLEARANCE: { key: 'C', color: '#ec4899' },
  CROSS: { key: 'X', color: '#14b8a6' },
  DRIBBLE: { key: 'D', color: '#10b981' },
  FOUL: { key: 'F', color: '#dc2626' },
  AERIAL: { key: 'A', color: '#6366f1' },
  SAVE: { key: 'V', color: '#f97316' },
};

export const SUBTAGS = [
  'Minus', 'Loose_Ball', 'Low', 'Diff_Oppo',
  'Anticipation', 'Own_Goal', 'Key_Onesh',
  'Neutral', 'Vol_Interc', 'High', 'Tackle',
  'Anticipate', 'Parplay', 'Key_Pass',
  'Plus', 'Left', 'Blocked', 'Ball_Lost',
  'Red_card', 'Under_pre', 'Assist',
  'Heading', 'Right', 'Clearance', 'Ball_Mise',
  'Yellow_ca', 'Scheme', 'Goal',
];
