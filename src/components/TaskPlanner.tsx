import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, Clock, AlertTriangle, Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { Task, Subject } from '../types';

interface TaskPlannerProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (title: string, subjectId: string, estimatedHours: number, dueDate: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TaskPlanner({ tasks, subjects, onAddTask, onToggleTask, onDeleteTask }: TaskPlannerProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAdding, setIsAdding] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(false);

  // set first subject by default
  React.useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    try {
      setLoading(true);
      const targetDate = dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]; // fallback 3 days out
      await onAddTask(title.trim(), subjectId, Number(estimatedHours) || 2, targetDate, priority);
      setTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterCompleted === 'pending') return !t.completed;
    if (filterCompleted === 'completed') return t.completed;
    return true;
  });

  const getPriorityBadge = (p: string) => {
    if (p === 'high') return <span className="text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-semibold">High</span>;
    if (p === 'medium') return <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-semibold">Med</span>;
    return <span className="text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase">Low</span>;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm text-white h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wider font-mono text-slate-300 uppercase">Preparation Milestones</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex bg-slate-905 border border-slate-850 rounded-lg p-0.5">
              {(['pending', 'completed', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterCompleted(filter)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded capitalize cursor-pointer transition-all ${
                    filterCompleted === filter 
                      ? 'bg-slate-800 text-white font-semibold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            {subjects.length > 0 && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-850 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border border-slate-800 rounded-lg mb-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Milestone Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Read Physics textbook Chapter 12 and do notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="" disabled>Select subject...</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Est. Focus Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none text-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                <div className="flex gap-1.5 h-8 items-center">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 text-[10px] py-1 bg-slate-950 border rounded uppercase font-mono tracking-wider transition-all cursor-pointer ${
                        priority === p 
                          ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                          : 'border-slate-850 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
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
                {loading ? 'Adding...' : 'Save Milestone'}
              </button>
            </div>
          </form>
        )}

        {subjects.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5 mt-2">
            <ClipboardList className="h-7 w-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-200 font-medium mb-1">Planning is offline</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Please register your first subject discipline to unlock task scheduling.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5 mt-2">
            <ClipboardList className="h-7 w-7 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-200 font-medium mb-1">Your action map is clear</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Milestoned study tasks keep your schedule balanced. Add high-priority study objectives to track milestones.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {filteredTasks.map((task) => {
                const sub = subjects.find((s) => s.id === task.subjectId);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-start justify-between p-2.5 rounded-lg border border-slate-850 group transition-all ${
                      task.completed ? 'bg-slate-950/40 border-slate-900 opacity-60' : 'bg-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleTask(task.id, !task.completed)}
                        className="mt-0.5 text-slate-500 hover:text-indigo-400 hover:scale-105 transition-all cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckSquare className="h-4.5 w-4.5 text-indigo-500 fill-indigo-500/10" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-400 hover:border-indigo-400" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xs font-semibold text-slate-100 truncate ${task.completed ? 'line-through text-slate-500 font-normal' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 select-none">
                          {sub && (
                            <span 
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold text-slate-200" 
                              style={{ backgroundColor: `${sub.color}20`, border: `1px solid ${sub.color}35` }}
                            >
                              {sub.name}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-mono">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {task.estimatedHours}h
                          </span>
                          <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-mono">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {task.dueDate}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                      title="Delete Milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
