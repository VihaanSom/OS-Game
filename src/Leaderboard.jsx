import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase'; // Adjust path if needed

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Extracts class name from team name
 * Parses format: "Team Name(ICT A)" or "Team Name ICT A"
 * Valid divisions: ICT A, ICT B, CSE A, CSE B, CSE C
 * Returns normalized format like "ICT A" or null if invalid
 */
function extractClass(teamName) {
  if (!teamName) return null;
  
  const validDivisions = ['ICT A', 'ICT B', 'CSE A', 'CSE B', 'CSE C'];
  
  // Try 1: Extract from parentheses (e.g., "Team(ICT A)" or "Team (ICT A)")
  const parenPattern = /\(([^)]+)\)\s*$/;
  const parenMatch = teamName.trim().match(parenPattern);
  
  if (parenMatch) {
    const classText = parenMatch[1].trim().toUpperCase();
    if (validDivisions.includes(classText)) {
      return classText;
    }
  }
  
  // Try 2: Check if team name ends with a valid division without parentheses
  // (e.g., "Team ICT A" or "Syntax Squad CSE B")
  const trimmed = teamName.trim().toUpperCase();
  for (const div of validDivisions) {
    if (trimmed.endsWith(div)) {
      // Verify there's a team name before the division
      const beforeDiv = trimmed.slice(0, -div.length).trim();
      if (beforeDiv.length > 0) {
        return div;
      }
    }
  }
  
  return null;
}

/**
 * Extracts unique classes from teams array
 * Returns sorted array of valid divisions
 * Valid order: ICT A, ICT B, CSE A, CSE B, CSE C
 */
function getUniqueClasses(teams) {
  const classSet = new Set();
  
  teams.forEach(team => {
    const cls = extractClass(team.teamName);
    if (cls) {
      classSet.add(cls);
    }
  });
  
  // Sort in fixed order: ICT A, ICT B, CSE A, CSE B, CSE C
  const divisionOrder = ['ICT A', 'ICT B', 'CSE A', 'CSE B', 'CSE C'];
  return divisionOrder.filter(div => classSet.has(div));
}

const TOTAL_TIME_SECONDS = 1800;

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {

    if (!db) {
      setLoading(false);
      return;
    }
    const leaderboardRef = ref(db, 'leaderboard');
    
    // onValue creates a live websocket connection. It updates instantly when a new team finishes.
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Firebase object into an array
        const teamArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort by timeRemaining descending (highest time wins)
        teamArray.sort((a, b) => b.timeRemaining - a.timeRemaining);
        setTeams(teamArray);
        
        // Extract and set available classes
        const classes = getUniqueClasses(teamArray);
        setAvailableClasses(classes);
      } else {
        setTeams([]);
        setAvailableClasses([]);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Filter teams based on selected class
  const filteredTeams = selectedClass === 'all' 
    ? teams 
    : teams.filter(team => extractClass(team.teamName) === selectedClass);

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-300 tracking-widest drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] mb-2">
            STARSHIP SYS-7 LEADERBOARD
          </h1>
          <p className="text-green-600 tracking-widest animate-pulse">
            LIVE SYSTEM DIAGNOSTICS & CREW SURVIVAL TIMES
          </p>
        </header>

        {loading ? (
          <div className="text-center text-green-500 animate-pulse text-xl">
            FETCHING MAINFRAME DATA...
          </div>
        ) : (
          <>
            {/* Class Filter Section */}
            <div className="mb-8 bg-gray-900/50 border-2 border-green-900 rounded-lg p-6 shadow-[0_0_30px_rgba(20,83,45,0.4)]">
              <div className="text-green-300 font-bold tracking-widest mb-4 text-lg">
                FILTER BY CLASS
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedClass('all')}
                  className={`px-4 py-2 rounded font-bold tracking-wide transition-all ${
                    selectedClass === 'all'
                      ? 'bg-green-500 text-gray-950 shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                      : 'bg-green-900/50 text-green-300 border border-green-700 hover:bg-green-900'
                  }`}
                >
                  ALL ({teams.length})
                </button>
                
                {availableClasses.map(cls => {
                  const classCount = teams.filter(t => extractClass(t.teamName) === cls).length;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-4 py-2 rounded font-bold tracking-wide transition-all ${
                        selectedClass === cls
                          ? 'bg-green-500 text-gray-950 shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                          : 'bg-green-900/50 text-green-300 border border-green-700 hover:bg-green-900'
                      }`}
                    >
                      {cls} ({classCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-gray-900/50 border-2 border-green-900 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(20,83,45,0.4)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-950/80 border-b-2 border-green-700">
                  <th className="p-4 text-green-300 font-bold tracking-widest">RANK</th>
                  <th className="p-4 text-green-300 font-bold tracking-widest">TEAM DESIGNATION</th>
                  <th className="p-4 text-green-300 font-bold tracking-widest text-right">TIME REMAINING</th>
                  <th className="p-4 text-green-300 font-bold tracking-widest text-right">TIME USED</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                      {teams.length === 0 
                        ? 'No teams have successfully restored the OS yet.'
                        : `No teams from ${selectedClass} have completed the mission.`}
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, index) => (
                    <tr 
                      key={team.id} 
                      className="border-b border-green-900/50 hover:bg-green-900/20 transition-colors"
                    >
                      <td className="p-4 font-bold text-xl">
                        {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index + 1}
                      </td>
                      <td className="p-4 font-bold text-lg tracking-wider text-white">
                        {team.teamName}
                      </td>
                      <td className="p-4 text-right font-bold text-green-400 text-xl">
                        {formatTime(team.timeRemaining)}
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        {formatTime(Math.max(0, TOTAL_TIME_SECONDS - team.timeRemaining))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}