export type Direction = 'up' | 'down' | 'left' | 'right';
export type CoreSubtype = 'beacon' | 'attractor' | 'growth';

export interface Position {
  x: number;
  y: number;
}

export interface BasicTile {
  id: string;
  kind: 'basic';
  level: number;
}

export interface CoreTile {
  id: string;
  kind: 'core';
  subtype: CoreSubtype;
}

export type Tile = BasicTile | CoreTile;

export interface Board {
  width: number;
  height: number;
  activeCells: boolean[][];
  newlyActivated: Position[];
}

export interface Scores {
  merge: number;
  territory: number;
  survival: number;
  continuity: number;
  total: number;
}

export interface GameState {
  board: Board;
  tiles: (Tile | null)[][];
  turn: number;
  controlledCells: boolean[][];
  contestedCells: boolean[][];
  scores: Scores;
  expansionMilestonesReached: number;
  expansionCharge: number;
  nextExpansionThreshold: number;
  growthCounters: Record<string, number>;
  gameOver: boolean;
  rngState: number;
  log: string[];
}

export interface SlideResult {
  nextTiles: (Tile | null)[][];
  mergedThisTurn: boolean;
  mergeScoreGained: number;
}

export interface StepResult {
  state: GameState;
  validMove: boolean;
}
