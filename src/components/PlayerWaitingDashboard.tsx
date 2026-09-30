import React from 'react';
import { Lock, Play, Pause, AlertOctagon, User, LogOut, Shield, Users, Clock, FileText, ChevronRight, CheckCircle2, Award } from 'lucide-react';
import { useMystery } from '../context/MysteryContext';

export const PlayerWaitingDashboard: React.FC = () => {
  const { currentUser, eventState, baseline, suspects, setCurrentView, logout } = useMystery();

  const status = eventState?.status || 'NOT_STARTED';

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-zinc-100">{baseline.title}</h1>
            <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider">
              Player Briefing Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400 font-normal">Logged as:</span>
            <span className="text-zinc-200 font-bold">{currentUser?.name}</span>
            <span className="text-[10px] text-zinc-500">({currentUser?.username})</span>
          </div>

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
      <main className="max-w-4xl w-full mx-auto my-6 space-y-6">
        {/* Welcome & Real-Time Event Status Banner */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block mb-1">
                CONFIDENTIAL DOSSIER
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-zinc-100">
                Welcome, {currentUser?.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your credentials have been authenticated for the campus detective challenge.
              </p>
            </div>

            {/* Live Clock if active */}
            {eventState && eventState.timeRemaining > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 self-start sm:self-auto font-mono">
                <Clock className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">EVENT TIMER</div>
                  <div className="text-lg font-bold text-zinc-200">
                    {formatTime(eventState.timeRemaining)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Event Status Box as required by prompt */}
          <div className="pt-2">
            {status === 'NOT_STARTED' && (
              <div className="rounded-xl border-2 border-amber-500/40 bg-amber-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                        EVENT STATUS: EVENT NOT STARTED
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                      🔒 INVESTIGATION LOCKED
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      "The investigation will begin when the administrator starts the event." Please wait for the administrator to start the event.
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 font-mono text-center shrink-0">
                  Awaiting Admin Broadcast
                </div>
              </div>
            )}

            {status === 'LIVE' && (
              <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                        EVENT STATUS: EVENT LIVE
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                      🟢 INVESTIGATION LIVE
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      "The investigation has started. You may begin investigating." All suspect chambers and evidence logs are now open!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentView('player-game')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>START INVESTIGATION</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {status === 'PAUSED' && (
              <div className="rounded-xl border-2 border-amber-500/60 bg-amber-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                    <Pause className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                        EVENT STATUS: EVENT PAUSED
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                      🟠 INVESTIGATION PAUSED
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      "The investigation is temporarily paused by the administrator." Your existing progress and discovered clues are preserved.
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-amber-400 font-mono text-center shrink-0">
                  Stand By
                </div>
              </div>
            )}

            {status === 'ENDED' && (
              <div className="rounded-xl border-2 border-red-500/50 bg-red-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                        EVENT STATUS: EVENT ENDED
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 font-serif mt-0.5">
                      🔴 INVESTIGATION ENDED
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      "The investigation has ended." Time has expired or the administrator has officially concluded the session.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setCurrentView('player-results')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>VIEW RESULTS & LEADERBOARD</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('player-game')}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Review Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CASE FILE BASELINE (Prompt Section 3 Requirement) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="font-serif font-bold text-lg text-zinc-100">
                CASE FILE: {baseline.title}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">{baseline.caseId}</span>
          </div>

          {/* Baseline Introduction Paragraph */}
          <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800/80 leading-relaxed text-sm text-zinc-200 font-sans space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase text-emerald-400">
              OFFICIAL INCIDENT SYNOPSIS
            </div>
            <p className="text-zinc-300 whitespace-pre-line">
              {baseline.synopsis}
            </p>
          </div>

          {/* Known Characters / Suspects Baseline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                AVAILABLE SUSPECTS AT THE PROPERTY
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {status === 'LIVE' ? 'Available for interrogation' : 'Interrogation currently locked'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suspects.map((suspect) => (
                <div
                  key={suspect.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={suspect.avatar}
                      alt={suspect.name}
                      className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-sm text-zinc-100">{suspect.name}</h4>
                      <span className="text-xs text-emerald-400 font-medium block">{suspect.role}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-normal line-clamp-3">
                    {suspect.baselineInfo}
                  </p>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Age: {suspect.age}</span>
                    <span>{status === 'LIVE' ? 'Ready' : 'Locked'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules / Guidance for Students */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-zinc-200">Investigation Protocol: </strong>
              When the event goes live, interrogate suspects one-on-one. Suspects will not volunteer secrets easily.
              Cross-examine inconsistencies between their statements to discover hidden clues.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-zinc-600 font-mono pt-4 border-t border-zinc-800/60">
        Forensic Science Deduction Portal • Student Dashboard
      </footer>
    </div>
  );
};
