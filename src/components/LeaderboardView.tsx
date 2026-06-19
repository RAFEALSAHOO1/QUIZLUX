import { useEffect, useState } from "react";
import { Trophy, RefreshCw, Star, Users, Award, Shield, Sparkles } from "lucide-react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import { LeaderboardEntry } from "../types";

export default function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Separate top 3 podium if many exist
  const firstPlace = entries.find(e => e.rank === 1);
  const secondPlace = entries.find(e => e.rank === 2);
  const thirdPlace = entries.find(e => e.rank === 3);

  // List of remaining students
  const regularRanks = entries.filter(e => e.rank > 3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Title Header with Glowing Refresh button */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#1E293B]/40 p-6 rounded-2xl border border-white/5 gap-4 shadow-md">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-[#FFD700] font-sans">
            <Trophy className="w-3.5 h-3.5" />
            <span>GLOBAL STANDINGS ACTIVE</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            QuizLux Academic Leaderboard
          </h2>
          <p className="text-slate-400 text-xs leading-normal">
            Calculated score rankings computed dynamically from total points and cumulative test accuracies.
          </p>
        </div>

        <div>
          <SkeuomorphicButton
            variant="glass"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="text-xs px-4 py-2 border-slate-700 hover:border-slate-500 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00D4FF] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ranks</span>
          </SkeuomorphicButton>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs font-mono">
          Querying standing histories...
        </div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-300">Scoreboard is Currently Empty</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            No exams have been submitted yet. Register a Student account and submit your answers to establish your rank.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top 3 placements Podium Visual Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
            
            {/* Position #2 (Silver Medal) */}
            <div className="order-2 md:order-1">
              {secondPlace ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-300/30 shadow-[0_0_15px_rgba(148,163,184,0.1)] flex items-center justify-center relative mb-3">
                    <span className="text-xl font-black text-slate-300">2</span>
                    <span className="absolute bottom-[-4px] bg-slate-400 text-[9px] px-1.5 font-bold uppercase rounded text-slate-950 font-mono">SILVER</span>
                  </div>
                  <div className="text-center p-5 bg-[#1E293B]/20 border border-white/5 rounded-2xl w-full space-y-1">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{secondPlace.fullName}</h4>
                    <p className="text-xs text-slate-400 font-mono font-bold text-[#FFD700]">{secondPlace.totalScore} pts</p>
                    <p className="text-[10px] text-slate-500">{secondPlace.averageAccuracy}% average accuracy</p>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/5 rounded-2xl p-6 text-center text-xs text-slate-600">Pending #2 Silver Standing</div>
              )}
            </div>

            {/* Position #1 (Gold Medal Crown Hero) */}
            <div className="order-1 md:order-2">
              {firstPlace ? (
                <div className="flex flex-col items-center relative z-10">
                  {/* Floating Gold crown visual detail */}
                  <div className="absolute top-[-24px] pointer-events-none animate-pulse">
                    <Sparkles className="w-6 h-6 text-[#FFD700] fill-current" />
                  </div>
                  <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center relative mb-4">
                    <span className="text-2xl font-black text-[#FFD700]">1</span>
                    <span className="absolute bottom-[-4px] bg-[#FFD700] text-[9px] px-1.5 font-black uppercase rounded text-slate-950 font-mono">CHAMPION</span>
                  </div>
                  <div className="text-center p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-3xl w-full space-y-2 select-none">
                    <h4 className="font-extrabold text-white text-base truncate">{firstPlace.fullName}</h4>
                    <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-amber-500 font-black font-mono">{firstPlace.totalScore} pts</p>
                    <p className="text-xs text-slate-400 leading-none">{firstPlace.averageAccuracy}% average accuracy</p>
                    <p className="text-[9px] text-[#00D4FF] uppercase tracking-wider font-mono font-bold">{firstPlace.attemptsCount} exams completed</p>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#FFD700]/20 rounded-3xl p-8 text-center text-xs text-slate-600">Pending #1 Scholar Standing</div>
              )}
            </div>

            {/* Position #3 (Bronze Medal) */}
            <div className="order-3">
              {thirdPlace ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-amber-900/30 shadow-[0_0_15px_rgba(180,83,9,0.1)] flex items-center justify-center relative mb-3">
                    <span className="text-xl font-black text-amber-600 font-mono">3</span>
                    <span className="absolute bottom-[-4px] bg-amber-700 text-[9px] px-1.5 font-bold uppercase rounded text-amber-100 font-mono">BRONZE</span>
                  </div>
                  <div className="text-center p-5 bg-[#1E293B]/20 border border-white/5 rounded-2xl w-full space-y-1">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{thirdPlace.fullName}</h4>
                    <p className="text-xs text-slate-400 font-mono font-bold text-[#FFD700]">{thirdPlace.totalScore} pts</p>
                    <p className="text-[10px] text-slate-500">{thirdPlace.averageAccuracy}% average accuracy</p>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/5 rounded-2xl p-6 text-center text-xs text-slate-600">Pending #3 Bronze Standing</div>
              )}
            </div>

          </div>

          {/* Placements 4+ detailed table list */}
          {regularRanks.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#1E293B]/10 overflow-hidden shadow-lg space-y-2 mt-4">
              <span className="block text-[10px] uppercase font-mono pl-6 pt-4 pb-1 text-slate-500 font-bold">
                Honorable Standings
              </span>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-[#0F172A] text-[9px] font-mono uppercase text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 w-20">Rank</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Exams Taken</th>
                      <th className="px-6 py-3">Avg Accuracy</th>
                      <th className="px-6 py-3 text-right">Composite Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {regularRanks.map((item) => (
                      <tr key={item.userId} className="hover:bg-white/[0.01]">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-500">
                          #{item.rank.toString().padStart(2, "0")}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-200">
                          {item.fullName}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400">
                          {item.attemptsCount} exams
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400">
                          {item.averageAccuracy}%
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-[#FFD700] text-right">
                          {item.totalScore} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
