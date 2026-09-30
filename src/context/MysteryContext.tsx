import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  EventState,
  PlayerProgress,
  Clue,
  TimelineEvent,
  ChatMessage,
  Suspect,
  SuspectId,
  EvaluationCenterState,
  PlayerEvaluationReport,
  LeaderboardEntry,
  AnswerKeyConfig,
  ClueConfig,
  ScoringRubricConfig,
} from '../types/mystery';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '../services/api';
import { SUSPECTS, DISCOVERABLE_CLUES, MASTER_TIMELINE, CASE_BASELINE } from '../data/mysteryData';

export type AppView = 'landing' | 'player-login' | 'admin-login' | 'player-waiting' | 'player-game' | 'admin-dashboard' | 'player-results';

interface MysteryContextType {
  currentUser: User | null;
  eventState: EventState | null;
  playerProgress: PlayerProgress | null;
  playersList: PlayerProgress[];
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  activeSuspectId: SuspectId;
  setActiveSuspectId: (id: SuspectId) => void;
  suspects: Suspect[];
  allClues: Clue[];
  timeline: TimelineEvent[];
  baseline: typeof CASE_BASELINE;
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  // Auth
  loginPlayer: (name: string, registerNumber: string, pass?: string) => Promise<void>;
  loginAdmin: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  // Admin Controls
  startEvent: () => Promise<void>;
  pauseEvent: () => Promise<void>;
  resumeEvent: () => Promise<void>;
  endEvent: () => Promise<void>;
  resetEvent: () => Promise<void>;
  updateSettings: (settings: Partial<EventState['settings']> & { duration?: number; caseTitle?: string; eventName?: string }) => Promise<void>;
  // Admin User Management
  adminUpdateUser: (userId: string, data: { name?: string; username?: string; password?: string; accountStatus?: 'Active' | 'Disabled' | 'Removed' }) => Promise<void>;
  adminResetPassword: (userId: string, newPassword?: string) => Promise<{ temporaryPassword?: string }>;
  adminToggleUserStatus: (userId: string, status: 'Active' | 'Disabled') => Promise<void>;
  adminForceLogout: (userId: string) => Promise<void>;
  adminRemoveUser: (userId: string, permanent?: boolean) => Promise<void>;
  accountDisabledNotice: string | null;
  clearAccountDisabledNotice: () => void;
  // Evaluation Center (Prompts 21-47)
  evaluationState: EvaluationCenterState | null;
  playerEvaluationReport: PlayerEvaluationReport | null;
  leaderboard: LeaderboardEntry[];
  isLeaderboardPublished: boolean;
  caseConfig: {
    answerKey: AnswerKeyConfig;
    clueWeights: Record<string, ClueConfig>;
    rubric: ScoringRubricConfig;
    scoringLocked: boolean;
  } | null;
  fetchEvaluationResults: () => Promise<void>;
  fetchPlayerMyResult: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  adminPublishLeaderboard: () => Promise<void>;
  adminOverrideScore: (data: {
    playerId: string;
    investigationScore?: number;
    finalAnswerScore?: number;
    reasoningScore?: number;
    accuracyPercentage?: number;
    reason: string;
  }) => Promise<void>;
  adminReEvaluate: () => Promise<void>;
  fetchCaseConfig: () => Promise<void>;
  adminUpdateCaseConfig: (data: {
    answerKey?: Partial<AnswerKeyConfig>;
    clueWeights?: Record<string, ClueConfig>;
    rubric?: Partial<ScoringRubricConfig>;
  }) => Promise<void>;
  // Player Actions
  sendChatMessage: (suspectId: SuspectId, message: string) => Promise<{ reply: string; discoveredClueId?: string }>;
  saveNotes: (notes: string) => Promise<void>;
  submitAccusation: (accusation: { suspect: string; motive: string; evidence: string[] }) => Promise<void>;
  refreshState: () => Promise<void>;
}

const MysteryContext = createContext<MysteryContextType | undefined>(undefined);

export const MysteryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [eventState, setEventState] = useState<EventState | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null);
  const [playersList, setPlayersList] = useState<PlayerProgress[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeSuspectId, setActiveSuspectId] = useState<SuspectId>('vicky');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accountDisabledNotice, setAccountDisabledNotice] = useState<string | null>(null);

  // Evaluation Center States (Prompts 21-47)
  const [evaluationState, setEvaluationState] = useState<EvaluationCenterState | null>(null);
  const [playerEvaluationReport, setPlayerEvaluationReport] = useState<PlayerEvaluationReport | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardPublished, setIsLeaderboardPublished] = useState<boolean>(false);
  const [caseConfig, setCaseConfig] = useState<{
    answerKey: AnswerKeyConfig;
    clueWeights: Record<string, ClueConfig>;
    rubric: ScoringRubricConfig;
    scoringLocked: boolean;
  } | null>(null);

  const clearAccountDisabledNotice = () => setAccountDisabledNotice(null);

  // Sync initial session on mount
  const refreshState = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (token) {
        const data = await api.getMe();
        if (data.user.accountStatus === 'Disabled') {
          setStoredToken(null);
          setStoredUser(null);
          setCurrentUser(null);
          setAccountDisabledNotice('Your account has been temporarily disabled by the event administrator.');
          setCurrentView('landing');
          return;
        }
        setCurrentUser(data.user);
        setEventState(data.event);
        if (data.progress) {
          setPlayerProgress(data.progress);
        }

        // Determine view
        if (data.user.role === 'ADMIN') {
          setCurrentView('admin-dashboard');
          // Fetch admin evaluation state
          try {
            const res = await api.adminGetEvaluationResults();
            setEvaluationState(res.evaluationState);
            setLeaderboard(res.evaluationState.leaderboard || []);
            setIsLeaderboardPublished(res.evaluationState.isLeaderboardPublished);
          } catch {}
        } else if (data.user.role === 'PLAYER') {
          if (data.event.status === 'LIVE') {
            setCurrentView((prev) => (prev === 'landing' || prev === 'player-login' ? 'player-waiting' : prev));
          } else {
            setCurrentView('player-waiting');
          }
          // Fetch personal result
          try {
            const res = await api.getPlayerMyResult();
            if (res.report) setPlayerEvaluationReport(res.report);
            setIsLeaderboardPublished(res.isPublished);
          } catch {}
        }
      } else {
        const { event } = await api.getEventStatus();
        setEventState(event);
      }
    } catch {
      setStoredToken(null);
      setStoredUser(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Real-Time Server-Sent Events (SSE) Listener with Fallback Polling
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'init') {
              setEventState(parsed.data.event);
              if (parsed.data.players) setPlayersList(parsed.data.players);
              if (parsed.data.evaluationState) {
                setEvaluationState(parsed.data.evaluationState);
                setLeaderboard(parsed.data.evaluationState.leaderboard || []);
                setIsLeaderboardPublished(parsed.data.evaluationState.isLeaderboardPublished);
              }
            } else if (parsed.type === 'event_updated') {
              setEventState(parsed.data);
            } else if (parsed.type === 'event_timer_tick') {
              setEventState((prev) => (prev ? { ...prev, timeRemaining: parsed.data.timeRemaining } : null));
            } else if (parsed.type === 'evaluation_status') {
              setEvaluationState((prev) => (prev ? { ...prev, status: parsed.data.status } : null));
            } else if (parsed.type === 'evaluation_completed' || parsed.type === 'evaluation_updated') {
              setEvaluationState(parsed.data);
              setLeaderboard(parsed.data.leaderboard || []);
              setIsLeaderboardPublished(parsed.data.isLeaderboardPublished);
              if (currentUser?.role === 'PLAYER' && parsed.data.reports?.[currentUser.id]) {
                setPlayerEvaluationReport(parsed.data.reports[currentUser.id]);
              }
            } else if (parsed.type === 'leaderboard_published') {
              setIsLeaderboardPublished(true);
              if (parsed.data.leaderboard) setLeaderboard(parsed.data.leaderboard);
            } else if (parsed.type === 'players_updated') {
              setPlayersList(parsed.data);
              // Update current player's progress if matched
              if (currentUser && currentUser.role === 'PLAYER') {
                const myProg = (parsed.data as PlayerProgress[]).find((p) => p.playerId === currentUser.id);
                if (myProg) {
                  setPlayerProgress(myProg);
                  if (myProg.accountStatus === 'Disabled') {
                    setStoredToken(null);
                    setStoredUser(null);
                    setCurrentUser(null);
                    setAccountDisabledNotice('Your account has been temporarily disabled by the event administrator.');
                    setCurrentView('landing');
                  }
                }
              }
            } else if (parsed.type === 'force_logout') {
              if (currentUser && currentUser.id === parsed.data?.userId) {
                setStoredToken(null);
                setStoredUser(null);
                setCurrentUser(null);
                setError('You have been logged out by the administrator.');
                setCurrentView('landing');
              }
            } else if (parsed.type === 'user_disabled') {
              if (currentUser && currentUser.id === parsed.data?.userId) {
                setStoredToken(null);
                setStoredUser(null);
                setCurrentUser(null);
                setAccountDisabledNotice('Your account has been temporarily disabled by the event administrator.');
                setCurrentView('landing');
              }
            }
          } catch (e) {
            console.warn('Error parsing SSE message', e);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
        };
      } catch (err) {
        console.warn('SSE not available, falling back to polling', err);
      }
    };

    connectSSE();

    // Fallback polling every 3 seconds for 100% real-time guarantees
    pollInterval = setInterval(async () => {
      try {
        const { event } = await api.getEventStatus();
        setEventState(event);

        if (currentUser?.role === 'ADMIN') {
          const { players } = await api.adminGetPlayers();
          setPlayersList(players);
          const evalRes = await api.adminGetEvaluationResults().catch(() => null);
          if (evalRes?.evaluationState) {
            setEvaluationState(evalRes.evaluationState);
            setLeaderboard(evalRes.evaluationState.leaderboard || []);
            setIsLeaderboardPublished(evalRes.evaluationState.isLeaderboardPublished);
          }
        } else if (currentUser?.role === 'PLAYER') {
          const meData = await api.getMe().catch(() => null);
          if (meData?.progress) setPlayerProgress(meData.progress);
          const myResult = await api.getPlayerMyResult().catch(() => null);
          if (myResult?.report) setPlayerEvaluationReport(myResult.report);
          if (myResult?.isPublished !== undefined) setIsLeaderboardPublished(myResult.isPublished);
        }
      } catch {
        // quiet ignore
      }
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Auth: Player Login (Password removed; uses name & registerNumber)
  const loginPlayer = async (name: string, registerNumber: string, _pass?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.loginPlayer(name, registerNumber);
      setCurrentUser(data.user);
      setEventState(data.event);
      if (data.progress) setPlayerProgress(data.progress);

      // Prompt requirement: "After successful login, do NOT immediately allow the player to start the investigation. Instead, show the Player Waiting Dashboard."
      setCurrentView('player-waiting');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auth: Admin Login
  const loginAdmin = async (username: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login(username, pass, 'ADMIN');
      setCurrentUser(data.user);
      setEventState(data.event);
      setCurrentView('admin-dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    await api.logout();
    setCurrentUser(null);
    setPlayerProgress(null);
    setCurrentView('landing');
  };

  // Admin Controls
  const startEvent = async () => {
    const res = await api.adminStartEvent();
    setEventState(res.event);
  };

  const pauseEvent = async () => {
    const res = await api.adminPauseEvent();
    setEventState(res.event);
  };

  const resumeEvent = async () => {
    const res = await api.adminResumeEvent();
    setEventState(res.event);
  };

  const endEvent = async () => {
    const res = await api.adminEndEvent();
    setEventState(res.event);
  };

  const resetEvent = async () => {
    const res = await api.adminResetEvent();
    setEventState(res.event);
    setPlayerProgress(null);
    const { players } = await api.adminGetPlayers();
    setPlayersList(players);
  };

  const updateSettings = async (settings: Partial<EventState['settings']> & { duration?: number; caseTitle?: string; eventName?: string }) => {
    const res = await api.adminUpdateSettings(settings);
    setEventState(res.event);
  };

  // Admin User Management
  const adminUpdateUser = async (
    userId: string,
    data: { name?: string; username?: string; password?: string; accountStatus?: 'Active' | 'Disabled' | 'Removed' }
  ) => {
    const res = await api.adminUpdateUser(userId, data);
    if (res.players) setPlayersList(res.players);
  };

  const adminResetPassword = async (userId: string, newPassword?: string) => {
    const res = await api.adminResetPassword(userId, newPassword);
    return { temporaryPassword: res.temporaryPassword };
  };

  const adminToggleUserStatus = async (userId: string, status: 'Active' | 'Disabled') => {
    const res = await api.adminToggleUserStatus(userId, status);
    if (res.players) setPlayersList(res.players);
  };

  const adminForceLogout = async (userId: string) => {
    const res = await api.adminForceLogout(userId);
    if (res.players) setPlayersList(res.players);
  };

  const adminRemoveUser = async (userId: string, permanent: boolean = false) => {
    const res = await api.adminRemoveUser(userId, permanent);
    if (res.players) setPlayersList(res.players);
  };

  // Evaluation Actions (Prompts 21-47)
  const fetchEvaluationResults = async () => {
    try {
      const res = await api.adminGetEvaluationResults();
      setEvaluationState(res.evaluationState);
      setLeaderboard(res.evaluationState.leaderboard || []);
      setIsLeaderboardPublished(res.evaluationState.isLeaderboardPublished);
    } catch {}
  };

  const fetchPlayerMyResult = async () => {
    try {
      const res = await api.getPlayerMyResult();
      if (res.report) setPlayerEvaluationReport(res.report);
      setIsLeaderboardPublished(res.isPublished);
    } catch {}
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setIsLeaderboardPublished(res.isPublished);
    } catch {}
  };

  const adminPublishLeaderboard = async () => {
    await api.adminPublishLeaderboard();
    setIsLeaderboardPublished(true);
    if (evaluationState) {
      setEvaluationState({ ...evaluationState, isLeaderboardPublished: true, publishedAt: new Date().toISOString() });
    }
  };

  const adminOverrideScore = async (data: {
    playerId: string;
    investigationScore?: number;
    finalAnswerScore?: number;
    reasoningScore?: number;
    accuracyPercentage?: number;
    reason: string;
  }) => {
    const res = await api.adminOverrideScore(data);
    if (res.report && evaluationState) {
      const updatedReports = { ...evaluationState.reports, [data.playerId]: res.report };
      setEvaluationState({
        ...evaluationState,
        reports: updatedReports,
        leaderboard: res.leaderboard,
      });
      setLeaderboard(res.leaderboard);
    }
  };

  const adminReEvaluate = async () => {
    const res = await api.adminReEvaluate();
    setEvaluationState(res.evaluationState);
    setLeaderboard(res.evaluationState.leaderboard || []);
  };

  const fetchCaseConfig = async () => {
    try {
      const res = await api.adminGetCaseConfig();
      setCaseConfig(res);
    } catch {}
  };

  const adminUpdateCaseConfig = async (data: {
    answerKey?: Partial<AnswerKeyConfig>;
    clueWeights?: Record<string, ClueConfig>;
    rubric?: Partial<ScoringRubricConfig>;
  }) => {
    await api.adminUpdateCaseConfig(data);
    await fetchCaseConfig();
  };

  // Player Actions
  const sendChatMessage = async (suspectId: SuspectId, message: string) => {
    const res = await api.playerSendChat(suspectId, message);
    if (res.progress) setPlayerProgress(res.progress);
    return res;
  };

  const saveNotes = async (notes: string) => {
    const res = await api.playerSaveNotes(notes);
    if (playerProgress) {
      setPlayerProgress({ ...playerProgress, notes: res.notes });
    }
  };

  const submitAccusation = async (accusation: { suspect: string; motive: string; evidence: string[] }) => {
    const res = await api.playerSubmitAccusation(accusation);
    if (res.progress) setPlayerProgress(res.progress);
  };

  return (
    <MysteryContext.Provider
      value={{
        currentUser,
        eventState,
        playerProgress,
        playersList,
        currentView,
        setCurrentView,
        activeSuspectId,
        setActiveSuspectId,
        suspects: SUSPECTS,
        allClues: DISCOVERABLE_CLUES,
        timeline: MASTER_TIMELINE,
        baseline: CASE_BASELINE,
        isLoading,
        error,
        setError,
        loginPlayer,
        loginAdmin,
        logout,
        startEvent,
        pauseEvent,
        resumeEvent,
        endEvent,
        resetEvent,
        updateSettings,
        adminUpdateUser,
        adminResetPassword,
        adminToggleUserStatus,
        adminForceLogout,
        adminRemoveUser,
        accountDisabledNotice,
        clearAccountDisabledNotice,
        evaluationState,
        playerEvaluationReport,
        leaderboard,
        isLeaderboardPublished,
        caseConfig,
        fetchEvaluationResults,
        fetchPlayerMyResult,
        fetchLeaderboard,
        adminPublishLeaderboard,
        adminOverrideScore,
        adminReEvaluate,
        fetchCaseConfig,
        adminUpdateCaseConfig,
        sendChatMessage,
        saveNotes,
        submitAccusation,
        refreshState,
      }}
    >
      {children}
    </MysteryContext.Provider>
  );
};

export function useMystery(): MysteryContextType {
  const context = useContext(MysteryContext);
  if (!context) {
    throw new Error('useMystery must be used within a MysteryProvider');
  }
  return context;
}
