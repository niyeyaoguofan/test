import { createBoard, createEmptyTileGrid, getEmptyActiveCells } from './board';
import { resolveCoreEffects } from './effects';
import { evolveBoard, initialExpansionThreshold } from './expansion';
import { resolveSlide } from './moveResolver';
import { pickRandomIndex, nextRng } from './rng';
import { computeTerritory } from './territory';
import { Direction, GameState, StepResult, Tile } from './types';

let nextId = 1;
const makeId = () => `t-${nextId++}`;

export function createInitialState(seed = 1337): GameState {
  const board = createBoard();
  let rngState = seed;
  const tiles = createEmptyTileGrid(board);

  for (let i = 0; i < 2; i += 1) {
    const spawned = spawnRandomTile(board.activeCells, tiles, rngState);
    if (!spawned) break;
    rngState = spawned.seed;
  }

  const territory = computeTerritory(board, tiles);
  return {
    board,
    tiles,
    turn: 0,
    controlledCells: territory.controlled,
    contestedCells: territory.contested,
    scores: {
      merge: 0,
      territory: 0,
      survival: 0,
      continuity: 0,
      total: 0
    },
    expansionMilestonesReached: 0,
    expansionCharge: 0,
    nextExpansionThreshold: initialExpansionThreshold(),
    growthCounters: {},
    gameOver: false,
    rngState,
    log: [],
    lastReward: { merge: 0, territory: 0, continuity: 0, survival: 0, total: 0 }
  };
}

export function step(state: GameState, direction: Direction): StepResult {
  if (state.gameOver) return { state, validMove: false };

  const before = JSON.stringify(state.tiles);
  const slide = resolveSlide(state.tiles, state.board.activeCells, direction, state.rngState, makeId);
  const afterSlide = JSON.stringify(slide.nextTiles);
  if (before === afterSlide) {
    return {
      state: { ...state, log: ['Invalid move: no tile shifted or merged.', ...state.log].slice(0, 5) },
      validMove: false
    };
  }

  const effects = resolveCoreEffects(state.board, slide.nextTiles, state.growthCounters, slide.seed, makeId);
  const territory = computeTerritory(state.board, effects.tiles);

  // v2 scoring: territory/continuity dominate; merges are enablers.
  const mergeGain = Math.floor(slide.mergeScoreGained * 0.35);
  const territoryGain = territory.territoryCount * 5 - territory.contestedCount * 2;
  const continuityGain = territory.continuityBonus * 3;
  const survivalGain = 1;

  const expansionChargeGain = Math.max(1, Math.floor((territory.territoryCount + territory.continuityBonus * 2) / 5));
  const evolved = evolveBoard(
    state.board,
    territory.controlled,
    state.turn + 1,
    state.expansionCharge + expansionChargeGain,
    state.nextExpansionThreshold,
    state.expansionMilestonesReached
  );

  const postTiles = effects.tiles.map((r) => [...r]);
  const spawned = spawnRandomTile(evolved.board.activeCells, postTiles, effects.seed);
  const rngState = spawned?.seed ?? effects.seed;

  const finalTerritory = computeTerritory(evolved.board, postTiles);
  const over = !hasAnyValidMove(evolved.board.activeCells, postTiles);

  const turnReward = {
    merge: mergeGain,
    territory: Math.max(0, territoryGain),
    continuity: continuityGain,
    survival: survivalGain,
    total: Math.max(0, territoryGain) + continuityGain + survivalGain + mergeGain
  };

  const scores = {
    merge: state.scores.merge + mergeGain,
    territory: state.scores.territory + Math.max(0, territoryGain),
    survival: state.scores.survival + survivalGain,
    continuity: state.scores.continuity + continuityGain,
    total: 0
  };
  scores.total = scores.merge + scores.territory + scores.survival + scores.continuity;

  return {
    validMove: true,
    state: {
      ...state,
      board: evolved.board,
      tiles: postTiles,
      controlledCells: finalTerritory.controlled,
      contestedCells: finalTerritory.contested,
      scores,
      turn: state.turn + 1,
      expansionMilestonesReached: evolved.milestonesReached,
      expansionCharge: evolved.expansionCharge,
      nextExpansionThreshold: evolved.nextThreshold,
      growthCounters: effects.growthCounters,
      gameOver: over,
      rngState,
      lastReward: turnReward,
      log: [
        `Turn ${state.turn + 1}: ${direction} | territory +${Math.max(0, territoryGain)} | continuity +${continuityGain}`,
        ...state.log
      ].slice(0, 5)
    }
  };
}

function spawnRandomTile(activeCells: boolean[][], tiles: (Tile | null)[][], seed: number): { seed: number } | null {
  const empties = getEmptyActiveCells({ width: 6, height: 6, activeCells, newlyActivated: [] }, tiles);
  if (empties.length === 0) return null;
  const pickCell = pickRandomIndex(seed, empties.length);
  const picked = empties[pickCell.index];
  const levelRoll = nextRng(pickCell.seed);
  tiles[picked.y][picked.x] = {
    id: makeId(),
    kind: 'basic',
    level: levelRoll.value < 0.8 ? 1 : 2
  };
  return { seed: levelRoll.seed };
}

export function hasAnyValidMove(activeCells: boolean[][], tiles: (Tile | null)[][]): boolean {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  return dirs.some((d) => JSON.stringify(resolveSlide(tiles, activeCells, d, 1, makeId).nextTiles) !== JSON.stringify(tiles));
}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(raw: string): GameState {
  return JSON.parse(raw) as GameState;
}

export function applyAction(state: GameState, action: Direction): StepResult {
  return step(state, action);
}
