import { PITCH_L, PITCH_W } from '../constants';
import { Match, Tag, TeamSide } from '../types';

export type HalfFilter = 'all' | 1 | 2;

const GOAL = { x: PITCH_L, y: PITCH_W / 2 };

export const toM = (x: number, y: number) => ({ x: (x / 100) * PITCH_L, y: (y / 100) * PITCH_W });

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export type PassDirection = 'forward' | 'back' | 'lateral';

export interface PassInfo {
  tag: Tag;
  success: boolean;
  length: number;
  direction: PassDirection;
  progressive: boolean;
  toFinalThird: boolean;
  toPenaltyArea: boolean;
  long: boolean;
  deep: boolean;
}

const inPenaltyArea = (p: { x: number; y: number }) => p.x >= PITCH_L - 16.5 && p.y >= 13.84 && p.y <= 54.16;

export function analysePass(tag: Tag): PassInfo | null {
  if (tag.endX === undefined || tag.endY === undefined) return null;
  const a = toM(tag.x, tag.y);
  const b = toM(tag.endX, tag.endY);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(Math.abs(dy), dx) * 180) / Math.PI;
  const direction: PassDirection = angle < 45 ? 'forward' : angle > 135 ? 'back' : 'lateral';
  const gain = dist(a, GOAL) - dist(b, GOAL);
  const half = PITCH_L / 2;
  const startOwn = a.x < half;
  const endOwn = b.x < half;
  const need = startOwn && endOwn ? 30 : !startOwn && !endOwn ? 10 : 15;
  const finalThird = PITCH_L - 35;
  const success = tag.outcome === 'success';
  return {
    tag,
    success,
    length,
    direction,
    progressive: gain >= need,
    toFinalThird: a.x < finalThird && b.x >= finalThird,
    toPenaltyArea: !inPenaltyArea(a) && inPenaltyArea(b),
    long: length >= 40,
    deep: tag.event === 'PASS' && dist(b, GOAL) <= 20,
  };
}

/** Very simple distance + angle xG estimate (not a trained model). */
export function shotXG(tag: Tag): number {
  if (tag.subtags.includes('Own_Goal')) return 0;
  if (tag.subtags.includes('Penalty')) return 0.76;
  const p = toM(tag.x, tag.y);
  const d = Math.max(dist(p, GOAL), 1);
  const left = { x: PITCH_L, y: PITCH_W / 2 - 3.66 };
  const right = { x: PITCH_L, y: PITCH_W / 2 + 3.66 };
  const a1 = Math.atan2(left.y - p.y, left.x - p.x);
  const a2 = Math.atan2(right.y - p.y, right.x - p.x);
  let angle = Math.abs(a2 - a1);
  if (angle > Math.PI) angle = 2 * Math.PI - angle;
  let xg = 1 / (1 + Math.exp(-(-0.4 - 0.12 * d + 1.2 * angle)));
  if (tag.bodyPart === 'Head') xg *= 0.6;
  return Math.min(0.95, xg);
}

export const shotDistance = (tag: Tag) => dist(toM(tag.x, tag.y), GOAL);

export const onTarget = (t: Tag) => t.shotResult === 'Goal' || t.shotResult === 'Saved';

export function filterTags(match: Match, side: TeamSide | null, half: HalfFilter): Tag[] {
  return match.tags
    .filter(t => (side ? t.team === side : true) && (half === 'all' || t.half === half))
    .sort((a, b) => a.half - b.half || a.t - b.t);
}

export interface Ratio {
  total: number;
  ok: number;
}

const ratio = (items: { success: boolean }[]): Ratio => ({
  total: items.length,
  ok: items.filter(i => i.success).length,
});

export interface TeamStats {
  goals: number;
  xg: number;
  shots: Ratio;
  shotsBlocked: number;
  shotsWide: number;
  shotsPost: number;
  avgShotDistance: number;
  passes: Ratio;
  forward: Ratio;
  back: Ratio;
  lateral: Ratio;
  progressive: Ratio;
  long: Ratio;
  finalThird: Ratio;
  penaltyArea: Ratio;
  deep: number;
  keyPasses: number;
  avgPassLength: number;
  crosses: Ratio;
  dribbles: Ratio;
  tackles: Ratio;
  aerials: Ratio;
  interceptions: number;
  clearances: number;
  fouls: number;
  saves: number;
  yellow: number;
  red: number;
}

export function teamStats(tags: Tag[], opponentTags: Tag[] = []): TeamStats {
  const of = (e: string) => tags.filter(t => t.event === e);
  const passes = of('PASS').map(analysePass).filter((p): p is PassInfo => !!p);
  const crosses = of('CROSS').map(t => ({ success: t.outcome === 'success' }));
  const shots = of('SHOT');
  const outcomeRatio = (e: string) => ratio(of(e).map(t => ({ success: t.outcome === 'success' })));
  const ownGoalsFor = opponentTags.filter(
    t => t.event === 'SHOT' && t.shotResult === 'Goal' && t.subtags.includes('Own_Goal'),
  ).length;
  const realShots = shots.filter(t => !t.subtags.includes('Own_Goal'));
  return {
    goals: realShots.filter(t => t.shotResult === 'Goal').length + ownGoalsFor,
    xg: realShots.reduce((s, t) => s + shotXG(t), 0),
    shots: { total: realShots.length, ok: realShots.filter(onTarget).length },
    shotsBlocked: realShots.filter(t => t.shotResult === 'Blocked').length,
    shotsWide: realShots.filter(t => t.shotResult === 'Off Target').length,
    shotsPost: realShots.filter(t => t.shotResult === 'Post').length,
    avgShotDistance: realShots.length ? realShots.reduce((s, t) => s + shotDistance(t), 0) / realShots.length : 0,
    passes: ratio(passes),
    forward: ratio(passes.filter(p => p.direction === 'forward')),
    back: ratio(passes.filter(p => p.direction === 'back')),
    lateral: ratio(passes.filter(p => p.direction === 'lateral')),
    progressive: ratio(passes.filter(p => p.progressive)),
    long: ratio(passes.filter(p => p.long)),
    finalThird: ratio(passes.filter(p => p.toFinalThird)),
    penaltyArea: ratio(passes.filter(p => p.toPenaltyArea)),
    deep: passes.filter(p => p.deep && p.success).length,
    keyPasses: tags.filter(t => (t.event === 'PASS' || t.event === 'CROSS') && t.subtags.includes('Key_Pass')).length,
    avgPassLength: passes.length ? passes.reduce((s, p) => s + p.length, 0) / passes.length : 0,
    crosses: ratio(crosses),
    dribbles: outcomeRatio('DRIBBLE'),
    tackles: outcomeRatio('TACKLE'),
    aerials: outcomeRatio('AERIAL'),
    interceptions: of('INTERCEPT').length,
    clearances: of('CLEARANCE').length,
    fouls: of('FOUL').length,
    saves: of('SAVE').length,
    yellow: tags.filter(t => t.subtags.includes('Yellow_Card')).length,
    red: tags.filter(t => t.subtags.includes('Red_Card')).length,
  };
}

export interface PlayerRow {
  playerId: number;
  actions: number;
  received: number;
  passes: Ratio;
  progressive: Ratio;
  keyPasses: number;
  assists: number;
  crosses: Ratio;
  shots: Ratio;
  goals: number;
  xg: number;
  dribbles: Ratio;
  tackles: Ratio;
  aerials: Ratio;
  interceptions: number;
  clearances: number;
  fouls: number;
}

export function playerRows(tags: Tag[]): PlayerRow[] {
  const ids = new Set<number>();
  tags.forEach(t => {
    ids.add(t.playerId);
    if (t.receiverId !== undefined) ids.add(t.receiverId);
  });
  return [...ids]
    .map(id => {
      const mine = tags.filter(t => t.playerId === id);
      const s = teamStats(mine);
      return {
        playerId: id,
        actions: mine.length,
        received: tags.filter(t => t.receiverId === id && t.outcome === 'success').length,
        passes: s.passes,
        progressive: s.progressive,
        keyPasses: s.keyPasses,
        assists: mine.filter(t => t.subtags.includes('Assist')).length,
        crosses: s.crosses,
        shots: s.shots,
        goals: mine.filter(t => t.event === 'SHOT' && t.shotResult === 'Goal' && !t.subtags.includes('Own_Goal')).length,
        xg: s.xg,
        dribbles: s.dribbles,
        tackles: s.tackles,
        aerials: s.aerials,
        interceptions: s.interceptions,
        clearances: s.clearances,
        fouls: s.fouls,
      };
    })
    .sort((a, b) => b.actions + b.received - (a.actions + a.received));
}

export interface NetworkNode {
  playerId: number;
  x: number;
  y: number;
  touches: number;
}

export interface NetworkEdge {
  from: number;
  to: number;
  count: number;
}

export function passNetwork(tags: Tag[]) {
  const pos = new Map<number, { sx: number; sy: number; n: number }>();
  const add = (id: number, x: number, y: number) => {
    const p = pos.get(id) || { sx: 0, sy: 0, n: 0 };
    p.sx += x;
    p.sy += y;
    p.n += 1;
    pos.set(id, p);
  };
  const edges = new Map<string, NetworkEdge>();
  for (const t of tags) {
    if (t.event === 'FOUL') continue;
    add(t.playerId, t.x, t.y);
    if ((t.event === 'PASS' || t.event === 'CROSS') && t.outcome === 'success' && t.receiverId !== undefined) {
      if (t.endX !== undefined && t.endY !== undefined) add(t.receiverId, t.endX, t.endY);
      if (t.receiverId === t.playerId) continue;
      const key = `${t.playerId}>${t.receiverId}`;
      const e = edges.get(key) || { from: t.playerId, to: t.receiverId, count: 0 };
      e.count++;
      edges.set(key, e);
    }
  }
  const nodes: NetworkNode[] = [...pos.entries()].map(([playerId, p]) => ({
    playerId,
    x: p.sx / p.n,
    y: p.sy / p.n,
    touches: p.n,
  }));
  return { nodes, edges: [...edges.values()] };
}

export const pct = (r: Ratio) => (r.total ? Math.round((r.ok / r.total) * 100) : 0);
export const fmtRatio = (r: Ratio) => (r.total ? `${r.total}/${r.ok}` : '0');
