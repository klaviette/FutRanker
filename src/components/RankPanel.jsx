import { PLAYERS } from '../data/players'
import RankRow from './RankRow'

export default function RankPanel({ ranked }) {
  return (
    <section className="panel">
      <h2>
        Your Top 10{' '}
        <span className="panel-meta">from a pool of {PLAYERS.length} legends</span>
      </h2>
      <ul className="rank-list">
        {ranked.map((player, idx) => (
          <RankRow key={player.name} player={player} rank={idx + 1} />
        ))}
      </ul>
    </section>
  )
}
