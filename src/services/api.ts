import { User, EventState, PlayerProgress, ChatMessage, UserRole } from '../types/mystery';

const TOKEN_KEY = 'thm_token';
const USER_KEY = 'thm_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData?.error) errorMsg = errorData.error;
    } catch {
      if (res.statusText) errorMsg = res.statusText;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async loginPlayer(playerName: string, registerNumber: string) {
    const data = await request<{ token: string; user: User; event: EventState; progress: PlayerProgress | null }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          role: 'PLAYER',
          playerName,
          registerNumber,
          username: registerNumber,
        }),
      }
    );
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(username: string, password: string, role: UserRole, playerName?: string) {
    const data = await request<{ token: string; user: User; event: EventState; progress: PlayerProgress | null }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password, role, playerName }),
      }
    );
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken(null);
    setStoredUser(null);
  },

  async getMe() {
    return request<{ user: User; event: EventState; progress: PlayerProgress | null }>('/api/auth/me');
  },

  async getEventStatus() {
    return request<{ event: EventState }>('/api/event/status');
  },

  // Admin Controls
  async adminStartEvent() {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/start', { method: 'POST' });
  },

  async adminPauseEvent() {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/pause', { method: 'POST' });
  },

  async adminResumeEvent() {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/resume', { method: 'POST' });
  },

  async adminEndEvent() {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/end', { method: 'POST' });
  },

  async adminResetEvent() {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/reset', { method: 'POST' });
  },

  async adminUpdateSettings(settings: Partial<EventState['settings']> & { duration?: number; caseTitle?: string; eventName?: string }) {
    return request<{ success: boolean; event: EventState }>('/api/admin/event/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async adminGetPlayers() {
    return request<{ players: PlayerProgress[] }>('/api/admin/players');
  },

  async adminGetPlayerDetails(playerId: string) {
    return request<{ progress: PlayerProgress; chatLogs: Record<string, ChatMessage[]> }>(`/api/admin/players/${playerId}`);
  },

  // Admin User Management (Prompt Section 21-25)
  async adminUpdateUser(
    userId: string,
    data: { name?: string; username?: string; password?: string; accountStatus?: 'Active' | 'Disabled' | 'Removed' }
  ) {
    return request<{ success: boolean; user: User; players: PlayerProgress[] }>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async adminResetPassword(userId: string, newPassword?: string) {
    return request<{ success: boolean; message: string; temporaryPassword?: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });
  },

  async adminToggleUserStatus(userId: string, accountStatus: 'Active' | 'Disabled') {
    return request<{ success: boolean; accountStatus: 'Active' | 'Disabled'; players: PlayerProgress[] }>(
      `/api/admin/users/${userId}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ accountStatus }),
      }
    );
  },

  async adminForceLogout(userId: string) {
    return request<{ success: boolean; message: string; players: PlayerProgress[] }>(
      `/api/admin/users/${userId}/force-logout`,
      {
        method: 'POST',
      }
    );
  },

  async adminRemoveUser(userId: string, permanent: boolean = false) {
    return request<{ success: boolean; message: string; players: PlayerProgress[] }>(
      `/api/admin/users/${userId}?permanent=${permanent}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Player Investigation
  async playerSendChat(suspectId: string, message: string) {
    return request<{ reply: string; discoveredClueId?: string; conversationStage?: number; progress: PlayerProgress }>('/api/player/chat', {
      method: 'POST',
      body: JSON.stringify({ suspectId, message }),
    });
  },

  async playerGetChat(suspectId: string) {
    return request<{ history: ChatMessage[]; conversationStage?: number }>(`/api/player/chat/${suspectId}`);
  },

  async playerSaveNotes(notes: string) {
    return request<{ success: boolean; notes: string }>('/api/player/notes', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async playerSubmitAccusation(accusation: { suspect: string; motive: string; evidence: string[] }) {
    return request<{ success: boolean; progress: PlayerProgress }>('/api/player/accusation', {
      method: 'POST',
      body: JSON.stringify(accusation),
    });
  },

  // ==========================================
  // EVALUATION SYSTEM API (Prompts 21-47)
  // ==========================================

  async adminGetEvaluationStatus() {
    return request<{
      status: 'PENDING' | 'EVALUATING' | 'COMPLETED';
      isLeaderboardPublished: boolean;
      completedAt: string | null;
    }>('/api/admin/evaluation/status');
  },

  async adminGetEvaluationResults() {
    return request<{ evaluationState: import('../types/mystery').EvaluationCenterState }>('/api/admin/evaluation/results');
  },

  async adminGetPlayerReport(playerId: string) {
    return request<{ report: import('../types/mystery').PlayerEvaluationReport }>(`/api/admin/evaluation/player/${playerId}`);
  },

  async adminOverrideScore(data: {
    playerId: string;
    investigationScore?: number;
    finalAnswerScore?: number;
    reasoningScore?: number;
    accuracyPercentage?: number;
    reason: string;
  }) {
    return request<{ success: boolean; report: import('../types/mystery').PlayerEvaluationReport; leaderboard: import('../types/mystery').LeaderboardEntry[] }>(
      '/api/admin/evaluation/override',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async adminPublishLeaderboard() {
    return request<{ success: boolean; message: string }>('/api/admin/evaluation/publish', {
      method: 'POST',
    });
  },

  async adminReEvaluate() {
    return request<{ success: boolean; evaluationState: import('../types/mystery').EvaluationCenterState }>(
      '/api/admin/evaluation/re-evaluate',
      {
        method: 'POST',
      }
    );
  },

  async adminGetCaseConfig() {
    return request<{
      answerKey: import('../types/mystery').AnswerKeyConfig;
      clueWeights: Record<string, import('../types/mystery').ClueConfig>;
      rubric: import('../types/mystery').ScoringRubricConfig;
      scoringLocked: boolean;
    }>('/api/admin/case-config');
  },

  async adminUpdateCaseConfig(data: {
    answerKey?: Partial<import('../types/mystery').AnswerKeyConfig>;
    clueWeights?: Record<string, import('../types/mystery').ClueConfig>;
    rubric?: Partial<import('../types/mystery').ScoringRubricConfig>;
  }) {
    return request<{ success: boolean; message: string }>('/api/admin/case-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getLeaderboard() {
    return request<{
      leaderboard: import('../types/mystery').LeaderboardEntry[];
      isPublished: boolean;
    }>('/api/evaluation/leaderboard');
  },

  async getPlayerMyResult() {
    return request<{
      report: import('../types/mystery').PlayerEvaluationReport | null;
      isPublished: boolean;
    }>('/api/player/evaluation/my-result');
  },
};
