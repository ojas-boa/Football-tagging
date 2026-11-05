export type TeamSide = 'home' | 'away';

export type EventType =
  | 'PASS'
  | 'CROSS'
  | 'SHOT'
  | 'DRIBBLE'
  | 'TACKLE'
  | 'INTERCEPT'
  | 'CLEARANCE'
  | 'AERIAL'
  | 'FOUL'
  | 'SAVE';

export type Outcome = 'success' | 'fail';

export type ShotResult = 'Goal' | 'Saved' | 'Off Target' | 'Blocked' | 'Post';

export interface Player {
  id: number;
  number: string;
  name: string;
  /** Formation slot index (0-10) while on the pitch; undefined when on the bench. */
  slot?: number;
}

export interface Team {
  name: string;
  formation: string;
  color: string;
  players: Player[];
}

/**
 * A tagged event. Coordinates are 0-100 and always normalised so the tagging
 * team attacks left -> right (x = 100 is the opponent goal line, y = 0 is the
 * top touchline from that team's point of view).
 */
export interface Tag {
  id: string;
  t: number;
  half: 1 | 2;
  team: TeamSide;
  playerId: number;
  event: EventType;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  outcome?: Outcome;
  receiverId?: number;
  shotResult?: ShotResult;
  bodyPart?: string;
  subtags: string[];
  formation?: string;
}

export interface FormationChange {
  team: TeamSide;
  formation: string;
  t: number;
  half: 1 | 2;
}

export interface Match {
  id: string;
  competition: string;
  date: string;
  home: Team;
  away: Team;
  tags: Tag[];
  formationHistory: FormationChange[];
  /** Direction the home team attacks in the video for the current half. */
  homeAttacksRight: boolean;
  videoName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
}
