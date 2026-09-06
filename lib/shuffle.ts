/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle, but avoid returning the exact original order when possible. */
export function shuffleChanged<T>(arr: readonly T[]): T[] {
  if (arr.length < 2) return arr.slice();
  for (let attempt = 0; attempt < 5; attempt++) {
    const out = shuffle(arr);
    if (out.some((v, i) => v !== arr[i])) return out;
  }
  return shuffle(arr);
}
