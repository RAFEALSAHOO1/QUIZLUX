import { Trophy, Shield, BrainCircuit, Sparkles, Star, Users } from "lucide-react";
import SkeuomorphicButton from "./SkeuomorphicButton";
import { motion } from "motion/react";

interface LandingViewProps {
  onStart: () => void;
  onGoToLeaderboard: () => void;
}

export default function LandingView({ onStart, onGoToLeaderboard }: LandingViewProps) {
  return (
    <div className="relative min-h-[90vh] text-white">
      {/* Absolute Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-[#6C63FF]/10 blur-[100px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full bg-[#00D4FF]/10 blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Container */}
      <div className="max-w-6xl mx-auto px-4 pt-12 md:pt-24 pb-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#00D4FF]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>THE GOLD STANDARD OF EVALUATION</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
            >
              Where Knowledge Meets{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] via-[#00D4FF] to-[#FFD700]">
                Luxury UX
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              QuizLux elevates regular collegiate examination into a tactile, beautiful, and fluid digital experience. Powered by generative AI, real-time analytics, and secure authorization schemas.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
            >
              <SkeuomorphicButton
                variant="primary"
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 text-base"
              >
                Get Started
              </SkeuomorphicButton>
              <SkeuomorphicButton
                variant="glass"
                onClick={onGoToLeaderboard}
                className="w-full sm:w-auto px-8 py-4 text-base gap-2 border-white/20"
              >
                <Trophy className="w-4 h-4 text-[#FFD700]" />
                View Leaderboards
              </SkeuomorphicButton>
            </motion.div>
          </div>

          {/* Hero Right Visuals: Skeuomorphic Preview Device */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 5 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-sm relative"
            >
              {/* Outer Skeuomorphic Panel Frame */}
              <div className="rounded-3xl p-6 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-t-[3px] border-t-white/10 border-x-indigo-900 border-b-[5px] border-b-black shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Simulated Realtime Quiz Header card */}
                <div className="border border-white/5 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-5 mb-5 space-y-4 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30 font-semibold uppercase">
                      MCQ TIMER ACTIVE
                    </span>
                    <span className="text-[#00D4FF] font-mono select-none">
                      08:45
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-100">
                    What creates the "tactile depth" in skeuomorphic buttons?
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl border border-[#00D4FF]/40 bg-[#00D4FF]/5 text-xs font-medium flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 flex items-center justify-center text-[10px] font-bold">
                        A
                      </span>
                      <span>An offset inset shadow & translateY click shift</span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 text-xs text-slate-400 cursor-pointer transition-all">
                      <span className="mr-3 font-mono font-bold text-[#6C63FF]">B</span> Flat uniform color layouts
                    </div>
                  </div>
                </div>

                {/* Dashboard summary glass snippet */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Your Accuracy
                    </span>
                    <span className="text-xl font-bold text-[#00D4FF]">89.5%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                      Rank Status
                    </span>
                    <span className="text-xl font-bold text-[#FFD700]"># 1 Pioneer</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Feature Grid */}
        <div className="mt-24 md:mt-32 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Engineered with 7-Layer Integrity
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              A comprehensive educational suite prioritizing user fidelity, performance tracking, and anti-cheat measures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.2)]">
              <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/15 border border-[#6C63FF]/30 flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6 text-[#6C63FF]" />
              </div>
              <h3 className="font-bold text-lg text-slate-100 mb-2">
                Generative AI Creator
              </h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Admins can summon fully dynamic, topic-specific quizzes instantly. Formed securely with Gemini’s robust reasoning capabilities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.2)]">
              <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <h3 className="font-bold text-lg text-slate-100 mb-2">
                Cryptographic Sessions
              </h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Your data is safe-guarded. Standardized password encryption techniques and secure authorization headers preserve testing credibility.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.2)]">
              <div className="w-12 h-12 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-[#FFD700]" />
              </div>
              <h3 className="font-bold text-lg text-slate-100 mb-2">
                Real-Time Rankings
              </h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                A gorgeous system leaderboard with calculated student accuracy and composite exam scores, encouraging competition.
              </p>
            </div>

          </div>
        </div>

        {/* Global Statistics Section */}
        <div className="mt-20 md:mt-28 py-8 px-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center shadow-lg">
          <div>
            <span className="block text-3xl font-extrabold text-[#6C63FF]">10K+</span>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1 block">
              Quizzes Answered
            </span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-[#00D4FF]">99.8%</span>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1 block">
              Platform Uptime
            </span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-[#FFD700]">3 Secs</span>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1 block">
              AI Gen Speeds
            </span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-white">Zero</span>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1 block">
              Data Flaws
            </span>
          </div>
        </div>

        {/* College Project Credit Banner */}
        <div className="mt-24 p-8 rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1E1B4B] border border-indigo-950 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#6C63FF]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 text-center md:text-left">
            <h4 className="font-bold text-xl text-[#FFD700]">Academic Evaluation Showcase</h4>
            <p className="text-slate-400 text-sm max-w-xl">
              This application has been meticulously hand-crafted as a premium College Capstone Project. Incorporating Node/Express custom endpoints, high fidelity localized document persistence, and realistic design patterns.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Created by</span>
            <span className="font-bold text-sm text-slate-200 mt-1">Bawya Prabhu</span>
            <span className="text-[10px] text-indigo-300 font-medium">II B.Com CA</span>
          </div>
        </div>

      </div>
    </div>
  );
}
