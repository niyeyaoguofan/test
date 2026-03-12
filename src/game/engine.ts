import { createBoard, createEmptyTileGrid, getEmptyActiveCells } from './board';
import { resolveCoreEffects } from './effects';
import { maybeExpandBoard } from './expansion';
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
    scores: {
      merge: 0,
      territory: 0,
      survival: 0,
      continuity: 0,
      total: 0
    },
    expansionMilestonesReached: 0,
    nextExpansionThreshold: 35,
    growthCounters: {},
    gameOver: false,
    rngState,
    log: []
  };
}

export function step(state: GameState, direction: Direction): StepResult {
  if (state.gameOver) return { state, validMove: false };

  const before = JSON.stringify(state.tiles);
  const slide = resolveSlide(state.tiles, state.board.activeCells, direction, state.rngState, makeId);
  const afterSlide = JSON.stringify(slide.nextTiles);
  if (before === afterSlide) {
    return { state: { ...state, log: ['Invalid move: no tile shifted or merged.', ...state.log].slice(0, 5) }, validMove: false };
  }

  const effects = resolveCoreEffects(state.board, slide.nextTiles, state.growthCounters, slide.seed, makeId);
  const territory = computeTerritory(state.board, effects.tiles);

  const survival = 2;
  const territoryGain = territory.territoryCount * 3;
  const continuity = territory.continuityBonus;

  let score = {
    merge: state.scores.merge + slide.mergeScoreGained,
    territory: territoryGain,
    survival: state.scores.survival + survival,
    continuity,
    total: 0
  };
  score.total = score.merge + score.territory + score.survival + score.continuity;

  const expanded = maybeExpandBoard(state.board, territory.controlled, score.total, state.expansionMilestonesReached);

  const postTiles = effects.tiles.map((r) => [...r]);
  const spawned = spawnRandomTile(expanded.board.activeCells, postTiles, effects.seed);
  const rngState = spawned?.seed ?? effects.seed;

  const finalTerritory = computeTerritory(expanded.board, postTiles);
  const over = !hasAnyValidMove(expanded.board.activeCells, postTiles);

  return {
    validMove: true,
    state: {
      ...state,
      board: expanded.board,
      tiles: postTiles,
      controlledCells: finalTerritory.controlled,
      scores: { ...score, territory: finalTerritory.territoryCount * 3, continuity: finalTerritory.continuityBonus, total: score.merge + finalTerritory.territoryCount * 3 + score.survival + finalTerritory.continuityBonus },
      turn: state.turn + 1,
      expansionMilestonesReached: expanded.reached,
      nextExpansionThreshold: expanded.nextThreshold,
      growthCounters: effects.growthCounters,
      gameOver: over,
      rngState,
      log: [
        `Turn ${state.turn + 1}: ${direction} | +${slide.mergeScoreGained} merge`,
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
