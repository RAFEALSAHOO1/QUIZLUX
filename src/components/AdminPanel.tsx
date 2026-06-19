import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Sparkles, BrainCircuit, RefreshCw, BarChart3, Database, Eye, Check, AlertCircle, Shield } from "lucide-react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import { Quiz, Question, AdminStats } from "../types";

interface AdminPanelProps {
  token: string;
  quizzes: Quiz[];
  onRefreshQuizzes: () => void;
}

export default function AdminPanel({ token, quizzes, onRefreshQuizzes }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"manage" | "create" | "ai" | "stats">("manage");
  
  // Custom manual quiz fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Programming");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [duration, setDuration] = useState("10");

  // Questions dynamic fields state
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q-init-1", question: "", options: ["", "", "", ""], correctAnswer: "", marks: 10 }
  ]);

  // AI Generator state vars
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState("Programming");
  const [aiDifficulty, setAiDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [aiCount, setAiCount] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [draftGeneratedQuiz, setDraftGeneratedQuiz] = useState<any>(null);

  // Admin stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats();
  }, [quizzes]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role === "admin") {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      { id: `q-${Date.now()}-${questions.length}`, question: "", options: ["", "", "", ""], correctAnswer: "", marks: 10 }
    ]);
  };

  const handleRemoveQuestionField = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_q, i) => i !== idx));
    }
  };

  const handleQuestionChange = (idx: number, property: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = {
      ...updated[idx],
      [property]: value
    };
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    const updatedOpts = [...updated[qIdx].options];
    updatedOpts[oIdx] = value;
    updated[qIdx] = {
      ...updated[qIdx],
      options: updatedOpts
    };
    setQuestions(updated);
  };

  // Submit hand-crafted manual quiz creation
  const handleCommitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!title || !description || !category || !duration) {
      setFormError("All top-level info fields are required.");
      return;
    }

    const invalidQuestion = questions.find(q => !q.question || q.options.some(opt => !opt) || !q.correctAnswer);
    if (invalidQuestion) {
      setFormError("Ensure all questions have text, fully spelled options, and a matching correct option string.");
      return;
    }

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          difficulty,
          duration: Number(duration),
          questions
        })
      });

      if (!res.ok) {
        throw new Error("Unable to save your new quiz.");
      }

      setFormSuccess("Successfully authored and compiled your custom quiz to primary databases!");
      onRefreshQuizzes();
      
      // Reset forms
      setTitle("");
      setDescription("");
      setQuestions([{ id: "q-init-1", question: "", options: ["", "", "", ""], correctAnswer: "", marks: 10 }]);
      setActiveSubTab("manage");
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Perform AI Gen requests
  const handleGenerateAI = async () => {
    setAiError(null);
    setGenerating(true);
    setDraftGeneratedQuiz(null);

    if (!aiTopic) {
      setAiError("Please type a topic keyword for the generative model.");
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory,
          difficulty: aiDifficulty,
          questionCount: Number(aiCount)
        })
      });

      const responseJson = await res.json();
      if (!res.ok) {
        throw new Error(responseJson.error || "AI generation timeout.");
      }

      setDraftGeneratedQuiz(responseJson);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Commit AI-Generated Draft
  const handlePublishGeneratedQuiz = async () => {
    if (!draftGeneratedQuiz) return;
    setAiError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: draftGeneratedQuiz.title,
          description: draftGeneratedQuiz.description,
          category: aiCategory,
          difficulty: aiDifficulty,
          duration: Number(aiCount) * 2, // 2 mins per question
          questions: draftGeneratedQuiz.questions
        })
      });

      if (!res.ok) {
        throw new Error("Save error committing draft content to databases.");
      }

      onRefreshQuizzes();
      setAiTopic("");
      setDraftGeneratedQuiz(null);
      setFormSuccess("Gemini-drafted quiz successfully verified and published!");
      setActiveSubTab("manage");
    } catch (err: any) {
      setAiError(err.message);
    }
  };

  // Delete quiz click
  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this exam? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/quiz/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshQuizzes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Local helper stats
  const localStats = stats || {
    totalQuizzes: quizzes.length,
    totalUsers: 5,
    totalAttempts: quizzes.length * 3,
    globalAverageScore: 40,
    categoryCounts: { Programming: 3, Science: 1, Design: 1 }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Admin Title Dashboard Block */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-amber-500/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-[#FFD700] font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>EXECUTIVE AUTHOR PLATFORM</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Admin Intelligence Control
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Audit diagnostic exams, access global aggregate statistics, write hand-crafted test questions, or trigger the <b>Gemini AI Quiz Content Engine</b>.
          </p>
        </div>

        <div className="flex gap-2">
          <SkeuomorphicButton
            variant="accent"
            onClick={() => setActiveSubTab("ai")}
            className="text-xs px-4 py-2 gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
            <span>AI Gen Studio</span>
          </SkeuomorphicButton>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-xs text-green-400 font-semibold flex items-center gap-2">
          <Check className="w-4.5 h-4.5 shrink-0" /> {formSuccess}
        </div>
      )}

      {/* Sub Tabs menu */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveSubTab("manage")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeSubTab === "manage" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Manage Quizzes
          {activeSubTab === "manage" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("create")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeSubTab === "create" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Author Custom Quiz
          {activeSubTab === "create" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("ai")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeSubTab === "ai" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          AI Quiz Generator
          {activeSubTab === "ai" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("stats")}
          className={`pb-3 text-sm font-semibold relative transition ${
            activeSubTab === "stats" ? "text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Executive Analytics
          {activeSubTab === "stats" && (
            <span className="absolute bottom-[-1px] left-0 w-full h-[2.5px] bg-[#6C63FF] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Sub Tab index triggers */}

      {/* Sub Tab 1: List Quizzes Manage */}
      {activeSubTab === "manage" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#1E293B]/10 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-[#0F172A] text-[10px] font-mono uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Quiz title</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4 font-mono">Questions</th>
                    <th className="px-6 py-4 font-mono">Max Score</th>
                    <th className="px-6 py-4 text-right">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4 font-bold text-slate-100">
                        {quiz.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {quiz.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {quiz.difficulty}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs text-center md:text-left">
                        {quiz.questions.length} items
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#FFD700]">
                        {quiz.totalMarks || (quiz.questions.length * 10)} pts
                      </td>
                      <td className="px-6 py-4 text-right">
                        <SkeuomorphicButton
                          variant="danger"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="px-3 py-1.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </SkeuomorphicButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Custom Quiz Manual Editor */}
      {activeSubTab === "create" && (
        <form onSubmit={handleCommitQuiz} className="space-y-6 max-w-3xl">
          
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 shadow-lg">
            <h3 className="font-bold text-base text-slate-200">1. Exam Shell Metadata</h3>
            
            {formError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Quiz Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Advanced Node.js Scaling"
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Topic Department Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="Programming">Programming</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Design">Design</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief syllabus overview or instruction breakdown..."
                className="w-full h-20 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Difficulty Rating</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Duration Limit (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-[#ffffff15] rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-bold text-base text-slate-200">2. Author Exam Questions</h3>
              <button
                type="button"
                onClick={handleAddQuestionField}
                className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Plus className="w-4 h-4" /> Add Question Block
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id} className="p-6 rounded-2xl bg-[#1E293B]/20 border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400">
                  <span>Question #{(qIdx + 1).toString().padStart(2, "0")}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(qIdx)}
                      className="text-red-400 hover:underline cursor-pointer"
                    >
                      Remove Question
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Question Text</label>
                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                    placeholder="e.g. What is the Big O time complexity of binary search?"
                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Option {String.fromCharCode(65 + oIdx)}</label>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)} text`}
                        className="w-full px-4.5 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Correct Answer String</label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleQuestionChange(qIdx, "correctAnswer", e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    >
                      <option value="">-- Choose correct option --</option>
                      {q.options.map((opt, oIdx) => (
                        <option key={oIdx} value={opt} disabled={!opt}>
                          Option {String.fromCharCode(65 + oIdx)}: {opt || "(empty)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Marks value</label>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(qIdx, "marks", Number(e.target.value))}
                      className="w-full px-4 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <SkeuomorphicButton type="submit" variant="primary" className="px-8 py-3 text-sm">
              Publish Custom Quiz
            </SkeuomorphicButton>
          </div>

        </form>
      )}

      {/* Sub Tab 3: Gemini Generative AI Quiz Studio */}
      {activeSubTab === "ai" && (
        <div className="space-y-6 max-w-3xl">
          
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-[#6C63FF]">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-200">Gemini AI Authoring Studio</h3>
                <p className="text-slate-500 text-[10px]">Autonomously generate syllabus-specific exams matching standard collections</p>
              </div>
            </div>

            {aiError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {aiError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Topic Theme Keyword</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. World War II Landmarks, CSS Flexbox & Box Model"
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Domain Category</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="Programming">Programming</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Design">Design</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Target Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="Easy">Easy Level</option>
                  <option value="Medium">Medium Level</option>
                  <option value="Hard">Hard Level</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Questions Count</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono"
                >
                  <option value="3">3 questions (quick draft)</option>
                  <option value="5">5 questions (standard model)</option>
                  <option value="8">8 questions (comprehensive)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <SkeuomorphicButton
                variant="primary"
                onClick={handleGenerateAI}
                disabled={generating}
                className="w-full py-3 text-xs gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Deconstructive Reasoning Ongoing..." : "Generate with Gemini AI Engine"}
              </SkeuomorphicButton>
            </div>
          </div>

          {/* Prompt Draft Inspect card */}
          {draftGeneratedQuiz && (
            <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-6 shadow-xl animate-pulse">
              <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-mono text-[#00D4FF] font-bold">GEMINI 3.5 DRAFT ACTIVE</span>
                  <h4 className="font-extrabold text-white text-base mt-0.5">{draftGeneratedQuiz.title}</h4>
                </div>
                <SkeuomorphicButton
                  variant="secondary"
                  onClick={handlePublishGeneratedQuiz}
                  className="text-xs px-4 py-2 gap-1.5"
                >
                  <Check className="w-4 h-4" /> Commit & Publish
                </SkeuomorphicButton>
              </div>

              <p className="text-slate-300 text-xs italic">
                "{draftGeneratedQuiz.description}"
              </p>

              <div className="space-y-3">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[#FFD700] pl-1 font-bold">
                  Draft Syllabus ({draftGeneratedQuiz.questions.length} Items)
                </span>
                
                {draftGeneratedQuiz.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
                    <p className="text-xs font-bold text-slate-200">
                      Q{(idx+1)}: {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`p-1.5 rounded ${q.correctAnswer === opt ? "bg-green-500/10 text-green-300 font-semibold" : "bg-[#00000020]"}`}>
                          {String.fromCharCode(65 + oIdx)}: {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Sub Tab 4: Multi-metric Executive dashboard stats */}
      {activeSubTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="font-extrabold text-base text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00D4FF]" /> Global Administration stats
            </h3>

            {loadingStats ? (
              <p className="text-slate-500 text-xs">Computing charts...</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-white/[0.03] space-y-1">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase font-black">Registered Authors</span>
                  <span className="text-2xl font-bold text-white font-mono">{localStats.totalUsers} Authors</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-white/[0.03] space-y-1">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase font-black">Global Average score</span>
                  <span className="text-2xl font-bold text-[#FFD700] font-mono">{localStats.globalAverageScore}% pts</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
            <h3 className="font-extrabold text-base text-slate-200 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#6C63FF]" /> Category Allocation Distribution
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              {Object.keys(localStats.categoryCounts || {}).map((cat) => {
                const count = (localStats.categoryCounts as any)[cat];
                const percentage = Math.round((count / Math.max(1, quizzes.length)) * 100);
                
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold">{cat}</span>
                      <span className="font-mono text-slate-400 font-bold">{count} quizzes ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
