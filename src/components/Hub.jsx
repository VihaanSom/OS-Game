import React from 'react';
import useGameStore from '../store/gameStore';

/**
 * Scene 1: The Mainframe Hub
 *
 * - Displays the global countdown timer
 * - Shows 4 module buttons (Oxygen, Power, Nav, Comms)
 * - Buttons pulse red when locked, turn solid green when solved
 * - Clicking a button navigates to that puzzle
 */

const MODULES = [
  {
    id: 'oxygen',
    label: 'OXYGEN SYSTEM',
    icon: '🌬️',
    description: 'Mutual Exclusion',
    sublabel: 'LIFE SUPPORT MODULE',
  },
  {
    id: 'power',
    label: 'POWER SYSTEM',
    icon: '⚡',
    description: 'Hold and Wait',
    sublabel: 'ENERGY DISTRIBUTION',
  },
  {
    id: 'nav',
    label: 'NAVIGATION',
    icon: '🧭',
    description: 'No Preemption',
    sublabel: 'TRAJECTORY CONTROL',
  },
  {
    id: 'comms',
    label: 'COMMS SYSTEM',
    icon: '📡',
    description: 'Circular Wait',
    sublabel: 'SIGNAL ROUTING',
  },
]

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Hub() {
  const timeRemaining = useGameStore((s) => s.timeRemaining)
  const systems = useGameStore((s) => s.systems)
  const gameLost = useGameStore((s) => s.gameLost)
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const resetGame = useGameStore((s) => s.resetGame)
  const timerActive = useGameStore((s) => s.timerActive)

  const solvedCount = Object.values(systems).filter(Boolean).length
  const isLowTime = timeRemaining <= 300 // last 5 minutes

  return (
    <div className="relative crt-overlay min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
      {/* Secret Reset Button for the Game Master */}
      <button
        onClick={() => {
          if (window.confirm('GAME MASTER: Wipe all progress and reset timer?')) {
            resetGame()
          }
        }}
        className="absolute top-0 right-0 w-8 h-8 opacity-0 hover:opacity-100 bg-red-600 text-white font-bold text-xs z-50"
        title="Reset Game State"
      >
        RST
      </button>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-green-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 tracking-widest">STARSHIP SYS-7 // MAINFRAME HUB</div>
          <h1 className="text-2xl font-bold text-green-300 tracking-widest text-glow">
            DEADLOCK IN SPACE
          </h1>
        </div>

        {/* Timer */}
        <div className={`text-right ${isLowTime ? 'text-red-400' : 'text-green-400'}`}>
          <div className="text-xs tracking-widest opacity-70">TIME REMAINING</div>
          <div className={`text-4xl font-bold tracking-wider ${isLowTime ? 'animate-pulse' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
          {isLowTime && (
            <div className="text-xs text-red-400 animate-pulse">⚠ CRITICAL — REACTOR DECAY IMMINENT</div>
          )}
        </div>
      </header>

      {/* ─── Status bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-2 border-b border-green-900 text-xs text-green-600 flex gap-6">
        <span>SYSTEMS ONLINE: {solvedCount}/4</span>
        <span className={timerActive ? 'text-green-400' : 'text-yellow-400'}>
          TIMER: {timerActive ? 'RUNNING' : 'STANDBY'}
        </span>
        {gameLost && <span className="text-red-400 animate-pulse">⚠ MISSION FAILED</span>}
      </div>

      {/* ─── Mission briefing ────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-green-900/50">
        <p className="text-xs text-green-600 leading-relaxed max-w-3xl">
          <span className="text-green-400 font-bold">[MISSION BRIEF]</span> The ship&apos;s OS has entered a
          deadlock state. Four critical systems are offline. Your crew of 5 must repair each system before
          reactor power fails. Each system teaches you one of the four OS deadlock conditions. Solve them
          all before time runs out.
        </p>
      </div>

      {/* ─── Module grid ────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        {MODULES.map(({ id, label, icon, description, sublabel }) => {
          const solved = systems[id]
          return (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              className={`
                relative overflow-hidden rounded-lg border-2 p-6 text-left
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950
                ${
                  solved
                    ? 'border-green-500 bg-green-950/40 hover:bg-green-950/60 focus:ring-green-500'
                    : 'border-red-700 bg-red-950/20 hover:bg-red-950/30 focus:ring-red-500 animate-pulse'
                }
              `}
            >
              {/* Background glow */}
              <div
                className={`absolute inset-0 opacity-5 ${solved ? 'bg-green-400' : 'bg-red-600'}`}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl" role="img" aria-label={label}>{icon}</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${
                      solved
                        ? 'border-green-500 text-green-400 bg-green-950'
                        : 'border-red-600 text-red-400 bg-red-950'
                    }`}
                  >
                    {solved ? '● ONLINE' : '● OFFLINE'}
                  </span>
                </div>

                <div className="text-xs text-green-600 tracking-widest mb-1">{sublabel}</div>
                <div className={`font-bold text-lg tracking-widest ${solved ? 'text-green-300' : 'text-red-300'}`}>
                  {label}
                </div>
                <div className={`text-sm mt-1 ${solved ? 'text-green-600' : 'text-red-600'}`}>
                  OS Concept: {description}
                </div>

                {solved && (
                  <div className="mt-3 text-xs text-green-400 font-bold">
                    ✓ SYSTEM RESTORED
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </main>

      {/* ─── Game Over overlay ───────────────────────────────────────────────── */}
      {gameLost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="border-2 border-red-500 bg-gray-950 p-10 text-center rounded-lg max-w-md">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2 tracking-widest">MISSION FAILED</h2>
            <p className="text-red-600 mb-6 text-sm">
              The reactor has gone critical. All crew members have been lost to the void.
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-red-900 border border-red-500 text-red-300 rounded hover:bg-red-800 transition-colors font-bold tracking-widest"
            >
              ↺ RESTART MISSION
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-green-900 px-6 py-3 text-center">
        <span>STARSHIP SYS-7 v2.4.1</span>
        <span>5-PLAYER CO-OP MODE // LOCAL</span>
        <span>KERNEL: DEADLOCK-OS</span>
      </footer>
    </div>
  );
}
