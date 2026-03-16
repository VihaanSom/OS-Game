import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 2: Power System — Hold and Wait
 *
 * Mechanic: Kanban-style drag-and-drop board.
 * - Players drag 4 power components into the correct sequence slots (1→2→3→4).
 * - Each player has a personal "holding area" (max 1 item).
 * - A player cannot pick up a new component if their holding area is occupied.
 * - Dropping an item on an invalid slot snaps it back.
 * - Win: all 4 sequence slots filled with the correct components in order.
 *
 * OS Concept — Hold and Wait: A process holds a resource while waiting for
 * another. Players must NOT hold onto components indefinitely — release them
 * into the sequence or back to the pool.
 */

// The 4 power components and their required sequence order
const COMPONENTS = [
  { id: 'cap', label: 'Capacitor', icon: '🔋', slot: 1 },
  { id: 'reg', label: 'Regulator', icon: '⚙️', slot: 2 },
  { id: 'inv', label: 'Inverter', icon: '🔌', slot: 3 },
  { id: 'fus', label: 'Fuse Array', icon: '💡', slot: 4 },
]

// Colour scheme per player holding area
const HOLDER_COLORS = [
  'border-cyan-600 bg-cyan-950/30 text-cyan-400',
  'border-purple-600 bg-purple-950/30 text-purple-400',
  'border-yellow-600 bg-yellow-950/30 text-yellow-400',
  'border-orange-600 bg-orange-950/30 text-orange-400',
  'border-pink-600 bg-pink-950/30 text-pink-400',
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ComponentCard({ comp, isDragging = false }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded border
        border-green-600 bg-green-950/40 text-green-300
        cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'opacity-50' : 'hover:bg-green-900/50'}
      `}
    >
      <span className="text-xl">{comp.icon}</span>
      <div>
        <div className="text-sm font-bold">{comp.label}</div>
        <div className="text-xs text-green-600">Seq #{comp.slot}</div>
      </div>
    </div>
  )
}

function DraggableCard({ comp, disabled }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: comp.id,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={disabled ? 'opacity-40 cursor-not-allowed' : ''}
      title={disabled ? 'Pick up the item in your holding area first' : undefined}
    >
      <ComponentCard comp={comp} isDragging={isDragging} />
    </div>
  )
}

function DroppableZone({ id, label, children, isCorrect, isOccupied }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[70px] rounded-lg border-2 p-3 transition-colors
        ${isOver ? 'border-yellow-400 bg-yellow-950/20' : isOccupied
          ? (isCorrect ? 'border-green-500 bg-green-950/20' : 'border-red-600 bg-red-950/20')
          : 'border-gray-700 bg-gray-900/50'}
      `}
    >
      <div className="text-xs text-gray-500 mb-1 tracking-widest">{label}</div>
      {children}
    </div>
  )
}

// ─── Main Puzzle ─────────────────────────────────────────────────────────────

export default function PowerPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  // Pool: components not yet placed anywhere
  const [pool, setPool] = useState(COMPONENTS.map((c) => c.id))

  // Sequence slots: array of 4, each either null or a component id
  const [sequence, setSequence] = useState([null, null, null, null])

  // Player holding areas: array of 5, each either null or a component id
  const [holdings, setHoldings] = useState([null, null, null, null, null])

  // Active drag id
  const [activeDragId, setActiveDragId] = useState(null)

  // Error flash
  const [errorMsg, setErrorMsg] = useState('')

  const solved = systems.power

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function flashError(msg) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 2500)
  }

  /** Locate where a component currently lives */
  function findSource(compId) {
    if (pool.includes(compId)) return { type: 'pool' }
    const hi = holdings.findIndex((h) => h === compId)
    if (hi !== -1) return { type: 'holding', index: hi }
    const si = sequence.findIndex((s) => s === compId)
    if (si !== -1) return { type: 'sequence', index: si }
    return null
  }

  /** Remove a component from wherever it currently lives */
  function removeFromSource(compId) {
    setPool((prev) => prev.filter((id) => id !== compId))
    setHoldings((prev) => prev.map((h) => (h === compId ? null : h)))
    setSequence((prev) => prev.map((s) => (s === compId ? null : s)))
  }

  function handleDragStart({ active }) {
    setActiveDragId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveDragId(null)
    if (!over) return // dropped outside — snap back (no state change)

    const compId = active.id
    const dest = over.id // 'pool' | 'hold-0'..'hold-4' | 'seq-0'..'seq-3'
    const source = findSource(compId)
    if (!source) return

    // ── Destination: a player holding area ────────────────────────────────
    if (dest.startsWith('hold-')) {
      const playerIdx = parseInt(dest.split('-')[1], 10)

      // Holding area already occupied?
      if (holdings[playerIdx] !== null) {
        flashError(`Player ${playerIdx + 1}'s holding area is full — release your component first!`)
        return
      }
      removeFromSource(compId)
      setHoldings((prev) => {
        const next = [...prev]
        next[playerIdx] = compId
        return next
      })
      return
    }

    // ── Destination: a sequence slot ──────────────────────────────────────
    if (dest.startsWith('seq-')) {
      const slotIdx = parseInt(dest.split('-')[1], 10) // 0-based index
      const comp = COMPONENTS.find((c) => c.id === compId)
      const requiredSlot = comp.slot // 1-based slot number

      // Slot already occupied?
      if (sequence[slotIdx] !== null) {
        flashError('That sequence slot is already occupied!')
        return
      }

      // Wrong position?
      if (requiredSlot !== slotIdx + 1) {
        flashError(
          `Wrong position! ${comp.label} belongs in slot ${requiredSlot}, not slot ${slotIdx + 1}.`
        )
        return
      }

      removeFromSource(compId)
      setSequence((prev) => {
        const next = [...prev]
        next[slotIdx] = compId
        // Check win
        const newSeq = [...next]
        if (newSeq.every((id, i) => id === COMPONENTS[i].id)) {
          unlockSystem('power')
        }
        return next
      })
      return
    }

    // ── Destination: pool ─────────────────────────────────────────────────
    if (dest === 'pool') {
      // Only allow returning to pool if it came from a holding area or sequence
      removeFromSource(compId)
      setPool((prev) => (prev.includes(compId) ? prev : [...prev, compId]))
      return
    }
  }

  const activeComp = activeDragId ? COMPONENTS.find((c) => c.id === activeDragId) : null

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-green-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 tracking-widest">STARSHIP SYS-7 // POWER SYSTEM</div>
          <h2 className="text-xl font-bold text-green-300 tracking-widest">⚡ ENERGY DISTRIBUTION</h2>
        </div>
        <button
          onClick={() => setCurrentView('hub')}
          className="text-xs px-4 py-2 border border-green-700 text-green-500 rounded hover:bg-green-900/30 transition-colors"
        >
          ← BACK TO HUB
        </button>
      </header>

      {/* OS concept banner */}
      <div className="px-6 py-3 bg-blue-950/30 border-b border-blue-900/50 text-xs text-blue-300">
        <span className="font-bold text-blue-200">OS CONCEPT — HOLD AND WAIT:</span> A process holds
        a resource while waiting to acquire another. Avoid holding resources indefinitely — sequence
        the components and release them into the build pipeline.
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mx-6 mt-3 p-3 border border-red-500 bg-red-950/30 rounded text-red-300 text-sm animate-pulse">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Instructions */}
      <div className="px-6 py-3 text-sm text-green-600">
        <span className="text-green-400 font-bold">[MISSION]</span> Drag each power component into
        its correct sequence slot (1→2→3→4). Use a player&apos;s holding area as a temporary buffer, but
        each player can only hold <span className="text-yellow-400">ONE component at a time</span>.
        Don&apos;t hold indefinitely — release into the sequence!
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          {/* ── Component pool ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <h3 className="text-xs text-green-600 tracking-widest mb-3">COMPONENT POOL</h3>
            <DroppableZone id="pool" label="Available Components" isOccupied={pool.length > 0}>
              <div className="space-y-2">
                {pool.length === 0 && (
                  <p className="text-xs text-gray-600 italic py-2">All components deployed</p>
                )}
                {pool.map((id) => {
                  const comp = COMPONENTS.find((c) => c.id === id)
                  // Disable dragging from pool if a player already holds something
                  // (no restriction — any player can pick from pool if their area is free)
                  return <DraggableCard key={id} comp={comp} disabled={false} />
                })}
              </div>
            </DroppableZone>

            {/* Player holding areas */}
            <h3 className="text-xs text-green-600 tracking-widest mt-6 mb-3">PLAYER HOLDING AREAS</h3>
            <div className="space-y-2">
              {holdings.map((heldId, i) => {
                const heldComp = heldId ? COMPONENTS.find((c) => c.id === heldId) : null
                return (
                  <DroppableZone
                    key={i}
                    id={`hold-${i}`}
                    label={`Player ${i + 1} — HOLD (max 1)`}
                    isOccupied={!!heldComp}
                  >
                    {heldComp && (
                      <DraggableCard comp={heldComp} disabled={false} />
                    )}
                    {!heldComp && (
                      <p className="text-xs text-gray-700 italic">— empty —</p>
                    )}
                  </DroppableZone>
                )
              })}
            </div>
          </div>

          {/* ── Sequence slots ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <h3 className="text-xs text-green-600 tracking-widest mb-3">
              BUILD SEQUENCE — POWER CIRCUIT
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {sequence.map((compId, i) => {
                const comp = compId ? COMPONENTS.find((c) => c.id === compId) : null
                const correct = comp && comp.slot === i + 1
                return (
                  <DroppableZone
                    key={i}
                    id={`seq-${i}`}
                    label={`SLOT ${i + 1} — ${COMPONENTS[i].label}`}
                    isOccupied={!!comp}
                    isCorrect={correct}
                  >
                    {comp && <DraggableCard comp={comp} disabled={correct} />}
                    {!comp && (
                      <p className="text-xs text-gray-700 italic">
                        Drop {COMPONENTS[i].label} here
                      </p>
                    )}
                  </DroppableZone>
                )
              })}
            </div>

            {/* Sequence progress */}
            <div className="mt-6 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
              <div className="text-xs text-gray-500 mb-2 tracking-widest">CIRCUIT INTEGRITY</div>
              <div className="flex gap-2">
                {sequence.map((id, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-3 rounded ${
                      id && COMPONENTS.find((c) => c.id === id)?.slot === i + 1
                        ? 'bg-green-500'
                        : 'bg-gray-800'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {sequence.filter((id, i) => id && COMPONENTS.find((c) => c.id === id)?.slot === i + 1).length}
                /4 components correctly sequenced
              </div>
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeComp ? <ComponentCard comp={activeComp} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Win overlay */}
      {solved && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="border-2 border-green-500 bg-gray-950 p-10 text-center rounded-lg max-w-md shadow-2xl shadow-green-500/20">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold text-green-300 mb-2 tracking-widest">
              POWER RESTORED
            </h2>
            <p className="text-green-600 mb-2 text-sm">
              The power circuit is fully sequenced. No process is holding a resource while waiting
              for another — the Hold and Wait condition is eliminated.
            </p>
            <p className="text-green-700 text-xs mb-6 italic">
              &ldquo;Require a process to request all needed resources upfront, or release held resources
              before requesting new ones.&rdquo;
            </p>
            <button
              onClick={() => setCurrentView('hub')}
              className="px-6 py-3 bg-green-900 border border-green-500 text-green-300 rounded hover:bg-green-800 transition-colors font-bold tracking-widest"
            >
              ← RETURN TO HUB
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
