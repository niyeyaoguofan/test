import { Board, Position, Tile } from './types';

export const TOTAL_SIZE = 6;
export const INITIAL_ACTIVE_MIN = 1;
export const INITIAL_ACTIVE_MAX = 4;

export function createBoard(): Board {
  const activeCells = Array.from({ length: TOTAL_SIZE }, (_, y) =>
    Array.from({ length: TOTAL_SIZE }, (_, x) =>
      y >= INITIAL_ACTIVE_MIN && y <= INITIAL_ACTIVE_MAX && x >= INITIAL_ACTIVE_MIN && x <= INITIAL_ACTIVE_MAX
    )
  );
  return {
    width: TOTAL_SIZE,
    height: TOTAL_SIZE,
    activeCells,
    newlyActivated: []
  };
}

export function createEmptyTileGrid(board: Board): (Tile | null)[][] {
  return Array.from({ length: board.height }, () => Array.from({ length: board.width }, () => null));
}

export function inBounds(board: Board, pos: Position): boolean {
  return pos.x >= 0 && pos.x < board.width && pos.y >= 0 && pos.y < board.height;
}

export function neighbors(pos: Position): Position[] {
  return [
    { x: pos.x + 1, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x, y: pos.y - 1 }
  ];
}

export function cloneTileGrid(tiles: (Tile | null)[][]): (Tile | null)[][] {
  return tiles.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function getEmptyActiveCells(board: Board, tiles: (Tile | null)[][]): Position[] {
  const out: Position[] = [];
  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      if (board.activeCells[y][x] && !tiles[y][x]) {
        out.push({ x, y });
      }
    }
  }
  return out;
}
