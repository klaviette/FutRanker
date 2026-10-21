// Per-game win chance estimates for side A.

// Standard Elo expected score: a 400-point gap ≈ 10:1 (≈ 91%).
export function eloWinChance(ratingA, ratingB, scale = 400) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / scale))
}

// Bill James' log5: chance A beats B given each side's overall win rate.
export function log5(pA, pB) {
  const denom = pA + pB - 2 * pA * pB
  if (denom === 0) return 0.5 // both perfect or both winless
  return (pA - pA * pB) / denom
}

// Win–loss records → log5. A side with no games counts as .500.
export function recordWinChance(winsA, lossesA, winsB, lossesB) {
  const rate = (w, l) => (w + l > 0 ? w / (w + l) : 0.5)
  return log5(rate(winsA, lossesA), rate(winsB, lossesB))
}
