import React from 'react';
import { AlertTriangle, RotateCcw, Search } from 'lucide-react';
import { playClick } from '../utils/audio';

interface WrongDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToEvidence: () => void;
}

export const WrongDeductionModal: React.FC<WrongDeductionModalProps> = ({
  isOpen,
  onClose,
  onGoToEvidence,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border-2 border-red-600 bg-zinc-950 p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.4)] text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase mb-1">
            CRIME BRANCH MAGISTRATE REJECTION
          </div>
          {/* EXACT TEXT AS SPECIFIED IN MASTER PROMPT */}
          <h2 className="text-2xl font-black text-red-500 tracking-tight font-serif">
            WRONG DEDUCTION! Re-examine the clues before time runs out!
          </h2>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/90 p-4 rounded-xl border border-zinc-800">
          The public prosecutor rejected the warrant. Either your identified culprit or your 2 chosen prosecution clues
          do not hold up in court! Re-interrogate the suspects and check their boot treads and electrical sabotage.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Review Accusation
          </button>
          <button
            onClick={() => {
              playClick();
              onGoToEvidence();
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Check Evidence Locker
          </button>
        </div>
      </div>
    </div>
  );
};
