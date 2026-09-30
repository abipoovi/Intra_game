export type UserRole = 'PLAYER' | 'ADMIN';
export type LoginStatus = 'Online' | 'Offline';
export type AccountStatus = 'Active' | 'Disabled' | 'Removed';
export type InvestigationStatus = 'Not Started' | 'Investigating' | 'Completed';
export type EventStatus = 'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'ENDED';

export interface User {
  id: string;
  name: string;
  username: string;
  registerNumber?: string;
  role: UserRole;
  loginStatus: LoginStatus;
  accountStatus: AccountStatus;
  createdAt: string;
  lastActive: string;
}

export interface EventSettings {
  accusationEnabled: boolean;
  notesEnabled: boolean;
  cluesVisible: boolean;
  duration: number; // in minutes
}

export interface EventState {
  eventId: string;
  eventName: string;
  caseTitle: string;
  status: EventStatus;
  startTime: number | null;
  endTime: number | null;
  duration: number; // in minutes
  timeRemaining: number; // in seconds
  createdAt: string;
  settings: EventSettings;
}

export type SuspectId = 'vicky' | 'perumal' | 'meena' | 'rangan' | 'arjun' | 'kamatchi' | string;

export interface Suspect {
  id: SuspectId;
  name: string;
  role: string;
  age: number;
  relation: string;
  avatar: string;
  demeanor: string;
  baselineInfo: string;
  initialMessage: string;
  suggestedQuestions: string[];
}

export interface Clue {
  id: string;
  title: string;
  category: string;
  description: string;
  foundAt: string;
  suspectSource: SuspectId | 'scene';
  icon: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  source: string;
  clueRef?: string;
}

export interface PlayerAccusation {
  suspect: string;
  motive: string;
  evidence: string[];
  submittedAt: string;
}

export interface PlayerProgress {
  playerId: string;
  playerName: string;
  username?: string;
  registerNumber?: string;
  loginStatus: LoginStatus;
  accountStatus: AccountStatus;
  investigationStatus: InvestigationStatus;
  suspectsInvestigated: string[];
  questionsAsked: number;
  cluesFound: string[];
  progressPercentage: number;
  notes: string;
  accusation: PlayerAccusation | null;
  completed: boolean;
  lastActivity: string;
  loginTime: string;
  suspectStages?: Record<string, number>;
  score?: number;
  accuracyPercentage?: number;
  scoreBreakdown?: {
    investigationScore: number;
    investigationMax: number;
    finalAnswerScore: number;
    finalAnswerMax: number;
    reasoningScore: number;
    reasoningMax: number;
    timeScore: number;
    timeMax: number;
    totalScore: number;
    totalMax: number;
  };
}

export interface ChatMessage {
  id: string;
  suspectId: SuspectId;
  sender: 'player' | 'suspect';
  text: string;
  timestamp: string;
  discoveredClueId?: string;
  conversationStage?: number;
}

// ==========================================
// EVALUATION SYSTEM TYPES (Prompts 21 - 47)
// ==========================================

export type ClueType = 'Critical' | 'Important' | 'Minor' | 'RedHerring';

export interface ClueConfig {
  id: string;
  title: string;
  type: ClueType;
  weight: number;
  description: string;
  expectedInterpretation: string;
}

export interface AnswerKeyConfig {
  caseTitle: string;
  correctCulpritId: string;
  correctCulpritName: string;
  correctConclusion: string;
  correctMotive: string;
  correctSequenceOfEvents: Array<{ time: string; event: string }>;
  criticalClueIds: string[];
  supportingClueIds: string[];
  redHerringClueIds: string[];
  requiredReasoningPoints: string[];
  acceptableAlternativeExplanations: string[];
}

export interface ScoringRubricConfig {
  maxInvestigationScore: number;
  maxFinalAnswerScore: number;
  maxReasoningScore: number;
  maxTimeScore: number;
  investigationBreakdown: {
    criticalCluesWeight: number;
    supportingCluesWeight: number;
    evidenceInterpretationWeight: number;
    investigationCompletenessWeight: number;
  };
  finalAnswerBreakdown: {
    conclusionWeight: number;
    culpritWeight: number;
    motiveWeight: number;
    explanationWeight: number;
    supportingEvidenceWeight: number;
  };
}

export interface ScoreBreakdown {
  investigationScore: number;
  investigationMax: number;
  investigationDetails: {
    criticalCluesScore: number;
    criticalCluesMax: number;
    supportingCluesScore: number;
    supportingCluesMax: number;
    interpretationScore: number;
    interpretationMax: number;
    completenessScore: number;
    completenessMax: number;
  };
  finalAnswerScore: number;
  finalAnswerMax: number;
  finalAnswerDetails: {
    conclusionScore: number;
    conclusionMax: number;
    culpritScore: number;
    culpritMax: number;
    motiveScore: number;
    motiveMax: number;
    explanationScore: number;
    explanationMax: number;
    evidenceLinkScore: number;
    evidenceLinkMax: number;
  };
  reasoningScore: number;
  reasoningMax: number;
  reasoningDetails: {
    logicalConnectionsScore: number;
    suspectSuspicionScore: number;
    eliminationScore: number;
    multipleCluesScore: number;
    sequenceExplanationScore: number;
  };
  timeScore: number;
  timeMax: number;
  totalScore: number;
  totalMax: number;
}

export interface PlayerEvaluationReport {
  playerId: string;
  playerName: string;
  username: string;
  rank?: number;
  finalScore: number;
  accuracyPercentage: number;
  timeTakenFormatted: string;
  timeTakenSeconds: number;
  isSubmitted: boolean;

  scoreBreakdown: ScoreBreakdown;

  investigationSummary: {
    suspectsInvestigatedCount: number;
    totalSuspects: number;
    questionsAsked: number;
    importantQuestionsCount: number;
    criticalCluesFoundCount: number;
    totalCriticalClues: number;
    supportingCluesFoundCount: number;
    totalSupportingClues: number;
    incorrectAssumptionsCount: number;
    investigationCompleteness: number;
  };

  playerFinalAnswer: {
    suspect: string;
    motive: string;
    evidence: string[];
    notes: string;
    submittedAt: string;
  };

  correctAnswerKeySummary: {
    correctCulprit: string;
    correctMotive: string;
    correctConclusion: string;
  };

  evaluationExplanation: {
    verdict: string;
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };

  evaluatedAt: string;
  manualOverride?: {
    originalScore: number;
    newScore: number;
    originalAccuracy: number;
    newAccuracy: number;
    adminName: string;
    reason: string;
    modifiedAt: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  username: string;
  finalScore: number;
  accuracyPercentage: number;
  timeTakenFormatted: string;
  timeTakenSeconds: number;
  cluesFoundCount: number;
  totalCluesCount: number;
  status: 'Completed' | 'Incomplete' | 'Not Started';
  criticalCluesScore: number;
  reasoningScore: number;
}

export interface EvaluationCenterState {
  status: 'PENDING' | 'EVALUATING' | 'COMPLETED';
  isLeaderboardPublished: boolean;
  publishedAt: string | null;
  completedAt: string | null;
  totalPlayers: number;
  playersEvaluated: number;
  playersPending: number;
  averageScore: number;
  averageAccuracy: number;
  fastestSolver: { playerName: string; time: string } | null;
  highestAccuracy: { playerName: string; accuracy: number } | null;
  mostCluesDiscovered: { playerName: string; count: number } | null;
  mostCompleteInvestigation: { playerName: string; percentage: number } | null;
  reports: Record<string, PlayerEvaluationReport>;
  leaderboard: LeaderboardEntry[];
  auditLogs: Array<{
    playerId: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
}
