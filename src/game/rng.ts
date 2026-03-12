export function nextRng(seed: number): { seed: number; value: number } {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function pickRandomIndex(seed: number, maxExclusive: number): { seed: number; index: number } {
  const { seed: nextSeed, value } = nextRng(seed);
  return { seed: nextSeed, index: Math.floor(value * maxExclusive) };
}
