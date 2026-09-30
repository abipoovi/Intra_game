import React from 'react';
import { Plane, AlertOctagon, RotateCcw, Clock } from 'lucide-react';
import { playClick } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onRestart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-2xl border-2 border-red-700 bg-zinc-950 p-6 md:p-8 shadow-[0_0_60px_rgba(239,68,68,0.5)] text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-red-950/90 border-2 border-red-600 flex items-center justify-center mx-auto text-red-400 shadow-xl">
          <Plane className="w-10 h-10 -rotate-45" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950 border border-red-800 text-red-400 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            30:00 INVESTIGATION WINDOW EXPIRED
          </div>
          {/* EXACT TEXT AS SPECIFIED IN MASTER PROMPT */}
          <h2 className="text-2xl md:text-3xl font-black text-red-500 tracking-tight font-serif uppercase">
            TIME EXPIRED! The culprit caught a flight from Chennai Airport and escaped!
          </h2>
        </div>

        <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2 text-left font-mono">
          <div className="flex justify-between border-b border-zinc-800 pb-1">
            <span className="text-zinc-500">Departed:</span>
            <span className="text-zinc-200">Chennai Int'l Airport (MAA)</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-1">
            <span className="text-zinc-500">Destination:</span>
            <span className="text-zinc-200">International Airspace (Non-Extradition)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">₹50 Crore Will:</span>
            <span className="text-red-400 font-bold">Unrecovered / Case Cold</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Inspector, you took longer than the allotted 30 minutes. You can restart the timer and conduct a fresh interrogation from the beginning!
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              playClick();
              onRestart();
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-zinc-950 font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART 30-MINUTE INVESTIGATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
