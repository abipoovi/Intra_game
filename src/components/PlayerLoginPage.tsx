import React, { useState } from 'react';
import { ArrowLeft, UserCheck, AlertCircle, Sparkles, Hash, User } from 'lucide-react';
import { useMystery } from '../context/MysteryContext';

export const PlayerLoginPage: React.FC = () => {
  const { loginPlayer, setCurrentView, error, setError, isLoading, accountDisabledNotice, clearAccountDisabledNotice } = useMystery();
  const [playerName, setPlayerName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);
    clearAccountDisabledNotice();

    if (!playerName.trim()) {
      setLocalError('Please enter your full Student / Player Name');
      return;
    }
    if (!registerNumber.trim()) {
      setLocalError('Please enter your Register Number / Roll No');
      return;
    }

    try {
      await loginPlayer(playerName.trim(), registerNumber.trim());
    } catch {
      // Error handled by context
    }
  };

  const handleSelectDemo = (name: string, regNo: string) => {
    setPlayerName(name);
    setRegisterNumber(regNo);
    setLocalError(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative select-none">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
        <button
          onClick={() => {
            setError(null);
            setCurrentView('landing');
          }}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO HOME</span>
        </button>

        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/80">
          INVESTIGATOR ENROLLMENT
        </span>
      </div>

      {/* Login Card Form */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl border border-emerald-500/30 bg-zinc-900/90 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <UserCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-zinc-100">STUDENT LOGIN</h2>
            <p className="text-xs text-zinc-400">
              Enter your Name and Register Number to enter the Case Investigation.
            </p>
          </div>

          {/* Account Disabled Banner */}
          {accountDisabledNotice && (
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs space-y-1 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-amber-400 font-mono">
                <span>🔒 ACCOUNT DISABLED</span>
              </div>
              <p className="leading-relaxed">Your account has been temporarily disabled by the event administrator.</p>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && !accountDisabledNotice && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Student / Player Name</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Abinaya M"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>Register Number / Roll No</span>
              </label>
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="e.g. 830123104008"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentView('landing');
                }}
                className="w-1/3 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>AUTHENTICATING...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>LOGIN</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts for College Evaluation */}
          <div className="pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
              <span className="font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Quick Fill Profiles:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo('Karthik Sundaram', '830123104001')}
                className="p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-zinc-200">Karthik</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">Reg: 830123104001</div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemo('Priya Sharma', '830123104002')}
                className="p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-zinc-200">Priya</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">Reg: 830123104002</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-zinc-600 font-mono pb-2">
        Case Dossier System • Student Register ID Authentication
      </div>
    </div>
  );
};
