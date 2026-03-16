import React, { useEffect, useRef, useState, useCallback } from 'react'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 1: Oxygen System — Mutual Exclusion
 *
 * - 5 progress bars (one per player), each assigned a key: Q, P, Z, M, Space
 * - Hold your key to fill your bar (+1%/sec while held)
 * - If more than 1 key is pressed simultaneously → RACE CONDITION
 *   - All filling stops; bars drain at 2%/sec
 * - Win condition: all 5 bars reach 100% simultaneously
 */

const PLAYERS = [
  { id: 0, label: 'Player 1', key: 'q', display: 'Q', color: 'cyan' },
  { id: 1, label: 'Player 2', key: 'p', display: 'P', color: 'purple' },
  { id: 2, label: 'Player 3', key: 'z', display: 'Z', color: 'yellow' },
  { id: 3, label: 'Player 4', key: 'm', display: 'M', color: 'orange' },
  { id: 4, label: 'Player 5', key: ' ', display: 'SPACE', color: 'pink' },
]

const COLOR_CLASSES = {
  cyan: {
    bar: 'bg-cyan-400',
    border: 'border-cyan-600',
    text: 'text-cyan-400',
    key: 'bg-cyan-900 border-cyan-600 text-cyan-300',
    glow: 'shadow-cyan-400/50',
  },
  purple: {
    bar: 'bg-purple-400',
    border: 'border-purple-600',
    text: 'text-purple-400',
    key: 'bg-purple-900 border-purple-600 text-purple-300',
    glow: 'shadow-purple-400/50',
  },
  yellow: {
    bar: 'bg-yellow-400',
    border: 'border-yellow-600',
    text: 'text-yellow-400',
    key: 'bg-yellow-900 border-yellow-600 text-yellow-300',
    glow: 'shadow-yellow-400/50',
  },
  orange: {
    bar: 'bg-orange-400',
    border: 'border-orange-600',
    text: 'text-orange-400',
    key: 'bg-orange-900 border-orange-600 text-orange-300',
    glow: 'shadow-orange-400/50',
  },
  pink: {
    bar: 'bg-pink-400',
    border: 'border-pink-600',
    text: 'text-pink-400',
    key: 'bg-pink-900 border-pink-600 text-pink-300',
    glow: 'shadow-pink-400/50',
  },
}

export default function OxygenPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  const [bars, setBars] = useState([0, 0, 0, 0, 0])
  const [raceCondition, setRaceCondition] = useState(false)
  const [solved, setSolved] = useState(systems.oxygen)

  // Track which keys are currently held using a ref (mutable, no re-render on change)
  const activeKeys = useRef(new Set())

  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase()
    if (PLAYERS.some((p) => p.key === key)) {
      e.preventDefault()
      activeKeys.current.add(key)
    }
  }, [])

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase()
    activeKeys.current.delete(key)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Game tick: runs every 100ms (10 ticks/sec) for smooth animation
  // Each tick = 0.1 seconds → fill rate = 1%/sec → +0.1% per tick
  //                          drain rate = 2%/sec → -0.2% per tick (race condition)
  useEffect(() => {
    if (solved) return

    const interval = setInterval(() => {
      const heldKeys = activeKeys.current
      const isRace = heldKeys.size > 1

      setRaceCondition(isRace)

      setBars((prev) => {
        const next = prev.map((val, i) => {
          const playerKey = PLAYERS[i].key
          if (isRace) {
            // Race condition: all bars drain at 2%/sec → 0.2% per 100ms tick
            return Math.max(0, val - 0.2)
          } else if (heldKeys.has(playerKey)) {
            // Key held: fill at 1%/sec → 0.1% per 100ms tick
            return Math.min(100, val + 0.1)
          }
          // Key not held, no race: hold at current value
          return val
        })

        // Check win condition
        if (next.every((v) => v >= 100)) {
          setSolved(true)
          unlockSystem('oxygen')
        }

        return next
      })
    }, 100)

    return () => clearInterval(interval)
  }, [solved, unlockSystem])

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-green-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 tracking-widest">STARSHIP SYS-7 // OXYGEN SYSTEM</div>
          <h2 className="text-xl font-bold text-green-300 tracking-widest">
            🌬️ LIFE SUPPORT MODULE
          </h2>
        </div>
        <button
          onClick={() => setCurrentView('hub')}
          className="text-xs px-4 py-2 border border-green-700 text-green-500 rounded hover:bg-green-900/30 transition-colors"
        >
          ← BACK TO HUB
        </button>
      </header>

      {/* OS Concept banner */}
      <div className="px-6 py-3 bg-blue-950/30 border-b border-blue-900/50 text-xs text-blue-300">
        <span className="font-bold text-blue-200">OS CONCEPT — MUTUAL EXCLUSION:</span> Only one
        process may access a shared resource at a time. Simultaneous access causes a race condition.
      </div>

      {/* Race condition warning */}
      {raceCondition && (
        <div className="mx-6 mt-4 p-4 border-2 border-red-500 bg-red-950/40 rounded-lg animate-pulse text-center">
          <div className="text-red-300 font-bold text-lg tracking-widest">
            ⚠ RACE CONDITION DETECTED
          </div>
          <div className="text-red-400 text-sm mt-1">
            Multiple players pressing simultaneously! Release all keys and try one at a time.
          </div>
          <div className="text-red-600 text-xs mt-1">
            Mutual exclusion violated — oxygen bars draining at 2×
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="px-6 py-4 text-sm text-green-600">
        <p>
          <span className="text-green-400 font-bold">[MISSION]</span> Each player must hold their
          assigned key to replenish the oxygen supply to their station. However, the life support
          system enforces <span className="text-yellow-400">mutual exclusion</span> — only one player
          may press at a time. If two or more keys are pressed simultaneously, a race condition
          occurs and oxygen drains faster!
        </p>
      </div>

      {/* Bars */}
      <div className="flex-1 px-6 py-4 space-y-5 max-w-2xl w-full mx-auto">
        {PLAYERS.map((player, i) => {
          const c = COLOR_CLASSES[player.color]
          const pct = bars[i]
          const isHeld = activeKeys.current.has(player.key)
          const isComplete = pct >= 100

          return (
            <div
              key={player.id}
              className={`p-4 rounded-lg border ${c.border} bg-gray-900 ${
                isComplete ? `shadow-lg ${c.glow}` : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`
                      inline-flex items-center justify-center
                      min-w-[3rem] px-2 py-1 rounded border font-bold text-sm
                      ${c.key} ${isHeld ? `shadow ${c.glow}` : ''}
                    `}
                  >
                    {player.display}
                  </span>
                  <span className={`font-bold ${c.text}`}>{player.label}</span>
                  {isHeld && !raceCondition && (
                    <span className={`text-xs animate-pulse ${c.text}`}>▶ FILLING</span>
                  )}
                  {isHeld && raceCondition && (
                    <span className="text-xs text-red-400 animate-pulse">✗ RACE!</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <span className={`text-xs font-bold ${c.text}`}>✓ FULL</span>
                  )}
                  <span className={`text-sm font-bold ${c.text}`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar track */}
              <div className="h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className={`h-full rounded-full progress-bar-fill transition-all ${
                    raceCondition ? 'bg-red-600' : c.bar
                  } ${isComplete ? 'opacity-100' : 'opacity-80'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Win overlay */}
      {solved && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="border-2 border-green-500 bg-gray-950 p-10 text-center rounded-lg max-w-md shadow-2xl shadow-green-500/20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-300 mb-2 tracking-widest">
              OXYGEN RESTORED
            </h2>
            <p className="text-green-600 mb-2 text-sm">
              Mutual Exclusion achieved. All 5 stations are operating safely without resource
              contention.
            </p>
            <p className="text-green-700 text-xs mb-6 italic">
              &ldquo;A shared resource protected by mutual exclusion prevents race conditions.&rdquo;
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
