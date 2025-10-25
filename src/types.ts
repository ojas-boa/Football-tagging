export interface TagData {
  timestamp: number;
  playerId: number;
  event: string;
  subtag?: string;
  shotResult?: string;
  bodyPart?: string;
  x?: number;
  y?: number;
}

export interface FormationData {
  formation: string;
  startTime: number;
  endTime: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
}
