import { inBounds, neighbors } from './board';
import { Board, Tile } from './types';

export function computeTerritory(
  board: Board,
  tiles: (Tile | null)[][]
): {
  controlled: boolean[][];
  contested: boolean[][];
  territoryCount: number;
  contestedCount: number;
  continuityBonus: number;
} {
  const controlled = Array.from({ length: board.height }, () => Array.from({ length: board.width }, () => false));

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const tile = tiles[y][x];
      if (!tile || tile.kind !== 'core') continue;
      const radius = tile.subtype === 'beacon' ? 2 : tile.subtype === 'growth' ? 1 : 0;
      for (let yy = 0; yy < board.height; yy += 1) {
        for (let xx = 0; xx < board.width; xx += 1) {
          if (!board.activeCells[yy][xx]) continue;
          const dist = Math.abs(xx - x) + Math.abs(yy - y);
          if (dist <= radius) controlled[yy][xx] = true;
        }
      }
      controlled[y][x] = true;
    }
  }

  let territoryCount = 0;
  const contested = Array.from({ length: board.height }, () => Array.from({ length: board.width }, () => false));
  let contestedCount = 0;

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      if (!board.activeCells[y][x]) continue;
      if (controlled[y][x]) territoryCount += 1;

      if (!controlled[y][x]) {
        const nearControl = neighbors({ x, y }).some(
          (n) => inBounds(board, n) && board.activeCells[n.y][n.x] && controlled[n.y][n.x]
        );
        if (nearControl) {
          contested[y][x] = true;
          contestedCount += 1;
        }
      }
    }
  }

  const continuityBonus = largestConnected(controlled, board.activeCells);
  return { controlled, contested, territoryCount, contestedCount, continuityBonus };
}

function largestConnected(controlled: boolean[][], activeCells: boolean[][]): number {
  const h = controlled.length;
  const w = controlled[0].length;
  const visited = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  let best = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (visited[y][x] || !controlled[y][x] || !activeCells[y][x]) continue;
      let size = 0;
      const stack = [{ x, y }];
      visited[y][x] = true;
      while (stack.length) {
        const p = stack.pop()!;
        size += 1;
        for (const n of neighbors(p)) {
          if (!inBounds({ width: w, height: h, activeCells, newlyActivated: [] }, n)) continue;
          if (visited[n.y][n.x] || !controlled[n.y][n.x] || !activeCells[n.y][n.x]) continue;
          visited[n.y][n.x] = true;
          stack.push(n);
        }
      }
      best = Math.max(best, size);
    }
  }
  return best;
}
