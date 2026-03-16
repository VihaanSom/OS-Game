import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase'; // Adjust path if needed

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } else {
        setTeams([]);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-green-400 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-12">
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
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                      No teams have successfully restored the OS yet.
                    </td>
                  </tr>
                ) : (
                  teams.map((team, index) => (
                    <tr 
                      key={team.id} 
                      className="border-b border-green-900/50 hover:bg-green-900/20 transition-colors"
                    >
                      <td className="p-4 font-bold text-xl">
                        {index === 0 ? '🏆 1' : index + 1}
                      </td>
                      <td className="p-4 font-bold text-lg tracking-wider text-white">
                        {team.teamName}
                      </td>
                      <td className="p-4 text-right font-bold text-green-400 text-xl">
                        {formatTime(team.timeRemaining)}
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        {formatTime(team.timeUsed)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}