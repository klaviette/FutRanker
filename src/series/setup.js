import { useState } from 'react'
import { winsNeeded, isFinished } from '../utils/seriesOdds'

export const FORMATS = {
  bestOf: { label: 'Best of', min: 1, max: 99, step: 2 },
  firstTo: { label: 'First to', min: 1, max: 50, step: 1 },
}

function lengthError(format, draft) {
  const { min, max } = FORMATS[format]
  const n = Number(draft)
  if (draft.trim() === '') return 'Enter a number.'
  if (!Number.isInteger(n) || n < min || n > max) return `Enter a whole number from ${min} to ${max}.`
  if (format === 'bestOf' && n % 2 === 0) return 'Use an odd number so the series can’t end in a tie.'
  return null
}

function targetFor(format, length) {
  return format === 'bestOf' ? winsNeeded(length) : length
}

// Highest/lowest score one side can have, given the other's, while the series is still live.
// With win by 2, a side can go past target - 1 as long as it isn't 2 clear.
export function maxWins(other, target, winBy2) {
  return winBy2 && other >= target - 1 ? other + 1 : target - 1
}
export function minWins(other, target, winBy2) {
  return winBy2 && other >= target ? other - 1 : 0
}

function clampScore(a, b, target, winBy2) {
  const ca = Math.min(a, maxWins(b, target, winBy2))
  const cb = Math.min(b, maxWins(ca, target, winBy2))
  return isFinished(target, ca, cb, winBy2) ? [0, 0] : [ca, cb]
}

// All state for one series setup (format, length, win by 2, names, score).
// Each tab calls this separately so their setups never affect each other.
export function useSeriesSetup() {
  const [format, setFormat] = useState('bestOf')
  const [length, setLength] = useState(7)
  const [lengthDraft, setLengthDraft] = useState('7')
  const [winBy2, setWinBy2] = useState(false)
  const [nameA, setNameA] = useState('Side A')
  const [nameB, setNameB] = useState('Side B')
  const [winsA, setWinsA] = useState(0)
  const [winsB, setWinsB] = useState(0)

  const target = targetFor(format, length)
  const fmt = FORMATS[format]
  const lengthErr = lengthError(format, lengthDraft)

  function applyScore(a, b, t, wb2) {
    const [ca, cb] = clampScore(a, b, t, wb2)
    setWinsA(ca)
    setWinsB(cb)
  }

  function changeLengthDraft(value) {
    setLengthDraft(value)
    if (lengthError(format, value) === null) {
      const n = Number(value)
      setLength(n)
      applyScore(winsA, winsB, targetFor(format, n), winBy2)
    }
  }

  // Switching format keeps the same number of wins needed (best of 7 ⇄ first to 4).
  function changeFormat(next) {
    if (next === format) return
    const n = next === 'bestOf' ? 2 * target - 1 : target
    setFormat(next)
    setLength(n)
    setLengthDraft(String(n))
  }

  function changeWinBy2(next) {
    setWinBy2(next)
    applyScore(winsA, winsB, target, next)
  }

  return {
    format, fmt, length, lengthDraft, lengthErr, winBy2, target,
    nameA, nameB, winsA, winsB,
    labelA: nameA.trim() || 'Side A',
    labelB: nameB.trim() || 'Side B',
    lengthHint: winBy2
      ? `First to ${target}, and must lead by 2. A tie at ${target - 1}–${target - 1} or later goes to extra games.`
      : format === 'bestOf' ? `First to ${target} wins.` : `At most ${2 * target - 1} games.`,
    formatMeta: `${fmt.label.toLowerCase()} ${length}${winBy2 ? ', win by 2' : ''}`,
    setNameA, setNameB, setWinsA, setWinsB,
    changeLengthDraft, changeFormat, changeWinBy2,
    restoreLengthDraft: () => { if (lengthErr) setLengthDraft(String(length)) },
  }
}

// A percentage with a slider and a free-entry box that stay in sync.
export function usePercentField(initial, min, max) {
  const [value, setValue] = useState(initial)
  const [draft, setDraft] = useState(String(initial))

  const parse = text => {
    const n = Number(text)
    return text.trim() !== '' && Number.isFinite(n) && n >= min && n <= max ? n : null
  }
  const error = parse(draft) === null ? `Enter a number from ${min} to ${max}.` : null

  return {
    value, draft, error, min, max,
    set(n) { setValue(n); setDraft(String(n)) },
    change(text) {
      setDraft(text)
      const n = parse(text)
      if (n !== null) setValue(n)
    },
    restore() { if (error) setDraft(String(value)) },
  }
}

export function pct(x) {
  return `${(x * 100).toFixed(1)}%`
}
