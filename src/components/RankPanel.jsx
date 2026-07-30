import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { PLAYERS } from '../data/players'
import RankRow from './RankRow'

export default function RankPanel({ ranked }) {
  const [order, setOrder] = useState(ranked)
  const [draggingKey, setDraggingKey] = useState(null)
  const listRef = useRef(null)
  const rowEls = useRef(new Map())
  const flipRects = useRef(null)
  const shouldFlip = useRef(false)

  const dragKey = useRef(null)
  const grabOffset = useRef({ x: 0, y: 0 })
  const ghostEl = useRef(null)
  const rafId = useRef(null)
  const pointerY = useRef(0)

  useEffect(() => { setOrder(ranked) }, [ranked])

  // FLIP: whenever the order changes because of a drag, animate rows from
  // their previous screen position to their new one instead of snapping.
  useLayoutEffect(() => {
    if (!shouldFlip.current || !flipRects.current) return
    shouldFlip.current = false
    const prevRects = flipRects.current
    flipRects.current = null

    rowEls.current.forEach((el, key) => {
      const prev = prevRects.get(key)
      if (!el || !prev) return
      const next = el.getBoundingClientRect()
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      if (!dx && !dy) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight // force reflow so the transform above actually applies first
      requestAnimationFrame(() => {
        el.style.transition = 'transform .22s ease'
        el.style.transform = ''
      })
    })
  }, [order])

  function captureRects() {
    const map = new Map()
    rowEls.current.forEach((el, key) => { if (el) map.set(key, el.getBoundingClientRect()) })
    flipRects.current = map
    shouldFlip.current = true
  }

  // Custom pointer-driven drag: we deliberately avoid the native HTML5 Drag
  // and Drop API here. Browsers (Chrome/Edge especially) force their own
  // drag-image preview to render at reduced opacity as part of native OS
  // drag compositing — no CSS on the dragged element can override that. A
  // real, fixed-position DOM clone that we move ourselves has no such limit.
  function handlePointerDown(e, name) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()

    const rowEl = rowEls.current.get(name)
    if (!rowEl) return
    const rect = rowEl.getBoundingClientRect()

    dragKey.current = name
    grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    pointerY.current = e.clientY
    setDraggingKey(name)

    const ghost = rowEl.cloneNode(true)
    ghost.classList.remove('rank-row--dragging')
    Object.assign(ghost.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      margin: '0',
      background: '#16241B',
      boxShadow: '0 16px 32px rgba(0,0,0,0.5)',
      zIndex: '1000',
      pointerEvents: 'none',
      opacity: '1',
    })
    document.body.appendChild(ghost)
    ghostEl.current = ghost

    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handlePointerMove(e) {
    pointerY.current = e.clientY
    if (ghostEl.current) {
      ghostEl.current.style.left = `${e.clientX - grabOffset.current.x}px`
      ghostEl.current.style.top = `${e.clientY - grabOffset.current.y}px`
    }
    if (rafId.current) return
    rafId.current = requestAnimationFrame(resolveHover)
  }

  function resolveHover() {
    rafId.current = null
    const listEl = listRef.current
    if (!listEl || dragKey.current === null) return

    const rows = Array.from(listEl.children)
    const y = pointerY.current
    let targetIdx = rows.length - 1
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect()
      if (y < r.top + r.height / 2) { targetIdx = i; break }
    }

    setOrder(prev => {
      const fromIdx = prev.findIndex(p => p.name === dragKey.current)
      if (fromIdx === -1 || fromIdx === targetIdx) return prev
      captureRects() // snapshot positions before the DOM reorders (FLIP "First")
      const next = [...prev]
      const [item] = next.splice(fromIdx, 1)
      next.splice(targetIdx, 0, item)
      return next
    })
  }

  function handlePointerUp() {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    if (ghostEl.current) {
      ghostEl.current.remove()
      ghostEl.current = null
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    dragKey.current = null
    setDraggingKey(null)
  }

  return (
    <section className="panel">
      <h2>
        Your Top 10{' '}
        <span className="panel-meta">from a pool of {PLAYERS.length} legends</span>
      </h2>
      <ul className="rank-list" ref={listRef}>
        {order.map((player, idx) => (
          <RankRow
            key={player.name}
            player={player}
            rank={idx + 1}
            isDragging={player.name === draggingKey}
            rowRef={el => {
              if (el) rowEls.current.set(player.name, el)
              else rowEls.current.delete(player.name)
            }}
            onHandlePointerDown={e => handlePointerDown(e, player.name)}
          />
        ))}
      </ul>
    </section>
  )
}