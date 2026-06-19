export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "admin";
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string; // Optional on list, present during active attempt
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number; // in minutes
  totalMarks: number;
  questions: Question[];
  createdBy?: string;
  createdAt?: string;
}

export interface Attempt {
  id: string;
  userId: string;
  userFullName: string;
  quizId: string;
  quizTitle: string;
  category: string;
  answers: { questionId: string; selectedOption: string }[];
  score: number;
  accuracy: number;
  totalQuestions: number;
  correctAnswersCount: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  totalScore: number;
  attemptsCount: number;
  averageAccuracy: number;
  rank: number;
}

export interface AdminStats {
  totalQuizzes: number;
  totalUsers: number;
  totalAttempts: number;
  globalAverageScore: number;
  categoryCounts: { [key: string]: number };
}

export interface StudentStats {
  totalAttempts: number;
  totalScore: number;
  averageScore: number;
  averageAccuracy: number;
  currentRank: number | string;
}
