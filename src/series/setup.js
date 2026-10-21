import { useEffect, useState } from 'react'
import { winsNeeded, isFinished } from '../utils/seriesOdds'
import { eloWinChance, recordWinChance } from '../utils/gameEstimates'
import { loadSettings, saveSettings, savedNumber } from './storage'

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

// Saved format/length/win-by-2, or the defaults if nothing valid was saved.
function savedFormat() {
  const s = loadSettings()
  const format = s.format in FORMATS ? s.format : 'bestOf'
  const length = typeof s.length === 'number' && lengthError(format, String(s.length)) === null
    ? s.length
    : format === 'bestOf' ? 7 : 4
  return { format, length, winBy2: s.winBy2 === true }
}

// All state for one series setup (format, length, win by 2, names, score).
// Called once in SeriesOdds and shared by both tabs. Format, length and win by 2
// are remembered across reloads; names and score are not.
export function useSeriesSetup() {
  const [initial] = useState(savedFormat)
  const [format, setFormat] = useState(initial.format)
  const [length, setLength] = useState(initial.length)
  const [lengthDraft, setLengthDraft] = useState(String(initial.length))
  const [winBy2, setWinBy2] = useState(initial.winBy2)

  useEffect(() => { saveSettings({ format, length, winBy2 }) }, [format, length, winBy2])
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
// With `saveKey`, the value is remembered across reloads under that name.
export function usePercentField(initial, min, max, saveKey) {
  const [value, setValue] = useState(() => saveKey ? savedNumber(loadSettings()[saveKey], min, max, initial) : initial)
  const [draft, setDraft] = useState(() => String(value))

  useEffect(() => { if (saveKey) saveSettings({ [saveKey]: value }) }, [saveKey, value])

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

// A free-entry number box that keeps its last valid value while the draft is invalid.
// `parse` returns the number, or null when the text isn't acceptable.
export function useNumberField(initial, parse, errorText) {
  const [value, setValue] = useState(initial)
  const [draft, setDraft] = useState(String(initial))
  const error = parse(draft) === null ? errorText : null
  return {
    value, draft, error,
    change(text) {
      setDraft(text)
      const n = parse(text)
      if (n !== null) setValue(n)
    },
    restore() { if (error) setDraft(String(value)) },
  }
}

// Manual / Elo / Record source plus the Elo and record inputs, for one tab.
// `p` is side A's estimated per-game chance, or null in manual mode.
export function useOddsEstimate() {
  const [source, setSource] = useState('manual')
  const elo = {
    a: useNumberField(1600, parseRating, 'Enter a rating.'),
    b: useNumberField(1500, parseRating, 'Enter a rating.'),
  }
  const record = {
    winsA: useNumberField(10, parseCount, 'Use a whole number, 0 or more.'),
    lossesA: useNumberField(5, parseCount, 'Use a whole number, 0 or more.'),
    winsB: useNumberField(8, parseCount, 'Use a whole number, 0 or more.'),
    lossesB: useNumberField(7, parseCount, 'Use a whole number, 0 or more.'),
  }
  const p =
    source === 'elo' ? eloWinChance(elo.a.value, elo.b.value)
    : source === 'record' ? recordWinChance(record.winsA.value, record.lossesA.value, record.winsB.value, record.lossesB.value)
    : null
  return { source, setSource, elo, record, p }
}

export const parseRating = text => {
  const n = Number(text)
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}
export const parseCount = text => {
  const n = Number(text)
  return text.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : null
}

export function pct(x) {
  return `${(x * 100).toFixed(1)}%`
}
