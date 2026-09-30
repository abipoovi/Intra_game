import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, MessageSquare, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Suspect, ChatMessage } from '../types/mystery';
import { useMystery } from '../context/MysteryContext';
import { api } from '../services/api';

interface SuspectChatModalProps {
  suspect: Suspect;
  onClose: () => void;
  onClueDiscovered?: (clueId: string) => void;
}

export const SuspectChatModal: React.FC<SuspectChatModalProps> = ({ suspect, onClose, onClueDiscovered }) => {
  const { sendChatMessage, eventState, allClues } = useMystery();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [stage, setStage] = useState<number>(0);
  const [newlyDiscoveredClue, setNewlyDiscoveredClue] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEventLive = eventState?.status === 'LIVE';

  // Load chat history
  useEffect(() => {
    let isMounted = true;
    api.playerGetChat(suspect.id).then((res) => {
      if (isMounted) {
        if (typeof res.conversationStage === 'number') {
          setStage(res.conversationStage);
        }
        if (res.history && res.history.length > 0) {
          setMessages(res.history);
        } else {
          // Provide initial in-character greeting if empty
          const initialGreeting: ChatMessage = {
            id: 'init_' + suspect.id,
            suspectId: suspect.id,
            sender: 'suspect',
            text: suspect.initialMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages([initialGreeting]);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [suspect]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending || !isEventLive) return;

    setInputMessage('');
    setIsSending(true);
    setNewlyDiscoveredClue(null);

    const playerMsg: ChatMessage = {
      id: 'p_' + Date.now(),
      suspectId: suspect.id,
      sender: 'player',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, playerMsg]);

    try {
      const res = await sendChatMessage(suspect.id, text);

      if (typeof (res as any).conversationStage === 'number') {
        setStage((res as any).conversationStage);
      }

      const botMsg: ChatMessage = {
        id: 's_' + Date.now(),
        suspectId: suspect.id,
        sender: 'suspect',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        discoveredClueId: res.discoveredClueId,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (res.discoveredClueId) {
        setNewlyDiscoveredClue(res.discoveredClueId);
        onClueDiscovered?.(res.discoveredClueId);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isAuthError =
        errMsg.toLowerCase().includes('authorization') ||
        errMsg.toLowerCase().includes('session') ||
        errMsg.includes('401') ||
        errMsg.includes('403');

      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        suspectId: suspect.id,
        sender: 'suspect',
        text: isAuthError
          ? `[System Notice: Session expired. Please log in again with your Student Name and Register Number.]`
          : `${suspect.name} hesitates and pauses for a moment before speaking. Please ask again or rephrase your question.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const getClueDetails = (clueId: string) => {
    return allClues.find((c) => c.id === clueId);
  };

  const stageBadgeInfo = [
    { label: 'Stage 0: Initial Denial', style: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
    { label: 'Stage 1: Defensive Answers', style: 'bg-amber-950/80 text-amber-300 border-amber-700/60' },
    { label: 'Stage 2: Partial Information', style: 'bg-sky-950/80 text-sky-300 border-sky-700/60' },
    { label: 'Stage 3: Critical Confession', style: 'bg-emerald-950 text-emerald-300 border-emerald-500/60 animate-pulse' },
  ][Math.min(3, Math.max(0, stage))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[85vh] rounded-3xl border border-zinc-800 bg-[#0e131a] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={suspect.avatar}
              alt={suspect.name}
              className="w-11 h-11 rounded-xl object-cover border border-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-zinc-100">{suspect.name}</h3>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {suspect.role}
                </span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${stageBadgeInfo.style}`}>
                  {stageBadgeInfo.label}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-sm sm:max-w-md">{suspect.demeanor}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Discovery Alert if new clue discovered */}
        {newlyDiscoveredClue && (
          <div className="px-6 py-3 bg-emerald-950/80 border-b border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-200 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>CRUCIAL CLUE DISCOVERED: </strong>
                {getClueDetails(newlyDiscoveredClue)?.title} added to your Clue Board!
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
              LOGGED
            </span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#0e131a] to-zinc-950">
          {messages.map((m) => {
            const isPlayer = m.sender === 'player';
            const clue = m.discoveredClueId ? getClueDetails(m.discoveredClueId) : null;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {isPlayer ? 'You (Investigator)' : suspect.name}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">{m.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    isPlayer
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-tr-xs'
                      : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-xs shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {clue && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold font-serif text-emerald-300">
                          Evidence Uncovered: {clue.title}
                        </div>
                        <div className="text-[11px] text-zinc-300 mt-0.5">{clue.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{suspect.name} is formulating a response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          {!isEventLive ? (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs text-center font-mono">
              Investigation is currently locked or paused. Suspect interrogation is disabled.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${suspect.name} a question, confront with timeline inconsistencies...`}
                disabled={isSending}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
