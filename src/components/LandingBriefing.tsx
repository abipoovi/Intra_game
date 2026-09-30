import React from 'react';
import { Play, ShieldAlert, Clock, MapPin, Zap, UserCheck, Search, FileQuestion, Flame, Footprints, ZapOff } from 'lucide-react';
import { BRIEFING_DATA, SUSPECTS } from '../data/gameData';
import { playClick, playThunder } from '../utils/audio';

interface LandingBriefingProps {
  onStartInvestigation: () => void;
  onOpenSuspect: (suspectId: 'vicky' | 'divya' | 'perumal') => void;
  onOpenEvidence: () => void;
  hasStarted: boolean;
}

export const LandingBriefing: React.FC<LandingBriefingProps> = ({
  onStartInvestigation,
  onOpenSuspect,
  onOpenEvidence,
  hasStarted,
}) => {
  const handleStart = () => {
    playThunder();
    playClick();
    onStartInvestigation();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Dossier Banner */}
      <div className="relative rounded-2xl border border-amber-600/30 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 md:p-10 shadow-2xl overflow-hidden">
        {/* Ambient atmospheric background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          {/* Top metadata tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-700/50 text-red-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              CONFIDENTIAL INVESTIGATION DOSSIER
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-400">
              {BRIEFING_DATA.caseNumber}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-amber-950/40 border border-amber-800/40 text-amber-300 font-mono">
              30-MIN URGENCY WINDOW
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-100 font-serif mb-2">
            {BRIEFING_DATA.title}
          </h1>
          <p className="text-lg md:text-xl text-amber-400 font-medium mb-6 flex items-center gap-2">
            <span>{BRIEFING_DATA.tamilTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-sans">
              Tamil Cinema Crime Thriller
            </span>
          </p>

          {/* Core Briefing Text Box verbatim from prompt */}
          <div className="relative p-5 md:p-6 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-inner mb-8">
            <div className="absolute top-2 right-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              POLICE DISPATCH • 11:30 PM
            </div>
            <p className="text-base md:text-lg text-zinc-200 leading-relaxed font-sans font-normal border-l-4 border-amber-500 pl-4 py-1">
              "{BRIEFING_DATA.briefingText}"
            </p>
          </div>

          {/* Case Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-800/80 text-amber-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Crime Scene</div>
                <div className="text-sm font-semibold text-zinc-200">Seaside Bungalow, ECR Chennai</div>
                <div className="text-[11px] text-zinc-500">East Coast Road, Beachfront Villa</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-800/80 text-red-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Blackout Time</div>
                <div className="text-sm font-semibold text-zinc-200">11:15 PM Storm Outage</div>
                <div className="text-[11px] text-zinc-500">CCTV Disabled for 5 Minutes</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-800/80 text-emerald-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estate Value</div>
                <div className="text-sm font-semibold text-zinc-200">₹50,00,00,000 (Fifty Crores)</div>
                <div className="text-[11px] text-zinc-500">Missing Unsigned Will Document</div>
              </div>
            </div>
          </div>

          {/* PROMINENT START BUTTON */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-extrabold text-base md:text-lg tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Play className="w-6 h-6 fill-current text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
              <span>{hasStarted ? 'CONTINUE 30-MINUTE INVESTIGATION' : 'START 30-MINUTE INVESTIGATION'}</span>
            </button>

            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Live countdown begins immediately. Culprit escapes at 00:00.
            </span>
          </div>
        </div>
      </div>

      {/* Case Timeline / Chronology Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-serif">
              <span>Incident Timeline</span>
              <span className="text-xs font-sans font-normal px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Night of the Storm
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Chronological sequence of verified events at the ECR bungalow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 relative">
            <div className="text-xs font-mono font-bold text-amber-400 mb-1">09:00 — 09:30 PM</div>
            <div className="font-semibold text-sm text-zinc-200 mb-1">Heated Argument & Draft</div>
            <p className="text-xs text-zinc-400">
              Divya had an argument with Varadarajan regarding her marriage. A letter was torn and thrown into the hearth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 relative">
            <div className="text-xs font-mono font-bold text-blue-400 mb-1">11:00 PM</div>
            <div className="font-semibold text-sm text-zinc-200 mb-1">The Urgent Phone Call</div>
            <p className="text-xs text-zinc-400">
              Varadarajan called his lawyer, formally declaring he was bequeathing all ₹50 Crore assets strictly to Divya.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-red-800/50 bg-red-950/10 relative">
            <div className="text-xs font-mono font-bold text-red-400 mb-1">11:15 PM</div>
            <div className="font-semibold text-sm text-red-200 mb-1">Blackout & Sabotage</div>
            <p className="text-xs text-zinc-400">
              Outdoor EB Main Fuse switch forcibly pulled down. All lights extinguished and CCTV network cut off.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-amber-800/50 bg-amber-950/10 relative">
            <div className="text-xs font-mono font-bold text-amber-400 mb-1">11:20 PM</div>
            <div className="font-semibold text-sm text-amber-200 mb-1">Vanished from Locked Room</div>
            <p className="text-xs text-zinc-400">
              Master bedroom door found bolted from inside; Varadarajan and the unsigned will document are gone!
            </p>
          </div>
        </div>
      </div>

      {/* Suspects at the Bungalow Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-serif">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Suspects Under Interrogation</span>
            </h2>
            <p className="text-xs text-zinc-400">All 3 persons present inside the bungalow when the power was cut</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Vicky Card */}
          <div
            onClick={() => onOpenSuspect('vicky')}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-red-500/60 hover:bg-zinc-900 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={SUSPECTS.vicky.portrait}
                alt="Vicky"
                className="w-16 h-16 rounded-xl object-cover border-2 border-red-500/40 group-hover:border-red-400 transition-colors shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-red-300 transition-colors font-serif">
                    {SUSPECTS.vicky.name}
                  </h3>
                  <span className="text-xs text-red-400 font-mono">({SUSPECTS.vicky.tamilName})</span>
                </div>
                <div className="text-xs text-red-400 font-medium">The Nephew — Arrogant & Loud</div>
                <div className="text-[11px] text-zinc-500">Age: 28 • Heavy debts</div>
              </div>
            </div>
            <div className="text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/80 mb-3 italic">
              "{SUSPECTS.vicky.officialAlibi}"
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-400 font-medium pt-1">
              <span>Question Vicky</span>
              <span>→</span>
            </div>
          </div>

          {/* Divya Card */}
          <div
            onClick={() => onOpenSuspect('divya')}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-amber-500/60 hover:bg-zinc-900 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={SUSPECTS.divya.portrait}
                alt="Divya"
                className="w-16 h-16 rounded-xl object-cover border-2 border-amber-500/40 group-hover:border-amber-400 transition-colors shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-amber-300 transition-colors font-serif">
                    {SUSPECTS.divya.name}
                  </h3>
                  <span className="text-xs text-amber-400 font-mono">({SUSPECTS.divya.tamilName})</span>
                </div>
                <div className="text-xs text-amber-400 font-medium">The Daughter — Emotional & Innocent</div>
                <div className="text-[11px] text-zinc-500">Age: 24 • Sole Beneficiary</div>
              </div>
            </div>
            <div className="text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/80 mb-3 italic">
              "{SUSPECTS.divya.officialAlibi}"
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-400 font-medium pt-1">
              <span>Question Divya</span>
              <span>→</span>
            </div>
          </div>

          {/* Perumal Card */}
          <div
            onClick={() => onOpenSuspect('perumal')}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={SUSPECTS.perumal.portrait}
                alt="Perumal"
                className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500/40 group-hover:border-emerald-400 transition-colors shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-emerald-300 transition-colors font-serif">
                    {SUSPECTS.perumal.name}
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono">({SUSPECTS.perumal.tamilName})</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium">The Cook — Scared Servant</div>
                <div className="text-[11px] text-zinc-500">Age: 58 • 22 Years with Family</div>
              </div>
            </div>
            <div className="text-xs text-zinc-300 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/80 mb-3 italic">
              "{SUSPECTS.perumal.officialAlibi}"
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-amber-400 font-medium pt-1">
              <span>Question Perumal</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Locker Teaser */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 font-serif">
              <Search className="w-5 h-5 text-amber-400" />
              <span>Evidence Locker (3 Recovered Clues)</span>
            </h2>
            <p className="text-xs text-zinc-400">Physical evidence secured by Crime Branch forensics</p>
          </div>
          <button
            onClick={onOpenEvidence}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold tracking-wide border border-zinc-700 transition-colors self-start md:self-auto cursor-pointer"
          >
            Open Evidence Locker →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={onOpenEvidence}
            className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-red-950/50 text-red-400 border border-red-800/30">
                <Footprints className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-amber-300">
                Clue #1: Red Clay Footprints
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Fresh red mud footprints found directly under Varadarajan's bedroom window (Red clay is only found in the ECR garden bed).
            </p>
          </div>

          <div
            onClick={onOpenEvidence}
            className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-amber-950/50 text-amber-400 border border-amber-800/30">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-amber-300">
                Clue #2: Half-Burned Letter
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              A torn paper scrap found in the fireplace reading "...cutting you out of the property...".
            </p>
          </div>

          <div
            onClick={onOpenEvidence}
            className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-yellow-950/50 text-yellow-400 border border-yellow-800/30">
                <ZapOff className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-zinc-200 group-hover:text-amber-300">
                Clue #3: Pulled EB Main Fuse
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              The main electricity switch outside in the store room was manually pulled down at 11:15 PM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
