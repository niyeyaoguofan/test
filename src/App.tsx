import { useEffect, useMemo, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { applyAction, createInitialState } from './game/engine';
import { Direction, GameState } from './game/types';

export function App() {
  const [state, setState] = useState<GameState>(() => createInitialState(Date.now() % 100000));

  const keyMap = useMemo<Record<string, Direction>>(
    () => ({ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = keyMap[e.key];
      if (!action) return;
      e.preventDefault();
      setState((prev) => applyAction(prev, action).state);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyMap]);

  const clickMove = (d: Direction) => setState((prev) => applyAction(prev, d).state);

  return (
    <main className="app">
      <h1>Territory Merge Prototype</h1>
      <p className="subtitle">Slide, forge cores, and grow a living frontier where territory continuity drives expansion.</p>
      <Hud state={state} onRestart={() => setState(createInitialState(Date.now() % 100000))} />

      <div className="controls">
        <button onClick={() => clickMove('up')}>↑</button>
        <button onClick={() => clickMove('left')}>←</button>
        <button onClick={() => clickMove('down')}>↓</button>
        <button onClick={() => clickMove('right')}>→</button>
      </div>

      <GameBoard state={state} />

      <section className="legend">
        <span className="badge beacon">Beacon</span>
        <span className="badge attractor">Attractor</span>
        <span className="badge growth">Growth</span>
      </section>

      {state.gameOver ? <div className="game-over">Game Over — no valid moves remain.</div> : null}

      <section className="log">
        {state.log.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </section>
    </main>
  );
}
