// Evaluation System Data Models & Contracts
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
  maxInvestigationScore: number; // default: 40
  maxFinalAnswerScore: number;    // default: 30
  maxReasoningScore: number;      // default: 20
  maxTimeScore: number;           // default: 10
  // Sub-breakdowns
  investigationBreakdown: {
    criticalCluesWeight: number;    // 20
    supportingCluesWeight: number;  // 10
    evidenceInterpretationWeight: number; // 5
    investigationCompletenessWeight: number; // 5
  };
  finalAnswerBreakdown: {
    conclusionWeight: number;        // 10
    culpritWeight: number;           // 8
    motiveWeight: number;            // 5
    explanationWeight: number;       // 4
    supportingEvidenceWeight: number;// 3
  };
}

export interface PlayerInvestigationRecord {
  playerId: string;
  playerName: string;
  username: string;
  loginTime: string;
  investigationStartTime: string;
  investigationEndTime: string;
  totalInvestigationTimeSeconds: number;
  totalInvestigationTimeFormatted: string;
  suspectsInvestigated: string[];
  totalQuestionsAsked: number;
  importantQuestionsAsked: number;
  cluesDiscovered: string[];
  criticalCluesDiscovered: string[];
  supportingCluesDiscovered: string[];
  evidenceCollected: string[];
  evidenceCorrectlyInterpreted: string[];
  incorrectAssumptions: string[];
  finalConclusion: string;
  finalExplanation: string;
  finalAccusation: {
    suspect: string;
    motive: string;
    evidence: string[];
    submittedAt: string;
  } | null;
  timestampOfFinalSubmission: string | null;
  investigationCompletenessPercentage: number;
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
