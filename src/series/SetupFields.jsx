import { FORMATS, maxWins, minWins } from './setup'

// Format, length, win-by-2 and the two sides. `id` keeps element ids unique per tab.
export function SetupFields({ setup: s, id }) {
  return (
    <>
      <div className="so-field">
        <div className="so-seg" role="group" aria-label="Series format">
          {Object.entries(FORMATS).map(([key, f]) => (
            <button
              key={key}
              type="button"
              className={`so-seg-btn${key === s.format ? ' is-active' : ''}`}
              aria-pressed={key === s.format}
              onClick={() => s.changeFormat(key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="so-number-wrap">
          <button
            type="button"
            className="rank-toggle"
            aria-label="Decrease series length"
            disabled={s.length - s.fmt.step < s.fmt.min}
            onClick={() => s.changeLengthDraft(String(s.length - s.fmt.step))}
          >−</button>
          <input
            id={`${id}-length`}
            className={`so-number${s.lengthErr ? ' is-invalid' : ''}`}
            type="number"
            inputMode="numeric"
            min={s.fmt.min}
            max={s.fmt.max}
            step={s.fmt.step}
            value={s.lengthDraft}
            aria-label={s.fmt.label}
            aria-invalid={Boolean(s.lengthErr)}
            aria-describedby={`${id}-length-hint`}
            onChange={e => s.changeLengthDraft(e.target.value)}
            onBlur={s.restoreLengthDraft}
          />
          <button
            type="button"
            className="rank-toggle"
            aria-label="Increase series length"
            disabled={s.length + s.fmt.step > s.fmt.max}
            onClick={() => s.changeLengthDraft(String(s.length + s.fmt.step))}
          >+</button>
        </div>
        <p id={`${id}-length-hint`} className={`so-hint${s.lengthErr ? ' so-hint--error' : ''}`}>
          {s.lengthErr ?? s.lengthHint}
        </p>

        <button
          type="button"
          role="switch"
          aria-checked={s.winBy2}
          className={`so-switch${s.winBy2 ? ' is-on' : ''}`}
          onClick={() => s.changeWinBy2(!s.winBy2)}
        >
          <span className="so-switch-track" aria-hidden="true"><span className="so-switch-thumb" /></span>
          Need to win by 2
        </button>
      </div>

      <div className="so-sides">
        <Side
          name={s.nameA} onName={s.setNameA} placeholder="Side A"
          wins={s.winsA} onWins={s.setWinsA}
          min={minWins(s.winsB, s.target, s.winBy2)} max={maxWins(s.winsB, s.target, s.winBy2)}
        />
        <Side
          name={s.nameB} onName={s.setNameB} placeholder="Side B"
          wins={s.winsB} onWins={s.setWinsB}
          min={minWins(s.winsA, s.target, s.winBy2)} max={maxWins(s.winsA, s.target, s.winBy2)}
        />
      </div>
    </>
  )
}

function Side({ name, onName, placeholder, wins, onWins, min, max }) {
  return (
    <div className="so-side">
      <label className="so-name-wrap">
        <input
          className="so-name"
          value={name}
          placeholder={placeholder}
          aria-label={`${placeholder} name`}
          onChange={e => onName(e.target.value)}
        />
        <svg className="so-pencil" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>
      <div className="so-stepper">
        <button type="button" className="rank-toggle" aria-label={`Decrease ${placeholder} wins`} disabled={wins <= min} onClick={() => onWins(wins - 1)}>−</button>
        <span className="so-wins" aria-label={`${placeholder} wins`}>{wins}</span>
        <button type="button" className="rank-toggle" aria-label={`Increase ${placeholder} wins`} disabled={wins >= max} onClick={() => onWins(wins + 1)}>+</button>
      </div>
    </div>
  )
}

// Slider plus a free-entry box. The slider covers whole percents; the box takes decimals.
export function PercentField({ id, label, field: f }) {
  const sliderMin = Math.ceil(f.min)
  const sliderMax = Math.floor(f.max)
  return (
    <div className="slider-row">
      <div className="slider-label">
        <label className="name" htmlFor={id}>{label}</label>
      </div>
      <div className="so-slider-row">
        <input
          id={id}
          type="range"
          min={sliderMin}
          max={sliderMax}
          step="1"
          value={f.value}
          style={{ '--fill': `${((f.value - sliderMin) / (sliderMax - sliderMin)) * 100}%` }}
          onChange={e => f.set(Number(e.target.value))}
        />
        <span className="so-pct-box">
          <input
            className={`so-number so-number--pct${f.error ? ' is-invalid' : ''}`}
            type="number"
            inputMode="decimal"
            min={f.min}
            max={f.max}
            step="0.1"
            value={f.draft}
            aria-label={`${label}, percent`}
            aria-invalid={Boolean(f.error)}
            onChange={e => f.change(e.target.value)}
            onBlur={f.restore}
          />
          <span className="so-pct-unit" aria-hidden="true">%</span>
        </span>
      </div>
      {f.error && <p className="so-hint so-hint--error">{f.error}</p>}
    </div>
  )
}

export function AssumptionNote() {
  return (
    <div className="note">
      <p>Assumes every remaining game is independent and has the same odds, so it ignores home advantage, momentum and injuries.</p>
    </div>
  )
}
