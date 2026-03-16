import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import useGameStore from '../../store/gameStore'

const COMPONENTS = {
  cap: { id: 'cap', label: 'Capacitor', icon: '🔋', slot: 1 },
  reg: { id: 'reg', label: 'Regulator', icon: '⚙️', slot: 2 },
  inv: { id: 'inv', label: 'Inverter', icon: '🔌', slot: 3 },
  fus: { id: 'fus', label: 'Fuse Array', icon: '💡', slot: 4 },
}

const ORDER = ['cap', 'reg', 'inv', 'fus']
const MAX_RAM = 2

function ComponentCard({ comp, isDragging = false, dimmed = false }) {
  return (
    <div
      className={[
        'rounded-lg border border-green-700 bg-green-950/40 px-3 py-2 text-green-300 shadow-md select-none transition-all',
        isDragging ? 'scale-105 shadow-green-500/40' : '',
        dimmed ? 'opacity-45' : 'opacity-100',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{comp.icon}</span>
        <div>
          <p className="text-sm font-bold">{comp.label}</p>
          <p className="text-[11px] tracking-widest text-green-600">SEQ #{comp.slot}</p>
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ compId, disabled = false, dimmed = false, className = '', style }) {
  const comp = COMPONENTS[compId]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: compId,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      title={disabled ? 'Only top card can be moved from this stack' : undefined}
      className={[className, disabled ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'].join(' ')}
    >
      <ComponentCard comp={comp} isDragging={isDragging} dimmed={dimmed || disabled} />
    </div>
  )
}

function DroppableZone({
  id,
  title,
  subtitle,
  children,
  className = '',
  titleClassName = 'text-xs',
  subtitleClassName = 'text-[11px]',
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-xl border-2 border-gray-700 bg-gray-900/50 p-3 transition-colors',
        isOver ? 'border-yellow-400 bg-yellow-950/20' : '',
        className,
      ].join(' ')}
    >
      <div className="mb-2">
        <p className={`${titleClassName} tracking-widest text-gray-500`}>{title}</p>
        {subtitle ? <p className={`${subtitleClassName} text-gray-600`}>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}

function NodeStack({ title, zoneId, stack }) {
  return (
    <DroppableZone
      id={zoneId}
      title={title}
      subtitle="LIFO stack: only top item draggable"
      className="min-h-[210px]"
    >
      {stack.length === 0 ? (
        <p className="pt-12 text-center text-xs italic text-gray-600">Node empty</p>
      ) : (
        <div className="relative flex min-h-[155px] items-end justify-center pb-2">
          <div className="w-full max-w-[250px]">
            {stack.map((id, idx) => {
              const isTop = idx === stack.length - 1
              return (
                <DraggableCard
                  key={id}
                  compId={id}
                  disabled={!isTop}
                  dimmed={!isTop}
                  className={['relative', idx > 0 ? '-mt-10' : ''].join(' ')}
                  style={{ zIndex: idx + 1 }}
                />
              )
            })}
          </div>
        </div>
      )}
    </DroppableZone>
  )
}

export default function PowerPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  const [nodeAlpha, setNodeAlpha] = useState(['cap', 'fus', 'inv'])
  const [nodeBeta, setNodeBeta] = useState(['reg'])
  const [holdings, setHoldings] = useState([null, null, null, null, null])
  const [sequence, setSequence] = useState([null, null, null, null])
  const [activeDragId, setActiveDragId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorPulse, setErrorPulse] = useState(0)
  const [solved, setSolved] = useState(systems.power)

  const clearErrorRef = useRef(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    return () => {
      if (clearErrorRef.current) {
        clearTimeout(clearErrorRef.current)
      }
    }
  }, [])

  const usedRam = useMemo(() => holdings.filter(Boolean).length, [holdings])
  const ramFull = usedRam >= MAX_RAM

  const integrityCount = useMemo(
    () => sequence.filter((id, i) => id === ORDER[i]).length,
    [sequence]
  )

  const flashError = (message) => {
    setErrorMsg(message)
    setErrorPulse((n) => n + 1)
    if (clearErrorRef.current) {
      clearTimeout(clearErrorRef.current)
    }
    clearErrorRef.current = setTimeout(() => setErrorMsg(''), 1900)
  }

  const isTopOfNode = (compId, node) => node.length > 0 && node[node.length - 1] === compId

  const findSource = (compId) => {
    if (nodeAlpha.includes(compId)) return { type: 'alpha' }
    if (nodeBeta.includes(compId)) return { type: 'beta' }

    const holdIndex = holdings.findIndex((id) => id === compId)
    if (holdIndex !== -1) return { type: 'holding', index: holdIndex }

    const seqIndex = sequence.findIndex((id) => id === compId)
    if (seqIndex !== -1) return { type: 'sequence', index: seqIndex }

    return null
  }

  const removeFromSource = (compId, source, state) => {
    const next = {
      nodeAlpha: [...state.nodeAlpha],
      nodeBeta: [...state.nodeBeta],
      holdings: [...state.holdings],
      sequence: [...state.sequence],
    }

    if (source.type === 'alpha') {
      next.nodeAlpha = next.nodeAlpha.filter((id) => id !== compId)
    } else if (source.type === 'beta') {
      next.nodeBeta = next.nodeBeta.filter((id) => id !== compId)
    } else if (source.type === 'holding') {
      next.holdings[source.index] = null
    } else if (source.type === 'sequence') {
      next.sequence[source.index] = null
    }

    return next
  }

  const commitState = (next) => {
    setNodeAlpha(next.nodeAlpha)
    setNodeBeta(next.nodeBeta)
    setHoldings(next.holdings)
    setSequence(next.sequence)

    if (next.sequence.every((id, i) => id === ORDER[i])) {
      unlockSystem('power')
      setSolved(true)
    }
  }

  const handleDragStart = ({ active }) => {
    setActiveDragId(active.id)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null)
    if (!over) return

    const compId = active.id
    const destination = String(over.id)
    const source = findSource(compId)
    if (!source) return

    if (source.type === 'alpha' && !isTopOfNode(compId, nodeAlpha)) return
    if (source.type === 'beta' && !isTopOfNode(compId, nodeBeta)) return

    const current = { nodeAlpha, nodeBeta, holdings, sequence }

    if (destination.startsWith('hold-')) {
      const holdIndex = Number(destination.split('-')[1])
      if (Number.isNaN(holdIndex) || holdIndex < 0 || holdIndex > 4) return

      if (holdings[holdIndex] && holdings[holdIndex] !== compId) {
        flashError(`Player ${holdIndex + 1}'s holding area is full!`)
        return
      }

      if ((source.type === 'alpha' || source.type === 'beta') && usedRam >= MAX_RAM) {
        flashError('KERNEL PANIC: System RAM Full (2/2). Release held resources.')
        return
      }

      const next = removeFromSource(compId, source, current)
      next.holdings[holdIndex] = compId
      commitState(next)
      return
    }

    if (destination === 'node-alpha' || destination === 'node-beta') {
      const next = removeFromSource(compId, source, current)
      if (destination === 'node-alpha') {
        next.nodeAlpha.push(compId)
      } else {
        next.nodeBeta.push(compId)
      }
      commitState(next)
      return
    }

    if (destination.startsWith('seq-')) {
      const slotIndex = Number(destination.split('-')[1])
      if (Number.isNaN(slotIndex) || slotIndex < 0 || slotIndex > 3) return

      if (source.type !== 'holding') {
        flashError('Dependency Error: Route through a player holding area first.')
        return
      }

      if (sequence[slotIndex] && sequence[slotIndex] !== compId) {
        flashError(`Slot ${slotIndex + 1} is already occupied.`)
        return
      }

      if (slotIndex > 0 && sequence[slotIndex - 1] === null) {
        flashError(`Dependency Error: You must fill Slot ${slotIndex} first!`)
        return
      }

      if (ORDER[slotIndex] !== compId) {
        flashError(`Dependency Error: ${COMPONENTS[compId].label} belongs in Slot ${COMPONENTS[compId].slot}.`)
        return
      }

      const next = removeFromSource(compId, source, current)
      next.sequence[slotIndex] = compId
      commitState(next)
    }
  }

  const activeComp = activeDragId ? COMPONENTS[activeDragId] : null

  return (
    <div className="min-h-screen bg-gray-950 font-mono text-green-400">
      <header className="flex items-center justify-between border-b border-green-900 px-6 py-4">
        <div>
          <p className="text-xs tracking-widest text-green-600">STARSHIP SYS-7 // POWER SYSTEM</p>
          <h2 className="text-xl font-bold tracking-widest text-green-300">SYS-7 // POWER SYSTEM</h2>
        </div>
        <button
          onClick={() => setCurrentView('hub')}
          className="rounded border border-green-700 px-4 py-2 text-xs text-green-500 transition-colors hover:bg-green-900/30"
        >
          ← BACK TO HUB
        </button>
      </header>

      <div className="border-b border-blue-900/50 bg-blue-950/30 px-6 py-3 text-xs text-blue-300">
        <span className="font-bold text-blue-200">OS CONCEPT — HOLD AND WAIT + MEMORY LIMITS:</span>{' '}
        Processes holding resources while waiting can deadlock the system, and global RAM capacity
        limits how many resources can be buffered at once.
      </div>

      <div className="mx-6 mt-4 rounded-xl border-2 border-cyan-700 bg-cyan-950/25 p-4">
        <p className="text-xs tracking-widest text-cyan-300">SYSTEM RAM ALLOCATION</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={ramFull ? 'text-red-300 animate-pulse font-bold' : 'text-cyan-200'}>
            {usedRam} / {MAX_RAM} Slots Used
          </span>
          <span className="text-xs text-cyan-500">Global buffer cap</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded bg-gray-800">
          <div
            className={[
              'h-full transition-all duration-300',
              ramFull ? 'bg-red-500 animate-pulse' : 'bg-cyan-400',
            ].join(' ')}
            style={{ width: `${(usedRam / MAX_RAM) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg ? (
        <div
          key={errorPulse}
          className="mx-6 mt-3 rounded border border-red-500 bg-red-950/40 p-3 text-sm text-red-300 animate-pulse"
        >
          ⚠ {errorMsg}
        </div>
      ) : null}

      <div className="px-6 py-4 text-sm text-green-600">
        <span className="font-bold text-green-400">[MISSION]</span> Use the two data nodes and player
        buffers to satisfy strict dependency order without exceeding RAM capacity.
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 px-6 pb-8 lg:grid-cols-3">
          <div className="space-y-5">
            <NodeStack title="DATA NODE ALPHA" zoneId="node-alpha" stack={nodeAlpha} />
            <NodeStack title="DATA NODE BETA" zoneId="node-beta" stack={nodeBeta} />
          </div>

          <div>
            <h1 className="mb-3 text-sm tracking-widest text-green-500">PLAYER HOLDING AREAS</h1>
            <div className="space-y-3">
              {holdings.map((id, idx) => (
                <DroppableZone
                  key={idx}
                  id={`hold-${idx}`}
                  title={`PLAYER ${idx + 1} BUFFER`}
                  subtitle="Capacity: 1"
                  className="min-h-[92px]"
                  titleClassName="text-sm"
                  subtitleClassName="text-xs"
                >
                  {id ? (
                    <DraggableCard compId={id} />
                  ) : (
                    <p className="pt-3 text-sm italic text-gray-500">Waiting for component...</p>
                  )}
                </DroppableZone>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm tracking-widest text-green-500">BUILD SEQUENCE</h3>
            <div className="space-y-3">
              {ORDER.map((requiredId, slotIndex) => {
                const currentId = sequence[slotIndex]
                const prevReady = slotIndex === 0 || sequence[slotIndex - 1] !== null

                return (
                  <DroppableZone
                    key={slotIndex}
                    id={`seq-${slotIndex}`}
                    title={`SLOT ${slotIndex + 1} — ${COMPONENTS[requiredId].label}`}
                    subtitle={prevReady ? 'Dependency ready' : `Locked until Slot ${slotIndex}`}
                    className={[
                      'min-h-[96px]',
                      currentId ? 'border-green-600 bg-green-950/20' : '',
                      !prevReady && !currentId ? 'border-orange-700/50 bg-orange-950/10' : '',
                    ].join(' ')}
                    titleClassName="text-sm"
                    subtitleClassName="text-xs"
                  >
                    {currentId ? (
                      <DraggableCard compId={currentId} />
                    ) : (
                      <p className="pt-3 text-sm italic text-gray-500">Drop {COMPONENTS[requiredId].label}</p>
                    )}
                  </DroppableZone>
                )
              })}
            </div>

            <div className="mt-5 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <p className="mb-2 text-xs tracking-widest text-gray-500">CIRCUIT INTEGRITY</p>
              <div className="h-3 overflow-hidden rounded bg-gray-800">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(integrityCount / ORDER.length) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">{integrityCount}/4 components sequenced</p>
            </div>
          </div>
        </div>

        <DragOverlay>{activeComp ? <ComponentCard comp={activeComp} isDragging /> : null}</DragOverlay>
      </DndContext>

      {solved ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="max-w-md rounded-lg border-2 border-green-500 bg-gray-950 p-10 text-center shadow-2xl shadow-green-500/20">
            <div className="mb-4 text-6xl">⚡</div>
            <h2 className="mb-2 text-3xl font-bold tracking-widest text-green-300">POWER RESTORED</h2>
            <p className="mb-2 text-sm text-green-600">
              Dependencies resolved and RAM pressure managed. Hold-and-wait deadlock path prevented.
            </p>
            <button
              onClick={() => setCurrentView('hub')}
              className="mt-4 rounded border border-green-500 bg-green-900 px-6 py-3 font-bold tracking-widest text-green-300 transition-colors hover:bg-green-800"
            >
              ← RETURN TO HUB
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
