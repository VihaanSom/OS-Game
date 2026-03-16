import React, { useEffect, useRef } from 'react'
import useGameStore from './store/gameStore'
import Hub from './components/Hub'
import OxygenPuzzle from './components/puzzles/OxygenPuzzle'
import PowerPuzzle from './components/puzzles/PowerPuzzle'
import NavPuzzle from './components/puzzles/NavPuzzle'
import CommsPuzzle from './components/puzzles/CommsPuzzle'
import Leaderboard from './Leaderboard';
import Victory from './components/Victory'

/**
 * App — root component with view routing.
 *
 * Navigation is handled entirely through Zustand state (currentView).
 * When all 4 systems are unlocked, the Victory screen is shown regardless
 * of currentView.
 */
export default function App() {
  const currentView = useGameStore((s) => s.currentView)
  const gameWon = useGameStore((s) => s.gameWon)
  const timerActive = useGameStore((s) => s.timerActive)
  const gameLost = useGameStore((s) => s.gameLost)
  const tickTimer = useGameStore((s) => s.tickTimer)

  // Tick timer every second globally
  const tickRef = useRef(tickTimer)
  tickRef.current = tickTimer
  useEffect(() => {
    const id = setInterval(() => tickRef.current(), 1000)
    return () => clearInterval(id)
  }, [])

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

  return (
    <BrowserRouter>
      <Routes>
        {/* The main escape room game is on the root path */}
        <Route path="/" element={<GameApp />} />
        
        {/* The dedicated projector screen for the class */}
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );

}