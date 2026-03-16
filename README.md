# 🚀 Deadlock in Space

A local co-op educational web app teaching the **four necessary conditions of an OS deadlock** through an escape-room game for 5 players sharing a single laptop screen.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Vite + React 18 | App framework |
| TailwindCSS | Styling (dark-mode terminal UI) |
| Zustand | Global state (timer, systems, navigation) |
| @dnd-kit/core | Drag-and-drop (Power puzzle) |
| Firebase | Final leaderboard POST |

## Puzzles

| Puzzle | OS Concept | Mechanic |
|--------|------------|---------|
| 🌬️ **Oxygen System** | Mutual Exclusion | 5 players hold keys (Q/P/Z/M/Space) to fill bars; simultaneous presses trigger RACE CONDITION |
| ⚡ **Power System** | Hold and Wait | Kanban drag-and-drop with limited holding areas; sequence 4 components |
| 🧭 **Navigation** | No Preemption | Wait 60 s for a diagnostic process to release its key; force-killing causes KERNEL PANIC |
| 📡 **Comms System** | Circular Wait | Break a 4-node circular dependency by decoding clues and routing to CENTRAL_SERVER |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Firebase Leaderboard (optional)

1. Copy `.env.example` → `.env.local`
2. Fill in your Firebase Realtime Database credentials
3. The Victory screen will submit the team's name and completion time

If Firebase is not configured, the game still works fully — the leaderboard submit button is disabled with a clear message.

## Controls (Oxygen Puzzle)

| Player | Key |
|--------|-----|
| Player 1 | Q |
| Player 2 | P |
| Player 3 | Z |
| Player 4 | M |
| Player 5 | Spacebar |
