import { create } from 'zustand'

/**
 * Global Zustand store for "Deadlock in Space"
 *
 * Manages:
 * - A global countdown timer (45:00 = 2700 seconds)
 * - A boolean object tracking the unlock status of 4 systems
 * - Navigation state to switch between Hub and 4 puzzle views
 * - Game win / loss state
 */
const useGameStore = create((set, get) => ({
  // ─── Timer ──────────────────────────────────────────────────────────────────
  timeRemaining: 2700, // 45 minutes in seconds
  timerActive: false,

  startTimer: () => set({ timerActive: true }),
  stopTimer: () => set({ timerActive: false }),

  tickTimer: () => {
    const { timeRemaining } = get()
    if (timeRemaining <= 1) {
      set({ timeRemaining: 0, timerActive: false, gameLost: true })
    } else {
      set({ timeRemaining: timeRemaining - 1 })
    }
  },

  // ─── System unlock status ────────────────────────────────────────────────────
  systems: {
    oxygen: false,
    power: false,
    nav: false,
    comms: false,
  },

  unlockSystem: (system) => {
    set((state) => {
      const newSystems = { ...state.systems, [system]: true }
      const allUnlocked = Object.values(newSystems).every(Boolean)
      return {
        systems: newSystems,
        gameWon: allUnlocked,
        timerActive: allUnlocked ? false : state.timerActive,
      }
    })
  },

  // ─── Navigation ─────────────────────────────────────────────────────────────
  // Possible values: 'hub' | 'oxygen' | 'power' | 'nav' | 'comms'
  currentView: 'hub',
  setCurrentView: (view) => set({ currentView: view }),

  // ─── Victory / Defeat ────────────────────────────────────────────────────────
  gameWon: false,
  gameLost: false,

  // ─── Reset ───────────────────────────────────────────────────────────────────
  resetGame: () =>
    set({
      timeRemaining: 2700,
      timerActive: false,
      systems: { oxygen: false, power: false, nav: false, comms: false },
      currentView: 'hub',
      gameWon: false,
      gameLost: false,
    }),
}))

export default useGameStore
