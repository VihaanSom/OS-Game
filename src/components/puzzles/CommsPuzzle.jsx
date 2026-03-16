import React, { useState } from 'react'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 4: Comms System — Circular Wait
 *
 * Correct code: Node1=7, Node2=3, Node3=1, Node4=5 → "7315"
 */

const NODE_OPTIONS = [
  { value: '', label: '-- SELECT ROUTE --' },
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

const CORRECT_CODE = ['7', '3', '1', '5']

const CLUES = [
  {
    id: 'C1',
    text: 'INTERCEPTED TRANSMISSION: "The ETA packet was last seen at Node 1 before the cascade failure."',
    hint: 'Node 1 output = 07 (ETA)',
  },
  {
    id: 'C2',
    text: 'MAINTENANCE LOG #4471: "Node 4 was stable at EPSILON. It was the last in the chain to produce valid output."',
    hint: 'Node 4 output = 05 (EPSILON)',
  },
  {
    id: 'C3',
    text: 'ENGINEERING MEMO: "Node 2 fed Node 1. Its output code was one below Node 1\'s code, then halved."',
    hint: '(7 - 1) / 2 = 3 → 03 (GAMMA)',
  },
  {
    id: 'C4',
    text: 'ROUTING TABLE FRAGMENT: "Node 3 sent signal ALPHA to Node 2. ALPHA is the first in the Greek sequence."',
    hint: 'Node 3 output = 01 (ALPHA)',
  },
]

// FIXED: The dependencies now form a perfect closed loop.
const NODE_DEPS = [
  { node: 1, requires: 'Node 2', produces: 'Node 4' },
  { node: 2, requires: 'Node 3', produces: 'Node 1' },
  { node: 3, requires: 'Node 4', produces: 'Node 2' },
  { node: 4, requires: 'Node 1', produces: 'Node 3' },
]

export default function CommsPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  const [selections, setSelections] = useState(['', '', '', ''])
  const [attempted, setAttempted] = useState(false)
  // FIXED: Removed conflicting global hint state. We only need the array.
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
  const isWrong = attempted && !selections.every((v, i) => v === CORRECT_CODE[i])

  // Helper to render the Node boxes in the diagram
  const renderNodeBox = (nodeNum) => {
    const isSelected = selections[nodeNum - 1] !== ''
    return (
      <div className={`px-4 py-3 rounded border font-bold text-center w-28 shadow-lg ${
          isSelected 
            ? 'border-green-600 bg-green-950/40 text-green-400' 
            : 'border-red-700 bg-red-950/30 text-red-400 animate-pulse'
        }`}
      >
        NODE {nodeNum}
        {isSelected && (
          <div className="text-xs mt-1 text-green-300">
            {NODE_OPTIONS.find((o) => o.value === selections[nodeNum - 1])?.label}
          </div>
        )}
      </div>
    )
  }

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
        <span className="font-bold text-blue-200">OS CONCEPT — CIRCULAR WAIT:</span> Processes are deadlocked 
        because they are waiting on a resource held by the next process in the chain, forming a closed loop.
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        
        {/* ── Left: Node diagram & dropdowns ─────────────────────────────── */}
        <div className="flex flex-col">
          <h3 className="text-xs text-green-600 tracking-widest mb-3">NETWORK DEPENDENCY MAP</h3>

          {/* FIXED: The diagram now physically renders as a square loop */}
          <div className="p-6 rounded-lg border border-gray-700 bg-gray-900/50 mb-6 flex flex-col items-center">
            <div className="text-center mb-6 text-red-500 text-sm font-bold tracking-widest animate-pulse">
              ⚠ DEADLOCK — CIRCULAR DEPENDENCY DETECTED
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center space-x-4">
                {renderNodeBox(1)}
                <div className="text-gray-500 text-xs text-center w-24">
                  waits for <br/> <span className="text-lg">→</span>
                </div>
                {renderNodeBox(2)}
              </div>
              
              <div className="flex items-center justify-between w-full px-12 text-gray-500 text-lg">
                <div>↑</div>
                <div>↓</div>
              </div>
              
              <div className="flex items-center space-x-4">
                {renderNodeBox(4)}
                <div className="text-gray-500 text-xs text-center w-24">
                  <span className="text-lg">←</span> <br/> waits for
                </div>
                {renderNodeBox(3)}
              </div>
            </div>
          </div>

          <h3 className="text-xs text-green-600 tracking-widest mb-3">SET ROUTING CODES</h3>
          <div className="space-y-3">
            {NODE_DEPS.map(({ node, requires, produces }, i) => (
              <div key={node} className="p-3 rounded-lg border border-gray-700 bg-gray-900/50 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-green-300">NODE {node}</div>
                  <div className="text-xs text-gray-500 mt-1">Requires: {requires} | Produces for: {produces}</div>
                </div>
                <select
                  value={selections[i]}
                  onChange={(e) => handleSelect(i, e.target.value)}
                  disabled={solved}
                  className={`
                    w-48 bg-gray-800 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                    ${selections[i] === CORRECT_CODE[i] && attempted
                      ? 'border-green-500 text-green-300'
                      : selections[i] && attempted
                      ? 'border-red-500 text-red-300'
                      : 'border-gray-600 text-green-400'
                    }
                  `}
                >
                  {NODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Submit Block */}
          <div className="mt-6">
            {isWrong && (
              <div className="mb-3 p-3 border border-red-700 bg-red-950/20 rounded text-red-400 text-sm animate-pulse">
                ✗ Routing code incorrect. The circular dependency remains unbroken.
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allSelected || solved}
              className={`
                w-full py-4 rounded-lg border-2 font-bold tracking-widest transition-all
                ${allSelected && !solved
                  ? 'border-green-500 bg-green-900/40 text-green-300 hover:bg-green-900/70 shadow-lg shadow-green-500/20'
                  : 'border-gray-700 bg-gray-900/30 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              INITIATE OVERRIDE TO CENTRAL_SERVER
            </button>
          </div>
        </div>

        {/* ── Right: Clues ─────────────────────────────────────────────────── */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-green-600 tracking-widest">INTERCEPTED CLUES</h3>
          </div>

          <div className="space-y-4">
            {CLUES.map((clue, i) => (
              <div key={clue.id} className="p-4 rounded-lg border border-gray-700 bg-gray-900/50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-yellow-600 font-bold shrink-0">[{clue.id}]</span>
                  <button
                    onClick={() => toggleHint(i)}
                    className="text-xs text-gray-500 hover:text-white transition-colors border border-gray-600 px-2 py-1 rounded"
                  >
                    {revealedHints[i] ? 'HIDE HINT' : 'DECRYPT HINT'}
                  </button>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{clue.text}</p>
                
                {revealedHints[i] && (
                  <div className="mt-4 p-3 bg-yellow-950/30 border-l-2 border-yellow-500 text-sm text-yellow-400">
                    💡 <span className="font-bold">SYSTEM OVERRIDE:</span> {clue.hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Win overlay */}
      {solved && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="border-2 border-green-500 bg-gray-950 p-10 text-center rounded-lg max-w-md shadow-2xl shadow-green-500/20">
            <div className="text-6xl mb-4">📡</div>
            <h2 className="text-3xl font-bold text-green-300 mb-2 tracking-widest">
              COMMS RESTORED
            </h2>
            <p className="text-green-600 mb-2 text-sm">
              The circular dependency is broken. All nodes are routing to CENTRAL_SERVER
              in a strict total ordering — no more circular wait!
            </p>
            <p className="text-green-700 text-xs mb-6 italic mt-4">
              "Impose a total ordering of all resource types to prevent loops."
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