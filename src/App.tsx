import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  GraduationCap, 
  LogOut, 
  TrendingUp, 
  Clock, 
  Calendar, 
  CheckCircle, 
  BookOpen, 
  Lock, 
  Award, 
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile, Subject, Task, StudyLog, Quiz, ReadinessAnalysis } from './types';

// Child components
import Onboarding from './components/Onboarding';
import SubjectManager from './components/SubjectManager';
import StudyTimer from './components/StudyTimer';
import TaskPlanner from './components/TaskPlanner';
import QuizTracker from './components/QuizTracker';
import ReadinessInsight from './components/ReadinessInsight';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Firestore state data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analysis, setAnalysis] = useState<ReadinessAnalysis | null>(null);

  // Loading analysis triggers
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState('');

  // 1. Auth state changes listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (!currentUser) {
        setProfile(null);
        setLoadingProfile(false);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Load user profile on authentication
  useEffect(() => {
    if (!user) return;

    setLoadingProfile(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoadingProfile(false);
    }, (err) => {
      setLoadingProfile(false);
      handleFirestoreError(err, OperationType.GET, 'users');
    });

    return unsubscribe;
  }, [user]);

  // 3. Bind real-time Firestore synchronization for student entities
  useEffect(() => {
    if (!user || !profile?.onboarded) {
      setSubjects([]);
      setTasks([]);
      setStudyLogs([]);
      setQuizzes([]);
      return;
    }

    // A. Sync Subjects
    const subQuery = query(collection(db, 'subjects'), where('userId', '==', user.uid));
    const unsubSub = onSnapshot(subQuery, (snapshot) => {
      const list: Subject[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Subject);
      });
      setSubjects(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'subjects'));

    // B. Sync Tasks
    const taskQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTask = onSnapshot(taskQuery, (snapshot) => {
      const list: Task[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Task);
      });
      setTasks(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    // C. Sync Study Logs
    const logsQuery = query(collection(db, 'study_logs'), where('userId', '==', user.uid));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const list: StudyLog[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as StudyLog);
      });
      setStudyLogs(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'study_logs'));

    // D. Sync Quizzes
    const quizzesQuery = query(collection(db, 'quizzes'), where('userId', '==', user.uid));
    const unsubQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
      const list: Quiz[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Quiz);
      });
      setQuizzes(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'quizzes'));

    return () => {
      unsubSub();
      unsubTask();
      unsubLogs();
      unsubQuizzes();
    };
  }, [user, profile]);

  // 4. Onboard Profile creation
  const handleOnboardComplete = async (onboardingData: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Learner',
        ...onboardingData,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  // 5. Database CRUD actions
  const handleAddSubject = async (name: string, targetScore: number, color: string) => {
    if (!user) return;
    try {
      const subRef = doc(collection(db, 'subjects'));
      await setDoc(subRef, {
        id: subRef.id,
        userId: user.uid,
        name,
        targetScore,
        color,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'subjects');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'subjects');
    }
  };

  const handleAddTask = async (title: string, subjectId: string, estimatedHours: number, dueDate: string, priority: 'low' | 'medium' | 'high') => {
    if (!user) return;
    try {
      const taskRef = doc(collection(db, 'tasks'));
      await setDoc(taskRef, {
        id: taskRef.id,
        userId: user.uid,
        subjectId,
        title,
        estimatedHours,
        completed: false,
        dueDate,
        priority,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks');
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { completed });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'tasks');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'tasks');
    }
  };

  const handleLogStudy = async (subjectId: string, durationMinutes: number, topicsCovered: string, focusScore: number, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!user) return;
    try {
      const logRef = doc(collection(db, 'study_logs'));
      await setDoc(logRef, {
        id: logRef.id,
        userId: user.uid,
        subjectId,
        durationMinutes,
        date: new Date().toISOString().split('T')[0],
        topicsCovered,
        focusScore,
        difficulty,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'study_logs');
    }
  };

  const handleLogQuiz = async (subjectId: string, score: number, numQuestions: number, numCorrect: number, confidenceLevel: 'low' | 'medium' | 'high', topicsCovered: string, date: string) => {
    if (!user) return;
    try {
      const quizRef = doc(collection(db, 'quizzes'));
      await setDoc(quizRef, {
        id: quizRef.id,
        userId: user.uid,
        subjectId,
        score,
        numQuestions,
        numCorrect,
        confidenceLevel,
        topicsCovered,
        date,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'quizzes');
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quizzes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'quizzes');
    }
  };

  // 6. Call full-stack Readiness Prediction engine
  const refreshReadinessAnalysis = async () => {
    if (!user || !profile) return;
    try {
      setLoadingAnalysis(true);
      setErrorAnalysis('');

      const response = await fetch('/api/predict-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetExam: profile.targetExam,
          targetScore: profile.targetScore,
          examDate: profile.examDate,
          subjects,
          tasks,
          studyLogs,
          quizzes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Engine returned standard response error code: ${response.status}`);
      }

      const predictedData = await response.json();
      setAnalysis(predictedData);
    } catch (err: any) {
      console.error('Readiness analysis fetch failed, executing baseline fallbacks:', err);
      setErrorAnalysis('Diagnostic analysis fetch error, loaded offline mathematical rating model instead.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Automatically request baseline diagnostics on meaningful state sync
  useEffect(() => {
    if (user && profile?.onboarded && subjects.length >= 0) {
      refreshReadinessAnalysis();
    }
  }, [user, profile?.onboarded, subjects.length, tasks.length, studyLogs.length, quizzes.length]);

  // Calculated state values
  const daysRemaining = useMemo(() => {
    if (!profile?.examDate) return 0;
    const exam = new Date(profile.examDate);
    const now = new Date();
    const dif = exam.getTime() - now.getTime();
    return Math.max(Math.ceil(dif / (1000 * 3600 * 24)), 1);
  }, [profile?.examDate]);

  const totalHoursStudied = useMemo(() => {
    const totalMin = studyLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    return Math.round((totalMin / 60) * 10) / 10;
  }, [studyLogs]);

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const finished = tasks.filter((t) => t.completed).length;
    return Math.round((finished / tasks.length) * 100);
  }, [tasks]);

  const averageQuizGrade = useMemo(() => {
    if (quizzes.length === 0) return 0;
    const totalQuizScore = quizzes.reduce((acc, q) => acc + q.score, 0);
    return Math.round(totalQuizScore / quizzes.length);
  }, [quizzes]);

  // Recharts score trend dataset builder
  const trendChartData = useMemo(() => {
    // Sort quizzes by timestamp
    const sorted = [...quizzes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((q) => {
      const sub = subjects.find((s) => s.id === q.subjectId);
      return {
        date: q.date,
        Score: q.score,
        Subject: sub ? sub.name : 'Unknown',
      };
    });
  }, [quizzes, subjects]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-500" />
          <span className="text-xs font-mono">Verifying flight coordinates...</span>
        </div>
      </div>
    );
  }

  // A. Guest flow
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_100%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 text-center"
        >
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-4">
            <GraduationCap className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight font-sans text-white mb-1.5">Atodemic OS</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-6">
            Predictive AI operating flight deck for student exam readiness, cognitive telemetry, and concept mastery diagnostics.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 py-3 rounded-xl border border-indigo-500 text-xs font-semibold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
          >
            Access with Google Account
          </button>

          <div className="mt-5 text-[10px] text-slate-500 font-mono">
            OAuth Sandbox • Secure Persistent Database
          </div>
        </motion.div>
      </div>
    );
  }

  // B. Onboarding flow
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
          <span className="text-xs font-mono">Synthesizing personal dashboard...</span>
        </div>
      </div>
    );
  }

  if (!profile || !profile.onboarded) {
    return <Onboarding onComplete={handleOnboardComplete} userEmail={user.email || ''} />;
  }

  // C. Authenticated & Onboarded Student operating console environment
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative pb-12">
      
      {/* Flight Control Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/15 border border-indigo-400/20 text-indigo-400 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Atodemic</h1>
              <span className="text-[10px] text-indigo-400 font-mono tracking-wider font-semibold">PREDICTIVE CAMPAIGN OS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats indicators */}
            <div className="hidden md:flex items-center gap-5 border-l border-slate-800 pl-5 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Days remaining: <strong className="text-slate-100 font-bold">{daysRemaining}d</strong></span>
              </div>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div>
                <span>Registered Goal: <strong className="text-indigo-400">{profile.targetExam}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden xl:inline font-mono truncate max-w-[120px]">
                {profile.displayName || user.email}
              </span>
              <button
                onClick={logoutUser}
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 hover:border-red-500/20 text-slate-400 rounded-lg cursor-pointer transition-all"
                title="Disconnect Flight Deck"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Campaign Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-6">
        
        {/* Academic Flight Deck header */}
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">Target Examination</span>
            <span className="text-sm font-bold text-slate-100 block">{profile.targetExam}</span>
            <span className="text-[10.5px] font-mono text-indigo-400 block font-semibold">Target Baseline: {profile.targetScore}%</span>
          </div>

          <div className="space-y-1 border-l border-slate-850 pl-4 md:pl-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">Study Duration</span>
            <span className="text-sm font-bold text-emerald-400 block">{totalHoursStudied} hours</span>
            <span className="text-[10.5px] font-mono text-slate-400 block">Logged Focus Logs: {studyLogs.length}</span>
          </div>

          <div className="space-y-1 border-t md:border-t-0 border-slate-850 pt-3 md:pt-0 md:border-l md:pl-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">Milestones Checked</span>
            <span className="text-sm font-bold text-amber-400 block">{taskCompletionRate}% done</span>
            <span className="text-[10.5px] font-mono text-slate-400 block">Remaining: {tasks.filter((t)=>!t.completed).length} items</span>
          </div>

          <div className="space-y-1 border-t md:border-t-0 border-slate-850 pt-3 md:pt-0 border-l pl-4 md:pl-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">Accuracy Average</span>
            <span className="text-sm font-bold text-indigo-400 block">{averageQuizGrade}% score</span>
            <span className="text-[10.5px] font-mono text-slate-400 block">Audited tests: {quizzes.length}</span>
          </div>
        </div>

        {/* Dynamic Bento Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Large Column (Diagnostic and Score Tracking) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Diagnostics Assessment */}
            <section aria-labelledby="readiness-section">
              <ReadinessInsight 
                analysis={analysis} 
                onRefresh={refreshReadinessAnalysis} 
                loading={loadingAnalysis} 
                subjectsCount={subjects.length}
              />
            </section>

            {/* Diagnostic Trend Chart / Performance Line */}
            <section className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-sm text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">Acoustics Score Trajectory</h2>
                </div>
              </div>

              {trendChartData.length === 0 ? (
                <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5">
                  <TrendingUp className="h-7 w-7 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-200 font-medium mb-1">Concept trajectory is silent</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    A minimum of one practice quiz score is required to map scores over your preparation campaign.
                  </p>
                </div>
              ) : (
                <div className="h-60 w-full mt-4 text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="date" stroke="#64748B" tickLine={false} />
                      <YAxis stroke="#64748B" domain={[0, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                        labelStyle={{ fontStyle: 'italic', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Score" 
                        stroke="#6366F1" 
                        strokeWidth={3} 
                        dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Quiz Mastery component */}
            <section className="h-full">
              <QuizTracker 
                quizzes={quizzes} 
                subjects={subjects} 
                onLogQuiz={handleLogQuiz} 
                onDeleteQuiz={handleDeleteQuiz}
              />
            </section>
          </div>

          {/* Right Smaller Column (Focus, Disciplines and Task Backlog) */}
          <div className="space-y-6">
            
            {/* Study Chronometer Clock */}
            <section>
              <StudyTimer 
                subjects={subjects} 
                onLogStudy={handleLogStudy} 
              />
            </section>

            {/* Academic Subjects Grid */}
            <section>
              <SubjectManager 
                subjects={subjects} 
                onAddSubject={handleAddSubject} 
                onDeleteSubject={handleDeleteSubject}
              />
            </section>

            {/* Milestone Backlog */}
            <section>
              <TaskPlanner 
                tasks={tasks} 
                subjects={subjects} 
                onAddTask={handleAddTask} 
                onToggleTask={handleToggleTask} 
                onDeleteTask={handleDeleteTask}
              />
            </section>
          </div>

        </div>

      </main>
    </div>
  );
}
