import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Timer as TimerIcon, Focus, Award, ChevronDown } from 'lucide-react';
import { Subject } from '../types';

interface StudyTimerProps {
  subjects: Subject[];
  onLogStudy: (subjectId: string, durationMinutes: number, topicsCovered: string, focusScore: number, difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
}

export default function StudyTimer({ subjects, onLogStudy }: StudyTimerProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [topics, setTopics] = useState('');
  const [focusScore, setFocusScore] = useState(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleStartStop = () => {
    setIsActive(!isActive);
    setSuccess(false);
  };

  const handleSaveSession = async () => {
    if (!selectedSubjectId) return;
    const minutes = Math.ceil(secondsElapsed / 60);
    if (minutes === 0) return;

    try {
      setLoading(true);
      await onLogStudy(selectedSubjectId, minutes, topics || 'Self Study', focusScore, difficulty);
      
      // Reset state
      setSecondsElapsed(0);
      setIsActive(false);
      setTopics('');
      setFocusScore(4);
      setDifficulty('medium');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TimerIcon className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">Focus Chronometer</h2>
          </div>
          {isActive && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5">
            <TimerIcon className="h-7 w-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-200 font-medium mb-1">Chronometer is offline</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Please register your first subject discipline to unlock focus timing and telemetry.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Focus Subject</label>
              <div className="relative">
                <select
                  disabled={isActive}
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 rounded-lg px-3 py-2 outline-none appearance-none disabled:opacity-60 cursor-pointer"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Main Timer Display */}
            <div className="py-2 text-center">
              <span className="text-4xl font-mono font-bold tracking-tight text-white select-none">
                {formatTime(secondsElapsed)}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isActive ? 'Active Studying Mode' : secondsElapsed > 0 ? 'Session Paused' : 'Ready to Calibrate'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={handleStartStop}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                }`}
              >
                {isActive ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Pause Block
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Focus Chrono
                  </>
                )}
              </button>

              {secondsElapsed > 0 && (
                <button
                  type="button"
                  onClick={handleSaveSession}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  Save Log ({Math.ceil(secondsElapsed / 60)}m)
                </button>
              )}
            </div>

            {success && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg text-center font-mono">
                Study session telemetry saved successfully.
              </div>
            )}

            {/* Metadata Fields (Visible when timer has recorded time or during pauses) */}
            <div className={`space-y-3 pt-2 border-t border-slate-900 transition-all ${secondsElapsed > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">In-Session Concepts Covered</label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics, Derivatives, Amino Acids"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Focus Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFocusScore(s)}
                        className={`flex-1 text-[10px] py-1 rounded border font-semibold transition-colors ${
                          focusScore === s 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Cognitive Friction</label>
                  <div className="flex gap-1.5">
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 text-[10px] py-1 rounded border capitalize transition-colors ${
                          difficulty === d 
                            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' 
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
