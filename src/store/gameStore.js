import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global Zustand store for "Deadlock in Space"
 *
 * Manages:
 * - A global countdown timer (45:00 = 2700 seconds)
 * - A boolean object tracking the unlock status of 4 systems
 * - Navigation state to switch between Hub and 4 puzzle views
 * - Game win / loss state
 */
const useGameStore = create(
  persist(
    (set, get) => ({
      // ─── Timer ──────────────────────────────────────────────────────────────────
      timeRemaining: 1800, // 30 minutes in seconds
      timerActive: true,

      startTimer: () => set({ timerActive: true }),
      stopTimer: () => set({ timerActive: false }),

      tickTimer: () => {
        const { timeRemaining, timerActive } = get()
        if (timerActive && timeRemaining <= 1) {
          set({ timeRemaining: 0, timerActive: false, gameLost: true })
        } else if (timerActive) {
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

      // --- NEW: CRITICAL FOR CLASSROOM USE ---
      resetGame: () =>
        set({
          timeRemaining: 1800,
          timerActive: true,
          systems: { oxygen: false, power: false, nav: false, comms: false },
          currentView: 'hub',
          gameWon: false,
          gameLost: false,
        }),
    }),
    {
      name: 'deadlock-escape-storage', // The key used in browser localStorage
    },
  ),
)

export default useGameStore
