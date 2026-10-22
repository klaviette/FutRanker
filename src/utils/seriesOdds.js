export function winsNeeded(bestOf) {
  return Math.floor(bestOf / 2) + 1
}

export function isFinished(target, a, b, winBy2 = false) {
  const margin = winBy2 ? 2 : 1
  return (a >= target && a - b >= margin) || (b >= target && b - a >= margin)
}

// Probability that A wins from a tie once both sides are past target - 1 and
// must win by 2: A has to win two in a row before B does.
function deuceWinChance(p) {
  const q = 1 - p
  return p * p / (p * p + q * q)
}

// A tie that goes to extra games (win by 2 only).
function isExtraTie(target, a, b, winBy2) {
  return winBy2 && a === b && a >= target - 1
}

// Just the chance that A wins from (winsA, winsB). Cheap enough to call once per
// point when plotting a curve: O(target²) with no allocations beyond one row.
export function seriesWinChance(target, winsA, winsB, p, { winBy2 = false } = {}) {
  const q = 1 - p
  if (isFinished(target, winsA, winsB, winBy2)) return winsA > winsB ? 1 : 0
  if (winBy2 && winsA >= target - 1 && winsB >= target - 1) {
    const d = deuceWinChance(p)
    const diff = winsA - winsB
    return diff === 0 ? d : diff === 1 ? p + q * d : p * d
  }

  // Backward induction over the regulation grid. row[j] holds V(i, j) for the
  // current i; V(i, j) = p·V(i+1, j) + q·V(i, j+1).
  const value = (i, j) =>
    isExtraTie(target, i, j, winBy2) ? deuceWinChance(p)
    : isFinished(target, i, j, winBy2) ? (i > j ? 1 : 0)
    : null
  let below = new Float64Array(target + 2) // V(i+1, ·)
  for (let i = target; i >= winsA; i--) {
    const row = new Float64Array(target + 2)
    for (let j = target; j >= winsB; j--) {
      const fixed = value(i, j)
      row[j] = fixed !== null ? fixed : p * below[j] + q * row[j + 1]
    }
    below = row
  }
  return below[winsB]
}

// Probability of every possible final result from the current state, assuming each
// remaining game is independent and side A wins any game with probability p.
// `target` is the number of wins needed (first to N). With winBy2, a tie at or past
// target - 1 goes to extra games; those are grouped into one outcome per side
// marked `extraFrom` (the tied score they start from).
// Returns { pA, pB, outcomes: [{ winner, a, b, prob, extraFrom? }] }.
export function seriesOdds(target, winsA, winsB, p, { winBy2 = false } = {}) {
  const q = 1 - p

  if (isFinished(target, winsA, winsB, winBy2)) {
    const winner = winsA > winsB ? 'A' : 'B'
    return { pA: winner === 'A' ? 1 : 0, pB: winner === 'B' ? 1 : 0, outcomes: [{ winner, a: winsA, b: winsB, prob: 1 }] }
  }

  // Forward pass: spread probability mass across the score grid. Every path ends
  // (finished or an extra-games tie) within one game of max(target, score) + 1.
  const size = Math.max(target, winsA, winsB) + 2
  const mass = Array.from({ length: size + 1 }, () => new Float64Array(size + 1))
  mass[winsA][winsB] = 1
  const finals = []
  const extras = []
  for (let i = winsA; i <= size; i++) {
    for (let j = winsB; j <= size; j++) {
      const m = mass[i][j]
      if (!m) continue
      if (isFinished(target, i, j, winBy2)) {
        finals.push({ winner: i > j ? 'A' : 'B', a: i, b: j, prob: m })
      } else if (isExtraTie(target, i, j, winBy2)) {
        const d = deuceWinChance(p)
        extras.push({ winner: 'A', a: i, b: j, prob: m * d, extraFrom: i })
        extras.push({ winner: 'B', a: i, b: j, prob: m * (1 - d), extraFrom: i })
      } else {
        mass[i + 1][j] += m * p
        mass[i][j + 1] += m * q
      }
    }
  }

  const byWinner = w => [...finals.filter(o => o.winner === w), ...extras.filter(o => o.winner === w)]
  const outcomes = [
    ...byWinner('A').sort((x, y) => x.b - y.b),
    ...byWinner('B').sort((x, y) => x.a - y.a),
  ]
  const pA = outcomes.filter(o => o.winner === 'A').reduce((s, o) => s + o.prob, 0)
  return { pA, pB: 1 - pA, outcomes }
}

// Reverse of seriesWinChance: the per-game chance p for side A that gives side A
// the requested series win chance from this state. Series odds rise strictly with
// p for any live state, so bisection always converges.
export function solveGameChance(target, winsA, winsB, seriesChance, { winBy2 = false } = {}) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (seriesWinChance(target, winsA, winsB, mid, { winBy2 }) < seriesChance) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// Margin and total-games distributions from seriesOdds outcomes, for handicap and
// over/under lines. Margins are signed (positive = A wins by that many). Extra-game
// outcomes (win by 2) always end with a 2-game margin; their total is geometric: from a
// tie at k–k each pair of games ends it with chance p² + q², else it's tied again.
// Returns { margins: [{ margin, prob }], totals: [{ total, prob }] } sorted ascending.
export function marginAndTotals(outcomes, p) {
  const q = 1 - p
  const margins = new Map()
  const totals = new Map()
  const add = (map, key, prob) => map.set(key, (map.get(key) ?? 0) + prob)
  const tieMass = new Map()

  for (const o of outcomes) {
    if (o.extraFrom === undefined) {
      add(margins, o.a - o.b, o.prob)
      add(totals, o.a + o.b, o.prob)
    } else {
      add(margins, o.winner === 'A' ? 2 : -2, o.prob)
      add(tieMass, o.extraFrom, o.prob)
    }
  }

  const decide = p * p + q * q // a pair of games ends it
  const again = 2 * p * q // a pair of games ties it again
  for (const [k, mass] of tieMass) {
    let reach = mass
    for (let j = 0; reach > 1e-13 && j < 1000; j++) {
      add(totals, 2 * k + 2 + 2 * j, reach * decide)
      reach *= again
    }
  }

  const sorted = (map, key) => [...map].map(([k, prob]) => ({ [key]: k, prob })).sort((x, y) => x[key] - y[key])
  return { margins: sorted(margins, 'margin'), totals: sorted(totals, 'total') }
}
