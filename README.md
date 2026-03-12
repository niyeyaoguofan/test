# Territory Merge Prototype (React + TypeScript)

An evolving single-player strategy-puzzle where slide-merge actions are a tool for building stable territory on a living board.

## Current architecture (existing repo + v2 iteration)

The project keeps a clean split between UI and headless rules:

```text
src/
  components/
    GameBoard.tsx   # Visual board + cell state rendering
    Hud.tsx         # Score, turn, territory, expansion info, restart
  game/
    types.ts        # Serializable state contracts
    rng.ts          # Seeded randomness
    board.ts        # Board helpers
    moveResolver.ts # Global slide + merge resolution
    effects.ts      # Core effects (deterministic order)
    territory.ts    # Territory / contested / continuity calculation
    expansion.ts    # Dynamic board evolution rules
    engine.ts       # Headless turn loop API
  App.tsx
  main.tsx
  styles.css
```

### What already aligned well
- Modular headless engine (`createInitialState`, `applyAction`, serialization) for future AI wrapping.
- Deterministic turn loop with seeded randomness only where intended.
- Distinct tile/core identities and readable code separation.

### What was shallow in v1
- Expansion felt like occasional bonus, not a central planning axis.
- Scoring still leaned too much toward merges.
- Territory had limited spatial tension (little distinction between stable control and frontier pressure).

## v2 Rules Upgrade (minimal, strategic)

### 1) Living board evolution
- Expansion now uses **territory-generated expansion charge**.
- Controlled area + continuity produce charge each turn.
- When charge crosses threshold, a **local cluster** of frontier cells unlocks.
- Additionally, every 4 turns a small cadence unlock may add 1 frontier cell.
- Unlocking is local, deterministic, and support-based (cells adjacent to more controlled cells unlock first).

### 2) Territory-first incentives
- Score emphasis shifted to:
  - Territory reward (dominant)
  - Continuity reward (strong)
  - Survival reward (small)
  - Merge reward (reduced; still important for core creation)
- Merging remains key, but primarily as an enabler for spatial control.

### 3) Spatial pressure feedback
- Added **contested cells**: active uncontrolled cells adjacent to controlled territory.
- Contested cells reduce territory gain and are rendered distinctly.
- This creates a clear “build + stabilize frontier” loop.

## Precise turn order
1. Player picks global slide direction.
2. Slide + merge resolve.
3. Core effects resolve in deterministic order.
4. Territory/contested/continuity update.
5. Expansion charge updates and board may evolve.
6. New tile spawns (80% level 1, 20% level 2).
7. Game-over check (no valid moves).

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Future AI Extension Notes

Engine remains AI-friendly:
- Headless API: `createInitialState(seed)`, `applyAction(state, action)`.
- Serialization: `serializeState` / `deserializeState`.
- Compact action space: 4 directions.
- Reproducible stochasticity through seeded RNG state.
- Reward components remain separable for RL:
  - merge reward,
  - territory reward,
  - continuity reward,
  - survival reward.
