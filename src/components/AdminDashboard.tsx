import React, { useState } from 'react';
import {
  ShieldAlert, Play, Pause, Square, RotateCcw, Clock, Users, UserCheck,
  Search, Sliders, CheckCircle2, AlertTriangle, Eye, X, LogOut, ArrowRight,
  FileText, Edit, UserX, UserPlus, Trash2, Power, Filter, Lock, Unlock,
  Award
} from 'lucide-react';
import { useMystery } from '../context/MysteryContext';
import { PlayerProgress, ChatMessage, AccountStatus } from '../types/mystery';
import { api } from '../services/api';
import { AdminEvaluationCenter } from './AdminEvaluationCenter';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    eventState,
    playersList,
    evaluationState,
    startEvent,
    pauseEvent,
    resumeEvent,
    endEvent,
    resetEvent,
    updateSettings,
    adminUpdateUser,
    adminToggleUserStatus,
    adminForceLogout,
    adminRemoveUser,
    logout,
  } = useMystery();

  // Tab state: 'monitoring' | 'users' | 'evaluation'
  const [activeAdminTab, setActiveAdminTab] = useState<'monitoring' | 'users' | 'evaluation'>('monitoring');

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [eventDurationInput, setEventDurationInput] = useState(eventState?.duration || 60);
  const [eventNameInput, setEventNameInput] = useState(eventState?.eventName || '');
  const [caseTitleInput, setCaseTitleInput] = useState(eventState?.caseTitle || '');
  const [accusationToggle, setAccusationToggle] = useState(eventState?.settings.accusationEnabled ?? true);
  const [notesToggle, setNotesToggle] = useState(eventState?.settings.notesEnabled ?? true);
  const [cluesToggle, setCluesToggle] = useState(eventState?.settings.cluesVisible ?? true);

  // Detailed Player Inspect Drawer / Modal state
  const [inspectingPlayer, setInspectingPlayer] = useState<PlayerProgress | null>(null);
  const [inspectingPlayerChats, setInspectingPlayerChats] = useState<Record<string, ChatMessage[]>>({});
  const [isLoadingPlayerDetail, setIsLoadingPlayerDetail] = useState(false);

  // USER MANAGEMENT STATE (Prompt Sections 21-25)
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'REMOVED' | 'ONLINE' | 'OFFLINE'>('ALL');

  // Edit Player Modal state
  const [editingPlayer, setEditingPlayer] = useState<PlayerProgress | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAccountStatus, setEditAccountStatus] = useState<AccountStatus>('Active');
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [editActionFeedback, setEditActionFeedback] = useState<string | null>(null);

  // Remove Player Modal state
  const [removingPlayer, setRemovingPlayer] = useState<PlayerProgress | null>(null);
  const [removePermanent, setRemovePermanent] = useState(false);

  // End Event loading and feedback
  const [isEndingEvent, setIsEndingEvent] = useState(false);
  const [endEventFeedback, setEndEventFeedback] = useState<string | null>(null);

  const handleEndEvent = async () => {
    if (isEndingEvent) return;
    setIsEndingEvent(true);
    setEndEventFeedback(null);
    try {
      await endEvent();
      setEndEventFeedback('✓ Investigation officially concluded. Automated multi-criteria evaluation triggered.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end event';
      setEndEventFeedback(`Error ending event: ${msg}`);
    } finally {
      setIsEndingEvent(false);
    }
  };

  const status = eventState?.status || 'NOT_STARTED';

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOpenPlayerDetail = async (player: PlayerProgress) => {
    setInspectingPlayer(player);
    setIsLoadingPlayerDetail(true);
    try {
      const res = await api.adminGetPlayerDetails(player.playerId);
      setInspectingPlayerChats(res.chatLogs || {});
    } catch {
      // quiet fallback
    } finally {
      setIsLoadingPlayerDetail(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      duration: Number(eventDurationInput),
      eventName: eventNameInput,
      caseTitle: caseTitleInput,
      accusationEnabled: accusationToggle,
      notesEnabled: notesToggle,
      cluesVisible: cluesToggle,
    });
    setShowSettingsModal(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (player: PlayerProgress) => {
    setEditingPlayer(player);
    setEditPlayerName(player.playerName);
    setEditUsername(player.username || player.playerId);
    setEditAccountStatus(player.accountStatus || 'Active');
    setShowEditConfirm(false);
    setEditActionFeedback(null);
  };

  const handleConfirmSaveEdit = async () => {
    if (!editingPlayer) return;
    try {
      await adminUpdateUser(editingPlayer.playerId, {
        name: editPlayerName,
        username: editUsername,
        accountStatus: editAccountStatus,
      });
      setEditActionFeedback('Player account updated successfully.');
      setTimeout(() => {
        setEditingPlayer(null);
        setShowEditConfirm(false);
      }, 700);
    } catch (err: any) {
      setEditActionFeedback(err?.message || 'Failed to update account.');
    }
  };

  // Toggle Account Disable/Enable
  const handleToggleStatus = async (player: PlayerProgress) => {
    const nextStatus: AccountStatus = player.accountStatus === 'Disabled' ? 'Active' : 'Disabled';
    await adminToggleUserStatus(player.playerId, nextStatus);
  };

  // Force Logout
  const handleForceLogout = async (player: PlayerProgress) => {
    await adminForceLogout(player.playerId);
  };

  // Remove Player Action
  const handleConfirmRemovePlayer = async () => {
    if (!removingPlayer) return;
    await adminRemoveUser(removingPlayer.playerId, removePermanent);
    setRemovingPlayer(null);
    setRemovePermanent(false);
  };

  // Filtered Players for User Management
  const filteredPlayers = playersList.filter((p) => {
    // Search query
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.playerName.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      p.playerId.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Status filter
    if (userStatusFilter === 'ACTIVE') return (p.accountStatus || 'Active') === 'Active';
    if (userStatusFilter === 'DISABLED') return p.accountStatus === 'Disabled';
    if (userStatusFilter === 'REMOVED') return p.accountStatus === 'Removed';
    if (userStatusFilter === 'ONLINE') return p.loginStatus === 'Online';
    if (userStatusFilter === 'OFFLINE') return p.loginStatus === 'Offline';

    return true;
  });

  // Compute live stats
  const totalPlayers = playersList.length;
  const onlinePlayers = playersList.filter((p) => p.loginStatus === 'Online').length;
  const activePlayers = playersList.filter((p) => (p.accountStatus || 'Active') === 'Active').length;
  const disabledPlayers = playersList.filter((p) => p.accountStatus === 'Disabled').length;
  const investigatingPlayers = playersList.filter((p) => p.investigationStatus === 'Investigating').length;
  const notStartedPlayers = playersList.filter((p) => p.investigationStatus === 'Not Started').length;
  const completedPlayers = playersList.filter((p) => p.investigationStatus === 'Completed').length;
  const avgProgress = totalPlayers > 0
    ? Math.round(playersList.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / totalPlayers)
    : 0;

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0e131a]/95 backdrop-blur-md border-b border-zinc-800/80 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg text-zinc-100">ADMIN CONTROL CENTER</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                  MASTER COORDINATOR
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {eventState?.eventName} • {eventState?.caseTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab navigation pills */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveAdminTab('monitoring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeAdminTab === 'monitoring'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Monitoring</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeAdminTab === 'users'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Management</span>
                {disabledPlayers > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-950 border border-amber-500 text-[10px] text-amber-300 font-bold">
                    {disabledPlayers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveAdminTab('evaluation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeAdminTab === 'evaluation'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Evaluation Center</span>
                {evaluationState?.status === 'COMPLETED' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                {evaluationState?.status === 'EVALUATING' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setEventDurationInput(eventState?.duration || 60);
                setEventNameInput(eventState?.eventName || '');
                setCaseTitleInput(eventState?.caseTitle || '');
                setAccusationToggle(eventState?.settings.accusationEnabled ?? true);
                setNotesToggle(eventState?.settings.notesEnabled ?? true);
                setCluesToggle(eventState?.settings.cluesVisible ?? true);
                setShowSettingsModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-mono transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Settings</span>
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Admin Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* TAB 1: EVENT MONITORING & LIVE CONTROLS */}
        {activeAdminTab === 'monitoring' && (
          <div className="space-y-6 animate-in fade-in">
            {/* EVENT STATUS & MASTER CONTROL PANEL */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                    Central Event Control Hub
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-3.5 h-3.5 rounded-full ${
                        status === 'LIVE'
                          ? 'bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse'
                          : status === 'PAUSED'
                          ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
                          : status === 'ENDED'
                          ? 'bg-red-400 shadow-[0_0_12px_#f87171]'
                          : 'bg-zinc-500'
                      }`}
                    />
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-zinc-100">
                      EVENT STATUS: {status}
                    </h2>
                  </div>
                </div>

                {/* Master Timer Box */}
                <div className="flex items-center gap-4 bg-zinc-950 px-6 py-4 rounded-2xl border border-zinc-800 shadow-inner">
                  <Clock className="w-6 h-6 text-amber-400" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Investigation Clock</span>
                    <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-zinc-100">
                      {status === 'ENDED' ? '00:00 (ENDED)' : formatTime(eventState?.timeRemaining || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Master Control Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {status === 'NOT_STARTED' && (
                  <button
                    onClick={startEvent}
                    className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START EVENT</span>
                  </button>
                )}

                {status === 'LIVE' && (
                  <>
                    <button
                      onClick={pauseEvent}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUSE EVENT</span>
                    </button>
                    <button
                      onClick={handleEndEvent}
                      disabled={isEndingEvent}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Square className={`w-4 h-4 fill-current ${isEndingEvent ? 'animate-spin' : ''}`} />
                      <span>{isEndingEvent ? 'ENDING EVENT...' : 'END EVENT'}</span>
                    </button>
                  </>
                )}

                {status === 'PAUSED' && (
                  <>
                    <button
                      onClick={resumeEvent}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>RESUME EVENT</span>
                    </button>
                    <button
                      onClick={handleEndEvent}
                      disabled={isEndingEvent}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Square className={`w-4 h-4 fill-current ${isEndingEvent ? 'animate-spin' : ''}`} />
                      <span>{isEndingEvent ? 'ENDING EVENT...' : 'END EVENT'}</span>
                    </button>
                  </>
                )}

                {status === 'ENDED' && (
                  <>
                    <div className="px-4 py-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 font-mono text-xs font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                      <span>INVESTIGATION OFFICIALLY CONCLUDED</span>
                    </div>
                    <button
                      onClick={startEvent}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>START NEW / RESTART EVENT</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-5 py-3.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-bold font-mono text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET EVENT</span>
                </button>
              </div>

              {endEventFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs font-mono border flex items-center justify-between mt-2 ${
                  endEventFeedback.startsWith('✓')
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/80 border-red-500/50 text-red-300'
                }`}>
                  <span>{endEventFeedback}</span>
                  <button onClick={() => setEndEventFeedback(null)} className="text-zinc-400 hover:text-zinc-100 p-1">
                    ✕
                  </button>
                </div>
              )}

              {/* EVALUATION STATUS BANNER (Prompt 33) */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-mono ${
                    evaluationState?.status === 'COMPLETED'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                      : evaluationState?.status === 'EVALUATING'
                      ? 'bg-amber-950 border border-amber-500/40 text-amber-400 animate-pulse'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                  }`}>
                    {evaluationState?.status === 'COMPLETED' ? '✓' : evaluationState?.status === 'EVALUATING' ? '⚙' : '⏳'}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                      AUTOMATED EVALUATION (PROMPT 33)
                    </span>
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      {evaluationState?.status === 'COMPLETED'
                        ? '✓ Evaluation Completed'
                        : evaluationState?.status === 'EVALUATING'
                        ? '⚙ Evaluating Players...'
                        : '⏳ Evaluation Pending'}
                    </span>
                    {evaluationState?.status === 'COMPLETED' && (
                      <span className="text-[11px] text-zinc-400 ml-2 font-mono">
                        ({evaluationState.playersEvaluated} evaluated • Avg: {evaluationState.averageScore}/100)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveAdminTab('evaluation')}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{evaluationState?.status === 'COMPLETED' ? 'VIEW LEADERBOARD' : 'EVALUATION CENTER'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE EVENT MONITORING STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Total Players</span>
                <div className="text-xl font-bold text-zinc-100 font-mono">{totalPlayers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Currently Online</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{onlinePlayers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Investigating</span>
                <div className="text-xl font-bold text-amber-400 font-mono">{investigatingPlayers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Not Started</span>
                <div className="text-xl font-bold text-zinc-400 font-mono">{notStartedPlayers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Submitted</span>
                <div className="text-xl font-bold text-teal-400 font-mono">{completedPlayers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Avg Progress</span>
                <div className="text-xl font-bold text-emerald-400 font-mono">{avgProgress}%</div>
              </div>
            </div>

            {/* LIVE PLAYER MONITORING TABLE */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 space-y-4 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-serif font-bold text-lg text-zinc-100">Live Investigation Feed</h3>
                </div>
                <button
                  onClick={() => setActiveAdminTab('users')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Advanced User Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Player ID</th>
                      <th className="py-3 px-4">Player Name</th>
                      <th className="py-3 px-4">Login Status</th>
                      <th className="py-3 px-4">Investigation Status</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {playersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-500 font-mono">
                          No players registered yet.
                        </td>
                      </tr>
                    ) : (
                      playersList.map((player) => (
                        <tr
                          key={player.playerId}
                          className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenPlayerDetail(player)}
                        >
                          <td className="py-3.5 px-4 font-mono text-zinc-300 font-semibold">
                            {player.username || player.playerId}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-zinc-100">
                            {player.playerName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                player.loginStatus === 'Online'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  player.loginStatus === 'Online' ? 'bg-emerald-400' : 'bg-zinc-500'
                                }`}
                              />
                              {player.loginStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                player.investigationStatus === 'Completed'
                                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                  : player.investigationStatus === 'Investigating'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {player.investigationStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all"
                                  style={{ width: `${player.progressPercentage || 0}%` }}
                                />
                              </div>
                              <span className="font-mono text-zinc-400 font-bold">
                                {player.progressPercentage || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                            {player.lastActivity}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPlayerDetail(player);
                              }}
                              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-xs font-mono transition-colors"
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED ADMIN USER MANAGEMENT (Prompt Section 21-25) */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header / Summary Card */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-zinc-100">
                      USER MANAGEMENT
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Complete administrative oversight of registered player accounts, credentials, and access permissions.
                  </p>
                </div>

                {/* Account status counts */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">{activePlayers}</span> Active
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <span className="text-amber-400 font-bold">{disabledPlayers}</span> Disabled
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">{onlinePlayers}</span> Online
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-zinc-800/80">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by Player Name, Player ID, or Username..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/70 font-sans"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  {(['ALL', 'ACTIVE', 'DISABLED', 'REMOVED', 'ONLINE', 'OFFLINE'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setUserStatusFilter(f)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                        userStatusFilter === f
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                          : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Registered Players Table (Exact Columns as Prompt Section 21) */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">
                  Showing <strong className="text-zinc-100">{filteredPlayers.length}</strong> of {playersList.length} players
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Passwordless Student Login (Name & Register Number)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4">Player ID</th>
                      <th className="py-3.5 px-4">Player Name</th>
                      <th className="py-3.5 px-4">Register Number / Roll No</th>
                      <th className="py-3.5 px-4">Login Status</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Progress</th>
                      <th className="py-3.5 px-4 text-center">Score (Criteria)</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-zinc-500 font-mono">
                          {userSearchQuery || userStatusFilter !== 'ALL'
                            ? 'No players matched your search filters.'
                            : 'No players registered yet.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((player) => {
                        const accStatus = player.accountStatus || 'Active';
                        const playerReport = evaluationState?.reports?.[player.playerId];
                        const displayScore = player.score !== undefined ? player.score : playerReport?.finalScore;
                        const displayAcc = player.accuracyPercentage !== undefined ? player.accuracyPercentage : playerReport?.accuracyPercentage;

                        return (
                          <tr key={player.playerId} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-zinc-300 font-semibold">
                              {player.playerId}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-zinc-100">
                              {player.playerName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-zinc-400">
                              @{player.username || player.playerId}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                  player.loginStatus === 'Online'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    player.loginStatus === 'Online' ? 'bg-emerald-400' : 'bg-zinc-500'
                                  }`}
                                />
                                {player.loginStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                  accStatus === 'Active'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                                    : accStatus === 'Disabled'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                                    : 'bg-red-950/80 text-red-300 border border-red-800/80'
                                }`}
                              >
                                {accStatus === 'Active' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ) : accStatus === 'Disabled' ? (
                                  <Lock className="w-3 h-3 text-amber-400" />
                                ) : (
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                )}
                                {accStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-zinc-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${player.progressPercentage || 0}%` }}
                                  />
                                </div>
                                <span className="font-mono text-zinc-400 font-bold">
                                  {player.progressPercentage || 0}%
                                </span>
                              </div>
                            </td>
                            {/* Generated Score Column (Multi-Criteria Evaluation) */}
                            <td className="py-3.5 px-4 text-center">
                              {displayScore !== undefined ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono font-bold text-xs shadow-sm">
                                    {displayScore} / 100
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                    Acc: {displayAcc ?? 0}%
                                  </span>
                                </div>
                              ) : player.accusation ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold">
                                    Submitted
                                  </span>
                                  <span className="text-[9px] font-mono text-amber-400/80 mt-0.5">
                                    Score Pending
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[10px]">
                                  Pending Answer
                                </span>
                              )}
                            </td>
                            {/* Actions for every player: VIEW, EDIT, RESET PASSWORD, DISABLE, ENABLE, REMOVE, FORCE LOGOUT */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* VIEW */}
                                <button
                                  onClick={() => handleOpenPlayerDetail(player)}
                                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-[11px] font-mono transition-colors cursor-pointer"
                                  title="View Full Player Dossier"
                                >
                                  VIEW
                                </button>

                                {/* EDIT */}
                                <button
                                  onClick={() => handleOpenEdit(player)}
                                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-[11px] font-mono transition-colors cursor-pointer"
                                  title="Edit Player Account"
                                >
                                  EDIT
                                </button>

                                {/* DISABLE / ENABLE */}
                                {accStatus === 'Disabled' ? (
                                  <button
                                    onClick={() => handleToggleStatus(player)}
                                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono transition-colors cursor-pointer"
                                    title="Restore Access"
                                  >
                                    ENABLE
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStatus(player)}
                                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-[11px] font-mono transition-colors cursor-pointer"
                                    title="Temporarily Disable Player"
                                  >
                                    DISABLE
                                  </button>
                                )}

                                {/* FORCE LOGOUT */}
                                {player.loginStatus === 'Online' && (
                                  <button
                                    onClick={() => handleForceLogout(player)}
                                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                                    title="Force Logout Player"
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* REMOVE */}
                                <button
                                  onClick={() => {
                                    setRemovingPlayer(player);
                                    setRemovePermanent(false);
                                  }}
                                  className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Remove Player from Event"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTOMATED EVALUATION CENTER & CASE CONFIG (Prompts 21-47) */}
        {activeAdminTab === 'evaluation' && (
          <div className="space-y-6 animate-in fade-in">
            <AdminEvaluationCenter />
          </div>
        )}
      </main>

      {/* EDIT PLAYER MODAL (Prompt Section 22 Requirement) */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl border border-amber-500/40 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-zinc-100">EDIT PLAYER ACCOUNT</h3>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    ID: {editingPlayer.playerId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editActionFeedback && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-amber-300">
                {editActionFeedback}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowEditConfirm(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-sans focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Register Number / Roll No
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  placeholder="e.g. 830123104008"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Account Status
                </label>
                <select
                  value={editAccountStatus}
                  onChange={(e) => setEditAccountStatus(e.target.value as AccountStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500/70"
                >
                  <option value="Active">Active (Permitted)</option>
                  <option value="Disabled">Disabled (Locked out)</option>
                  <option value="Removed">Removed (Soft-deleted)</option>
                </select>
              </div>

              {/* Confirmation Prompt (Prompt 22 requirement) */}
              {showEditConfirm && (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-3">
                  <p className="text-xs text-amber-200 font-mono leading-relaxed">
                    "Are you sure you want to update this player's account details?"
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-mono"
                    >
                      No, Review
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSaveEdit}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono"
                    >
                      Yes, Save Changes
                    </button>
                  </div>
                </div>
              )}

              {!showEditConfirm && (
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* REMOVE PLAYER MODAL (Prompt Section 23 Requirement) */}
      {removingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl border border-red-500/50 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-serif text-zinc-100">REMOVE PLAYER</h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono">
                "Are you sure you want to remove {removingPlayer.playerName} from this event?"
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removePermanent}
                  onChange={(e) => setRemovePermanent(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="font-semibold text-red-300">Delete Permanently (Irreversible)</span>
              </label>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {removePermanent
                  ? 'Warning: All player records, notes, and chat transcripts will be completely erased.'
                  : 'Soft-delete approach: Prevents access while preserving previous event data for auditing records.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemovingPlayer(null)}
                className="py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold font-mono text-zinc-300"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePlayer}
                className="py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-zinc-100 font-bold font-mono text-xs shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                REMOVE PLAYER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET EVENT MODAL (Prompt Section 9 Requirement) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl border border-red-500/50 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-serif text-zinc-100">RESET EVENT SESSION?</h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                "Are you sure you want to reset the event? All player progress will be cleared."
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold font-mono text-zinc-300"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  await resetEvent();
                  setShowResetConfirm(false);
                }}
                className="py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-zinc-100 font-bold font-mono text-xs shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT CONFIGURATION MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full rounded-3xl border border-zinc-800 bg-[#0e131a] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-zinc-100">EVENT SETTINGS</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  value={caseTitleInput}
                  onChange={(e) => setCaseTitleInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-300 block mb-1">
                  Event Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={eventDurationInput}
                  onChange={(e) => setEventDurationInput(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                  <span>Allow Final Accusation Submission</span>
                  <input
                    type="checkbox"
                    checked={accusationToggle}
                    onChange={(e) => setAccusationToggle(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                  <span>Enable Detective Notes Notepad</span>
                  <input
                    type="checkbox"
                    checked={notesToggle}
                    onChange={(e) => setNotesToggle(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer">
                  <span>Make Discovered Clues Visible</span>
                  <input
                    type="checkbox"
                    checked={cluesToggle}
                    onChange={(e) => setCluesToggle(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono"
                >
                  SAVE CONFIGURATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PLAYER INSPECTION MODAL (Prompt Section 11 Requirement) */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full max-h-[85vh] rounded-3xl border border-zinc-800 bg-[#0e131a] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400">
                  PLAYER DOSSIER MONITORING
                </span>
                <h3 className="font-serif font-bold text-lg text-zinc-100">
                  {inspectingPlayer.playerName} ({inspectingPlayer.username})
                </h3>
              </div>
              <button
                onClick={() => setInspectingPlayer(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-300">
              {/* Stats overview */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Status</span>
                  <span className="font-bold text-emerald-400">{inspectingPlayer.investigationStatus}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Progress</span>
                  <span className="font-bold text-emerald-400">{inspectingPlayer.progressPercentage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Questions Asked</span>
                  <span className="font-bold text-zinc-100">{inspectingPlayer.questionsAsked}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Clues Unlocked</span>
                  <span className="font-bold text-amber-400">{inspectingPlayer.cluesFound.length}</span>
                </div>
              </div>

              {/* Suspects Investigated */}
              <div>
                <h4 className="font-mono uppercase font-bold text-zinc-400 mb-2">Suspects Investigated</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {['vicky', 'perumal', 'meena', 'rangan'].map((s) => {
                    const investigated = inspectingPlayer.suspectsInvestigated.includes(s);
                    const stage = inspectingPlayer.suspectStages?.[s] ?? 0;
                    const stageName = ['Denial', 'Defensive', 'Partial', 'Confession'][stage] || 'Denial';
                    return (
                      <span
                        key={s}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 ${
                          investigated
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                        }`}
                      >
                        <span>{s.toUpperCase()}</span>
                        <span>•</span>
                        <span className={investigated ? 'text-emerald-400' : 'text-zinc-600'}>
                          {investigated ? `Stage ${stage} (${stageName})` : 'UNTOUCHED'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-mono uppercase font-bold text-zinc-400 mb-2">Player Investigation Notes</h4>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-zinc-300 whitespace-pre-wrap min-h-16">
                  {inspectingPlayer.notes || 'No notes written yet.'}
                </div>
              </div>

              {/* Accusation */}
              <div>
                <h4 className="font-mono uppercase font-bold text-amber-400 mb-2">Final Accusation Submission</h4>
                {inspectingPlayer.accusation ? (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
                    <div>
                      <span className="text-zinc-500">Suspect Accused: </span>
                      <strong className="text-zinc-100">{inspectingPlayer.accusation.suspect}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Motive / Theory: </span>
                      <p className="text-zinc-300 mt-1">{inspectingPlayer.accusation.motive}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Evidence Attached: </span>
                      <span className="text-zinc-300">{inspectingPlayer.accusation.evidence.join(', ')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500">
                    Player has not yet submitted an accusation.
                  </div>
                )}
              </div>

              {/* Multi-Criteria Generated Score (Restricted to Admin Console) */}
              {(() => {
                const report = evaluationState?.reports?.[inspectingPlayer.playerId];
                const finalScore = inspectingPlayer.score !== undefined ? inspectingPlayer.score : report?.finalScore;
                const accuracy = inspectingPlayer.accuracyPercentage !== undefined ? inspectingPlayer.accuracyPercentage : report?.accuracyPercentage;
                const breakdown = inspectingPlayer.scoreBreakdown || report?.scoreBreakdown;

                return (
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                          CONFIDENTIAL ADMIN SCORING ENGINE
                        </span>
                        <h4 className="text-sm font-bold font-serif text-zinc-100">
                          Multi-Criteria Evaluation Score
                        </h4>
                      </div>
                      <div className="text-right">
                        {finalScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black font-mono text-emerald-400">
                              {finalScore} / 100
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Acc: {accuracy ?? 0}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-zinc-500">
                            Awaiting Submission
                          </span>
                        )}
                      </div>
                    </div>

                    {breakdown ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-[10px] uppercase font-mono text-zinc-400 block">1. Clues & Evidence</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {breakdown.investigationScore} / {breakdown.investigationMax || 40}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-[10px] uppercase font-mono text-zinc-400 block">2. Culprit & Motive</span>
                          <span className="font-mono font-bold text-amber-400 text-sm">
                            {breakdown.finalAnswerScore} / {breakdown.finalAnswerMax || 30}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-[10px] uppercase font-mono text-zinc-400 block">3. Deduction Logic</span>
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {breakdown.reasoningScore} / {breakdown.reasoningMax || 20}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-[10px] uppercase font-mono text-zinc-400 block">4. Time Efficiency</span>
                          <span className="font-mono font-bold text-purple-400 text-sm">
                            {breakdown.timeScore} / {breakdown.timeMax || 10}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {report?.evaluationExplanation && (
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] space-y-1 font-mono">
                        <div className="text-zinc-300 font-bold">Verdict: {report.evaluationExplanation.verdict}</div>
                        <p className="text-zinc-400">{report.evaluationExplanation.summary}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto p-4 text-center text-[11px] text-zinc-600 font-mono border-t border-zinc-800/60 mt-8">
        THE HIDDEN MYSTERY • Admin Control Console • Nilgiris Forensic CID
      </footer>
    </div>
  );
};
