import React from 'react';
import { Clock, ShieldAlert, Volume2, VolumeX, CloudRain, RotateCcw, Award } from 'lucide-react';
import { TabType } from '../types/game';

interface TopBarProps {
  timeRemaining: number; // in seconds
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  rainEnabled: boolean;
  setRainEnabled: (enabled: boolean) => void;
  onReset: () => void;
  cluesInspectedCount: number;
  hasSolved: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  timeRemaining,
  activeTab,
  setActiveTab,
  isMuted,
  setIsMuted,
  rainEnabled,
  setRainEnabled,
  onReset,
  cluesInspectedCount,
  hasSolved,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = timeRemaining <= 300 && timeRemaining > 0;
  const isCritical = timeRemaining <= 60 && timeRemaining > 0;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Case Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('briefing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-zinc-100 group-hover:text-amber-300 transition-colors font-serif">
                  The ₹50 Crore Will
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  தி 50 கோடி உயில்
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 tracking-tight">
                TN Police Crime Branch • ECR Bungalow Case
              </p>
            </div>
          </button>
        </div>

        {/* Center: Live 30-Minute Countdown Clock */}
        <div className="flex items-center gap-3 order-last sm:order-none mx-auto sm:mx-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-base transition-all ${
              hasSolved
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : isCritical
                ? 'bg-red-950/70 border-red-500/80 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                : isUrgent
                ? 'bg-orange-950/50 border-orange-500/60 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.25)]'
                : 'bg-zinc-900/90 border-zinc-700/70 text-amber-300'
            }`}
          >
            <Clock className={`w-4 h-4 ${isUrgent && !hasSolved ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
            <span>[ {hasSolved ? 'SOLVED' : formattedTime} ]</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-sans hidden md:inline ml-1 font-semibold">
              {hasSolved ? 'Case Closed' : 'Countdown to Airport Escape'}
            </span>
          </div>

          {/* Quick Clue Counter */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="text-zinc-500">Evidence:</span>
            <span className="font-semibold text-amber-400">{cluesInspectedCount}/3</span>
          </div>
        </div>

        {/* Right: Audio toggles & Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Rain ambience toggle */}
          <button
            onClick={() => setRainEnabled(!rainEnabled)}
            title={rainEnabled ? 'Mute ECR Storm Ambience' : 'Play ECR Storm Rain Ambience'}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              rainEnabled
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            <span className="text-[11px] hidden md:inline">ECR Rain</span>
          </button>

          {/* Sound FX Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className={`p-2 rounded-lg border transition-colors ${
              !isMuted
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Investigation */}
          <button
            onClick={onReset}
            title="Restart 30-Minute Investigation"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-800/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Case Resolution quick button */}
          <button
            onClick={() => setActiveTab('resolution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
              activeTab === 'resolution'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Submit Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
