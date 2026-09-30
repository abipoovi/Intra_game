import React from 'react';
import { Shield, UserCheck, Lock, Search, FileText, Compass, Award, Clock } from 'lucide-react';
import { useMystery } from '../context/MysteryContext';

export const LandingPage: React.FC = () => {
  const { setCurrentView, eventState, accountDisabledNotice, clearAccountDisabledNotice } = useMystery();

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-wider text-zinc-100 block">
              THE HIDDEN MYSTERY
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
              Department of Forensic Deduction
            </span>
          </div>
        </div>

        {/* Global Live Event Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                eventState?.status === 'LIVE'
                  ? 'bg-emerald-400 animate-pulse'
                  : eventState?.status === 'PAUSED'
                  ? 'bg-amber-400'
                  : eventState?.status === 'ENDED'
                  ? 'bg-red-400'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="text-zinc-400 font-medium">EVENT STATUS:</span>
            <span
              className={`font-bold ${
                eventState?.status === 'LIVE'
                  ? 'text-emerald-400'
                  : eventState?.status === 'PAUSED'
                  ? 'text-amber-400'
                  : eventState?.status === 'ENDED'
                  ? 'text-red-400'
                  : 'text-zinc-400'
              }`}
            >
              {eventState?.status || 'NOT_STARTED'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Login Selection */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Account Disabled Alert Banner */}
        {accountDisabledNotice && (
          <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-amber-950/90 border border-amber-500/70 text-amber-200 text-xs flex items-start justify-between gap-3 text-left shadow-2xl animate-in fade-in">
            <div>
              <div className="font-bold flex items-center gap-1.5 text-amber-400 font-mono text-sm">
                <span>🔒 ACCOUNT DISABLED</span>
              </div>
              <p className="mt-1 leading-relaxed text-zinc-300">
                Your account has been temporarily disabled by the event administrator.
              </p>
            </div>
            <button
              onClick={clearAccountDisabledNotice}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-6 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>College Forensic Deduction Challenge • Case File #2026-VR</span>
        </div>

        {/* Main Title & Subtitle */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-serif text-zinc-100 mb-4 drop-shadow-md">
          THE HIDDEN MYSTERY
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-emerald-400/90 font-serif italic max-w-2xl mb-4">
          "At 9:42 PM, the lights went out. At 9:50 PM, everything changed."
        </p>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed mb-12">
          Step into a high-stakes murder investigation. Interrogate suspects driven by advanced multi-stage conversational AI,
          analyze forensic clues, reconstruct the timeline, and uncover the truth behind what happened in Varadarajan's ancestral house.
        </p>

        {/* Two Login Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          {/* PLAYER LOGIN CARD */}
          <div className="group relative rounded-2xl border border-emerald-500/30 bg-zinc-900/80 backdrop-blur-md p-6 sm:p-8 hover:border-emerald-400/70 transition-all duration-300 shadow-xl flex flex-col justify-between hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  INVESTIGATOR ACCESS
                </span>
                <h3 className="text-xl font-bold text-zinc-100 font-serif mt-1">PLAYER LOGIN</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Join the investigation queue as a student detective. Review case files, wait for the event broadcast, and interrogate suspects.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('player-login')}
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>Enter as Player</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* ADMIN LOGIN CARD */}
          <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 hover:border-amber-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                  EVENT COORDINATOR
                </span>
                <h3 className="text-xl font-bold text-zinc-100 font-serif mt-1">ADMIN LOGIN</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Administrator control console. Manage event states (Start, Pause, Resume, End), configure countdown timers, and monitor live student progress.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('admin-login')}
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 hover:text-amber-300 font-semibold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Admin Login</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-16 pt-8 border-t border-zinc-800/60 text-left">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-200">AI Suspect Bots</h4>
              <p className="text-[11px] text-zinc-500">Autonomous conversational interrogation</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-200">Real-Time Clock</h4>
              <p className="text-[11px] text-zinc-500">Synchronized central event timer</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-200">Evidence Locker</h4>
              <p className="text-[11px] text-zinc-500">Dynamic clue board & timeline</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-200">Admin Live Control</h4>
              <p className="text-[11px] text-zinc-500">Instant multi-device broadcast</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs text-zinc-500 font-mono border-t border-zinc-800/60">
        <p>THE HIDDEN MYSTERY • All-India Forensic AI Competition System • Nilgiris Case Division</p>
      </footer>
    </div>
  );
};
