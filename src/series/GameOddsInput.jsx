import { PercentField } from './SetupFields'
import { pct } from './setup'

const ODDS_SOURCES = [
  { id: 'manual', label: 'Manual' },
  { id: 'elo', label: 'Elo' },
  { id: 'record', label: 'Record' },
]

// Where the Forward tab's per-game odds come from: typed directly, or estimated
// from Elo ratings or win–loss records. `estimate` is side A's per-game chance (0–1).
export default function GameOddsInput({ id, source, onSource, game, elo, record, estimate, labelA, labelB, onFineTune }) {
  return (
    <div className="so-estimate">
      <div className="so-estimate-head">
        <span className="so-label">Per-game odds from</span>
        <div className="so-seg" role="group" aria-label="Per-game odds source">
          {ODDS_SOURCES.map(o => (
            <button
              key={o.id}
              type="button"
              className={`so-seg-btn${o.id === source ? ' is-active' : ''}`}
              aria-pressed={o.id === source}
              onClick={() => onSource(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {source === 'manual' && (
        <PercentField id={`${id}-game-pct`} label={`${labelA} fair odds or best estimate per game`} field={game} />
      )}

      {source === 'elo' && (
        <>
          <div className="so-estimate-grid">
            <NumberBox label={`${labelA} Elo`} field={elo.a} />
            <NumberBox label={`${labelB} Elo`} field={elo.b} />
          </div>
          <p className="so-hint">Standard Elo: a 400-point gap ≈ 91% per game.</p>
        </>
      )}

      {source === 'record' && (
        <>
          <div className="so-estimate-grid">
            <RecordBox label={labelA} wins={record.winsA} losses={record.lossesA} />
            <RecordBox label={labelB} wins={record.winsB} losses={record.lossesB} />
          </div>
          <p className="so-hint">
            Combines each side&apos;s win rate with the log5 method. Ties are ignored; a side with no games counts as .500.
          </p>
        </>
      )}

      {source !== 'manual' && (
        <div className="so-estimate-out">
          <span>
            {labelA} per game: <b>{pct(estimate)}</b>
          </span>
          <button type="button" className="preset-btn" onClick={onFineTune}>Fine-tune manually</button>
        </div>
      )}
    </div>
  )
}

function NumberBox({ label, field }) {
  return (
    <label className="so-estimate-box">
      <span className="so-estimate-label">{label}</span>
      <input
        className={`so-number${field.error ? ' is-invalid' : ''}`}
        type="number"
        inputMode="decimal"
        value={field.draft}
        aria-invalid={Boolean(field.error)}
        onChange={e => field.change(e.target.value)}
        onBlur={field.restore}
      />
      {field.error && <span className="so-hint so-hint--error">{field.error}</span>}
    </label>
  )
}

function RecordBox({ label, wins, losses }) {
  return (
    <fieldset className="so-estimate-box so-record">
      <legend className="so-estimate-label">{label} record</legend>
      <div className="so-record-row">
        <input
          className={`so-number so-number--small${wins.error ? ' is-invalid' : ''}`}
          type="number" inputMode="numeric" min="0" step="1"
          value={wins.draft}
          aria-label={`${label} record wins`}
          aria-invalid={Boolean(wins.error)}
          onChange={e => wins.change(e.target.value)}
          onBlur={wins.restore}
        />
        <span className="so-record-dash" aria-hidden="true">–</span>
        <input
          className={`so-number so-number--small${losses.error ? ' is-invalid' : ''}`}
          type="number" inputMode="numeric" min="0" step="1"
          value={losses.draft}
          aria-label={`${label} record losses`}
          aria-invalid={Boolean(losses.error)}
          onChange={e => losses.change(e.target.value)}
          onBlur={losses.restore}
        />
      </div>
      {(wins.error || losses.error) && <span className="so-hint so-hint--error">{wins.error || losses.error}</span>}
    </fieldset>
  )
}
