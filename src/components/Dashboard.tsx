import { useState, useEffect } from "react";
import { BookOpen, Award, CheckCircle, Search, Sparkles, Filter, Calendar, BarChart3, Star, PlaySquare, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import { Quiz, Attempt, StudentStats } from "../types";

interface DashboardProps {
  token: string;
  user: { id: string; fullName: string; email: string; role: "student" | "admin" };
  onStartQuiz: (quizId: string) => void;
  onViewResult: (attemptId: string) => void;
  quizzes: Quiz[];
  onRefreshQuizzes: () => void;
}

export default function Dashboard({
  token,
  user,
  onStartQuiz,
  onViewResult,
  quizzes,
  onRefreshQuizzes
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"available" | "history" | "analytics">("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard" | string>("All");

  const [history, setHistory] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch performance and stats
  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [token]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/attempts/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.sort((a: Attempt, b: Attempt) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role === "student") {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStats(null); // Fallback mock calculating locally if fetch fails or is blank
      setLoadingStats(false);
    }
  };

  // Local calculations if server is empty
  const localStats: StudentStats = stats || {
    totalAttempts: history.length,
    totalScore: history.reduce((sum, h) => sum + h.score, 0),
    averageScore: history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) : 0,
    averageAccuracy: history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / history.length) : 0,
    currentRank: history.length > 0 ? "Gold Level" : "Unranked"
  };

  // Extract distinct categories
  const categories = ["All", ...Array.from(new Set(quizzes.map(q => q.category)))];

  // Filtering Logic
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Dashboard Greeting Header Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-900/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C63FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-[#00D4FF] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>AUTHENTICATED STUDENT WORKSPACE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome, {user.fullName}!
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            View available diagnostic quizzes, track your historic accuracy levels, and view rankings. Select any quiz to launch the countdown timer.
          </p>
        </div>

        <div className="flex gap-2">
          <SkeuomorphicButton 
            variant="glass" 
            onClick={fetchHistory}
            className="text-xs px-4 py-2 border-slate-700 hover:border-slate-500"
          >
            Refresh Diagnostics
          </SkeuomorphicButton>
        </div>
      </div>

      {/* Analytics Widgets Cards */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        
        {/* Widget 1 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
          }}
          className="p-5 rounded-2xl bg-[#1E293B]/40 border border-white/5 shadow-md flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#6C63FF]" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Attempts</span>
            <span className="text-xl md:text-2xl font-bold text-white mt-1 block">{localStats.totalAttempts}</span>
          </div>
        </motion.div>

        {/* Widget 2 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
          }}
          className="p-5 rounded-2xl bg-[#1E293B]/40 border border-white/5 shadow-md flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Score</span>
            <span className="text-xl md:text-2xl font-bold text-[#FFD700] mt-1 block">{localStats.totalScore} pts</span>
          </div>
        </motion.div>

        {/* Widget 3 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
          }}
          className="p-5 rounded-2xl bg-[#1E293B]/40 border border-white/5 shadow-md flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Average Accuracy</span>
            <span className="text-xl md:text-2xl font-bold text-[#00D4FF] mt-1 block">{localStats.averageAccuracy}%</span>
          </div>
        </motion.div>

        {/* Widget 4 */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
          }}
          className="p-5 rounded-2xl bg-[#1E293B]/40 border border-white/5 shadow-md flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Pioneer Rank</span>
            <span className="text-base md:text-lg font-bold text-pink-200 mt-2 block select-none truncate">
              {localStats.currentRank}
            </span>
          </div>
        </motion.div>

      </motion.div>

      {/* Tabs Menu Selection */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeTab === "available" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Available Exams
          {activeTab === "available" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeTab === "history" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Attempt History ({history.length})
          {activeTab === "history" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeTab === "analytics" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Analytics Summary
          {activeTab === "analytics" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>
      </div>

      {/* TABS PANELS */}

      {/* Tab 1: Available Exams */}
      {activeTab === "available" && (
        <div className="space-y-6">
          
          {/* Search, Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-[#1E293B]/10 p-4 rounded-2xl border border-white/5">
            <div className="flex flex-col md:flex-row gap-3 items-center w-full lg:max-w-xl">
              {/* Search Input */}
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exam title or category..."
                  className="w-full pl-11 pr-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Difficulty Dropdown */}
              <div className="relative w-full md:max-w-[170px] shrink-0">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">⭐ Easy</option>
                  <option value="Medium">⭐⭐ Medium</option>
                  <option value="Hard">⭐⭐⭐ Hard</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[8px] text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            {/* Category Filters row */}
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none pb-1 lg:pb-0">
              <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider font-bold shrink-0">Categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap scrollbar-none transition cursor-pointer select-none border ${
                    selectedCategory === cat
                      ? "bg-[#6C63FF]/15 border-[#6C63FF]/30 text-white"
                      : "bg-[#0F172A]/40 border-white/5 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quizzes Grids */}
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-300">No Exams Match Your Fit</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                No active quizzes found on the platform matching search filters. Admins can easily author new exams or trigger the AI Gen toolkit directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="rounded-2xl bg-white/[0.01] border border-white/5 p-6 hover:border-white/15 transition-all flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_20px_rgba(0,0,0,0.2)] group"
                >
                  <div className="space-y-4">
                    {/* Tags line */}
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#6C63FF]/15 border border-[#6C63FF]/25 text-[10px] font-bold text-[#8C84FF] uppercase tracking-wide">
                        {quiz.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        quiz.difficulty === "Easy" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                        quiz.difficulty === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                        "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-[#6C63FF] transition">
                      {quiz.title}
                    </h3>

                    {/* Brief description */}
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Meta stats block */}
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono text-slate-500 bg-[#0F172A]/35 py-2.5 rounded-lg">
                      <div>
                        <span className="block text-slate-400 text-xs font-bold text-white">{quiz.questions.length}</span>
                        <span>Questions</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-xs font-bold text-white">{quiz.duration} Mins</span>
                        <span>Time Limit</span>
                      </div>
                    </div>

                    <SkeuomorphicButton
                      variant="primary"
                      onClick={() => onStartQuiz(quiz.id)}
                      className="w-full gap-2 text-xs py-2.5"
                    >
                      <PlaySquare className="w-4 h-4" />
                      Start Examination
                    </SkeuomorphicButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Attempt History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              Interrogating log databases...
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-300">Your Exam Records are Empty</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                No past exam records found. When you complete any available quiz, and submit answers, your total points, accuracy, and detailed score sheet reviews will populate here instantly.
              </p>
              <div className="pt-2">
                <SkeuomorphicButton variant="primary" onClick={() => setActiveTab("available")} className="text-xs px-4 py-2">
                  Take First Quiz
                </SkeuomorphicButton>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-[#1E293B]/10 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-[#0F172A] text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Quiz Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Date Completed</th>
                      <th className="px-6 py-4">Accuracy</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 font-semibold text-slate-100">
                          {item.quizTitle}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-bold ${
                              item.accuracy >= 80 ? "text-green-400" :
                              item.accuracy >= 50 ? "text-amber-400" :
                              "text-red-400"
                            }`}>
                              {item.accuracy}%
                            </span>
                            <div className="w-16 bg-slate-800 rounded-full h-1 overflow-hidden shrink-0 hidden md:block">
                              <div
                                className={`h-full rounded-full ${
                                  item.accuracy >= 80 ? "bg-green-400" :
                                  item.accuracy >= 50 ? "bg-amber-400" :
                                  "bg-red-400"
                                }`}
                                style={{ width: `${item.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#FFD700]">
                          {item.score} pts
                        </td>
                        <td className="px-6 py-4 text-right">
                          <SkeuomorphicButton
                            variant="glass"
                            onClick={() => onViewResult(item.id)}
                            className="text-[10px] px-3 py-1 cursor-pointer border-indigo-950"
                          >
                            <span className="flex items-center gap-1.5">
                              Review Solutions
                              <ArrowRight className="w-3 h-3 text-[#00D4FF]" />
                            </span>
                          </SkeuomorphicButton>
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

      {/* Tab 3: Analytics Summary */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-6">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00D4FF]" /> Custom Performance Index
            </h3>

            {history.length === 0 ? (
              <p className="text-slate-500 text-xs">Complete a quiz to plot accuracy history charts.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analytics calculates accuracy and total points relative to overall target marks. Track category averages to identify weaknesses under specialized curriculum structures.
                </p>

                {/* Progress Category bars */}
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Composite Score Accuracy</span>
                      <span className="text-[#6C63FF]">{localStats.averageAccuracy}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-920 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-full" style={{ width: `${localStats.averageAccuracy}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Target Level Achievements</span>
                      <span className="text-[#FFD700]">
                        {localStats.totalScore > 100 ? "Gold Certified" : localStats.totalScore > 50 ? "Silver Certified" : "Standard Level"}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-920 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FFD700] to-yellow-600 rounded-full" style={{ width: `${Math.min(100, (localStats.totalScore / 200) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-6">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FFD700]" /> Student Progression Checklist
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                <input type="checkbox" checked={history.length > 0} readOnly className="mt-0.5 accent-[#6C63FF]" />
                <div>
                  <span className="block text-slate-200">First Attempt Achieved</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Complete any quiz on the dashboard.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                <input type="checkbox" checked={localStats.averageAccuracy >= 80} readOnly className="mt-0.5 accent-[#00D4FF]" />
                <div>
                  <span className="block text-slate-200">Excellence Badge (Avg &gt;= 80%)</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Maintain an average score accuracy of 80% or greater.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#ffffff03]">
                <input type="checkbox" checked={history.length >= 3} readOnly className="mt-0.5 accent-amber-500" />
                <div>
                  <span className="block text-slate-200">Tri-Academic Certification</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Attempt three or more unique quizzes on separate departments.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
