export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  targetExam?: string;
  examDate?: string;
  targetScore?: number;
  onboarded?: boolean;
  createdAt?: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  targetScore: number;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface StudyLog {
  id: string;
  userId: string;
  subjectId: string;
  durationMinutes: number;
  date: string;
  topicsCovered: string;
  focusScore: number; // 1 to 5
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId: string;
  score: number; // 0 to 100
  numQuestions: number;
  numCorrect: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  topicsCovered: string;
  date: string;
  createdAt: string;
}

export interface ReadinessAnalysis {
  readinessScore: number;
  riskLevel: 'critical' | 'caution' | 'warning' | 'slightly_behind' | 'on_track' | 'ready';
  gaps: string[];
  recommendations: string[];
  subjectScores?: {
    subjectName: string;
    estimatedReadyScore: number;
  }[];
  calculatedAt?: string;
  isAiPowered?: boolean;
}
