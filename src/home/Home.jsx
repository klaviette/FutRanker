import goatLogo from '../assets/GoatCalcLogo.png'
import seriesLogo from '../assets/SeriesCalcLogo.png'

// Each entry becomes a module card. Add new tools here; omit `href` to show a locked slot.
const MODULES = [
  {
    id: '01',
    title: 'The GOAT Calculator',
    href: '/goat/',
    blurb: 'Weight the categories you value and build your own all-time ranking.',
    tags: ['Ranking', 'Sliders'],
    icon: goatLogo,
  },
  {
    id: '02',
    title: 'Series-State Odds Calculator',
    href: '/series-odds/',
    blurb: 'Given the current score of a best-of series, see the odds of each side winning it.',
    tags: ['Probability', 'Best-of-N'],
    icon: seriesLogo,
  },
]

export default function Home() {
  return (
    <div className="hq">
      <header className="hq-hero">
        <p className="hq-eyebrow">Index</p>
        <h1 className="hq-title">The Toolbox</h1>
        <p className="hq-sub">
          A collection of calculators and experiments. Pick one to get started.
        </p>
      </header>

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="hq-section-title">
          <span>Modules</span>
          <span className="hq-rule" aria-hidden="true" />
        </h2>
        <ul className="hq-grid">
          {MODULES.map(m => (
            <li key={m.id}>
              {m.href ? (
                <a className="hq-card" href={m.href}>
                  <CardBody module={m} />
                  <span className="hq-launch">Open <span aria-hidden="true">→</span></span>
                </a>
              ) : (
                <div className="hq-card hq-card--locked" aria-disabled="true">
                  <CardBody module={m} />
                  <span className="hq-launch">Coming soon</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function CardBody({ module: m }) {
  return (
    <>
      <div className="hq-card-head">
        <span className="hq-card-id">{m.id}</span>
        {m.icon ? (
          <img src={m.icon} alt="" className="hq-card-icon" />
        ) : (
          <span className="hq-card-icon hq-card-icon--mono" aria-hidden="true">{m.title.charAt(0)}</span>
        )}
      </div>
      <h3 className="hq-card-title">{m.title}</h3>
      <p className="hq-card-blurb">{m.blurb}</p>
      <ul className="hq-tags">
        {m.tags.map(t => <li key={t}>{t}</li>)}
      </ul>
    </>
  )
}
