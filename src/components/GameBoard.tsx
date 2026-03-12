import { GameState, Tile } from '../game/types';

interface Props {
  state: GameState;
}

function tileLabel(tile: Tile): string {
  if (tile.kind === 'basic') return `${2 ** tile.level}`;
  if (tile.subtype === 'beacon') return 'B';
  if (tile.subtype === 'attractor') return 'A';
  return 'G';
}

function tileClass(tile: Tile): string {
  if (tile.kind === 'basic') return `tile basic level-${Math.min(tile.level, 6)}`;
  return `tile core ${tile.subtype}`;
}

export function GameBoard({ state }: Props) {
  const { board, tiles, controlledCells, contestedCells } = state;

  return (
    <div className="board">
      {tiles.map((row, y) =>
        row.map((cell, x) => {
          const active = board.activeCells[y][x];
          const controlled = controlledCells[y][x];
          const contested = contestedCells[y][x];
          const isNew = board.newlyActivated.some((p) => p.x === x && p.y === y);
          return (
            <div
              key={`${x}-${y}`}
              className={`cell ${active ? 'active' : 'inactive'} ${controlled ? 'controlled' : ''} ${contested ? 'contested' : ''} ${isNew ? 'new-cell' : ''}`}
            >
              {cell ? <div className={tileClass(cell)}>{tileLabel(cell)}</div> : null}
            </div>
          );
        })
      )}
    </div>
  );
}
