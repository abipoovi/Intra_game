import React, { useEffect } from 'react';
import {
  Award, CheckCircle2, Clock, FileText, ArrowLeft, Shield, LogOut,
  Sparkles, Check, AlertOctagon, HelpCircle, ChevronRight, Lock
} from 'lucide-react';
import { useMystery } from '../context/MysteryContext';

export const PlayerResultsPage: React.FC = () => {
  const {
    currentUser,
    playerEvaluationReport,
    leaderboard,
    isLeaderboardPublished,
    setCurrentView,
    logout,
    fetchPlayerMyResult,
    fetchLeaderboard,
    baseline,
  } = useMystery();

  useEffect(() => {
    fetchPlayerMyResult();
    fetchLeaderboard();
  }, [fetchPlayerMyResult, fetchLeaderboard]);

  const report = playerEvaluationReport;

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-zinc-100">{baseline.title}</h1>
            <span className="text-[11px] font-mono uppercase text-amber-400 tracking-wider">
              Investigation Complete • Case Debriefing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('player-game')}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Review Case Board</span>
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto my-6 space-y-8 flex-1">
        {/* Banner Section (Prompt 40: INVESTIGATION COMPLETE) */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>CASE EVALUATION OFFICIAL</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-zinc-100 tracking-tight">
                INVESTIGATION COMPLETE
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Detective Dossier: <strong className="text-zinc-200">{currentUser?.name}</strong> (@{currentUser?.username})
              </p>
            </div>

            {/* Rank Badge */}
            {report?.rank && (
              <div className="flex items-center gap-3 bg-zinc-950 px-6 py-4 rounded-2xl border border-amber-500/40 shadow-inner">
                <div className="text-3xl">
                  {report.rank === 1 ? '🥇' : report.rank === 2 ? '🥈' : report.rank === 3 ? '🥉' : '🎖️'}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">FINAL RANKING</span>
                  <span className="text-2xl font-bold font-mono text-amber-400 tracking-wider">
                    RANK #{report.rank}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Row (Prompt 40: Confidential Score Guardrail) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500">INVESTIGATION STATUS</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-extrabold font-mono text-emerald-400">
                  CHARGE-SHEET FILED
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500">SCORE AUDIT STATUS</span>
              <div className="text-xs font-bold font-mono text-amber-400 mt-2">
                EVALUATED (ADMIN ONLY)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500">TIME RECORDED</span>
              <div className="text-base font-bold font-mono text-zinc-200 mt-2">
                {report?.timeTakenFormatted || 'Official Session'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500">CLUES DISCOVERED</span>
              <div className="text-base font-bold font-mono text-teal-400 mt-2">
                {report ? `${report.investigationSummary.criticalCluesFoundCount + report.investigationSummary.supportingCluesFoundCount} / ${report.investigationSummary.totalCriticalClues + report.investigationSummary.totalSupportingClues}` : 'Logged'}
              </div>
            </div>
          </div>

          {/* Confidential Admin-Only Score Notice */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-amber-300">
                Institutional Score Protection Active
              </span>
              <p className="text-zinc-300 text-[11px] mt-1 leading-relaxed">
                Your investigation dossier, reasoning articulation, and attached evidence have been automatically evaluated across multi-criteria scoring rubrics. To maintain strict evaluation integrity, all numerical scores and rankings are restricted and displayed exclusively on the Chief Administrator Console.
              </p>
            </div>
          </div>
        </div>

        {/* CASE RESOLUTION & OFFICIAL SOLUTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official Case Resolution */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <h3 className="font-serif font-bold text-base text-zinc-100 flex items-center justify-between">
              <span>OFFICIAL CASE RESOLUTION</span>
              <span className="text-xs font-mono text-emerald-400">Forensic Truth</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Prime Perpetrator:</span>
                <span className="text-sm font-bold text-emerald-400 font-serif">
                  Vicky (Varadarajan's Nephew)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">The Uncovered Motive:</span>
                <p className="text-zinc-300 leading-relaxed">
                  Facing ₹85 Lakh in bankruptcy debt, Vicky learned he was being cut from the property settlement deed in favor of Meena. He offered cook Perumal ₹10 Lakh in cash to flip the main electrical breaker at 9:42 PM to steal the deed from the study safe. In the blackout, an unexpected confrontation with Varadarajan turned violent.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Accomplice Role:</span>
                <p className="text-zinc-300 leading-relaxed">
                  Cook Perumal pulled the exterior breaker switch at 9:42 PM under promise of money for his daughter's wedding, unaware that Vicky planned a violent confrontation. Perumal restored power at 9:50 PM in terror.
                </p>
              </div>
            </div>
          </div>

          {/* Detective Submission Dossier Review */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <h3 className="font-serif font-bold text-base text-zinc-100">
              FILED INVESTIGATION DOSSIER
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Suspect Accused in Your Verdict:</span>
                <span className="text-sm font-bold text-zinc-100 capitalize">
                  {report?.evaluationExplanation.verdict || 'Vicky'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Deductive Appraisal:</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-0.5">
                  {report?.evaluationExplanation.summary || 'Your answers, clue correlations, and timing have been compiled into the Chief Administrator audit report.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-zinc-800">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Questions Logged</span>
                <span className="font-bold text-zinc-200">{report?.investigationSummary.questionsAsked || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Admin Grade State</span>
                <span className="font-bold text-emerald-400">Score Evaluated</span>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL LEADERBOARD (Prompt 36 & 40) */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-100">
                  🏆 THE HIDDEN MYSTERY — FINAL LEADERBOARD
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  Rankings finalized based on investigation quality, accuracy, and deductive reasoning.
                </span>
              </div>
            </div>

            {!isLeaderboardPublished && (
              <span className="px-3 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                ⏳ Final Rankings Pending Publication
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4 text-center">Score Evaluation</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Clues</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-zinc-500 font-mono">
                      Leaderboard will appear here once published by the coordinator.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => {
                    const isMe = currentUser?.id === entry.playerId;
                    return (
                      <tr
                        key={entry.playerId}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-amber-950/30 border-l-4 border-l-amber-400 font-semibold'
                            : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          {entry.rank === 1 && '🥇 1st'}
                          {entry.rank === 2 && '🥈 2nd'}
                          {entry.rank === 3 && '🥉 3rd'}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-100">{entry.playerName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 text-[9px] font-mono font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">@{entry.username}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px]">
                            Admin Confidential
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {entry.timeTakenFormatted}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-300">
                          {entry.cluesFoundCount} / {entry.totalCluesCount}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              entry.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
