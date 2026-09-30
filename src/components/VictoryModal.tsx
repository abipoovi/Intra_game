import React from 'react';
import { Award, CheckCircle, RotateCcw, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { WINNING_BACKSTORY } from '../data/gameData';
import { playClick } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeRemaining,
  onRestart,
}) => {
  if (!isOpen) return null;

  const totalTimeSeconds = 30 * 60;
  const timeTakenSeconds = Math.max(0, totalTimeSeconds - timeRemaining);
  const minutesTaken = Math.floor(timeTakenSeconds / 60);
  const secondsTaken = timeTakenSeconds % 60;
  const formattedTimeTaken = `${minutesTaken}m ${secondsTaken}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-2xl rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-6 md:p-10 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center space-y-6 my-auto">
        {/* Victory Badge */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <Award className="w-12 h-12" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-zinc-950 uppercase tracking-widest shadow-md">
            MASTER DETECTIVE
          </span>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <CheckCircle className="w-4 h-4" />
            TAMIL NADU POLICE • CRIME BRANCH COMMENDATION
          </div>
          {/* EXACT TEXT AS SPECIFIED IN MASTER PROMPT */}
          <h2 className="text-3xl md:text-5xl font-black text-amber-400 tracking-tight font-serif">
            CASE SOLVED! 🎉
          </h2>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Time Taken</div>
            <div className="text-sm font-bold text-amber-300 font-mono">{formattedTimeTaken}</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Varadarajan</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">RESCUED</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Estate Value</div>
            <div className="text-sm font-bold text-amber-300 font-mono">₹50 CRORE</div>
          </div>
        </div>

        {/* THE BACKSTORY: VERBATIM AS IN MASTER PROMPT */}
        <div className="text-left bg-zinc-950 p-6 rounded-2xl border border-amber-500/40 shadow-inner space-y-4 font-sans">
          <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>THE OFFICIAL BACKSTORY & CONFESSION</span>
          </div>

          <div className="space-y-3 text-sm md:text-base text-zinc-200 leading-relaxed font-normal">
            <p>
              <strong className="text-amber-300 font-serif">Vicky</strong> was drowning in heavy race-course debts and found out his uncle Varadarajan was cutting him out of the ₹50 Crore property will!
            </p>
            <p>
              Vicky bribed the old cook <strong className="text-emerald-300 font-serif">Perumal</strong> with <span className="text-amber-400 font-semibold">₹10 Lakhs</span> to pull down the outdoor EB Main Fuse at 11:15 PM, plunging the ECR bungalow into total darkness and cutting off the CCTV.
            </p>
            <p>
              During those 5 minutes of darkness, Vicky stepped through the garden mud with his boots, opened the bedroom window, stole the signed will paper, and locked Varadarajan in the back storeroom!
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-semibold text-sm">
              You caught them red-handed using the <span className="underline decoration-amber-400">Red Clay Footprints</span> and the <span className="underline decoration-amber-400">Pulled EB Fuse</span>!
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              playClick();
              onRestart();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN / REPLAY MYSTERY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
