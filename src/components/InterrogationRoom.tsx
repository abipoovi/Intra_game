import React, { useState, useRef, useEffect } from 'react';
import { Send, UserCheck, AlertTriangle, CheckCircle, Sparkles, MessageSquare, Volume2, ShieldCheck } from 'lucide-react';
import { SuspectId, ChatMessage } from '../types/game';
import { SUSPECTS } from '../data/gameData';
import { playClick, playThunder } from '../utils/audio';

interface InterrogationRoomProps {
  currentSuspectId: SuspectId;
  setCurrentSuspectId: (id: SuspectId) => void;
  chatHistories: Record<SuspectId, ChatMessage[]>;
  onSendMessage: (suspectId: SuspectId, text: string) => Promise<void>;
  isLoading: boolean;
  isTimeExpired: boolean;
  secretsUnlocked: Record<SuspectId, { secret1: boolean; secret2?: boolean }>;
}

export const InterrogationRoom: React.FC<InterrogationRoomProps> = ({
  currentSuspectId,
  setCurrentSuspectId,
  chatHistories,
  onSendMessage,
  isLoading,
  isTimeExpired,
  secretsUnlocked,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suspect = SUSPECTS[currentSuspectId];
  const messages = chatHistories[currentSuspectId] || [];
  const suspectSecrets = secretsUnlocked[currentSuspectId] || { secret1: false, secret2: false };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || isTimeExpired) return;
    const text = inputText.trim();
    setInputText('');
    playClick();
    onSendMessage(currentSuspectId, text);
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading || isTimeExpired) return;
    playClick();
    onSendMessage(currentSuspectId, question);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10">
      {/* Left Column: Suspect Selector & Suspect Profile (4 cols on lg) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Suspect Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
          {(['vicky', 'divya', 'perumal'] as SuspectId[]).map((id) => {
            const s = SUSPECTS[id];
            const active = currentSuspectId === id;
            const hasConfession = secretsUnlocked[id]?.secret2 || (id === 'divya' && secretsUnlocked[id]?.secret1);
            return (
              <button
                key={id}
                onClick={() => {
                  playClick();
                  setCurrentSuspectId(id);
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{s.name}</span>
                <span className={`text-[10px] ${active ? 'text-zinc-900 font-medium' : 'text-zinc-500'}`}>
                  {s.tamilName}
                </span>
                {hasConfession && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-900 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Suspect Dossier Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg relative overflow-hidden">
          {/* Accent Glow Header */}
          <div className="flex items-start gap-4 mb-4">
            <img
              src={suspect.portrait}
              alt={suspect.name}
              className="w-20 h-20 rounded-xl object-cover border-2 border-zinc-700 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-100 font-serif">{suspect.name}</h2>
                <span className="text-xs font-mono text-amber-400">({suspect.tamilName})</span>
              </div>
              <p className="text-xs font-semibold text-amber-400/90">{suspect.role}</p>
              <p className="text-[11px] text-zinc-400">{suspect.relation}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                Age: {suspect.age}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Demeanor</div>
              <div className="text-zinc-300 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 leading-relaxed">
                {suspect.demeanor}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Official Alibi Statement</div>
              <div className="text-zinc-300 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80 italic border-l-2 border-l-amber-500">
                "{suspect.officialAlibi}"
              </div>
            </div>

            {/* Secret status badges */}
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Interrogation Progress
              </div>
              <div className="space-y-1.5">
                <div
                  className={`flex items-center justify-between p-2 rounded text-[11px] border ${
                    suspectSecrets.secret1
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500'
                  }`}
                >
                  <span>Secret #1: {suspect.secret1Trigger}</span>
                  {suspectSecrets.secret1 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] uppercase font-mono">Locked</span>
                  )}
                </div>

                {suspect.secret2Trigger && (
                  <div
                    className={`flex items-center justify-between p-2 rounded text-[11px] border ${
                      suspectSecrets.secret2
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500'
                    }`}
                  >
                    <span>Full Confession: {suspect.secret2Trigger}</span>
                    {suspectSecrets.secret2 ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <span className="text-[10px] uppercase font-mono">Locked</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Confrontation Chips */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
          <div className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1">
            <span>Quick Confrontation Prompts</span>
            <span className="text-[10px] text-zinc-500 font-normal">Click to interrogate</span>
          </div>
          <div className="space-y-1.5">
            {suspect.quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q)}
                disabled={isLoading || isTimeExpired}
                className="w-full text-left p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-xs text-zinc-300 hover:text-amber-200 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Chat Interrogation Terminal (8 cols on lg) */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-2xl overflow-hidden h-[700px]">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-200 font-mono">
                INTERROGATION ROOM • SUSPECT: {suspect.name.toUpperCase()}
              </span>
              <p className="text-[11px] text-zinc-500">Tamil Nadu Police Recorded Deposition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTimeExpired ? (
              <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-700/60 text-red-300 text-xs font-bold uppercase font-mono">
                SESSION LOCKED (TIME EXPIRED)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                RECORDING ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-zinc-950/60 via-zinc-950/90 to-zinc-950">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-700" />
              <div className="text-sm font-medium text-zinc-400 font-serif">
                Interrogation with {suspect.name} initiated.
              </div>
              <p className="text-xs max-w-md text-zinc-500">
                Question {suspect.name} about their whereabouts, the 11:15 PM blackout, or confront them with
                forensic clues from the Evidence Locker!
              </p>
              <button
                onClick={() => handleQuickQuestion(suspect.quickQuestions[0])}
                className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
              >
                Ask First Question →
              </button>
            </div>
          ) : (
            messages.map((msg) => {
              const isDetective = msg.sender === 'detective';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isDetective ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-400">
                      {isDetective ? 'Inspector (You)' : `${suspect.name} (${suspect.role.split('—')[0]})`}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-4 max-w-[88%] text-sm leading-relaxed shadow-md ${
                      isDetective
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-tr-xs'
                        : msg.isConfession
                        ? 'bg-red-950/70 border-2 border-red-500/70 text-red-100 rounded-tl-xs shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.isConfession && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-widest mb-1.5 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        CRITICAL CONFESSION EXTRACTED!
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{suspect.name} is responding under interrogation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-950/90">
          {isTimeExpired ? (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-center text-xs font-semibold font-mono">
              TIME EXPIRED! The suspect will not answer questions as the airport escape window has passed.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask ${suspect.name} a question, or confront with clues (e.g. Red Clay Mud, EB Fuse)...`}
                disabled={isLoading || isTimeExpired}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || isTimeExpired}
                className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
