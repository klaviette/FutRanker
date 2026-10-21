// Remembers a few series settings in this browser across reloads.
// Storage can be unavailable (private mode, blocked site data), so every access is guarded
// and anything missing or invalid falls back to the defaults.
const KEY = 'seriesOdds.settings.v1'

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(KEY)
    const data = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

export function saveSettings(patch) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...loadSettings(), ...patch }))
  } catch {
    // Not saving is fine; the page works the same without it.
  }
}

export function savedNumber(value, min, max, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback
}
