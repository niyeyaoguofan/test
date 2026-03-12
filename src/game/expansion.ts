import { inBounds, neighbors } from './board';
import { Board, Position } from './types';

const INITIAL_THRESHOLD = 18;
const GROWTH_PER_EXPANSION = 7;
const MAX_UNLOCK_PER_EVENT = 4;

function frontierCandidates(board: Board, controlled: boolean[][]): Array<Position & { support: number }> {
  const frontier = new Map<string, Position & { support: number }>();

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      if (!controlled[y][x]) continue;
      for (const n of neighbors({ x, y })) {
        if (!inBounds(board, n) || board.activeCells[n.y][n.x]) continue;
        const key = `${n.x},${n.y}`;
        const prev = frontier.get(key);
        frontier.set(key, { ...n, support: (prev?.support ?? 0) + 1 });
      }
    }
  }

  return Array.from(frontier.values()).sort((a, b) => b.support - a.support || a.y - b.y || a.x - b.x);
}

export function evolveBoard(
  board: Board,
  controlled: boolean[][],
  turn: number,
  expansionCharge: number,
  nextThreshold: number,
  milestonesReached: number
): {
  board: Board;
  expansionCharge: number;
  nextThreshold: number;
  milestonesReached: number;
} {
  const candidates = frontierCandidates(board, controlled);
  if (candidates.length === 0) {
    return {
      board: { ...board, newlyActivated: [] },
      expansionCharge,
      nextThreshold,
      milestonesReached
    };
  }

  const cadenceTrigger = turn > 0 && turn % 4 === 0;
  const thresholdTrigger = expansionCharge >= nextThreshold;
  if (!cadenceTrigger && !thresholdTrigger) {
    return {
      board: { ...board, newlyActivated: [] },
      expansionCharge,
      nextThreshold,
      milestonesReached
    };
  }

  const unlockCount = thresholdTrigger ? MAX_UNLOCK_PER_EVENT : 1;
  const chosen = candidates.slice(0, unlockCount);
  const activeCells = board.activeCells.map((row) => [...row]);
  chosen.forEach((p) => {
    activeCells[p.y][p.x] = true;
  });

  let nextCharge = expansionCharge;
  let nextMilestone = milestonesReached;
  let threshold = nextThreshold;

  if (thresholdTrigger) {
    nextCharge = Math.max(0, expansionCharge - nextThreshold);
    nextMilestone += 1;
    threshold += GROWTH_PER_EXPANSION;
  }

  return {
    board: { ...board, activeCells, newlyActivated: chosen },
    expansionCharge: nextCharge,
    nextThreshold: threshold,
    milestonesReached: nextMilestone
  };
}

export function initialExpansionThreshold(): number {
  return INITIAL_THRESHOLD;
}
