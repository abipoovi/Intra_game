import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useMystery } from '../context/MysteryContext';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, setCurrentView, error, setError, isLoading } = useMystery();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!username.trim()) {
      setLocalError('Please enter Admin Username');
      return;
    }
    if (!password.trim()) {
      setLocalError('Please enter Admin Password');
      return;
    }

    try {
      await loginAdmin(username.trim(), password.trim());
    } catch {
      // Error handled by context
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setLocalError(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative select-none">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
        <button
          onClick={() => {
            setError(null);
            setCurrentView('landing');
          }}
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO HOME</span>
        </button>

        <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80">
          CHIEF EVENT CONTROLLER
        </span>
      </div>

      {/* Login Card Form */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-700 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-zinc-100">ADMIN LOGIN</h2>
            <p className="text-xs text-zinc-400">
              Access the Event Control Center to manage event status, countdown timers, and player monitoring.
            </p>
          </div>

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono font-medium text-zinc-300 block mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-zinc-300 block mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
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
                className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>AUTHENTICATING...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>ADMIN LOGIN</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Demo Admin: admin / admin123</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-zinc-600 font-mono pb-2">
        Case Dossier System • Secured Admin Session
      </div>
    </div>
  );
};
