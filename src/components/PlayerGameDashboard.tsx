import React, { useState, useEffect } from 'react';
import {
  Shield, User, Clock, MessageSquare, Search, FileText, Calendar, Award,
  Lock, Pause, AlertOctagon, CheckCircle2, Send, Save, Eye, ArrowLeft, RefreshCw, Sparkles, ChevronRight
} from 'lucide-react';
import { useMystery } from '../context/MysteryContext';
import { Suspect } from '../types/mystery';
import { SuspectChatModal } from './SuspectChatModal';

export const PlayerGameDashboard: React.FC = () => {
  const {
    currentUser,
    eventState,
    playerProgress,
    baseline,
    suspects,
    allClues,
    timeline,
    setCurrentView,
    saveNotes,
    submitAccusation,
  } = useMystery();

  const [activeTab, setActiveTab] = useState<'suspects' | 'clues' | 'timeline' | 'notes' | 'accusation'>('suspects');
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);

  // Notes state
  const [notesContent, setNotesContent] = useState(playerProgress?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveMessage, setNotesSaveMessage] = useState<string | null>(null);

  // Accusation Form state
  const [accusedSuspect, setAccusedSuspect] = useState(playerProgress?.accusation?.suspect || '');
  const [accusedMotive, setAccusedMotive] = useState(playerProgress?.accusation?.motive || '');
  const [accusedEvidence, setAccusedEvidence] = useState<string[]>(playerProgress?.accusation?.evidence || []);
  const [isSubmittingAccusation, setIsSubmittingAccusation] = useState(false);
  const [accusationSuccess, setAccusationSuccess] = useState(false);
  const [accusationError, setAccusationError] = useState<string | null>(null);

  const status = eventState?.status || 'NOT_STARTED';
  const isLive = status === 'LIVE';
  const isPaused = status === 'PAUSED';
  const isEnded = status === 'ENDED';

  // Format countdown clock
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sync notes when player progress loads
  useEffect(() => {
    if (playerProgress?.notes !== undefined) {
      setNotesContent(playerProgress.notes);
    }
  }, [playerProgress?.notes]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await saveNotes(notesContent);
      setNotesSaveMessage('Notes auto-saved to case file');
      setTimeout(() => setNotesSaveMessage(null), 3000);
    } catch {
      setNotesSaveMessage('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleEvidence = (clueTitle: string) => {
    if (accusedEvidence.includes(clueTitle)) {
      setAccusedEvidence(accusedEvidence.filter((c) => c !== clueTitle));
    } else {
      setAccusedEvidence([...accusedEvidence, clueTitle]);
    }
  };

  const handleSubmitAccusation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccusationError(null);

    if (!accusedSuspect) {
      setAccusationError('Please select the prime suspect responsible.');
      return;
    }
    if (!accusedMotive.trim()) {
      setAccusationError('Please articulate what happened and the hidden motive.');
      return;
    }
    if (accusedEvidence.length === 0) {
      setAccusationError('Please attach at least one piece of discovered evidence.');
      return;
    }

    setIsSubmittingAccusation(true);
    try {
      await submitAccusation({
        suspect: accusedSuspect,
        motive: accusedMotive,
        evidence: accusedEvidence,
      });
      setAccusationSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setAccusationError(msg);
    } finally {
      setIsSubmittingAccusation(false);
    }
  };

  const discoveredCluesList = allClues.filter((clue) =>
    playerProgress?.cluesFound.includes(clue.id)
  );

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between select-none">
      {/* CASE INFORMATION TOP BAR (Prompt Section 5 Requirement) */}
      <header className="sticky top-0 z-40 bg-[#0e131a]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Case & Missing Person info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('player-waiting')}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Return to Waiting Briefing"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm tracking-wide text-zinc-100">
                  {baseline.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Missing: {baseline.missingPerson.split('(')[0].trim()}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Student Investigator: <span className="text-zinc-200 font-medium">{currentUser?.name}</span> ({currentUser?.username})
              </p>
            </div>
          </div>

          {/* Center: Live Status & Countdown Timer */}
          <div className="flex items-center gap-3 order-last sm:order-none mx-auto sm:mx-0">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
                isLive
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : isPaused
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>⏱ {formatTime(eventState?.timeRemaining || 0)}</span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400 hidden md:inline ml-1">
                {status === 'LIVE' ? 'LIVE' : status}
              </span>
            </div>

            {/* Progress Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-400">Progress:</span>
              <span className="font-bold text-emerald-400">
                {playerProgress?.progressPercentage || 0}%
              </span>
            </div>
          </div>

          {/* Right: Quick Action Button */}
          <div className="flex items-center gap-2">
            {isEnded && (
              <button
                onClick={() => setCurrentView('player-results')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wide transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Case Debrief</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('accusation')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'accusation'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-mono'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-mono'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{playerProgress?.accusation ? 'Dossier Submitted' : 'End & Submit Verdict'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* EVENT ENDED BANNER (Prompt 21, 32, 40) */}
      {isEnded && (
        <div className="bg-red-950/90 border-b border-red-500/50 px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold uppercase text-red-300">
                  INVESTIGATION OFFICIALLY CONCLUDED
                </span>
                <p className="text-[11px] text-zinc-300">
                  The event has ended. All player dossiers are recorded for administrator evaluation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('player-results')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>VIEW CASE RESOLUTION →</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-800/80">
          <button
            onClick={() => setActiveTab('suspects')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'suspects'
                ? 'bg-emerald-600 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Suspects Interrogation ({suspects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clues')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'clues'
                ? 'bg-emerald-600 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Clue Board ({discoveredCluesList.length}/{allClues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-emerald-600 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'notes'
                ? 'bg-emerald-600 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Detective Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('accusation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'accusation'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                : 'text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Submit Accusation</span>
          </button>
        </div>

        {/* Global Pause Overlay if event paused */}
        {isPaused && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border-2 border-amber-500/60 text-amber-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              <Pause className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold font-serif">INVESTIGATION PAUSED</h4>
                <p className="text-xs text-zinc-300">
                  "The investigation is temporarily paused by the administrator." Actions are locked. Your notes and clues remain safe.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 shrink-0">
              STAND BY
            </span>
          </div>
        )}

        {/* Global End Overlay if event ended */}
        {isEnded && (
          <div className="p-4 rounded-2xl bg-red-950/60 border-2 border-red-500/60 text-red-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold font-serif">THE INVESTIGATION HAS ENDED</h4>
                <p className="text-xs text-zinc-300">
                  The event countdown reached zero or the administrator closed the session. Review your submitted report or timeline below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: SUSPECTS INTERROGATION (Prompt Section 5 Requirement)  */}
        {/* ============================================================== */}
        {activeTab === 'suspects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-100">
                  Suspect Chambers & Cross-Examination
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Interrogate each suspect one-on-one. Uncover inconsistencies to discover hidden documentary and physical clues.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {suspects.map((suspect) => {
                const hasInterrogated = playerProgress?.suspectsInvestigated.includes(suspect.id);
                return (
                  <div
                    key={suspect.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl group"
                  >
                    <div className="space-y-4">
                      {/* Avatar & Role Header */}
                      <div className="flex items-center gap-4">
                        <img
                          src={suspect.avatar}
                          alt={suspect.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-700 group-hover:border-emerald-500/50 transition-colors shadow-md shrink-0"
                        />
                        <div>
                          <h3 className="font-serif font-bold text-lg text-zinc-100 group-hover:text-emerald-300 transition-colors">
                            {suspect.name}
                          </h3>
                          <span className="text-xs font-mono uppercase text-emerald-400 block font-semibold">
                            {suspect.role}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Age: {suspect.age} • {suspect.relation}
                          </span>
                        </div>
                      </div>

                      {/* Demeanor */}
                      <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                          OBSERVED DEMEANOR:
                        </span>
                        {suspect.demeanor}
                      </div>

                      {/* Baseline Known Info */}
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {suspect.baselineInfo}
                      </p>
                    </div>

                    {/* Action Button: START CONVERSATION */}
                    <div className="pt-6 border-t border-zinc-800/80 mt-4 flex items-center justify-between">
                      {hasInterrogated ? (
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Interrogated
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500">Unexamined</span>
                      )}

                      <button
                        onClick={() => setSelectedSuspect(suspect)}
                        disabled={!isLive}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>START CONVERSATION</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CLUE BOARD (Prompt Section 6 Requirement)              */}
        {/* ============================================================== */}
        {activeTab === 'clues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-100">Evidence & Clue Board</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Physical artifacts, documentary shreds, and forensic findings discovered through sharp interrogation.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
                Discovered: <span className="font-bold text-emerald-400">{discoveredCluesList.length}</span> / {allClues.length}
              </div>
            </div>

            {discoveredCluesList.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3">
                <Search className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="font-serif font-bold text-base text-zinc-300">No Clues Discovered Yet</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Begin questioning Arjun, Meena, and Kamatchi. Inquire into arguments, the missing vehicle keys, the open safe, or the veranda footprints to unlock evidence!
                </p>
                <button
                  onClick={() => setActiveTab('suspects')}
                  className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-mono transition-colors cursor-pointer"
                >
                  Interrogate Suspects Now →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredCluesList.map((clue, idx) => (
                  <div
                    key={clue.id}
                    className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-5 space-y-3 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold uppercase">
                          CLUE #{idx + 1}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">{clue.category}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Source: {clue.suspectSource.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-zinc-100">{clue.title}</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                      {clue.description}
                    </p>

                    <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                      <span>Found: {clue.foundAt}</span>
                      <span className="text-emerald-400 font-semibold">VERIFIED</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TIMELINE (Prompt Section 6 Requirement)                */}
        {/* ============================================================== */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-zinc-100">Case Chronology & Timeline of the Night</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verified reconstruction of the evening's movements leading up to the 9:42 PM blackout and crime discovery at 9:50 PM.
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-zinc-800">
              {timeline.map((item, idx) => (
                <div key={item.id} className="relative flex items-start gap-4 pl-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-950 border-2 border-emerald-500 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0 z-10">
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">{item.time}</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.source}</span>
                    </div>
                    <h3 className="font-serif font-bold text-sm text-zinc-200">{item.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: DETECTIVE NOTES (Prompt Section 6 Requirement)          */}
        {/* ============================================================== */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-zinc-100">Investigator Notepad</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Record your observations, suspect contradictions, and working hypotheses. Auto-saves to your dossier.
                </p>
              </div>

              {notesSaveMessage && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800/40 animate-in fade-in">
                  ✓ {notesSaveMessage}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 shadow-xl">
              <textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Type your notes here... (e.g., The main electrical breaker was tripped at 9:42 PM on the exterior panel. Cook Perumal was seen near the panel at 9:40 PM. Vicky arrived at 9:30 PM with heavy creditor notices...)"
                rows={12}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500 font-mono">
                  {notesContent.length} characters logged
                </span>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingNotes ? 'SAVING...' : 'SAVE NOTES'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ACCUSATION SUBMISSION (Prompt Section 6 Requirement)     */}
        {/* ============================================================== */}
        {activeTab === 'accusation' && (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-zinc-100">Final Case Accusation</h2>
              <p className="text-xs text-zinc-400 mt-1">
                When you have gathered sufficient clues and resolved contradictions, file your official charge-sheet.
              </p>
            </div>

            {playerProgress?.accusation ? (
              <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/20 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>CHARGE-SHEET OFFICIALLY SUBMITTED</span>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Your investigation charge-sheet and evidence have been locked and submitted. Multi-criteria score generation is confidential and reviewed exclusively on the Chief Administrator console.
                  </p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-500 font-mono text-xs uppercase block">Accused Suspect:</span>
                    <span className="font-serif font-bold text-zinc-100 text-base">
                      {playerProgress.accusation.suspect}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-xs uppercase block">Deduction & Motive:</span>
                    <p className="text-zinc-300 leading-relaxed">{playerProgress.accusation.motive}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-xs uppercase block">Attached Evidence:</span>
                    <ul className="list-disc list-inside text-zinc-300 text-xs">
                      {playerProgress.accusation.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                    Logged at: {playerProgress.accusation.submittedAt}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAccusation} className="space-y-6">
                {accusationError && (
                  <div className="p-4 rounded-xl bg-red-950/70 border border-red-500 text-red-200 text-xs">
                    {accusationError}
                  </div>
                )}

                {/* Question 1: Who is responsible */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <label className="text-xs font-mono uppercase text-zinc-300 font-bold block">
                    1. Who is primary responsible for the murder of Varadarajan?
                  </label>
                  <select
                    value={accusedSuspect}
                    onChange={(e) => setAccusedSuspect(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Select Prime Suspect --</option>
                    <option value="Vicky (Nephew)">Vicky — The Nephew</option>
                    <option value="Perumal (Family Cook)">Perumal — The Family Cook</option>
                    <option value="Meena (Daughter)">Meena — The Daughter</option>
                    <option value="Rangan (Former Business Partner)">Rangan — Former Business Partner & Rival</option>
                    <option value="Vicky and Perumal (Conspiracy)">Vicky and Perumal (Conspiracy)</option>
                  </select>
                </div>

                {/* Question 2: What happened & Motive */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <label className="text-xs font-mono uppercase text-zinc-300 font-bold block">
                    2. Describe What Happened and the Motive:
                  </label>
                  <textarea
                    value={accusedMotive}
                    onChange={(e) => setAccusedMotive(e.target.value)}
                    rows={4}
                    placeholder="Explain what happened during the 9:42 PM blackout, Vicky's debts and motive regarding the settlement deed, Perumal's involvement, and how Varadarajan was killed in the study..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                {/* Question 3: Attach Evidence */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                  <label className="text-xs font-mono uppercase text-zinc-300 font-bold block">
                    3. Select Discovered Evidence to Support Your Charge:
                  </label>
                  <div className="space-y-2">
                    {allClues.map((clue) => {
                      const isSelected = accusedEvidence.includes(clue.title);
                      const isDiscovered = playerProgress?.cluesFound.includes(clue.id);

                      return (
                        <div
                          key={clue.id}
                          onClick={() => handleToggleEvidence(clue.title)}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <span className="font-serif font-bold">{clue.title}</span>
                          </div>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDiscovered ? 'text-emerald-400 bg-emerald-950' : 'text-zinc-600 bg-zinc-900'}`}>
                            {isDiscovered ? 'Discovered' : 'Undiscovered'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Accusation Button */}
                <button
                  type="submit"
                  disabled={isSubmittingAccusation}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingAccusation ? 'FILING ACCUSATION...' : 'OFFICIALLY FILE ACCUSATION'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Suspect Individual Chat Modal */}
      {selectedSuspect && (
        <SuspectChatModal
          suspect={selectedSuspect}
          onClose={() => setSelectedSuspect(null)}
          onClueDiscovered={() => {
            // Clue auto-refresh handled by context
          }}
        />
      )}

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-4 text-center text-[11px] text-zinc-600 font-mono border-t border-zinc-800/60 mt-8">
        THE HIDDEN MYSTERY • Forensic Investigation System
      </footer>
    </div>
  );
};
