import { getEmptyActiveCells, inBounds, neighbors } from './board';
import { pickRandomIndex } from './rng';
import { Board, Position, Tile } from './types';

const GROWTH_INTERVAL = 3;

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function resolveCoreEffects(
  board: Board,
  tiles: (Tile | null)[][],
  growthCounters: Record<string, number>,
  seed: number,
  idFactory: () => string
): { tiles: (Tile | null)[][]; growthCounters: Record<string, number>; seed: number } {
  const nextTiles = tiles.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  const nextGrowth = { ...growthCounters };
  let rngSeed = seed;

  const corePositions: Array<{ x: number; y: number; tile: Tile }> = [];
  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const tile = nextTiles[y][x];
      if (tile?.kind === 'core') corePositions.push({ x, y, tile });
    }
  }

  // deterministic ordering: beacon -> attractor -> growth, then by y/x
  const order = { beacon: 0, attractor: 1, growth: 2 } as const;
  corePositions.sort((a, b) => order[a.tile.subtype] - order[b.tile.subtype] || a.y - b.y || a.x - b.x);

  for (const core of corePositions) {
    if (core.tile.kind !== 'core') continue;
    if (core.tile.subtype === 'attractor') {
      const candidates: Array<{ from: Position; to: Position; level: number }> = [];
      for (let y = 0; y < board.height; y += 1) {
        for (let x = 0; x < board.width; x += 1) {
          const tile = nextTiles[y][x];
          if (!tile || tile.kind !== 'basic' || tile.level > 2) continue;
          if (manhattan({ x, y }, { x: core.x, y: core.y }) > 2) continue;
          const dx = Math.sign(core.x - x);
          const dy = Math.sign(core.y - y);
          const target = Math.abs(core.x - x) >= Math.abs(core.y - y) ? { x: x + dx, y } : { x, y: y + dy };
          if (!inBounds(board, target) || !board.activeCells[target.y][target.x] || nextTiles[target.y][target.x]) continue;
          candidates.push({ from: { x, y }, to: target, level: tile.level });
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.level - b.level || manhattan(a.from, { x: core.x, y: core.y }) - manhattan(b.from, { x: core.x, y: core.y }));
        const pull = candidates[0];
        nextTiles[pull.to.y][pull.to.x] = nextTiles[pull.from.y][pull.from.x];
        nextTiles[pull.from.y][pull.from.x] = null;
      }
    }

    if (core.tile.subtype === 'growth') {
      nextGrowth[core.tile.id] = (nextGrowth[core.tile.id] ?? 0) + 1;
      if (nextGrowth[core.tile.id] >= GROWTH_INTERVAL) {
        const empties = neighbors({ x: core.x, y: core.y }).filter(
          (p) => inBounds(board, p) && board.activeCells[p.y][p.x] && !nextTiles[p.y][p.x]
        );
        if (empties.length > 0) {
          const pick = pickRandomIndex(rngSeed, empties.length);
          rngSeed = pick.seed;
          const target = empties[pick.index];
          nextTiles[target.y][target.x] = { id: idFactory(), kind: 'basic', level: 1 };
          nextGrowth[core.tile.id] = 0;
        }
      }
    }
  }

  // cleanup removed growth cores
  const activeCoreIds = new Set(
    nextTiles.flatMap((row) => row.filter((tile): tile is Tile => !!tile && tile.kind === 'core' && tile.subtype === 'growth').map((t) => t.id))
  );
  Object.keys(nextGrowth).forEach((key) => {
    if (!activeCoreIds.has(key)) delete nextGrowth[key];
  });

  // if no empties left after effects, keep state as is
  getEmptyActiveCells(board, nextTiles);

  return { tiles: nextTiles, growthCounters: nextGrowth, seed: rngSeed };
}
