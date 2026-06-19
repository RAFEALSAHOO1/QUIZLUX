import { useState, useEffect } from "react";
import { Sparkles, Trophy, Shield, LogOut, User, Layout, ArrowRight, Menu, X, Sun, Moon, Laptop } from "lucide-react";
import SkeuomorphicButton from "./components/SkeuomorphicButton";
import LandingView from "./components/LandingView";
import AuthView from "./components/AuthView";
import Dashboard from "./components/Dashboard";
import QuizActive from "./components/QuizActive";
import ResultReport from "./components/ResultReport";
import LeaderboardView from "./components/LeaderboardView";
import AdminPanel from "./components/AdminPanel";
import { Quiz } from "./types";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function App() {
  // Navigation Route state
  const [currentView, setCurrentView] = useState<"home" | "login" | "register" | "dashboard" | "quiz-active" | "result-report" | "leaderboard" | "admin">("home");
  
  // Theme state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("quizlux-theme-mode") as "light" | "dark" | "system") || "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    localStorage.setItem("quizlux-theme-mode", themeMode);

    if (themeMode === "light") {
      setResolvedTheme("light");
    } else if (themeMode === "dark") {
      setResolvedTheme("dark");
    } else {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      setResolvedTheme(media.matches ? "dark" : "light");

      const handleMediaChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };
      
      media.addEventListener("change", handleMediaChange);
      return () => media.removeEventListener("change", handleMediaChange);
    }
  }, [themeMode]);

  // Auth states populated from localStorage for fluid persistent sessions
  const [token, setToken] = useState<string | null>(localStorage.getItem("quizlux-token"));
  const [user, setUser] = useState<{ id: string; fullName: string; email: string; role: "student" | "admin" } | null>(
    localStorage.getItem("quizlux-user") ? JSON.parse(localStorage.getItem("quizlux-user")!) : null
  );

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [viewingAttemptId, setViewingAttemptId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);

  // Parse token expiry and watch session
  useEffect(() => {
    if (!token) {
      setShowRefreshModal(false);
      return;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return;

    const intervalId = setInterval(() => {
      const nowInSecs = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - nowInSecs;

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        handleLogout();
      } else if (timeLeft <= 120) {
        // Triggers warning 2 minutes or less before JWT expiration
        setRefreshCountdown(timeLeft);
        setShowRefreshModal(true);
      } else {
        setShowRefreshModal(false);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [token]);

  const handleRefreshToken = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("quizlux-token", data.token);
        localStorage.setItem("quizlux-user", JSON.stringify(data.user));
        setShowRefreshModal(false);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to automatically refresh secure JWT token session:", err);
      handleLogout();
    }
  };

  // Global diagnostics loading
  useEffect(() => {
    fetchQuizzes();
    // Auto route to dashboard if session persists
    if (token && user) {
      setCurrentView("dashboard");
    }
  }, []);

  const fetchQuizzes = async () => {
    // 1. Initial state restoration from backup cache immediately for flickering network fallback
    try {
      const cached = localStorage.getItem("quizlux-catalog-cache");
      if (cached) {
        setQuizzes(JSON.parse(cached));
      }
    } catch (_) {
      // safe fallback
    }

    try {
      const res = await fetch("/api/quiz");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
        // Persist fresh quiz catalog copy for total offline redundancy
        localStorage.setItem("quizlux-catalog-cache", JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Network flicker detected or offline mode active. Using cached quiz database.", e);
      const cached = localStorage.getItem("quizlux-catalog-cache");
      if (cached) {
        setQuizzes(JSON.parse(cached));
      }
    }
  };

  const handleAuthSuccess = (
    authToken: string,
    authUser: { id: string; fullName: string; email: string; role: "student" | "admin" }
  ) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("quizlux-token", authToken);
    localStorage.setItem("quizlux-user", JSON.stringify(authUser));
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("quizlux-token");
    localStorage.removeItem("quizlux-user");
    setCurrentView("home");
    setMobileMenuOpen(false);
  };

  const handleStartQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentView("quiz-active");
  };

  const handleFinishQuiz = async (answers: { questionId: string; selectedOption: string }[]) => {
    if (!activeQuizId || !token) return;

    try {
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: activeQuizId,
          answers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setViewingAttemptId(data.id);
        setCurrentView("result-report");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveQuizId(null);
    }
  };

  const handleCloseReport = () => {
    setViewingAttemptId(null);
    setCurrentView("dashboard");
  };

  // Navigations route trigger helper
  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  // Find active quiz details
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId);

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased selection:bg-[#6C63FF]/30 selection:text-white transition duration-300 ${
      resolvedTheme === "light" ? "theme-light bg-[#F5F7FB]" : "bg-[#0F172A] text-slate-100"
    }`}>
      {/* Absolute background stars mesh noise */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0F172A] to-[#0B0F19] -z-20" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMC41IiBmaWxsPSIjNmM2M2ZmIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz48L3N2Zz4=')] bg-repeat -z-10 opacity-70" />

      {/* Primary header navbar navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-white/5 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          
          {/* Logo brand item */}
          <div 
            onClick={() => navigateTo(token ? "dashboard" : "home")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center text-slate-950 font-black relative overflow-hidden shadow-inner">
              <span className="relative z-10 text-xs font-serif font-black italic text-white uppercase select-none">Q</span>
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition duration-300" />
            </div>
            <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#FFD700]">
              QuizLux
            </h1>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            
            {token && (
              <>
                <button
                  onClick={() => navigateTo("dashboard")}
                  className={`flex items-center gap-1.5 transition ${
                    currentView === "dashboard" ? "text-[#00D4FF]" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  Dashboard
                </button>

                {user?.role === "admin" && (
                  <button
                    onClick={() => navigateTo("admin")}
                    className={`flex items-center gap-1.5 transition ${
                      currentView === "admin" ? "text-[#FFD700]" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin controls
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => navigateTo("leaderboard")}
              className={`flex items-center gap-1.5 transition ${
                currentView === "leaderboard" ? "text-amber-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              Leaderboard
            </button>

            {/* Segmented Luxury Theme Selector */}
            <div className="flex items-center gap-0.5 bg-slate-900/40 p-1 rounded-xl border border-white/5 relative">
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                title="Satin Light Elegance"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === "light" 
                    ? "bg-[#6C63FF] text-white shadow-inner" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                title="Deep Dark Luxury"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === "dark" 
                    ? "bg-[#6C63FF] text-white shadow-inner" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("system")}
                title="System Default Scheme"
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  themeMode === "system" 
                    ? "bg-[#6C63FF] text-white shadow-inner" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth status block controls */}
            {token && user ? (
              <div id="user-pills" className="flex items-center gap-4 pl-4 border-l border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-[10px] text-slate-300 font-bold select-none font-mono">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left font-sans">
                    <span className="block text-[10px] font-bold text-white leading-none capitalize">{user.fullName.split(' ')[0]}</span>
                    <span className={`block text-[8px] font-bold uppercase mt-0.5 leading-none ${user.role === 'admin' ? "text-amber-400" : "text-slate-500"}`}>{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Secure Session Escape"
                  className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateTo("login")}
                  className="text-slate-300 font-semibold hover:text-white transition px-3 cursor-pointer text-xs"
                >
                  Sign In
                </button>
                <SkeuomorphicButton
                  variant="primary"
                  onClick={() => navigateTo("register")}
                  className="px-4 py-1.5 text-xs font-semibold"
                >
                  Register
                </SkeuomorphicButton>
              </div>
            )}

          </nav>

          {/* Mobile responsive toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>

        </div>

        {/* Mobile menu panel overlay drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-950 px-4 py-4 space-y-4 text-sm font-semibold animate-[fadeIn_0.2s_ease-out]">
            {token && (
              <>
                <button
                  onClick={() => navigateTo("dashboard")}
                  className={`block w-full text-left py-2 border-b border-white/5 ${
                    currentView === "dashboard" ? "text-[#00D4FF]" : "text-slate-400"
                  }`}
                >
                  Dashboard Hub
                </button>

                {user?.role === "admin" && (
                  <button
                    onClick={() => navigateTo("admin")}
                    className={`block w-full text-left py-2 border-b border-white/5 ${
                      currentView === "admin" ? "text-[#FFD700]" : "text-slate-400"
                    }`}
                  >
                    Admin Controls
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => navigateTo("leaderboard")}
              className={`block w-full text-left py-2 border-b border-white/5 ${
                currentView === "leaderboard" ? "text-amber-400" : "text-slate-400"
              }`}
            >
              Top Scores Leaderboard
            </button>

            {token && user ? (
              <div className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white">
                    {user.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-xs text-white capitalize">{user.fullName}</span>
                    <span className="block text-[9px] text-slate-500 uppercase">{user.role} role</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-red-400 bg-red-500/10 border border-red-500/20 py-1 px-2.5 rounded text-xs"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => navigateTo("login")}
                  className="py-2 text-center rounded border border-white/10 text-xs text-slate-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo("register")}
                  className="py-2 text-center rounded bg-indigo-600 text-xs text-white"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Theme Selector */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-slate-400 font-mono text-xs">Visual Slate Theme:</span>
              <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-xl border border-white/5 relative">
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                    themeMode === "light" 
                      ? "bg-[#6C63FF] text-white" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                    themeMode === "dark" 
                      ? "bg-[#6C63FF] text-white" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("system")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                    themeMode === "system" 
                      ? "bg-[#6C63FF] text-white" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  System
                </button>
              </div>
            </div>

          </div>
        )}
      </header>

      {/* Main Container Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 relative">
        
        {/* VIEW ROUTER BODY */}

        {/* 1. Landing Marketing Page */}
        {currentView === "home" && (
          <LandingView
            onStart={() => navigateTo(token ? "dashboard" : "register")}
            onGoToLeaderboard={() => navigateTo("leaderboard")}
          />
        )}

        {/* 2. Authentication forms */}
        {(currentView === "login" || currentView === "register") && (
          <AuthView
            initialMode={currentView === "login" ? "login" : "register"}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* 3. Students Workspace dashboard */}
        {currentView === "dashboard" && token && user && (
          <Dashboard
            token={token}
            user={user}
            quizzes={quizzes}
            onStartQuiz={handleStartQuiz}
            onViewResult={(attemptId) => {
              setViewingAttemptId(attemptId);
              setCurrentView("result-report");
            }}
            onRefreshQuizzes={fetchQuizzes}
          />
        )}

        {/* 4. Active Quiz Countdown Room */}
        {currentView === "quiz-active" && activeQuiz && (
          <QuizActive
            quiz={activeQuiz}
            onCancel={() => navigateTo("dashboard")}
            onSubmit={handleFinishQuiz}
          />
        )}

        {/* 5. Score report and Explanations page */}
        {currentView === "result-report" && viewingAttemptId && token && (
          <ResultReport
            attemptId={viewingAttemptId}
            token={token}
            onBackToDashboard={handleCloseReport}
          />
        )}

        {/* 6. Dynamic Standings Ranking page */}
        {currentView === "leaderboard" && (
          <LeaderboardView />
        )}

        {/* 7. Admin CRUD & Generative AI Studio */}
        {currentView === "admin" && token && user?.role === "admin" && (
          <AdminPanel
            token={token}
            quizzes={quizzes}
            onRefreshQuizzes={fetchQuizzes}
          />
        )}

      </main>

      {/* 8. JWT Expiration Warning Modal */}
      {showRefreshModal && (
        <div id="jwt-warning-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div
            style={{
              backdropFilter: "blur(20px)",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(255,215,0,0.2)"
            }}
            className="rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-[0_20px_50px_rgba(255,215,0,0.05)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#FFD700] to-amber-500" />
            
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400">
                Security Session Expiry
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Your authenticated session is scheduled to expire in <b className="text-amber-400 font-mono text-sm">{refreshCountdown}</b> seconds. Would you like to renew your authentication?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="btn-jwt-logout"
                onClick={handleLogout}
                className="py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-400 hover:bg-white/10 hover:text-white font-bold cursor-pointer transition"
              >
                Log Out
              </button>
              <SkeuomorphicButton
                variant="primary"
                onClick={handleRefreshToken}
                className="text-xs py-2.5"
              >
                Renew Session
              </SkeuomorphicButton>
            </div>
          </div>
        </div>
      )}

      {/* Academic footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-8 text-center text-[10px] md:text-xs text-slate-500 font-sans tracking-wide">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <div className="flex justify-center gap-6 text-slate-400">
            <span className="hover:text-white cursor-pointer" onClick={() => navigateTo("home")}>About and Features</span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigateTo("leaderboard")}>Leaderboard Standings</span>
            {token && <span className="hover:text-white cursor-pointer" onClick={() => navigateTo("dashboard")}>Student Workspace</span>}
          </div>
          <p>© 2026 QuizLux – Luxury Interactive Quiz Platform.</p>
          <p className="text-indigo-400/80 font-mono">
            College Capstone Project crafted under strict academic inspection by <b>Bawya Prabhu (II B.Com CA)</b>.
          </p>
        </div>
      </footer>
    </div>
  );
}
