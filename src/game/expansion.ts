import { inBounds, neighbors } from './board';
import { Board, Position } from './types';

const MILESTONES = [35, 80, 140, 220];

export function getMilestones() {
  return MILESTONES;
}

export function maybeExpandBoard(board: Board, controlledCells: boolean[][], score: number, reached: number): { board: Board; reached: number; nextThreshold: number } {
  if (reached >= MILESTONES.length || score < MILESTONES[reached]) {
    return { board: { ...board, newlyActivated: [] }, reached, nextThreshold: MILESTONES[reached] ?? -1 };
  }

  const toUnlock = 3;
  const frontier: Position[] = [];
  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      if (!controlledCells[y][x]) continue;
      for (const n of neighbors({ x, y })) {
        if (!inBounds(board, n) || board.activeCells[n.y][n.x]) continue;
        frontier.push(n);
      }
    }
  }

  const unique = Array.from(new Map(frontier.map((p) => [`${p.x},${p.y}`, p])).values()).slice(0, toUnlock);
  const activeCells = board.activeCells.map((row) => [...row]);
  unique.forEach((p) => {
    activeCells[p.y][p.x] = true;
  });

  return {
    board: { ...board, activeCells, newlyActivated: unique },
    reached: reached + 1,
    nextThreshold: MILESTONES[reached + 1] ?? -1
  };
}
