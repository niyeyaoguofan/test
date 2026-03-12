import { GameState } from '../game/types';

interface Props {
  state: GameState;
  onRestart: () => void;
}

export function Hud({ state, onRestart }: Props) {
  const territory = state.controlledCells.flat().filter(Boolean).length;
  const contested = state.contestedCells.flat().filter(Boolean).length;
  return (
    <div className="hud">
      <div><strong>Score:</strong> {state.scores.total}</div>
      <div><strong>Turn:</strong> {state.turn}</div>
      <div><strong>Territory:</strong> {territory}</div>
      <div><strong>Contested:</strong> {contested}</div>
      <div><strong>Expansion charge:</strong> {state.expansionCharge}/{state.nextExpansionThreshold}</div>
      <button onClick={onRestart}>Restart</button>
    </div>
  );
}
