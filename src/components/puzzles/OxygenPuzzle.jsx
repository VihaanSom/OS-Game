import React, { useEffect, useRef, useState, useCallback } from 'react'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 1: Oxygen System — Mutual Exclusion
 *
 * - 5 progress bars (one per player), each assigned a key: Q, P, Z, M, Space
 * - Hold your key to fill your bar
 * - Unheld bars slowly drain (process starvation)
 * - If more than 1 key is pressed simultaneously → RACE CONDITION
 * - All bars drain quickly
 * - Win condition: all 5 bars reach the safe zone simultaneously
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

// --- THE MIDDLE GROUND MATH ---
const FILL_RATE = 24
const PASSIVE_DRAIN_RATE = 4
const RACE_DRAIN_RATE = 60
const WIN_THRESHOLD = 95

// Priority Inversion: a random unheld bar gets extra drain periodically
const PI_INTERVAL = 10000    // ms between inversion events
const PI_DURATION = 3000     // ms each inversion lasts
const PI_DRAIN_RATE = 8      // drain/s during inversion

export default function OxygenPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)
  const recordIncident = useGameStore((s) => s.recordIncident)

  const [solved, setSolved] = useState(systems.oxygen)
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const [completedBars, setCompletedBars] = useState([false, false, false, false, false])
  const [priorityTarget, setPriorityTarget] = useState(-1)

  const raceCondition = pressedKeys.size > 1

  const activeKeys = useRef(new Set())
  const barsRef = useRef([0, 0, 0, 0, 0])
  const completedRef = useRef([false, false, false, false, false])
  const barFillRefs = useRef(PLAYERS.map(() => null))
  const barTextRefs = useRef(PLAYERS.map(() => null))
  const wasRacingRef = useRef(false)
  const recordIncidentRef = useRef(recordIncident)
  recordIncidentRef.current = recordIncident
  const priorityRef = useRef({ target: -1, startTime: 0, nextTrigger: performance.now() + PI_INTERVAL })

  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase()
    if (PLAYERS.some((p) => p.key === key)) {
      e.preventDefault()
      activeKeys.current.add(key)
      setPressedKeys((prev) => new Set([...prev, key]))
    }
  }, [])

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase()
    activeKeys.current.delete(key)
    setPressedKeys((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    if (solved) return

    let rafId
    let lastTime = performance.now()

    const tick = (now) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      const heldKeys = activeKeys.current
      const isRace = heldKeys.size > 1

      // Track race condition incidents
      if (isRace && !wasRacingRef.current) {
        recordIncidentRef.current('raceConditions')
      }
      wasRacingRef.current = isRace

      // Priority Inversion — periodically drains a random unheld bar
      const pi = priorityRef.current
      if (pi.target === -1 && now >= pi.nextTrigger) {
        const unheld = PLAYERS
          .map((_, idx) => idx)
          .filter(idx => !heldKeys.has(PLAYERS[idx].key) && barsRef.current[idx] > 15)
        if (unheld.length > 0) {
          pi.target = unheld[Math.floor(Math.random() * unheld.length)]
          pi.startTime = now
          setPriorityTarget(pi.target)
        }
      } else if (pi.target !== -1 && now - pi.startTime >= PI_DURATION) {
        pi.target = -1
        pi.nextTrigger = now + PI_INTERVAL
        setPriorityTarget(-1)
      }

      let allComplete = true
      let completionChanged = false

      PLAYERS.forEach((player, i) => {
        let val = barsRef.current[i]

        if (isRace) {
          // Rule 1: RACE CONDITION! Massive penalty.
          val = Math.max(0, val - RACE_DRAIN_RATE * dt)
        } else if (heldKeys.has(player.key)) {
          // Rule 2: Active & Safe. Fills rapidly.
          val = Math.min(100, val + FILL_RATE * dt)
        } else {
          // Rule 3: Unheld (Starvation). Drains slowly.
          val = Math.max(0, val - PASSIVE_DRAIN_RATE * dt)
        }

        // Priority Inversion: extra drain on the targeted bar
        if (priorityRef.current.target === i) {
          val = Math.max(0, val - PI_DRAIN_RATE * dt)
        }

        barsRef.current[i] = val

        // THE FIX: Check against the Threshold, not 100
        if (val < WIN_THRESHOLD) allComplete = false

        // Direct DOM updates for butter-smooth 60fps UI
        if (barFillRefs.current[i]) barFillRefs.current[i].style.width = `${val}%`
        if (barTextRefs.current[i]) barTextRefs.current[i].textContent = `${val.toFixed(1)}%`

        // Update the visual glow if they are in the Safe Zone
        const nowComplete = val >= WIN_THRESHOLD
        if (nowComplete !== completedRef.current[i]) {
          completedRef.current[i] = nowComplete
          completionChanged = true
        }
      })

      if (completionChanged) setCompletedBars([...completedRef.current])

      if (allComplete) {
        setSolved(true)
        unlockSystem('oxygen')
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [solved, unlockSystem])

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
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

      <div className="px-6 py-3 bg-blue-950/30 border-b border-blue-900/50 text-xs text-blue-300">
        <span className="font-bold text-blue-200">OS CONCEPT — MUTUAL EXCLUSION:</span> Only one
        process may access a shared resource at a time. Simultaneous access causes a race condition.
      </div>

      {raceCondition && (
        <div className="mx-6 mt-4 p-4 border-2 border-red-500 bg-red-950/40 rounded-lg animate-pulse text-center">
          <div className="text-red-300 font-bold text-lg tracking-widest">
            ⚠ RACE CONDITION DETECTED
          </div>
          <div className="text-red-400 text-sm mt-1">
            Multiple players pressing simultaneously! Release all keys and try one at a time.
          </div>
          <div className="text-red-600 text-xs mt-1">
            Mutual exclusion violated — all oxygen bars are draining at the fastest rate
          </div>
        </div>
      )}

      <div className="px-6 py-4 text-sm text-green-600">
        <p>
          <span className="text-green-400 font-bold">[MISSION]</span> Each player must hold their
          assigned key to replenish the oxygen supply to their station. However, the life support
          system enforces <span className="text-yellow-400">mutual exclusion</span> — only one player
          may press at a time. If two or more keys are pressed simultaneously, a race condition
          occurs and every bar drains faster. Since unheld stations slowly lose oxygen, you must 
          communicate to constantly rotate the active resource until all 5 cross the 95% safe zone.
        </p>
      </div>

      <div className="flex-1 px-6 py-4 space-y-5 max-w-2xl w-full mx-auto">
        {PLAYERS.map((player, i) => {
          const c = COLOR_CLASSES[player.color]
          const isHeld = pressedKeys.has(player.key)
          const isComplete = completedBars[i]

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
                  {!isHeld && priorityTarget === i && (
                    <span className="text-xs text-orange-400 animate-pulse">⚡ PRIORITY INVERSION</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && <span className={`text-xs font-bold ${c.text}`}>✓ SAFE</span>}
                  <span
                    ref={(el) => { barTextRefs.current[i] = el }}
                    className={`text-sm font-bold ${c.text}`}
                  >
                    0.0%
                  </span>
                </div>
              </div>

              <div className="h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                <div className="absolute top-0 bottom-0 right-[5%] w-0.5 bg-green-500/50 z-10" />
                <div
                  ref={(el) => { barFillRefs.current[i] = el }}
                  className={`h-full rounded-full progress-bar-fill relative z-0 ${
                    raceCondition ? 'bg-red-600' : c.bar
                  } ${isComplete ? 'opacity-100' : 'opacity-80'}`}
                  style={{ width: '0%', transition: 'background-color 0.2s' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {solved && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
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
              "A shared resource protected by mutual exclusion prevents race conditions."
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