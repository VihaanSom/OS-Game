import React from 'react'
import useGameStore from './store/gameStore'
import Hub from './components/Hub'
import OxygenPuzzle from './components/puzzles/OxygenPuzzle'
import PowerPuzzle from './components/puzzles/PowerPuzzle'
import NavPuzzle from './components/puzzles/NavPuzzle'
import CommsPuzzle from './components/puzzles/CommsPuzzle'
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
