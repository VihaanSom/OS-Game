import React, { useState } from 'react'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 4: Comms System — Circular Wait
 *
 * Mechanic:
 * - 4 dropdown menus representing 4 network nodes.
 * - Node 1 requires the output of Node 2, Node 2 requires 3, 3 requires 4, 4 requires 1.
 * - Scattered text clues on the screen help the team break the loop.
 * - Win: enter the correct 4-digit routing code (one digit per node) to route to CENTRAL_SERVER.
 *
 * The correct code is: Node1=7, Node2=3, Node3=1, Node4=5 → "7315"
 * (derived by solving the clues in order, breaking the circular dependency)
 *
 * OS Concept — Circular Wait: Each process in the set is waiting for a resource
 * held by the next process, forming a circular chain. To break it, impose a
 * total ordering on resources.
 */

// Options each node's dropdown can produce
const NODE_OPTIONS = [
  { value: '', label: '-- SELECT --' },
  { value: '1', label: '01 (ALPHA)' },
  { value: '2', label: '02 (BETA)' },
  { value: '3', label: '03 (GAMMA)' },
  { value: '4', label: '04 (DELTA)' },
  { value: '5', label: '05 (EPSILON)' },
  { value: '6', label: '06 (ZETA)' },
  { value: '7', label: '07 (ETA)' },
  { value: '8', label: '08 (THETA)' },
  { value: '9', label: '09 (IOTA)' },
]

// Correct routing code (one value per node)
const CORRECT_CODE = ['7', '3', '1', '5']

// Clues scattered around the UI — players must piece them together
const CLUES = [
  {
    id: 'C1',
    text: 'INTERCEPTED TRANSMISSION: "The ETA packet was last seen at Node 1 before the cascade failure."',
    hint: '→ Node 1 output = 07 (ETA)',
  },
  {
    id: 'C2',
    text: 'MAINTENANCE LOG #4471: "Node 4 was stable at EPSILON. It was the last in the chain to produce valid output."',
    hint: '→ Node 4 output = 05 (EPSILON)',
  },
  {
    id: 'C3',
    text: 'ENGINEERING MEMO: "Node 2 fed Node 1. Its output code was one below Node 1\'s code, then halved."',
    hint: '→ Node 2 = (7-1)/2 = 3 → 03 (GAMMA)',
  },
  {
    id: 'C4',
    text: 'ROUTING TABLE FRAGMENT: "Node 3 sent signal ALPHA to Node 2. ALPHA is the first in the Greek sequence."',
    hint: '→ Node 3 output = 01 (ALPHA)',
  },
]

// Node descriptions showing the circular dependency
const NODE_DEPS = [
  { node: 1, requires: 'output of Node 2', produces: 'for Central Server' },
  { node: 2, requires: 'output of Node 3', produces: 'for Node 1' },
  { node: 3, requires: 'output of Node 4', produces: 'for Node 2' },
  { node: 4, requires: 'output of Node 1', produces: 'for Node 3' },
]

export default function CommsPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  const [selections, setSelections] = useState(['', '', '', ''])
  const [attempted, setAttempted] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [revealedHints, setRevealedHints] = useState([false, false, false, false])

  const solved = systems.comms

  function handleSelect(nodeIdx, value) {
    setSelections((prev) => {
      const next = [...prev]
      next[nodeIdx] = value
      return next
    })
    setAttempted(false)
  }

  function handleSubmit() {
    setAttempted(true)
    if (selections.every((v, i) => v === CORRECT_CODE[i])) {
      unlockSystem('comms')
    }
  }

  function toggleHint(i) {
    setRevealedHints((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const allSelected = selections.every((s) => s !== '')
  const isWrong =
    attempted && !selections.every((v, i) => v === CORRECT_CODE[i])

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-green-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 tracking-widest">STARSHIP SYS-7 // COMMS SYSTEM</div>
          <h2 className="text-xl font-bold text-green-300 tracking-widest">📡 SIGNAL ROUTING</h2>
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
        <span className="font-bold text-blue-200">OS CONCEPT — CIRCULAR WAIT:</span> Each process
        waits for a resource held by the next, forming a cycle. To break it, impose a total ordering
        on resources and require processes to request them in order.
      </div>

      {/* Instructions */}
      <div className="px-6 py-3 text-sm text-green-600">
        <span className="text-green-400 font-bold">[MISSION]</span> The comms network is deadlocked
        in a circular dependency. Each node waits for the next node&apos;s output, forming an endless
        loop. Read the scattered clues to determine the correct routing code for each node and break
        the cycle by routing all signals to <span className="text-yellow-400">CENTRAL_SERVER</span>.
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">

        {/* ── Left: Node diagram & dropdowns ─────────────────────────────── */}
        <div>
          <h3 className="text-xs text-green-600 tracking-widest mb-3">NETWORK DEPENDENCY MAP</h3>

          {/* Circular wait diagram */}
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-900/50 mb-5 text-xs text-gray-400">
            <div className="text-center mb-3 text-yellow-500 text-xs font-bold tracking-widest">
              ⚠ DEADLOCK — CIRCULAR DEPENDENCY DETECTED
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap text-center">
              {NODE_DEPS.map(({ node, requires }) => (
                <React.Fragment key={node}>
                  <div
                    className={`
                      px-3 py-2 rounded border text-xs font-bold min-w-[70px]
                      ${selections[node - 1]
                        ? 'border-green-600 bg-green-950/30 text-green-400'
                        : 'border-red-700 bg-red-950/20 text-red-400 animate-pulse'
                      }
                    `}
                  >
                    NODE {node}
                    {selections[node - 1] && (
                      <div className="text-green-300 font-bold">→ {NODE_OPTIONS.find(o => o.value === selections[node - 1])?.label.split(' ')[1]}</div>
                    )}
                  </div>
                  <div className="text-gray-600 text-xs">
                    →<br />
                    <span className="text-gray-700">needs {requires.replace('output of ', '')}</span>
                  </div>
                </React.Fragment>
              ))}
              <div className="px-3 py-2 rounded border border-yellow-600 bg-yellow-950/20 text-yellow-400 text-xs font-bold">
                CENTRAL<br />SERVER
              </div>
            </div>
          </div>

          {/* Node dropdowns */}
          <h3 className="text-xs text-green-600 tracking-widest mb-3">SET ROUTING CODES</h3>
          <div className="space-y-3">
            {NODE_DEPS.map(({ node, requires, produces }, i) => (
              <div key={node} className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-green-300">NODE {node}</span>
                  <span className="text-xs text-gray-500">Requires: {requires}</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">Produces: {produces}</div>
                <select
                  value={selections[i]}
                  onChange={(e) => handleSelect(i, e.target.value)}
                  disabled={solved}
                  className={`
                    w-full bg-gray-800 border rounded px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    ${selections[i] === CORRECT_CODE[i] && attempted
                      ? 'border-green-500 text-green-300'
                      : selections[i] && attempted
                      ? 'border-red-500 text-red-300'
                      : 'border-gray-600 text-green-400'
                    }
                  `}
                >
                  {NODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="mt-4">
            {isWrong && (
              <div className="mb-3 p-3 border border-red-700 bg-red-950/20 rounded text-red-400 text-sm">
                ✗ Routing code incorrect. Re-read the clues and try again.
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allSelected || solved}
              className={`
                w-full py-3 rounded-lg border-2 font-bold tracking-widest transition-all
                ${allSelected && !solved
                  ? 'border-green-500 bg-green-900/40 text-green-300 hover:bg-green-900/70 cursor-pointer'
                  : 'border-gray-700 bg-gray-900/30 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              ROUTE TO CENTRAL_SERVER
            </button>
          </div>
        </div>

        {/* ── Right: Clues ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-green-600 tracking-widest">INTERCEPTED CLUES</h3>
            <button
              onClick={() => setShowHints(!showHints)}
              className="text-xs text-yellow-600 hover:text-yellow-400 transition-colors"
            >
              {showHints ? '▼ HIDE HINTS' : '▶ SHOW HINTS'}
            </button>
          </div>

          <div className="space-y-4">
            {CLUES.map((clue, i) => (
              <div
                key={clue.id}
                className="p-4 rounded-lg border border-gray-700 bg-gray-900/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-yellow-600 font-bold shrink-0">[{clue.id}]</span>
                  <button
                    onClick={() => toggleHint(i)}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors shrink-0"
                  >
                    {revealedHints[i] ? '▼ hint' : '▶ hint'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{clue.text}</p>
                {(showHints || revealedHints[i]) && (
                  <div className="mt-2 p-2 bg-yellow-950/20 border border-yellow-800/50 rounded text-xs text-yellow-400">
                    💡 {clue.hint}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Circular wait explanation */}
          <div className="mt-4 p-4 rounded-lg border border-gray-800 bg-gray-900/30">
            <div className="text-xs text-gray-500 tracking-widest mb-2">DEADLOCK ANALYSIS</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Node 1 waits for Node 2 → Node 2 waits for Node 3</div>
              <div>→ Node 3 waits for Node 4 → Node 4 waits for Node 1</div>
              <div className="text-red-500 mt-1">↻ CIRCULAR DEPENDENCY — SYSTEM HALTED</div>
              <div className="text-green-600 mt-2">
                Solution: Break the loop by assigning each node a unique ordered routing code,
                so signals can flow linearly to CENTRAL_SERVER.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win overlay */}
      {solved && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="border-2 border-green-500 bg-gray-950 p-10 text-center rounded-lg max-w-md shadow-2xl shadow-green-500/20">
            <div className="text-6xl mb-4">📡</div>
            <h2 className="text-3xl font-bold text-green-300 mb-2 tracking-widest">
              COMMS RESTORED
            </h2>
            <p className="text-green-600 mb-2 text-sm">
              The circular dependency is broken. All nodes are routing to CENTRAL_SERVER
              in a strict total ordering — no more circular wait!
            </p>
            <p className="text-green-700 text-xs mb-6 italic">
              &ldquo;Impose a total ordering of all resource types and require each process to
              request resources only in increasing order of enumeration.&rdquo;
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
