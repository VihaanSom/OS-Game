import React, { useState, useEffect, useRef } from 'react'
import useGameStore from '../../store/gameStore'

/**
 * Puzzle 3: Navigation System — No Preemption
 *
 * Mechanic:
 * - A 60-second "Automated Diagnostic" progress bar runs.
 * - When it completes, the Override Key is released and the system comes online.
 * - A tempting red "FORCE KILL PROCESS" button is on screen.
 * - If clicked, it throws a KERNEL PANIC error and resets the timer to 0.
 * - Players must learn to NOT click the button and let the process yield voluntarily.
 *
 * OS Concept — No Preemption: Resources cannot be forcibly taken from a process.
 * The process must release them voluntarily. Preempting (force-killing) causes
 * instability (kernel panic) and the process has to restart.
 */

const DIAGNOSTIC_DURATION = 60 // seconds

export default function NavPuzzle() {
  const setCurrentView = useGameStore((s) => s.setCurrentView)
  const systems = useGameStore((s) => s.systems)
  const unlockSystem = useGameStore((s) => s.unlockSystem)

  const [elapsed, setElapsed] = useState(0)   // 0..DIAGNOSTIC_DURATION
  const [running, setRunning] = useState(false)
  const [panicState, setPanicState] = useState(false)
  const [panicCount, setPanicCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const solved = systems.nav

  // Tick every second
  const elapsedRef = useRef(elapsed)
  elapsedRef.current = elapsed

  useEffect(() => {
    if (solved) return

    // Auto-start the diagnostic
    setRunning(true)

    const id = setInterval(() => {
      if (panicState) return
      setElapsed((prev) => {
        if (prev >= DIAGNOSTIC_DURATION) {
          clearInterval(id)
          setRunning(false)
          unlockSystem('nav')
          return DIAGNOSTIC_DURATION
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panicState, solved])

  function handleForceKill() {
    if (solved) return
    // Trigger kernel panic
    setPanicState(true)
    setPanicCount((c) => c + 1)
    setRunning(false)
    setElapsed(0)

    // Recover after 3 seconds, restart diagnostic
    setTimeout(() => {
      setPanicState(false)
      setRunning(true)
    }, 3000)
  }

  function handleStartWarning() {
    setShowWarning(true)
    setTimeout(() => setShowWarning(false), 2000)
  }

  const progress = (elapsed / DIAGNOSTIC_DURATION) * 100
  const timeLeft = DIAGNOSTIC_DURATION - elapsed

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-green-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 tracking-widest">STARSHIP SYS-7 // NAVIGATION</div>
          <h2 className="text-xl font-bold text-green-300 tracking-widest">🧭 TRAJECTORY CONTROL</h2>
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
        <span className="font-bold text-blue-200">OS CONCEPT — NO PREEMPTION:</span> Resources
        cannot be forcibly taken from a process. The process must release them voluntarily. Forcing
        a process to stop causes instability — wait for the diagnostic to complete on its own.
      </div>

      {/* Kernel Panic overlay */}
      {panicState && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-pulse">
          <div className="border-2 border-red-600 bg-gray-950 p-10 text-center rounded-lg max-w-lg">
            <div className="text-5xl mb-4">💥</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2 tracking-widest">KERNEL PANIC</h2>
            <div className="font-mono text-red-600 text-xs text-left bg-black p-4 rounded mb-4 space-y-1">
              <div>Oops: killed: nav_diagnostic_process</div>
              <div>EIP: 0060:[&lt;f8a31c7d&gt;] EFLAGS: 00010096 CPU: 0</div>
              <div>Call Trace:</div>
              <div>&nbsp;&nbsp;[&lt;c01b3d2f&gt;] force_preempt+0x12/0x40</div>
              <div>&nbsp;&nbsp;[&lt;c01a8b14&gt;] resource_revoke+0x8/0x10</div>
              <div>Process nav_diag (pid: 4872, ti=c1684000 task=c168...</div>
              <div className="text-red-400 animate-pulse">Restarting diagnostic in 3 seconds...</div>
            </div>
            <p className="text-red-500 text-sm">
              Pre-empting the diagnostic process caused system instability. The process must be
              allowed to complete voluntarily.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Panic counter */}
        {panicCount > 0 && (
          <div className="mb-4 p-3 border border-red-800 bg-red-950/20 rounded text-sm">
            <span className="text-red-400 font-bold">⚠ KERNEL PANICS: {panicCount}</span>
            <span className="text-red-600 ml-2">
              — Each forced kill restarts the diagnostic. Let it run!
            </span>
          </div>
        )}

        {/* Process info */}
        <div className="p-4 rounded-lg border border-gray-700 bg-gray-900/50 mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 tracking-widest">PROCESS</span>
            <span className={`text-xs font-bold ${running ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>
              {running ? '▶ RUNNING' : '■ STOPPED'}
            </span>
          </div>
          <div className="text-green-300 font-bold">nav_diagnostic_process</div>
          <div className="text-xs text-gray-500 mt-1">PID: 4872 | Priority: HIGH | Lock: NAV_OVERRIDE_KEY</div>
          <div className="text-xs text-yellow-500 mt-1">
            Holding resource: <span className="font-bold">NAV_OVERRIDE_KEY</span> (will release voluntarily on completion)
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>AUTOMATED DIAGNOSTIC PROGRESS</span>
            <span>{elapsed}s / {DIAGNOSTIC_DURATION}s</span>
          </div>
          <div className="h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                panicState ? 'bg-red-600' : 'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-green-600">{progress.toFixed(1)}% complete</span>
            {running && !panicState && (
              <span className="text-yellow-500">~{timeLeft}s remaining</span>
            )}
          </div>
        </div>

        {/* Status log */}
        <div className="p-4 rounded-lg border border-gray-800 bg-black/40 mb-6 font-mono text-xs text-green-700 space-y-1 h-28 overflow-y-auto">
          <div>[{String(elapsed).padStart(2, '0')}s] Diagnostic progress: {progress.toFixed(1)}%</div>
          {elapsed >= 10 && <div>[10s] Sector A: nav-array integrity... OK</div>}
          {elapsed >= 20 && <div>[20s] Sector B: trajectory matrix... OK</div>}
          {elapsed >= 30 && <div>[30s] Sector C: star-map checksums... OK</div>}
          {elapsed >= 40 && <div>[40s] Sector D: autopilot calibration... OK</div>}
          {elapsed >= 50 && <div>[50s] Sector E: hyperspace calculations... OK</div>}
          {elapsed >= 60 && <div>[60s] ✓ Diagnostic complete — releasing NAV_OVERRIDE_KEY</div>}
          {panicCount > 0 && (
            <div className="text-red-500">
              [ERR] Kernel panic #{panicCount} — force-kill attempted!
            </div>
          )}
        </div>

        {/* THE TEMPTING BUTTON */}
        <div className="border-2 border-red-800 rounded-lg p-5 bg-red-950/10">
          <div className="text-xs text-red-600 tracking-widest mb-1">⚠ DANGER ZONE</div>
          <div className="text-red-400 text-sm mb-3">
            The diagnostic is taking too long. You could force-kill it... but should you?
          </div>
          <button
            onClick={handleForceKill}
            onMouseEnter={handleStartWarning}
            disabled={solved}
            className={`
              w-full py-4 rounded-lg border-2 border-red-600 font-bold text-lg tracking-widest
              transition-all duration-200
              ${solved
                ? 'opacity-20 cursor-not-allowed'
                : 'bg-red-900/50 text-red-300 hover:bg-red-800/70 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }
            `}
          >
            💀 FORCE KILL PROCESS
          </button>
          {showWarning && (
            <div className="mt-2 text-xs text-red-500 animate-pulse text-center">
              ⚠ This will cause a KERNEL PANIC and reset the timer!
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="mt-4 p-3 border border-gray-800 bg-gray-900/30 rounded text-xs text-gray-500 text-center">
          💡 Hint: In OS design, No Preemption means you cannot forcibly take a resource from a
          process. Just wait 60 seconds for the process to release the Override Key on its own.
        </div>
      </div>

      {/* Win overlay */}
      {solved && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="border-2 border-green-500 bg-gray-950 p-10 text-center rounded-lg max-w-md shadow-2xl shadow-green-500/20">
            <div className="text-6xl mb-4">🧭</div>
            <h2 className="text-3xl font-bold text-green-300 mb-2 tracking-widest">
              NAV RESTORED
            </h2>
            <p className="text-green-600 mb-2 text-sm">
              The diagnostic completed and voluntarily released the Override Key.
              No preemption was needed — the process yielded on its own.
            </p>
            <p className="text-green-700 text-xs mb-6 italic">
              &ldquo;Resources are released only voluntarily by the process holding them,
              after that process has completed its task.&rdquo;
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
