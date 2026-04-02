import React, { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import useGameStore from './store/gameStore'
import Hub from './components/Hub'
import OxygenPuzzle from './components/puzzles/OxygenPuzzle'
import PowerPuzzle from './components/puzzles/PowerPuzzle'
import NavPuzzle from './components/puzzles/NavPuzzle'
import CommsPuzzle from './components/puzzles/CommsPuzzle'
import Leaderboard from './Leaderboard'
import Victory from './components/Victory'

/**
 * App — root component with view routing.
 *
 * Navigation is handled entirely through Zustand state (currentView).
 * When all 4 systems are unlocked, the Victory screen is shown regardless
 * of currentView.
 */
function GameApp() {
  const currentView = useGameStore((s) => s.currentView)
  const gameWon = useGameStore((s) => s.gameWon)

  if (gameWon) return <Victory />

  switch (currentView) {
    case 'oxygen':
      return <OxygenPuzzle />
    case 'power':
      return <PowerPuzzle />
    case 'nav':
      return <NavPuzzle />
    case 'comms':
      return <CommsPuzzle />
    case 'hub':
    default:
      return <Hub />
  }
}

export default function App() {
  const tickTimer = useGameStore((s) => s.tickTimer)
  const [devToolsOpen, setDevToolsOpen] = useState(false)
  const devToolsRef = useRef(false)

  // Tick timer every second globally
  const tickRef = useRef(tickTimer)
  tickRef.current = tickTimer
  useEffect(() => {
    const id = setInterval(() => tickRef.current(), 1000)
    return () => clearInterval(id)
  }, [])

  // DevTools detection
  useEffect(() => {
    const detect = () => {
      const threshold = 160
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      const isOpen = widthDiff || heightDiff

      if (isOpen && !devToolsRef.current) {
        devToolsRef.current = true
        setDevToolsOpen(true)
        useGameStore.getState().stopTimer()
      } else if (!isOpen && devToolsRef.current) {
        devToolsRef.current = false
        setDevToolsOpen(false)
        useGameStore.getState().startTimer()
      }
    }
    const id = setInterval(detect, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* The main escape room game is on the root path */}
        <Route path="/" element={<GameApp />} />

        {/* The dedicated projector screen for the class */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>

      {/* DevTools SECURITY BREACH overlay */}
      {devToolsOpen && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center font-mono">
          <div className="text-center p-10">
            <div className="text-8xl mb-6">🔒</div>
            <h1 className="text-4xl font-bold text-red-500 tracking-widest mb-4 animate-pulse">
              SECURITY BREACH DETECTED
            </h1>
            <p className="text-red-400 text-lg mb-2">
              Unauthorized system access detected. Close developer tools to resume.
            </p>
            <p className="text-red-700 text-sm">
              Timer paused. Game will resume when the breach is resolved.
            </p>
          </div>
        </div>
      )}
    </BrowserRouter>
  )
}