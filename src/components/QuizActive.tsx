import { useState, useEffect } from "react";
import { Timer, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import { Quiz } from "../types";
import { luxuryAudio } from "../lib/audio";

interface QuizActiveProps {
  quiz: Quiz;
  onCancel: () => void;
  onSubmit: (answers: { questionId: string; selectedOption: string }[]) => void;
}

export default function QuizActive({ quiz, onCancel, onSubmit }: QuizActiveProps) {
  // Storage and Restoration keys relative to user/quiz instance
  const storageIndexKey = `quizlux-active-${quiz.id}-current-idx`;
  const storageAnswersKey = `quizlux-active-${quiz.id}-answers`;
  const storageTimerKey = `quizlux-active-${quiz.id}-timer`;
  const storageReviewedKey = `quizlux-active-${quiz.id}-reviewed`;

  // Current active question page index, restoring from cache on mount
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    const saved = localStorage.getItem(storageIndexKey);
    return saved ? Number(saved) : 0;
  });

  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>(() => {
    const saved = localStorage.getItem(storageAnswersKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [reviewedQuestions, setReviewedQuestions] = useState<{ [qId: string]: boolean }>(() => {
    const saved = localStorage.getItem(storageReviewedKey);
    return saved ? JSON.parse(saved) : {};
  });
  
  // Timer calculations with backup and check intervals
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const saved = localStorage.getItem(storageTimerKey);
    return saved ? Number(saved) : quiz.duration * 60;
  });

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Sync state modifications dynamically to LocalStorage
  useEffect(() => {
    localStorage.setItem(storageAnswersKey, JSON.stringify(selectedAnswers));
  }, [selectedAnswers]);

  useEffect(() => {
    localStorage.setItem(storageTimerKey, secondsRemaining.toString());
  }, [secondsRemaining]);

  useEffect(() => {
    localStorage.setItem(storageReviewedKey, JSON.stringify(reviewedQuestions));
  }, [reviewedQuestions]);

  useEffect(() => {
    localStorage.setItem(storageIndexKey, currentIdx.toString());
  }, [currentIdx]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      luxuryAudio.playTimeup();
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Clean local caching of active attempts upon successful dispatch or cancel
  const cleanupStorage = () => {
    localStorage.removeItem(storageIndexKey);
    localStorage.removeItem(storageAnswersKey);
    localStorage.removeItem(storageTimerKey);
    localStorage.removeItem(storageReviewedKey);
  };

  // Format seconds to H:MM:SS / M:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (questionId: string, option: string) => {
    luxuryAudio.playClick();
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleClearSelection = () => {
    luxuryAudio.playClick();
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleNavigateNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleNavigatePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    cleanupStorage();
    // Collect answers
    const answersPayload = quiz.questions.map(q => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] || "" // Blank string if not answered
    }));
    onSubmit(answersPayload);
  };

  const handleManualSubmitClick = () => {
    setConfirmSubmitOpen(true);
  };

  const handleConfirmSubmit = () => {
    setConfirmSubmitOpen(false);
    handleAutoSubmit();
  };

  const handleQuitQuiz = () => {
    if (window.confirm("Are you sure you want to quit this active quiz session? Your saved answers and progress will be empty.")) {
      cleanupStorage();
      onCancel();
    }
  };

  // Compute stats helper
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = quiz.questions.length - answeredCount;

  const currentQuestion = quiz.questions[currentIdx];
  const progressPercentage = Math.round(((currentIdx + 1) / quiz.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Top Banner with Quiz Title & Running Timer */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#1E293B]/40 p-5 rounded-2xl border border-white/5 gap-4 mb-6 shadow-md">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold block">
            Quiz Category: {quiz.category}
          </span>
          <h2 className="text-xl font-bold text-white leading-normal">
            {quiz.title}
          </h2>
        </div>

        {/* Dynamic Glowing Timer Container */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-mono font-bold text-sm ${
          secondsRemaining < 60 
          ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" 
          : "bg-slate-900 border-[#00D4FF]/30 text-[#00D4FF]"
        }`}>
          <Timer className="w-4.5 h-4.5" />
          <span>{formatTime(secondsRemaining)} Remaining</span>
        </div>
      </div>

       {/* Navigation Line & Question Counts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Questions Rail navigator */}
        <div className="md:col-span-3 space-y-3">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold block pl-1">
            Question Map ({quiz.questions.length})
          </span>
          <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
            {quiz.questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isActive = idx === currentIdx;
              const isMarkedForReview = !!reviewedQuestions[q.id];
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`py-3.5 rounded-xl font-mono text-xs font-bold cursor-pointer transition flex items-center justify-center border shadow-inner relative ${
                    isActive 
                      ? "bg-gradient-to-b from-[#6C63FF] to-indigo-600 border-[#8B85FF] text-white" 
                      : isMarkedForReview
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/15"
                        : isAnswered 
                          ? "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 hover:bg-[#00D4FF]/15" 
                          : "bg-slate-900/60 border-white/5 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {(idx + 1).toString().padStart(2, "0")}
                  {isMarkedForReview && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 space-y-2 pl-1 hidden md:block border-t border-white/5 mt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 bg-[#6C63FF] rounded-full" />
              <span>Current Position</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 bg-[#00D4FF]/30 rounded-full" />
              <span>Question Saved</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 bg-amber-500/30 rounded-full" />
              <span>Marked for Review</span>
            </div>
          </div>
        </div>

        {/* Right Side: Active Question Display Panel */}
        <div className="md:col-span-9 space-y-6">
          
          {/* Main Visual Question Box */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 shadow-lg space-y-6">
            
            {/* Progress bar info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Progress: {progressPercentage}% Done</span>
                <span>Value: {currentQuestion.marks} Marks</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-[#6C63FF]" /> Question {(currentIdx + 1).toString().padStart(2, "0")}
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-100 leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options list */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, oIdx) => {
                const charCode = String.fromCharCode(65 + oIdx);
                const isSelected = selectedAnswers[currentQuestion.id] === option;
                
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, option)}
                    className={`w-full p-4.5 rounded-2xl border text-left text-sm font-semibold transition flex items-center gap-4 cursor-pointer select-none relative group ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-950 to-slate-900 border-[#00D4FF]/40 text-[#00D4FF]"
                        : "bg-slate-920/30 border-white/5 text-slate-400 hover:bg-slate-900 hover:border-slate-600 hover:text-slate-100"
                    }`}
                  >
                    {/* Circle badge identifier */}
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-xs border ${
                      isSelected
                        ? "bg-[#00D4FF]/20 border-[#00D4FF]/45 text-[#00D4FF]"
                        : "bg-slate-900 border-white/5 text-slate-500 group-hover:text-slate-300"
                    }`}>
                      {charCode}
                    </span>
                    
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Question Tools: Clear selection & Review */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/5 text-xs">
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={!selectedAnswers[currentQuestion.id]}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-bold ${
                  selectedAnswers[currentQuestion.id]
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    : "text-slate-600 border-white/5 opacity-40 cursor-not-allowed"
                }`}
              >
                Clear Selection
              </button>

              <button
                type="button"
                onClick={() => {
                  setReviewedQuestions((prev) => ({
                    ...prev,
                    [currentQuestion.id]: !prev[currentQuestion.id]
                  }));
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border transition font-bold cursor-pointer ${
                  reviewedQuestions[currentQuestion.id]
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    : "bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {reviewedQuestions[currentQuestion.id] ? "★ Marked for Review" : "☆ Mark for Review"}
              </button>
            </div>

          </div>

          {/* Nav Controls Row */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2">
              <SkeuomorphicButton
                variant="muted"
                onClick={handleNavigatePrev}
                disabled={currentIdx === 0}
                className="px-5 py-2.5 text-xs gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Question
              </SkeuomorphicButton>

              <SkeuomorphicButton
                variant="muted"
                onClick={handleQuitQuiz}
                className="px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300"
              >
                Quit Quiz
              </SkeuomorphicButton>
            </div>

            {currentIdx < quiz.questions.length - 1 ? (
              <SkeuomorphicButton
                variant="muted"
                onClick={handleNavigateNext}
                className="px-5 py-2.5 text-xs gap-1"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </SkeuomorphicButton>
            ) : (
              <SkeuomorphicButton
                variant="secondary"
                onClick={handleManualSubmitClick}
                className="px-8 py-2.5 text-xs gap-1.5"
              >
                <span>Submit Exam</span>
                <CheckCircle2 className="w-4.5 h-4.5" />
              </SkeuomorphicButton>
            )}
          </div>

        </div>
      </div>

      {/* CONFIRMATION SUBMIT DIALOG PANEL */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div
            style={{
              backdropFilter: "blur(20px)",
              background: "rgba(30,41,59,0.9)",
              border: "1px solid rgba(255,255,255,0.15)"
            }}
            className="rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">Perform Submit?</h4>
              <p className="text-slate-400 text-xs leading-normal">
                You have answered <b className="text-white">{answeredCount}</b> out of {quiz.questions.length} questions. You have <b className="text-[#FFD700]">{unansweredCount}</b> questions remaining unanswered.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-300 hover:bg-white/10 font-bold cursor-pointer"
              >
                Keep Reviewing
              </button>
              <SkeuomorphicButton
                variant="primary"
                onClick={handleConfirmSubmit}
                className="text-xs py-2.5"
              >
                Submit Now
              </SkeuomorphicButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
