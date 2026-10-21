# FutRanker — "The Toolbox"

A small multi-page React 19 + Vite 8 static site, deployed to GitHub Pages at **futranker.win**.
The root is a hub page ("The Toolbox") linking to independent tools ("modules"). Modules are
deliberately unrelated in topic, so keep the hub copy general (no football-specific wording on it).

## Commands

```bash
npm run dev      # dev server (React dev mode + StrictMode is much slower than prod; judge perf with build+preview)
npm run build    # outputs dist/
npm run preview  # serve dist/ locally
npm test         # vitest (jsdom)
npm run lint     # oxlint
npm run deploy   # builds, then gh-pages -d dist
```

## Pages (Vite multi-page)

Each page is its own HTML entry, registered in `build.rolldownOptions.input` in `vite.config.js`.
**A new page must be added there or it won't be built.**

| URL | HTML entry | React entry | What it is |
|---|---|---|---|
| `/` | `index.html` | `src/home/main.jsx` → `Home.jsx` | Hub: title, list of module cards |
| `/goat/` | `goat/index.html` | `src/main.jsx` → `App.jsx` | The GOAT Calculator (original app) |
| `/series-odds/` | `series-odds/index.html` | `src/series/main.jsx` → `SeriesOdds.jsx` | Series-State Odds Calculator |

Links between pages are plain `<a href>` to absolute folder paths (`/goat/`, `/series-odds/`, `/`) —
no router. Each tool page has a "← All tools" link (`.home-link` in `src/index.css`).

### Adding a module
1. Create `<slug>/index.html` (copy an existing one: fonts, AdSense script, favicon, `#root`).
2. Create `src/<slug>/main.jsx` importing `../index.css` (shared theme) plus any page CSS.
3. Add the entry to `vite.config.js`.
4. Add a card to the `MODULES` array in `src/home/Home.jsx` (`href`, `blurb`, `tags`, `icon`).
   Omitting `href` renders a locked "Coming soon" card.

## Visual style

- Dark "glass panel" theme. Shared tokens and components live in `src/index.css`
  (`--bg-0`, `--chalk*`, `--amber*`, `.panel`, `.board` 2-col grid, `.preset-btn`, `.rank-toggle`
  round buttons, range slider styling, `.chev`, `.eyebrow`, `.header-logo`).
- Fonts: Oswald (headings, uppercase), Inter (body), IBM Plex Mono (labels/numbers).
- The hub (`src/home/home.css`) uses the same palette with a static faint grid. The owner rejected
  a more "high-tech" version (scanning lines, moving grid, Orbitron font, pulsing lights) as too much —
  keep it restrained.
- Logos are pixel art shown at 128×128 via `.header-logo` (`image-rendering: pixelated`,
  mirrored with `scaleX(-1)`). Source files differ in size (`GoatCalcLogo.png` 32px,
  `SeriesCalcLogo.png` 256px) — always size via CSS, not the file. Home cards use `.hq-card-icon` (48px).
- Prefer themed controls over native ones (e.g. native number spinners are hidden and replaced
  by `−`/`+` `.rank-toggle` buttons).

## The GOAT Calculator (`src/App.jsx`, `src/components/`, `src/data/`, `src/utils/scoring.js`)

Ranks footballers by user-weighted accolade categories.
- Player data is fetched from `https://klaviette.github.io/futrankerdata/greatest_players_full.json`;
  on failure it falls back to `src/data/players.js` and shows a notice.
- `src/data/categories.js` defines category keys/groups; `src/data/presets.js` weight presets
  (the owner edits these often). Weights are 0–10 per category.
- `scoring.js`: each stat is normalised to % of the pool's max, multiplied by weight, summed.
- `WeightPanel` (presets, randomize, grouped sliders), `RankPanel` (top 10, confederation/position
  filter popover, drag-to-reorder), `RankRow`, `DisclaimerPanel`.

## Series-State Odds Calculator (`src/series/`, `src/utils/seriesOdds.js`)

Given a series format, current score and odds, computes who wins the series.

**Two tabs** (`SeriesOdds.jsx`, ARIA tablist): **Forward** (per-game odds → series odds) and
**Reverse** (series odds → implied per-game odds). The **series setup is shared**: `SeriesOdds`
calls `useSeriesSetup()` once and passes it to both tabs, so format, length, win-by-2, names and
score carry across when switching (the owner asked for this). Each tab's **odds inputs stay separate**
(Forward: manual/Elo/record; Reverse: series odds), as does each chart's open/closed state. Both tabs
stay mounted (inactive one `hidden`); element ids are prefixed per tab (`fwd-*`, `rev-*`) because
both are in the DOM.

Files:
- `setup.js` — `useSeriesSetup()` (format, length, win-by-2, names, score + validation/clamping),
  `usePercentField()` (slider + text box kept in sync, with a draft string), `FORMATS`, `pct()`.
- `SetupFields.jsx` — the setup panel is split into labelled `SetupSection`s that all share one
  layout (mono uppercase title → `.so-control-row` → details, divider between sections):
  **Format** (Best of / First to + length stepper on one row, "Need to win by 2" switch, rule hint),
  **Current score** (side rows: pencil icon *before* the editable name, win steppers), and the odds
  section from `GameOddsInput` (**Per-game odds** on Forward / **Series odds** on Reverse).
  Keep new setup controls inside a section and follow that pattern. Also exports `PercentField`,
  `AssumptionNote`.
- `GameOddsInput.jsx` — the **Manual / Elo / Record** source picker, on *both* tabs. State lives in
  `useOddsEstimate()` (`setup.js`), called once per tab, so each tab has its own source choice and
  Elo/record values. `est.p` is the per-game estimate (null in Manual). Estimates come from
  `src/utils/gameEstimates.js` (`eloWinChance`, 400-point scale; `log5`/`recordWinChance`,
  Bill James log5, no-games side = .500).
  - Forward: Manual = per-game slider; Elo/Record give the per-game odds directly.
  - Reverse: Manual = series-odds slider; Elo/Record per-game estimate → `seriesWinChance` → series
    odds, which the solver then inverts (so it lands back on the estimate).
  - "Fine-tune manually" (and clicking the chart) copies the current value into that tab's slider
    and switches to Manual.
  Number boxes use `useNumberField` (keeps the last valid value while a draft is invalid).
- Each tab's slider is its own value (Forward = per-game %, Reverse = series %); the owner chose
  to keep them separate rather than converting one into the other on tab switch.
- `storage.js` — remembers settings across reloads in `localStorage` key `seriesOdds.settings.v1`:
  `format`, `length`, `winBy2` (saved by `useSeriesSetup`) and the two sliders `gamePct` (Forward)
  and `seriesPct` (Reverse) (saved via `usePercentField(..., saveKey)`). Names, score, Elo/record
  inputs are *not* saved. Every access is try/caught and invalid saved values fall back to defaults.
  Tests clear `localStorage` in `beforeEach` so saved state can't leak between them.
- `ResultPanels.jsx` — `SplitPanel` (two big percentages + split bar), `ChartPanel`
  (collapsible; unmounts the chart when closed), `BreakdownPanel` (every final score).
- `OddsCurve.jsx` — SVG chart of series win % vs game win %. Measures its container with
  ResizeObserver and draws at real pixel width (so text doesn't scale). Hover tooltip; click sets odds.
- `series.css` — page styles (`so-*` classes). Chart marks use `--series-a` `#C7801F` /
  `--series-b` `#2FA586` (validated as a colour-blind-safe pair on the dark surface); text stays in
  chalk colours, not series colours.

Rules / semantics:
- **Best of N**: odd N, 1–99; wins needed = ⌊N/2⌋+1. **First to N**: 1–50. Switching format keeps
  the same wins needed (best of 7 ⇄ first to 4).
- **Win by 2**: once both sides reach `target − 1` and are tied, play continues until someone leads
  by 2 (solved exactly via the deuce formula p²/(p²+q²)). Scores may then exceed the target
  (e.g. 14–13 in first to 13). The breakdown groups extra-game outcomes into one row per side
  ("after 12–12", `extraFrom` on the outcome).
- Score steppers are bounded by `minWins`/`maxWins` so the state can never be a finished series;
  changing length/format/win-by-2 re-clamps the score.
- Model assumption (shown on page): games are independent with constant odds.
- Copy: the manual per-game input is labelled "Side A fair odds or best estimate per game"; reverse input is
  "Side A series odds".

`src/utils/seriesOdds.js` (pure, tested):
- `seriesWinChance(target, a, b, p, {winBy2})` — fast O(target²) backward induction, used per chart
  point (101× per render) and by the solver.
- `seriesOdds(...)` — forward pass over a Float64Array grid returning `{pA, pB, outcomes}`.
- `solveGameChance(target, a, b, seriesChance, {winBy2})` — bisection (series odds are strictly
  increasing in p).
- Performance matters: an earlier Map/string-keyed version stuttered (~60ms per change at best of 99).
  Keep these array-based and avoid calling `seriesOdds` per chart point.

## Tests

`src/tests/` — vitest + Testing Library. Key suites: `seriesOdds.test.js` (math incl. tennis-game
value 0.7357 at p=0.6, forward/reverse round-trip, both calculators agree), `SeriesOdds.test.jsx`
(format switch, win-by-2, collapse, reverse solve, shared setup across tabs — query within
`getByRole('tabpanel')` since hidden tabs are in the DOM), `Home.test.jsx`, plus GOAT component tests.

## Deployment notes

- `public/CNAME` (futranker.win) is copied into `dist/`. `base: '/'`.
- Moving the GOAT Calculator from `/` to `/goat/` means old links to the root now land on the hub.
