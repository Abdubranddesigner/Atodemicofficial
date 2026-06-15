import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Trash2, FolderOpen } from 'lucide-react';
import { Subject } from '../types';

interface SubjectManagerProps {
  subjects: Subject[];
  onAddSubject: (name: string, targetScore: number, color: string) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
}

export default function SubjectManager({ subjects, onAddSubject, onDeleteSubject }: SubjectManagerProps) {
  const [name, setName] = useState('');
  const [targetScore, setTargetScore] = useState('80');
  const [color, setColor] = useState('#6366F1');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onAddSubject(name.trim(), Number(targetScore) || 80, color);
      setName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#00CDAC'  // Jade
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">Registered Disciplines</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 font-medium rounded-lg hover:bg-slate-850 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border border-slate-800 rounded-lg mb-4 space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Calculus AB, Physics II"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 timeline-none outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Target Score %</label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Visual Tag Accent</label>
              <div className="flex items-center gap-1.5 flex-wrap h-10 content-center">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-4 w-4 rounded-full border border-slate-950 transition-all"
                    style={{
                      backgroundColor: c,
                      boxShadow: color === c ? '0 0 0 2px rgb(99, 102, 241)' : 'none',
                    }}
                  />
                ))}
              </div>
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
              {loading ? 'Adding...' : 'Save Subject'}
            </button>
          </div>
        </form>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5 mt-2">
          <FolderOpen className="h-7 w-7 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-200 font-medium mb-1">Begin your study campaign</p>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            Subjects categorize your study session logs, quizzes, and tasks. Register a subject (e.g. Mathematics, Organic Chemistry) to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {subjects.map((sub) => (
            <div 
              key={sub.id} 
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-800 group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.color }} />
                <div>
                  <h3 className="text-xs font-semibold text-slate-100">{sub.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Benchmark Threshold: {sub.targetScore}%</span>
                </div>
              </div>
              <button
                onClick={() => onDeleteSubject(sub.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                title="Delete Subject"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
