import React, { useState, useEffect } from 'react'
import { ref, push } from 'firebase/database'
import useGameStore from '../store/gameStore'
import { db } from '../firebase'

/**
 * Victory Component
 *
 * Shown when all 4 systems are unlocked (gameWon === true).
 * - Stops the timer (already stopped in the store).
 * - Displays the final time.
 * - Presents a form to submit the Team Name to Firebase Realtime Database.
 *
 * Firebase config is read from environment variables (Vite VITE_ prefix).
 * If no Firebase config is provided, the leaderboard submission is disabled
 * gracefully and a message is shown.
 */

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const FIREWORKS = ['🎉', '🚀', '⭐', '✨', '🛸', '🌟', '💥', '🎊','👾']

export default function Victory() {
  const timeRemaining = useGameStore((s) => s.timeRemaining)
  const resetGame = useGameStore((s) => s.resetGame)
  const integrity = useGameStore((s) => s.integrity)

  const timeUsed = 1800 - timeRemaining
  const firebaseConfigured = Boolean(db)

  const [teamName, setTeamName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [firework, setFirework] = useState(FIREWORKS[0])

  // Rotate firework emoji
  useEffect(() => {
    const id = setInterval(() => {
      setFirework(FIREWORKS[Math.floor(Math.random() * FIREWORKS.length)])
    }, 400)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!teamName.trim()) return

    // If db is null (because variables are missing), stop gracefully
    if (!db) {
      setSubmitError(
        'Database connection offline. Leaderboard is disabled.'
      )
      return
    }

    setSubmitting(true)
    // ... rest of submit logic
    setSubmitError('')
    try {
      await push(ref(db, 'leaderboard'), {
        teamName: teamName.trim(),
        timeUsed,
        timeRemaining,
        raceConditions: integrity.raceConditions,
        kernelPanics: integrity.kernelPanics,
        completedAt: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="crt-overlay min-h-screen bg-gray-950 text-green-400 font-mono flex flex-col items-center justify-center p-6">
      {/* Animated header */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-4 animate-bounce">{firework}</div>
        <h1 className="text-5xl font-bold text-green-300 tracking-widest text-glow mb-2">
          MISSION COMPLETE
        </h1>
        <div className="text-green-600 tracking-widest text-lg">
          ALL SYSTEMS ONLINE — DEADLOCK ELIMINATED
        </div>
      </div>

      {/* Stats card */}
      <div className="border-2 border-green-500 bg-gray-900 rounded-xl p-8 w-full max-w-md mb-8 shadow-2xl shadow-green-500/20">
        <h2 className="text-lg font-bold text-green-300 tracking-widest mb-4 text-center">
          MISSION STATS
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-green-900 pb-2">
            <span className="text-green-600">Time Used</span>
            <span className="text-green-300 font-bold">{formatTime(timeUsed)}</span>
          </div>
          <div className="flex justify-between border-b border-green-900 pb-2">
            <span className="text-green-600">Time Remaining</span>
            <span className="text-green-300 font-bold">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex justify-between border-b border-green-900 pb-2">
            <span className="text-green-600">Systems Restored</span>
            <span className="text-green-300 font-bold">4/4</span>
          </div>
          <div className="flex justify-between border-b border-green-900 pb-2">
            <span className="text-green-600">Deadlock Conditions Eliminated</span>
            <span className="text-green-300 font-bold">4/4</span>
          </div>
          <div className="flex justify-between border-b border-green-900 pb-2">
            <span className="text-green-600">Race Conditions</span>
            <span className={`font-bold ${integrity.raceConditions > 0 ? 'text-red-400' : 'text-green-300'}`}>
              {integrity.raceConditions}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Kernel Panics</span>
            <span className={`font-bold ${integrity.kernelPanics > 0 ? 'text-red-400' : 'text-green-300'}`}>
              {integrity.kernelPanics}
            </span>
          </div>
        </div>

        {/* Concepts learned */}
        <div className="mt-4 pt-4 border-t border-green-900">
          <div className="text-xs text-green-600 tracking-widest mb-2">DEADLOCK CONDITIONS MASTERED:</div>
          <div className="space-y-1 text-xs">
            {[
              { label: 'Mutual Exclusion', icon: '🌬️', desc: 'Only one process accesses a resource at a time' },
              { label: 'Hold and Wait', icon: '⚡', desc: 'Don\'t hold resources while requesting others' },
              { label: 'No Preemption', icon: '🧭', desc: 'Let processes release resources voluntarily' },
              { label: 'Circular Wait', icon: '📡', desc: 'Impose total ordering on resource requests' },
            ].map(({ label, icon, desc }) => (
              <div key={label} className="flex gap-2 text-green-500">
                <span>{icon}</span>
                <div>
                  <span className="font-bold">{label}</span>
                  <span className="text-green-700 ml-1">— {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard submission */}
      <div className="border border-green-800 bg-gray-900 rounded-xl p-6 w-full max-w-md mb-6">
        <h2 className="text-lg font-bold text-green-300 tracking-widest mb-4 text-center">
          🏆 SUBMIT TO LEADERBOARD
        </h2>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎖️</div>
            <div className="text-green-400 font-bold">Score submitted!</div>
            <div className="text-green-600 text-sm mt-1">
              Your team&apos;s time has been recorded.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="teamName"
                className="block text-xs text-green-600 tracking-widest mb-1"
              >
                TEAM NAME
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g.Team Kernel(your divisoin eg.ICT A)"
                maxLength={50}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-green-300
                  placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500
                  focus:border-transparent"
              />
            </div>

            {submitError && (
              <div className="p-3 border border-red-700 bg-red-950/20 rounded text-red-400 text-xs">
                {submitError}
              </div>
            )}

            {!firebaseConfigured && (
              <div className="p-3 border border-yellow-700 bg-yellow-950/20 rounded text-yellow-500 text-xs">
                ⚠ Firebase not configured — leaderboard is disabled. Add{' '}
                <span className="font-bold">VITE_FIREBASE_*</span> environment variables to enable.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !teamName.trim() || !firebaseConfigured}
              className={`
                w-full py-3 rounded-lg border-2 font-bold tracking-widest transition-all
                ${firebaseConfigured && teamName.trim() && !submitting
                  ? 'border-green-500 bg-green-900/40 text-green-300 hover:bg-green-900/70 cursor-pointer'
                  : 'border-gray-700 bg-gray-900/30 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
            </button>
          </form>
        )}
      </div>

      {/* Play again */}
      <button
        onClick={resetGame}
        className="px-8 py-3 border border-green-700 text-green-500 rounded-lg hover:bg-green-900/30 transition-colors font-bold tracking-widest text-sm"
      >
        ↺ PLAY AGAIN
      </button>
    </div>
  )
}
