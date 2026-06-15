import React, { useState } from 'react';
import { Award, Plus, Trash2, BookOpen, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { Quiz, Subject } from '../types';

interface QuizTrackerProps {
  quizzes: Quiz[];
  subjects: Subject[];
  onLogQuiz: (subjectId: string, score: number, numQuestions: number, numCorrect: number, confidenceLevel: 'low' | 'medium' | 'high', topicsCovered: string, date: string) => Promise<void>;
  onDeleteQuiz: (id: string) => Promise<void>;
}

export default function QuizTracker({ quizzes, subjects, onLogQuiz, onDeleteQuiz }: QuizTrackerProps) {
  const [subjectId, setSubjectId] = useState('');
  const [numQuestions, setNumQuestions] = useState('20');
  const [numCorrect, setNumCorrect] = useState('16');
  const [confidenceLevel, setConfidenceLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [topics, setTopics] = useState('');
  const [date, setDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const total = Number(numQuestions) || 1;
    const correct = Number(numCorrect) || 0;
    const calculatedScore = Math.min(Math.round((correct / total) * 100), 100);

    try {
      setLoading(true);
      const targetDate = date || new Date().toISOString().split('T')[0];
      await onLogQuiz(subjectId, calculatedScore, total, correct, confidenceLevel, topics || 'Mixed Practice', targetDate);
      
      // reset
      setTopics('');
      setNumQuestions('20');
      setNumCorrect('16');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentScorePreview = () => {
    const total = Number(numQuestions) || 1;
    const correct = Number(numCorrect) || 0;
    return Math.min(Math.round((correct / total) * 100), 100);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm text-white h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">Mastery Diagnostics</h2>
          </div>
          {subjects.length > 0 && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-850 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Score
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border border-slate-800 rounded-lg mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2 py-1.5 outline-none"
                >
                  <option value="" disabled>Select...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Date Taken</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Questions</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Correct</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={numCorrect}
                  onChange={(e) => setNumCorrect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-1">Grade Preview</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg text-center py-1.5 text-xs font-bold text-slate-100 font-mono">
                  {currentScorePreview()}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Confidence Rating</label>
                <div className="flex gap-1.5 h-8 items-center">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setConfidenceLevel(lvl)}
                      className={`flex-1 text-[10px] py-1 bg-slate-950 border rounded uppercase font-mono tracking-wider transition-all cursor-pointer ${
                        confidenceLevel === lvl 
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                          : 'border-slate-850 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Concepts Audited</label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics MCQ practice, Trig"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {loading ? 'Logging...' : 'Record Quiz'}
              </button>
            </div>
          </form>
        )}

        {subjects.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5 mt-2">
            <Award className="h-7 w-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-200 font-medium mb-1">Diagnostics are offline</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Please register your first subject discipline to unlock quiz tracking.
            </p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5 mt-2">
            <Award className="h-7 w-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-200 font-medium mb-1">Accuracy diagnostic is silent</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Scores from practice exams are the highest weighted indicator of concept readiness. Log your first mock quiz score to update baseline calculations.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {quizzes.map((quiz) => {
              const sub = subjects.find((s) => s.id === quiz.subjectId);
              return (
                <div 
                  key={quiz.id}
                  className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg group transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono rounded select-none mt-0.5">
                      {quiz.score}%
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-slate-200 truncate pr-4">
                        {quiz.topicsCovered}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 select-none flex-wrap">
                        {sub && (
                          <span 
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold text-slate-200"
                            style={{ backgroundColor: `${sub.color}20`, border: `1px solid ${sub.color}35` }}
                          >
                            {sub.name}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono">
                          {quiz.numCorrect}/{quiz.numQuestions} Quest.
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {quiz.date}
                        </span>
                        <span className={`text-[9px] font-mono capitalize px-1 py-0.2 rounded border ${
                          quiz.confidenceLevel === 'high' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          quiz.confidenceLevel === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-slate-400 bg-slate-800 border-slate-700'
                        }`}>
                          {quiz.confidenceLevel} Conf.
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteQuiz(quiz.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                    title="Delete Practice"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
