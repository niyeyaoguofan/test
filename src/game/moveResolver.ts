import { cloneTileGrid } from './board';
import { pickRandomIndex } from './rng';
import { Direction, SlideResult, Tile } from './types';

const CORE_TYPES = ['beacon', 'attractor', 'growth'] as const;

function lineIndices(dir: Direction, fixed: number, index: number) {
  switch (dir) {
    case 'left':
      return { y: fixed, x: index };
    case 'right':
      return { y: fixed, x: 5 - index };
    case 'up':
      return { y: index, x: fixed };
    case 'down':
      return { y: 5 - index, x: fixed };
  }
}

export function resolveSlide(
  tiles: (Tile | null)[][],
  activeCells: boolean[][],
  direction: Direction,
  seed: number,
  idFactory: () => string
): SlideResult & { seed: number } {
  const next = cloneTileGrid(tiles);
  let mergedThisTurn = false;
  let mergeScoreGained = 0;
  let rngSeed = seed;

  for (let lane = 0; lane < 6; lane += 1) {
    const candidates: Tile[] = [];
    for (let i = 0; i < 6; i += 1) {
      const { x, y } = lineIndices(direction, lane, i);
      if (!activeCells[y][x]) continue;
      const tile = next[y][x];
      if (tile) {
        candidates.push(tile);
        next[y][x] = null;
      }
    }

    const compacted: Tile[] = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const current = candidates[i];
      const upcoming = candidates[i + 1];
      if (
        current.kind === 'basic' &&
        upcoming &&
        upcoming.kind === 'basic' &&
        current.level === upcoming.level
      ) {
        mergedThisTurn = true;
        if (current.level === 4) {
          const pick = pickRandomIndex(rngSeed, CORE_TYPES.length);
          rngSeed = pick.seed;
          compacted.push({
            id: idFactory(),
            kind: 'core',
            subtype: CORE_TYPES[pick.index]
          });
          mergeScoreGained += 64;
        } else {
          compacted.push({ id: idFactory(), kind: 'basic', level: current.level + 1 });
          mergeScoreGained += current.level * 8;
        }
        i += 1;
      } else {
        compacted.push(current);
      }
    }

    let write = 0;
    for (let i = 0; i < 6; i += 1) {
      const { x, y } = lineIndices(direction, lane, i);
      if (!activeCells[y][x]) continue;
      next[y][x] = compacted[write] ?? null;
      write += 1;
    }
  }

  return { nextTiles: next, mergedThisTurn, mergeScoreGained, seed: rngSeed };
}
