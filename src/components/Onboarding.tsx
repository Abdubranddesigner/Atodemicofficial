import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, Calendar, Trophy, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (data: Partial<UserProfile>) => void;
  userEmail: string;
}

export default function Onboarding({ onComplete, userEmail }: OnboardingProps) {
  const [targetExam, setTargetExam] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetExam.trim()) {
      setError('Please specify the entrance or course exam name.');
      return;
    }
    if (!examDate) {
      setError('Please select your scheduled exam date.');
      return;
    }
    if (!targetScore || isNaN(Number(targetScore)) || Number(targetScore) <= 0) {
      setError('Please enter a valid positive target score threshold.');
      return;
    }

    onComplete({
      targetExam,
      examDate,
      targetScore: Number(targetScore),
      onboarded: true,
      email: userEmail,
      createdAt: new Date().toISOString(),
    });
  };

  const PRESETS = ['SAT Prep', 'MCAT Medical', 'CFA Level I', 'USMLE Step 1', 'GMAT Business', 'Bar Exam Law'];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/15 rounded-xl border border-indigo-500/20 text-indigo-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-indigo-400 tracking-wider uppercase font-semibold">Atodemic OS</span>
            <h1 className="text-2xl font-bold font-sans tracking-tight">Onboarding Diagnostic</h1>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Welcome to Atodemic. Unlike retrospective study helpers, Atodemic operates as a 
          predictive diagnostic flight deck. Set your targets below to calibrate risk indexes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
              1. Target Academic / Course Exam
            </label>
            <input
              type="text"
              placeholder="e.g. SAT, MCAT, CFA, USMLE, Final Exams"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors outline-none"
            />
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetExam(preset)}
                  className="text-[11px] font-mono bg-slate-900 hover:bg-slate-800/80 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
                2. Scheduled Exam Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white transition-colors outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
                3. Ultimate Target Score
              </label>
              <div className="relative">
                <Trophy className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="number"
                  placeholder="e.g. 1550, 520, 80"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 transition-colors outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl py-3.5 transition-colors shadow-lg shadow-indigo-600/15 cursor-pointer mt-6"
          >
            Submit Target Data Map
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
