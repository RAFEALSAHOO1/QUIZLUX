import { useEffect, useState } from "react";
import { Award, CheckCircle, XCircle, ArrowLeft, RefreshCw, Star, Sparkles, BookOpen } from "lucide-react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import ConfettiCanvas from "./ConfettiCanvas";
import { luxuryAudio } from "../lib/audio";
import { Attempt, Quiz } from "../types";

interface ResultReportProps {
  attemptId: string;
  token: string;
  onBackToDashboard: () => void;
}

export default function ResultReport({ attemptId, token, onBackToDashboard }: ResultReportProps) {
  const [data, setData] = useState<{ attempt: Attempt; quiz: Quiz } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/result/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("Failed to load your test score report.");
      }
      const json = await res.json();
      setData(json);
      
      // Play high-fidelity contextual evaluation sound
      if (json.attempt && json.attempt.accuracy >= 60) {
        luxuryAudio.playCorrect();
      } else if (json.attempt) {
        luxuryAudio.playWrong();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-4">
        <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin mx-auto" />
        <p>Generating luxury performance report card...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-500/10 border border-red-500/20 max-w-md mx-auto rounded-2xl space-y-4">
        <p className="text-red-400 text-sm font-semibold">{error || "Result unavailable."}</p>
        <SkeuomorphicButton variant="primary" onClick={onBackToDashboard}>
          Return to Dashboard
        </SkeuomorphicButton>
      </div>
    );
  }

  const { attempt, quiz } = data;

  // Determine reward level badge based on accuracy percentage
  let badgeTitle = "Scholastic Pioneer";
  let badgeColor = "from-slate-500 to-slate-400 border-slate-400/30 text-slate-300";
  let badgeHighlight = "rgba(148,163,184,0.15)";
  
  if (attempt.accuracy >= 90) {
    badgeTitle = "Summa Cum Laude (Gold Elite)";
    badgeColor = "from-[#FFF176] via-[#FFD700] to-[#FF8F00] border-[#FFF176]/50 text-amber-200";
    badgeHighlight = "rgba(255,215,0,0.15)";
  } else if (attempt.accuracy >= 70) {
    badgeTitle = "Magna Cum Laude (Silver Pioneer)";
    badgeColor = "from-cyan-400 to-[#0099B8] border-cyan-400/40 text-cyan-200";
    badgeHighlight = "rgba(0,212,255,0.15)";
  } else if (attempt.accuracy >= 50) {
    badgeTitle = "Cum Laude (Indigo Scholar)";
    badgeColor = "from-[#8B85FF] to-indigo-600 border-[#6C63FF]/40 text-indigo-200";
    badgeHighlight = "rgba(108,99,255,0.15)";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {attempt.accuracy >= 70 && <ConfettiCanvas />}
      
      {/* Celebration banner */}
      <div 
        style={{
          boxShadow: `0 15px 40px ${badgeHighlight}`,
          backdropFilter: "blur(25px)",
          background: "rgba(15,23,42,0.6)"
        }}
        className="p-8 rounded-3xl border border-white/5 relative overflow-hidden text-center space-y-4"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        
        {/* Animated Medals icon */}
        <div className="relative inline-flex items-center justify-center p-4 rounded-2xl bg-slate-900 border border-white/5 shadow-inner">
          <Award className="w-12 h-12 text-[#FFD700] animate-bounce" />
          <Sparkles className="w-5 h-5 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-gradient-to-r ${badgeColor}`}>
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{badgeTitle}</span>
          </span>
          <h2 className="text-3xl font-extrabold text-white">Quiz Examination Concluded!</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Your results have been computed, categorized, verified, and saved to the leader standings. Review question diagnostics below.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <SkeuomorphicButton variant="primary" onClick={onBackToDashboard} className="px-6 py-2.5 text-xs">
            Back to Workspace
          </SkeuomorphicButton>
        </div>
      </div>

      {/* Main Results statistics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block mb-2">
            Final Score
          </span>
          <span className="text-4xl font-black text-[#FFD700] tracking-tight">{attempt.score} pts</span>
          <span className="text-xs text-slate-400 mt-2 block font-mono">
            Out of {quiz.totalMarks} total points
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block mb-2">
            Accuracy Level
          </span>
          <span className="text-4xl font-black text-[#00D4FF] tracking-tight">{attempt.accuracy}%</span>
          <span className="text-xs text-slate-400 mt-2 block font-mono">
            {attempt.correctAnswersCount} correct / {attempt.totalQuestions} questions
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block mb-2">
            Completion Code
          </span>
          <span className="text-base font-bold text-emerald-400 truncate w-full px-2 mt-1">STATUS: SAVED</span>
          <span className="text-[10px] text-slate-400 mt-3 block font-mono uppercase bg-slate-920 px-2 py-0.5 rounded">
            ID: {attempt.id.slice(0, 16)}
          </span>
        </div>

      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#6C63FF]" /> Question Solutions Breakdown
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Detailed Explanation Reviews
          </span>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => {
            const userAns = attempt.answers.find(ans => ans.questionId === q.id);
            const isCorrect = userAns ? userAns.selectedOption === q.correctAnswer : false;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border ${
                  isCorrect
                    ? "bg-green-500/[0.01] border-green-500/10"
                    : "bg-red-500/[0.01] border-red-500/10"
                }`}
              >
                {/* Score and Rank */}
                <div className="flex justify-between items-center text-xs font-mono mb-4 text-slate-400">
                  <span className="flex items-center gap-1">
                    Question {(idx + 1).toString().padStart(2, "0")} 
                    {isCorrect ? (
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded ml-2 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3 h-3" /> Correct Choice
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded ml-2 flex items-center gap-1 font-bold">
                        <XCircle className="w-3 h-3" /> Incorrect Choice
                      </span>
                    )}
                  </span>
                  <span>Value: {q.marks} Marks</span>
                </div>

                {/* Question */}
                <h4 className="text-base font-bold text-slate-100 leading-relaxed mb-4">
                  {q.question}
                </h4>

                {/* Options visual display */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const charCode = String.fromCharCode(65 + oIdx);
                    
                    const optIsSelected = userAns?.selectedOption === opt;
                    const optIsCorrect = q.correctAnswer === opt;
                    
                    let bgStyle = "bg-slate-900/35 border-white/5 text-slate-400";
                    if (optIsCorrect) {
                      bgStyle = "bg-green-500/10 border-green-500/30 text-green-400 font-semibold";
                    } else if (optIsSelected) {
                      bgStyle = "bg-red-500/10 border-red-500/30 text-red-400 font-semibold";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${bgStyle}`}
                      >
                        <span className="font-mono text-[10px] font-bold border border-current px-1.5 py-0.5 rounded bg-black/10">
                          {charCode}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
