import React, { useState, useEffect } from 'react';
import {
  Award, CheckCircle2, Clock, Download, Eye, FileText, Filter, HelpCircle,
  Lock, RefreshCw, RotateCcw, Search, Shield, Sliders, Sparkles, TrendingUp,
  UserCheck, Users, X, AlertTriangle, KeyRound, Check
} from 'lucide-react';
import { useMystery } from '../context/MysteryContext';
import { PlayerEvaluationReport, LeaderboardEntry, ClueConfig } from '../types/mystery';

export const AdminEvaluationCenter: React.FC = () => {
  const {
    evaluationState,
    leaderboard,
    isLeaderboardPublished,
    adminPublishLeaderboard,
    adminOverrideScore,
    adminReEvaluate,
    fetchEvaluationResults,
    fetchCaseConfig,
    caseConfig,
    adminUpdateCaseConfig,
  } = useMystery();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE'>('ALL');

  // Selected Player Report for Detailed Dossier Modal
  const [selectedReport, setSelectedReport] = useState<PlayerEvaluationReport | null>(null);

  // Publish Leaderboard Confirmation Modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);

  // Manual Override Form State
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideInvestigationScore, setOverrideInvestigationScore] = useState<number>(0);
  const [overrideFinalAnswerScore, setOverrideFinalAnswerScore] = useState<number>(0);
  const [overrideReasoningScore, setOverrideReasoningScore] = useState<number>(0);
  const [overrideAccuracy, setOverrideAccuracy] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Case Solution / Clue Weights Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempClueWeights, setTempClueWeights] = useState<Record<string, number>>({});
  const [configSaveFeedback, setConfigSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluationResults();
    fetchCaseConfig();
  }, [fetchEvaluationResults, fetchCaseConfig]);

  // Open Player Report Dossier
  const handleOpenReport = (report: PlayerEvaluationReport) => {
    setSelectedReport(report);
    setShowOverrideForm(false);
    setOverrideInvestigationScore(report.scoreBreakdown.investigationScore);
    setOverrideFinalAnswerScore(report.scoreBreakdown.finalAnswerScore);
    setOverrideReasoningScore(report.scoreBreakdown.reasoningScore);
    setOverrideAccuracy(report.accuracyPercentage);
    setOverrideReason('');
    setOverrideFeedback(null);
  };

  // Confirm Publish Leaderboard
  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    try {
      await adminPublishLeaderboard();
      setPublishSuccessMessage('The Final Leaderboard has been published to all players.');
      setTimeout(() => {
        setShowPublishModal(false);
        setPublishSuccessMessage(null);
      }, 1500);
    } catch {
      setPublishSuccessMessage('Failed to publish leaderboard');
    } finally {
      setIsPublishing(false);
    }
  };

  // Submit Manual Score Override
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!overrideReason.trim()) {
      setOverrideFeedback('A detailed reason is required for administrative audit logs.');
      return;
    }

    setIsSubmittingOverride(true);
    setOverrideFeedback(null);
    try {
      await adminOverrideScore({
        playerId: selectedReport.playerId,
        investigationScore: Number(overrideInvestigationScore),
        finalAnswerScore: Number(overrideFinalAnswerScore),
        reasoningScore: Number(overrideReasoningScore),
        accuracyPercentage: Number(overrideAccuracy),
        reason: overrideReason.trim(),
      });
      setOverrideFeedback('Score override logged and leaderboard rankings updated.');
      setTimeout(() => {
        setShowOverrideForm(false);
        // Refresh selected report from updated evaluationState
        if (evaluationState?.reports[selectedReport.playerId]) {
          setSelectedReport(evaluationState.reports[selectedReport.playerId]);
        }
      }, 1000);
    } catch (err: any) {
      setOverrideFeedback(err?.message || 'Failed to submit override.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = '/api/admin/evaluation/export/csv';
  };

  // Open Configuration Modal
  const handleOpenConfig = () => {
    if (caseConfig?.clueWeights) {
      const weights: Record<string, number> = {};
      Object.entries(caseConfig.clueWeights).forEach(([k, v]) => {
        weights[k] = v.weight;
      });
      setTempClueWeights(weights);
    }
    setConfigSaveFeedback(null);
    setShowConfigModal(true);
  };

  const handleSaveClueWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (caseConfig?.scoringLocked) {
      setConfigSaveFeedback('Cannot save: Scoring system is locked because the event has started.');
      return;
    }

    if (!caseConfig?.clueWeights) return;
    const updatedClues: Record<string, ClueConfig> = { ...caseConfig.clueWeights };
    Object.entries(tempClueWeights).forEach(([id, weight]) => {
      if (updatedClues[id]) {
        updatedClues[id] = { ...updatedClues[id], weight: Number(weight) };
      }
    });

    try {
      await adminUpdateCaseConfig({ clueWeights: updatedClues });
      setConfigSaveFeedback('Clue weights updated successfully.');
      setTimeout(() => setShowConfigModal(false), 1000);
    } catch (err: any) {
      setConfigSaveFeedback(err?.message || 'Failed to update clue weights.');
    }
  };

  // Filtered Leaderboard
  const filteredLeaderboard = leaderboard.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      entry.playerName.toLowerCase().includes(q) ||
      entry.username.toLowerCase().includes(q) ||
      entry.playerId.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'COMPLETED') return entry.status === 'Completed';
    if (statusFilter === 'INCOMPLETE') return entry.status === 'Incomplete' || entry.status === 'Not Started';

    return true;
  });

  const evalStatus = evaluationState?.status || 'PENDING';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* EVALUATION STATUS & MASTER HEADER */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                AUTOMATED EVALUATION CENTER
              </span>
              {/* Status Badge (Prompt 33) */}
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                  evalStatus === 'COMPLETED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : evalStatus === 'EVALUATING'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {evalStatus === 'COMPLETED' && '✓ Evaluation Completed'}
                {evalStatus === 'EVALUATING' && '⚙ Evaluating Players...'}
                {evalStatus === 'PENDING' && '⏳ Evaluation Pending'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-zinc-100">
              LEADERBOARD & CASE AUDITING
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Deterministic, evidence-grounded scoring evaluating clues discovered, reasoning quality, motive analysis, and completion efficiency.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Re-Evaluate button */}
            <button
              onClick={adminReEvaluate}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-400 font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Re-run evaluation algorithm across all player records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Evaluate</span>
            </button>

            {/* Answer Key & Weights */}
            <button
              onClick={handleOpenConfig}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Answer Key & Clue Weights</span>
            </button>

            {/* Export CSV (Prompt 45) */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Publish Leaderboard (Prompt 39) */}
            {!isLeaderboardPublished ? (
              <button
                onClick={() => setShowPublishModal(true)}
                disabled={evalStatus !== 'COMPLETED'}
                className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                  evalStatus === 'COMPLETED'
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>PUBLISH LEADERBOARD</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Leaderboard Published</span>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY METRICS DASHBOARD (Prompt 34 & 45) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Total Players</span>
            <div className="text-lg font-bold text-zinc-100 font-mono">
              {evaluationState?.totalPlayers || leaderboard.length}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Evaluated</span>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {evaluationState?.playersEvaluated || leaderboard.length}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Avg Score</span>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {evaluationState?.averageScore || 0}
              <span className="text-[10px] text-zinc-500 font-normal">/100</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Avg Accuracy</span>
            <div className="text-lg font-bold text-teal-400 font-mono">
              {evaluationState?.averageAccuracy || 0}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1 col-span-2">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Fastest Correct Solver</span>
            <div className="text-xs font-bold text-zinc-100 truncate font-mono">
              {evaluationState?.fastestSolver
                ? `${evaluationState.fastestSolver.playerName} (${evaluationState.fastestSolver.time})`
                : 'None yet'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Top Accuracy</span>
            <div className="text-lg font-bold text-indigo-400 font-mono">
              {evaluationState?.highestAccuracy ? `${evaluationState.highestAccuracy.accuracy}%` : 'N/A'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Most Clues</span>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {evaluationState?.mostCluesDiscovered ? `${evaluationState.mostCluesDiscovered.count}` : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* LEADERBOARD TABLE (Prompt 36 & 37) */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg text-zinc-100">
              Official Leaderboard Rankings
            </h3>
            <span className="text-[11px] font-mono text-zinc-500 ml-2">
              (Deterministic tie-breaking: Score → Accuracy → Critical Clues → Reasoning → Time)
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rankings..."
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/70"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
              {(['ALL', 'COMPLETED', 'INCOMPLETE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] cursor-pointer ${
                    statusFilter === f ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Final Score</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Time Taken</th>
                <th className="py-3 px-4">Clues Found</th>
                <th className="py-3 px-4">Investigation Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500 font-mono">
                    {evalStatus === 'PENDING'
                      ? 'Investigation in progress. Leaderboard will be computed upon clicking END EVENT.'
                      : 'No player evaluations match your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((entry) => {
                  const report = evaluationState?.reports[entry.playerId];
                  return (
                    <tr
                      key={entry.playerId}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => report && handleOpenReport(report)}
                    >
                      {/* Rank Medal */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        {entry.rank === 1 && (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            🥇 <span className="text-zinc-100 font-bold">1st</span>
                          </span>
                        )}
                        {entry.rank === 2 && (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            🥈 <span className="text-zinc-100 font-bold">2nd</span>
                          </span>
                        )}
                        {entry.rank === 3 && (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            🥉 <span className="text-zinc-100 font-bold">3rd</span>
                          </span>
                        )}
                        {entry.rank > 3 && <span className="text-zinc-400">#{entry.rank}</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-100">{entry.playerName}</div>
                        <div className="text-[10px] font-mono text-zinc-500">@{entry.username}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {entry.finalScore}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">/ 100</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold ${
                            entry.accuracyPercentage >= 85
                              ? 'text-emerald-400'
                              : entry.accuracyPercentage >= 60
                              ? 'text-teal-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {entry.accuracyPercentage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300 text-xs">
                        {entry.timeTakenFormatted}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {entry.cluesFoundCount} / {entry.totalCluesCount}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            entry.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : entry.status === 'Incomplete'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (report) handleOpenReport(report);
                          }}
                          className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-xs font-mono transition-colors cursor-pointer"
                        >
                          Inspect Report →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLAYER EVALUATION REPORT MODAL (Prompt 35 & 43 & 44) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="max-w-3xl w-full my-8 rounded-3xl border border-zinc-700 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    OFFICIAL DOSSIER EVALUATION
                  </span>
                  {selectedReport.rank && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      RANK #{selectedReport.rank}
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-2xl text-zinc-100 mt-1">
                  PLAYER: {selectedReport.playerName.toUpperCase()}
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  ID: {selectedReport.playerId} • @{selectedReport.username} • Evaluated At: {selectedReport.evaluatedAt}
                </span>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Accuracy Highlight Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500">FINAL SCORE</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold font-mono text-amber-400">
                    {selectedReport.finalScore}
                  </span>
                  <span className="text-sm font-mono text-zinc-500">/ 100</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-2">
                  Deterministic 100-Point Model
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500">INVESTIGATION ACCURACY</span>
                <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                  {selectedReport.accuracyPercentage}%
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-2">
                  Evidence & Deduction Alignment
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500">TIME TAKEN</span>
                <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
                  {selectedReport.timeTakenFormatted}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-2">
                  {selectedReport.isSubmitted ? 'Submitted before time expired' : 'Investigation ended at timer limit'}
                </div>
              </div>
            </div>

            {/* SCORE BREAKDOWN (Prompt 35) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
              <h4 className="font-serif font-bold text-sm text-zinc-200 flex items-center justify-between">
                <span>SCORE BREAKDOWN</span>
                <span className="text-xs font-mono text-zinc-500">Max 100 Points</span>
              </h4>

              <div className="space-y-3">
                {/* 1. Investigation & Evidence */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-300">1. Investigation & Evidence</span>
                    <span className="font-bold text-emerald-400">
                      {selectedReport.scoreBreakdown.investigationScore} / {selectedReport.scoreBreakdown.investigationMax}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedReport.scoreBreakdown.investigationScore / selectedReport.scoreBreakdown.investigationMax) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500 mt-1.5">
                    <span>Critical Clues: {selectedReport.scoreBreakdown.investigationDetails.criticalCluesScore}/{selectedReport.scoreBreakdown.investigationDetails.criticalCluesMax}</span>
                    <span>• Supporting Clues: {selectedReport.scoreBreakdown.investigationDetails.supportingCluesScore}/{selectedReport.scoreBreakdown.investigationDetails.supportingCluesMax}</span>
                    <span>• Evidence Interpretation: {selectedReport.scoreBreakdown.investigationDetails.interpretationScore}/{selectedReport.scoreBreakdown.investigationDetails.interpretationMax}</span>
                    <span>• Completeness: {selectedReport.scoreBreakdown.investigationDetails.completenessScore}/{selectedReport.scoreBreakdown.investigationDetails.completenessMax}</span>
                  </div>
                </div>

                {/* 2. Final Answer */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-300">2. Final Answer & Conclusion</span>
                    <span className="font-bold text-teal-400">
                      {selectedReport.scoreBreakdown.finalAnswerScore} / {selectedReport.scoreBreakdown.finalAnswerMax}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedReport.scoreBreakdown.finalAnswerScore / selectedReport.scoreBreakdown.finalAnswerMax) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500 mt-1.5">
                    <span>Conclusion: {selectedReport.scoreBreakdown.finalAnswerDetails.conclusionScore}/{selectedReport.scoreBreakdown.finalAnswerDetails.conclusionMax}</span>
                    <span>• Culprit: {selectedReport.scoreBreakdown.finalAnswerDetails.culpritScore}/{selectedReport.scoreBreakdown.finalAnswerDetails.culpritMax}</span>
                    <span>• Motive: {selectedReport.scoreBreakdown.finalAnswerDetails.motiveScore}/{selectedReport.scoreBreakdown.finalAnswerDetails.motiveMax}</span>
                    <span>• Event Explanation: {selectedReport.scoreBreakdown.finalAnswerDetails.explanationScore}/{selectedReport.scoreBreakdown.finalAnswerDetails.explanationMax}</span>
                  </div>
                </div>

                {/* 3. Reasoning */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-300">3. Deductive Reasoning</span>
                    <span className="font-bold text-indigo-400">
                      {selectedReport.scoreBreakdown.reasoningScore} / {selectedReport.scoreBreakdown.reasoningMax}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedReport.scoreBreakdown.reasoningScore / selectedReport.scoreBreakdown.reasoningMax) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500 mt-1.5">
                    <span>Logical Links: {selectedReport.scoreBreakdown.reasoningDetails.logicalConnectionsScore}/5</span>
                    <span>• Suspect Suspicion: {selectedReport.scoreBreakdown.reasoningDetails.suspectSuspicionScore}/5</span>
                    <span>• Elimination of Innocents: {selectedReport.scoreBreakdown.reasoningDetails.eliminationScore}/4</span>
                    <span>• Timeline Sequence: {selectedReport.scoreBreakdown.reasoningDetails.sequenceExplanationScore}/3</span>
                  </div>
                </div>

                {/* 4. Time */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-zinc-300">4. Controlled Time Bonus</span>
                    <span className="font-bold text-amber-400">
                      {selectedReport.scoreBreakdown.timeScore} / {selectedReport.scoreBreakdown.timeMax}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedReport.scoreBreakdown.timeScore / selectedReport.scoreBreakdown.timeMax) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* INVESTIGATION SUMMARY CHIPS (Prompt 35) */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="text-xs font-mono uppercase text-zinc-400 font-bold block">
                INVESTIGATION SUMMARY
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">SUSPECTS INTERROGATED</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">
                    {selectedReport.investigationSummary.suspectsInvestigatedCount} / {selectedReport.investigationSummary.totalSuspects}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">TOTAL QUESTIONS ASKED</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">
                    {selectedReport.investigationSummary.questionsAsked}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">IMPORTANT QUESTIONS</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {selectedReport.investigationSummary.importantQuestionsCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">CRITICAL CLUES FOUND</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {selectedReport.investigationSummary.criticalCluesFoundCount} / {selectedReport.investigationSummary.totalCriticalClues}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">SUPPORTING CLUES FOUND</div>
                  <div className="text-sm font-bold text-teal-400 mt-0.5">
                    {selectedReport.investigationSummary.supportingCluesFoundCount} / {selectedReport.investigationSummary.totalSupportingClues}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500">INCORRECT ASSUMPTIONS</div>
                  <div className="text-sm font-bold text-red-400 mt-0.5">
                    {selectedReport.investigationSummary.incorrectAssumptionsCount}
                  </div>
                </div>
              </div>
            </div>

            {/* FINAL ANSWER VS CORRECT ANSWER KEY (Prompt 35) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  PLAYER'S SUBMITTED CONCLUSION
                </span>
                <div className="text-xs space-y-1.5 font-sans">
                  <div>
                    <span className="text-zinc-500 font-mono">Suspect Accused: </span>
                    <strong className="text-zinc-100">{selectedReport.playerFinalAnswer.suspect || 'None'}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono">Articulated Motive: </span>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[11px]">
                      {selectedReport.playerFinalAnswer.motive || 'No motive provided.'}
                    </p>
                  </div>
                  {selectedReport.playerFinalAnswer.notes && (
                    <div>
                      <span className="text-zinc-500 font-mono">Recorded Notes: </span>
                      <p className="text-zinc-400 text-[11px] italic bg-zinc-900/40 p-2 rounded border border-zinc-800/60 truncate">
                        "{selectedReport.playerFinalAnswer.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  OFFICIAL CASE SOLUTION
                </span>
                <div className="text-xs space-y-1.5 font-sans">
                  <div>
                    <span className="text-zinc-500 font-mono">True Culprit: </span>
                    <strong className="text-emerald-300">{selectedReport.correctAnswerKeySummary.correctCulprit}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono">True Motive: </span>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[11px]">
                      {selectedReport.correctAnswerKeySummary.correctMotive}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* EVALUATION EXPLANATION & VERDICT (Prompt 35) */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block">
                EVALUATION APPRAISAL & VERDICT
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {selectedReport.evaluationExplanation.summary}
              </p>

              {selectedReport.evaluationExplanation.strengths.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">Deductive Strengths:</span>
                  <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 font-sans">
                    {selectedReport.evaluationExplanation.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReport.evaluationExplanation.weaknesses.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">Areas of Improvement:</span>
                  <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-sans">
                    {selectedReport.evaluationExplanation.weaknesses.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* PREVIOUS AUDIT OVERRIDE NOTICE IF PRESENT (Prompt 44) */}
            {selectedReport.manualOverride && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>MANUAL SCORE OVERRIDE AUDIT LOG</span>
                </div>
                <p className="text-zinc-300">
                  Score manually adjusted from {selectedReport.manualOverride.originalScore} to {selectedReport.manualOverride.newScore} by <strong>{selectedReport.manualOverride.adminName}</strong> at {selectedReport.manualOverride.modifiedAt}.
                </p>
                <p className="text-zinc-400 italic">
                  Reason: "{selectedReport.manualOverride.reason}"
                </p>
              </div>
            )}

            {/* ADMIN MANUAL OVERRIDE ACCORDION (Prompt 44) */}
            <div className="border-t border-zinc-800 pt-4">
              {!showOverrideForm ? (
                <button
                  onClick={() => setShowOverrideForm(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Review / Adjust Score (Manual Override)</span>
                </button>
              ) : (
                <form onSubmit={handleSubmitOverride} className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif font-bold text-sm text-amber-400">
                      ADMIN MANUAL SCORE OVERRIDE
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowOverrideForm(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                    >
                      Cancel
                    </button>
                  </div>

                  {overrideFeedback && (
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-amber-300">
                      {overrideFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Investigation Score (0-40)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={overrideInvestigationScore}
                        onChange={(e) => setOverrideInvestigationScore(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Final Answer (0-30)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={overrideFinalAnswerScore}
                        onChange={(e) => setOverrideFinalAnswerScore(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Reasoning (0-20)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={overrideReasoningScore}
                        onChange={(e) => setOverrideReasoningScore(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Accuracy % (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={overrideAccuracy}
                        onChange={(e) => setOverrideAccuracy(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Reason for Override (Mandatory Audit Trail)
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. Player identified the torn letter motive in their notes using synonym terminology."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-sans focus:outline-none focus:border-amber-500/70"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingOverride}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono shadow-md cursor-pointer"
                    >
                      {isSubmittingOverride ? 'Saving Override...' : 'Confirm Score Adjustment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH LEADERBOARD CONFIRMATION MODAL (Prompt 39) */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl border border-amber-500/40 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Award className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl text-zinc-100">
                PUBLISH FINAL LEADERBOARD
              </h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                "Evaluation completed. Do you want to publish the final leaderboard to players?"
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                Once published, players will see their rank, final scores, and complete leaderboard standings.
              </p>
            </div>

            {publishSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-mono">
                {publishSuccessMessage}
              </div>
            )}

            {!publishSuccessMessage && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold font-mono text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-xs shadow-lg cursor-pointer"
                >
                  {isPublishing ? 'Publishing...' : 'PUBLISH'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANSWER KEY & CLUE WEIGHTS MODAL (Prompt 23, 24, 26, 46) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="max-w-2xl w-full my-8 rounded-3xl border border-zinc-700 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-xl text-zinc-100">
                    CASE ANSWER KEY & CLUE WEIGHTS
                  </h3>
                  {caseConfig?.scoringLocked && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      🔒 LOCKED (EVENT ACTIVE)
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Fairness rule: Scoring system locked once the event starts.
                </span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSaveFeedback && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-amber-300">
                {configSaveFeedback}
              </div>
            )}

            {/* Answer Key Details */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-sans">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold block">
                Official Case Solution
              </span>
              <div>
                <span className="text-zinc-500 font-mono">Culprit: </span>
                <strong className="text-zinc-100">{caseConfig?.answerKey.correctCulpritName}</strong>
              </div>
              <div>
                <span className="text-zinc-500 font-mono">Motive: </span>
                <p className="text-zinc-300 mt-1 leading-relaxed bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 text-[11px]">
                  {caseConfig?.answerKey.correctMotive}
                </p>
              </div>
              <div>
                <span className="text-zinc-500 font-mono">Required Reasoning Points: </span>
                <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-1 mt-1">
                  {caseConfig?.answerKey.requiredReasoningPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Clue Weights Form */}
            <form onSubmit={handleSaveClueWeights} className="space-y-4">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-bold block">
                Clue Weights (Configurable Prior to Start)
              </span>

              <div className="space-y-2">
                {caseConfig?.clueWeights &&
                  Object.entries(caseConfig.clueWeights).map(([id, clue]) => (
                    <div
                      key={id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-zinc-200">{clue.title}</strong>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.2 rounded-full uppercase ${
                              clue.type === 'Critical'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-teal-950 text-teal-300 border border-teal-800'
                            }`}
                          >
                            {clue.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-md">
                          {clue.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400">Weight:</span>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          disabled={caseConfig.scoringLocked}
                          value={tempClueWeights[id] ?? clue.weight}
                          onChange={(e) =>
                            setTempClueWeights({
                              ...tempClueWeights,
                              [id]: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-100 font-mono text-center disabled:opacity-60"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">pts</span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  {caseConfig?.scoringLocked
                    ? '🔒 Locked: Scoring system cannot be modified during or after the live event.'
                    : 'Changes will apply to future automated evaluations.'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-mono"
                  >
                    Close
                  </button>
                  {!caseConfig?.scoringLocked && (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono"
                    >
                      Save Weights
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
