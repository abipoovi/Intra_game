import React, { useState } from 'react';
import { Footprints, Flame, ZapOff, Search, ArrowRight, ShieldCheck, FileText, CheckCircle2, Eye } from 'lucide-react';
import { CLUES } from '../data/gameData';
import { Clue, ClueId, SuspectId } from '../types/game';
import { playClick } from '../utils/audio';

interface EvidenceLockerProps {
  inspectedClueIds: ClueId[];
  onMarkInspected: (clueId: ClueId) => void;
  onConfrontWithClue: (suspectId: SuspectId, clueTitle: string) => void;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({
  inspectedClueIds,
  onMarkInspected,
  onConfrontWithClue,
}) => {
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);

  const getClueIcon = (id: ClueId) => {
    switch (id) {
      case 'red_clay_footprints':
        return <Footprints className="w-6 h-6 text-red-400" />;
      case 'half_burned_letter':
        return <Flame className="w-6 h-6 text-amber-400" />;
      case 'pulled_eb_fuse':
        return <ZapOff className="w-6 h-6 text-yellow-400" />;
    }
  };

  const handleInspect = (clue: Clue) => {
    playClick();
    setSelectedClue(clue);
    onMarkInspected(clue.id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Evidence Locker Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              FORENSIC EVIDENCE VAULT
            </span>
            <span className="text-xs text-zinc-500">Chain of Custody Verified</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 font-serif">
            Evidence Locker — 3 Recovered Clues
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Carefully analyze all physical clues retrieved from the ECR seaside bungalow to construct the true motive and method.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Clues Inspected</div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {inspectedClueIds.length} / {CLUES.length}
            </div>
          </div>
        </div>
      </div>

      {/* Clues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CLUES.map((clue, index) => {
          const isInspected = inspectedClueIds.includes(clue.id);
          return (
            <div
              key={clue.id}
              className={`rounded-2xl border bg-zinc-900/70 p-6 flex flex-col justify-between transition-all relative overflow-hidden shadow-xl ${
                isInspected
                  ? 'border-zinc-700/80 hover:border-amber-500/60'
                  : 'border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              {/* Evidence Tag Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner">
                      {getClueIcon(clue.id)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                        EXHIBIT #{index + 1}
                      </span>
                      <h3 className="font-bold text-base text-zinc-100 font-serif">
                        {clue.title}
                      </h3>
                      <span className="text-[11px] text-amber-400 font-mono">
                        {clue.tamilTitle}
                      </span>
                    </div>
                  </div>

                  {isInspected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      ANALYZED
                    </span>
                  )}
                </div>

                {/* Short Description as requested */}
                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 mb-4 text-xs text-zinc-300 leading-relaxed font-sans">
                  "{clue.shortDesc}"
                </div>

                {/* Evidence Specs */}
                <div className="space-y-2 text-xs mb-6">
                  <div className="flex items-start justify-between gap-2 text-zinc-400 border-b border-zinc-800/60 pb-1.5">
                    <span className="text-zinc-500">Category:</span>
                    <span className="font-medium text-zinc-300 text-right">{clue.category}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-zinc-400 border-b border-zinc-800/60 pb-1.5">
                    <span className="text-zinc-500">Location:</span>
                    <span className="font-medium text-zinc-300 text-right">{clue.foundLocation}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-zinc-400">
                    <span className="text-zinc-500">Recovery Time:</span>
                    <span className="font-mono text-amber-400 text-right">{clue.timeLogged}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => handleInspect(clue)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Inspect Forensic Report</span>
                </button>

                {/* Quick Confrontation Dropdown / Actions */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => onConfrontWithClue('vicky', clue.title)}
                    className="py-1.5 px-1 rounded-lg bg-zinc-950 hover:bg-red-950/60 border border-zinc-800 hover:border-red-600/50 text-[11px] font-medium text-red-300 transition-colors cursor-pointer text-center"
                    title={`Confront Vicky with ${clue.title}`}
                  >
                    Confront Vicky
                  </button>
                  <button
                    onClick={() => onConfrontWithClue('divya', clue.title)}
                    className="py-1.5 px-1 rounded-lg bg-zinc-950 hover:bg-amber-950/60 border border-zinc-800 hover:border-amber-600/50 text-[11px] font-medium text-amber-300 transition-colors cursor-pointer text-center"
                    title={`Confront Divya with ${clue.title}`}
                  >
                    Confront Divya
                  </button>
                  <button
                    onClick={() => onConfrontWithClue('perumal', clue.title)}
                    className="py-1.5 px-1 rounded-lg bg-zinc-950 hover:bg-emerald-950/60 border border-zinc-800 hover:border-emerald-600/50 text-[11px] font-medium text-emerald-300 transition-colors cursor-pointer text-center"
                    title={`Confront Perumal with ${clue.title}`}
                  >
                    Confront Perumal
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Forensic Modal View */}
      {selectedClue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  {getClueIcon(selectedClue.id)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 font-serif">{selectedClue.title}</h2>
                  <p className="text-xs text-amber-400 font-mono">{selectedClue.tamilTitle}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClue(null)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer text-xs font-mono"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono block mb-1">
                  OFFICIAL EVIDENCE DESCRIPTION
                </span>
                <p className="text-sm text-zinc-200 bg-zinc-950 p-4 rounded-xl border border-zinc-800 leading-relaxed">
                  {selectedClue.fullDesc}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono block mb-1">
                  CRIME BRANCH FORENSIC ANALYSIS REPORT
                </span>
                <p className="text-xs text-zinc-300 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 leading-relaxed font-sans">
                  {selectedClue.forensicReport}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Recovery Location</span>
                  <span className="text-zinc-200 font-medium">{selectedClue.foundLocation}</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Timestamp</span>
                  <span className="text-amber-400 font-mono font-medium">{selectedClue.timeLogged}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-400">
                Confront suspects with this clue to break their alibis.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const clue = selectedClue;
                    setSelectedClue(null);
                    onConfrontWithClue('vicky', clue.title);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-700/60 text-xs font-semibold text-red-200 cursor-pointer"
                >
                  Confront Vicky →
                </button>
                <button
                  onClick={() => {
                    const clue = selectedClue;
                    setSelectedClue(null);
                    onConfrontWithClue('perumal', clue.title);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-xs font-semibold text-emerald-200 cursor-pointer"
                >
                  Confront Perumal →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
