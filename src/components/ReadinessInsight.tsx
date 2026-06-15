import React from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { ReadinessAnalysis } from '../types';

interface ReadinessInsightProps {
  analysis: ReadinessAnalysis | null;
  onRefresh: () => Promise<void>;
  loading: boolean;
  subjectsCount: number;
}

export default function ReadinessInsight({ analysis, onRefresh, loading, subjectsCount }: ReadinessInsightProps) {
  
  const getRiskStatus = (score: number, riskLevel: string) => {
    if (score < 30) return {
      label: 'Critical Vulnerability',
      color: 'text-red-400 border-red-500/20 bg-red-500/5',
      badge: 'bg-red-500 text-white',
      desc: 'Preparation level is currently highly critical. Your score is far from the benchmark.'
    };
    if (score < 45) return {
      label: 'High Risk Alert',
      color: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
      badge: 'bg-orange-500 text-white',
      desc: 'Preparation gaps are widening. Consistent mock scores and focus hours are needed.'
    };
    if (score < 60) return {
      label: 'Behind Schedule',
      color: 'text-amber-400 border-amber-500/25 bg-amber-500/5',
      badge: 'bg-amber-500 text-slate-900',
      desc: 'Currently trailing slightly below schedule. Focus on covering difficult milestones.'
    };
    if (score < 75) return {
      label: 'Slightly Behind',
      color: 'text-[rgb(132,204,22)] border-[rgb(132,204,22)]/20 bg-[rgb(132,204,22)]/5',
      badge: 'bg-[rgb(132,204,22)] text-slate-950',
      desc: 'Nearly on track. Incremental mock exams with high confidence will secure readiness.'
    };
    if (score < 90) return {
      label: 'On Track',
      color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5',
      badge: 'bg-emerald-500 text-slate-950',
      desc: 'Excellent consistency. Practice metrics prove you are meeting baseline threshold targets.'
    };
    return {
      label: 'Exam Ready',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 shadow-indigo-500/10 shadow-lg relative overflow-hidden',
      badge: 'bg-indigo-500 text-white font-semibold shadow-indigo-500/20 animate-pulse',
      desc: 'Highest confidence score. Mastery is verified across core audited topics.'
    };
  };

  const status = analysis ? getRiskStatus(analysis.readinessScore, analysis.riskLevel) : null;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-md text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Brain className="h-5 w-5 text-indigo-400" />
          <div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest leading-none font-bold">Predictive Diagnostic</span>
            <h2 className="text-base font-bold tracking-tight">AI Prep Readiness Score</h2>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading || subjectsCount === 0}
          className="w-full sm:w-auto p-2 px-4 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-lg hover:bg-indigo-600/15 focus:ring-1 focus:ring-indigo-500/50 hover:border-indigo-500 hover:text-indigo-300 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed select-none"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          {loading ? 'Analyzing Data...' : 'Analyze Prep Strategy'}
        </button>
      </div>

      {!analysis ? (
        <div className="text-center py-12 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-5">
          <Brain className="h-9 w-9 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Readiness calculation is pending</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The system requires initial academic subjects and logged learning metrics before calculating preparation risks. Add your targets and log a focus session to request diagnostic feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Visual Metric Dashboard */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 p-5 border rounded-xl ${status?.color}`}>
            <div className="flex flex-col justify-center items-center text-center p-3">
              <span className="text-[10.5px] font-mono tracking-widest text-slate-400 uppercase">Risk Level Index</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono mt-2 ${status?.badge}`}>
                {status?.label}
              </span>
              <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed max-w-xs">{status?.desc}</p>
            </div>

            <div className="flex flex-col justify-center items-center py-2 relative select-none">
              {analysis.readinessScore >= 90 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent blur-xl animate-pulse" />
              )}
              <div className="relative flex items-center justify-center p-4">
                <span className="text-6xl font-extrabold font-mono tracking-tighter text-white">
                  {analysis.readinessScore}
                </span>
                <span className="text-lg text-slate-400 font-mono ml-1">/100</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">Ready Rating</span>
            </div>

            {/* Quick Metrics Breakdown list */}
            <div className="flex flex-col justify-center gap-3 font-mono border-t md:border-t-0 md:border-l border-slate-800 md:pl-5 pt-3 md:pt-0">
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">Diagnosis Metadata</span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Telemetry Engine:</span>
                  <span className="font-semibold text-indigo-400">{analysis.isAiPowered ? 'Gemini 3.5 LLM' : 'Precision Math'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Exam Window:</span>
                  <span className="font-semibold">{analysis.calculatedAt ? new Date(analysis.calculatedAt).toLocaleTimeString() : 'Current'}</span>
                </div>
                {analysis.subjectScores && analysis.subjectScores.length > 0 && (
                  <div className="border-t border-slate-900 pt-1.5 mt-1.5 space-y-1">
                    {analysis.subjectScores.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 truncate max-w-[120px]">{s.subjectName}:</span>
                        <span className={`font-semibold ${s.estimatedReadyScore >= 75 ? 'text-emerald-400' : s.estimatedReadyScore >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                          {s.estimatedReadyScore}% Ready
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic Gaps & Practical Recommendations lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gaps detected */}
            <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-semibold tracking-wider font-mono uppercase text-slate-300">Preparation Gaps Identified</h3>
              </div>
              <ul className="space-y-2.5">
                {analysis.gaps.map((gap, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold tracking-wider font-mono uppercase text-slate-300">Action Plan Advice</h3>
              </div>
              <ul className="space-y-2.5">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <span className="text-emerald-400 mt-0.5 font-bold shrink-0">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
