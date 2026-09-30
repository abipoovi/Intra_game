import { GoogleGenAI } from '@google/genai';
import {
  AnswerKeyConfig,
  ClueConfig,
  EvaluationCenterState,
  PlayerEvaluationReport,
  ScoringRubricConfig,
} from './types';
import { evaluatePlayerClues } from './clueEvaluator';
import { evaluateFinalAnswer } from './answerEvaluator';
import { evaluatePlayerReasoning } from './reasoningEvaluator';
import { evaluatePlayerTime } from './timeEvaluator';
import { calculateInvestigationAccuracy } from './accuracyCalculator';
import { generateLeaderboard } from './leaderboard';

export interface RawPlayerInput {
  playerId: string;
  playerName: string;
  username: string;
  loginTime: string;
  investigationStatus: string;
  suspectsInvestigated: string[];
  questionsAsked: number;
  cluesFound: string[];
  notes: string;
  accusation: {
    suspect: string;
    motive: string;
    evidence: string[];
    submittedAt?: string;
  } | null;
  completed: boolean;
  lastActivity: string;
  questionsList: string[];
}

export async function evaluateSinglePlayer(
  player: RawPlayerInput,
  eventStartTimeMs: number | null,
  eventEndTimeMs: number | null,
  eventDurationMinutes: number,
  answerKey: AnswerKeyConfig,
  clueWeights: Record<string, ClueConfig>,
  rubric: ScoringRubricConfig,
  aiClient?: GoogleGenAI
): Promise<PlayerEvaluationReport> {
  // 1. Evaluate Clues & Evidence
  const clueResult = evaluatePlayerClues(
    player.cluesFound,
    player.suspectsInvestigated,
    player.notes,
    player.questionsAsked,
    player.questionsList,
    clueWeights,
    answerKey.criticalClueIds,
    answerKey.supportingClueIds,
    rubric
  );

  // 2. Evaluate Final Answer
  const answerResult = evaluateFinalAnswer(player.accusation, player.notes, answerKey, rubric);

  // 3. Evaluate Reasoning (AI assisted + deterministic fallback)
  const reasoningResult = await evaluatePlayerReasoning(
    player.accusation ? `${player.accusation.suspect}: ${player.accusation.motive}` : '',
    player.notes,
    player.cluesFound,
    answerKey,
    rubric,
    aiClient
  );

  // 4. Evaluate Time Taken
  // Determine submission timestamp or end of event
  let submissionTimestampMs: number | null = null;
  if (player.accusation?.submittedAt && eventStartTimeMs) {
    // If submitted, approximate to valid time range
    submissionTimestampMs = eventEndTimeMs || Date.now();
  } else if (player.completed && eventEndTimeMs) {
    submissionTimestampMs = eventEndTimeMs;
  }

  const isSubstantialAccuracy = answerResult.isCorrectCulprit || clueResult.criticalCluesFound.length > 0;
  const timeResult = evaluatePlayerTime(
    eventStartTimeMs,
    submissionTimestampMs,
    eventDurationMinutes,
    rubric,
    isSubstantialAccuracy
  );

  // 5. Calculate Final Score (100 pt system)
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (clueResult.investigationScore +
          answerResult.finalAnswerScore +
          reasoningResult.reasoningScore +
          timeResult.timeScore) *
          10
      ) / 10
    )
  );

  // 6. Calculate Separate Investigation Accuracy %
  const accuracyPercentage = calculateInvestigationAccuracy(
    clueResult,
    answerResult,
    reasoningResult,
    answerKey.criticalClueIds.length + answerKey.supportingClueIds.length
  );

  // 7. Synthesize Evaluation Explanation
  const verdict = answerResult.isCorrectConclusion
    ? 'Case Solved: Master Detective'
    : answerResult.isCorrectCulprit
    ? 'Partially Solved: Perpetrator Identified'
    : player.accusation
    ? 'Case Unresolved: Incorrect Conclusion'
    : 'Incomplete: No Final Accusation Filed';

  const strengths: string[] = [
    ...reasoningResult.reasoningStrengths,
    ...clueResult.evidenceCorrectlyInterpreted,
  ];
  if (clueResult.criticalCluesFound.length === answerKey.criticalClueIds.length) {
    strengths.push('Discovered 100% of critical forensic evidence');
  }

  const weaknesses: string[] = [
    ...reasoningResult.reasoningWeaknesses,
    ...clueResult.incorrectAssumptions,
  ];
  if (!player.accusation) {
    weaknesses.push('Investigation concluded before official case submission');
  }
  if (clueResult.criticalCluesFound.length < answerKey.criticalClueIds.length) {
    weaknesses.push(
      `Missed ${answerKey.criticalClueIds.length - clueResult.criticalCluesFound.length} critical clues`
    );
  }

  const summaryText = `${verdict}. Final score of ${totalScore}/100 with an overall investigation accuracy of ${accuracyPercentage}%. ${answerResult.verdictSummary} ${reasoningResult.reasoningSummary}`;

  return {
    playerId: player.playerId,
    playerName: player.playerName,
    username: player.username,
    finalScore: totalScore,
    accuracyPercentage,
    timeTakenFormatted: timeResult.timeTakenFormatted,
    timeTakenSeconds: timeResult.timeTakenSeconds,
    isSubmitted: timeResult.isSubmitted,
    scoreBreakdown: {
      investigationScore: clueResult.investigationScore,
      investigationMax: rubric.maxInvestigationScore,
      investigationDetails: {
        criticalCluesScore: clueResult.criticalCluesScore,
        criticalCluesMax: clueResult.criticalCluesMax,
        supportingCluesScore: clueResult.supportingCluesScore,
        supportingCluesMax: clueResult.supportingCluesMax,
        interpretationScore: clueResult.interpretationScore,
        interpretationMax: clueResult.interpretationMax,
        completenessScore: clueResult.completenessScore,
        completenessMax: clueResult.completenessMax,
      },
      finalAnswerScore: answerResult.finalAnswerScore,
      finalAnswerMax: rubric.maxFinalAnswerScore,
      finalAnswerDetails: {
        conclusionScore: answerResult.conclusionScore,
        conclusionMax: answerResult.conclusionMax,
        culpritScore: answerResult.culpritScore,
        culpritMax: answerResult.culpritMax,
        motiveScore: answerResult.motiveScore,
        motiveMax: answerResult.motiveMax,
        explanationScore: answerResult.explanationScore,
        explanationMax: answerResult.explanationMax,
        evidenceLinkScore: answerResult.evidenceLinkScore,
        evidenceLinkMax: answerResult.evidenceLinkMax,
      },
      reasoningScore: reasoningResult.reasoningScore,
      reasoningMax: rubric.maxReasoningScore,
      reasoningDetails: {
        logicalConnectionsScore: reasoningResult.logicalConnectionsScore,
        suspectSuspicionScore: reasoningResult.suspectSuspicionScore,
        eliminationScore: reasoningResult.eliminationScore,
        multipleCluesScore: reasoningResult.multipleCluesScore,
        sequenceExplanationScore: reasoningResult.sequenceExplanationScore,
      },
      timeScore: timeResult.timeScore,
      timeMax: rubric.maxTimeScore,
      totalScore,
      totalMax: 100,
    },
    investigationSummary: {
      suspectsInvestigatedCount: player.suspectsInvestigated.length,
      totalSuspects: 3,
      questionsAsked: player.questionsAsked,
      importantQuestionsCount: clueResult.importantQuestionsCount,
      criticalCluesFoundCount: clueResult.criticalCluesFound.length,
      totalCriticalClues: answerKey.criticalClueIds.length,
      supportingCluesFoundCount: clueResult.supportingCluesFound.length,
      totalSupportingClues: answerKey.supportingClueIds.length,
      incorrectAssumptionsCount: clueResult.incorrectAssumptions.length,
      investigationCompleteness: clueResult.completenessPercentage,
    },
    playerFinalAnswer: {
      suspect: player.accusation?.suspect || 'None',
      motive: player.accusation?.motive || 'None',
      evidence: player.accusation?.evidence || [],
      notes: player.notes || 'None recorded',
      submittedAt: player.accusation?.submittedAt || 'N/A',
    },
    correctAnswerKeySummary: {
      correctCulprit: answerKey.correctCulpritName,
      correctMotive: answerKey.correctMotive,
      correctConclusion: answerKey.correctConclusion,
    },
    evaluationExplanation: {
      verdict,
      strengths,
      weaknesses,
      summary: summaryText,
    },
    evaluatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function evaluateAllPlayers(
  players: RawPlayerInput[],
  eventStartTimeMs: number | null,
  eventEndTimeMs: number | null,
  eventDurationMinutes: number,
  answerKey: AnswerKeyConfig,
  clueWeights: Record<string, ClueConfig>,
  rubric: ScoringRubricConfig,
  aiClient?: GoogleGenAI
): Promise<{
  reports: Record<string, PlayerEvaluationReport>;
  leaderboard: ReturnType<typeof generateLeaderboard>;
  summary: {
    totalPlayers: number;
    playersEvaluated: number;
    playersPending: number;
    averageScore: number;
    averageAccuracy: number;
    fastestSolver: { playerName: string; time: string } | null;
    highestAccuracy: { playerName: string; accuracy: number } | null;
    mostCluesDiscovered: { playerName: string; count: number } | null;
    mostCompleteInvestigation: { playerName: string; percentage: number } | null;
  };
}> {
  const reports: Record<string, PlayerEvaluationReport> = {};

  for (const player of players) {
    reports[player.playerId] = await evaluateSinglePlayer(
      player,
      eventStartTimeMs,
      eventEndTimeMs,
      eventDurationMinutes,
      answerKey,
      clueWeights,
      rubric,
      aiClient
    );
  }

  // 8. Generate Leaderboard with Deterministic Tie-Breaker
  const leaderboard = generateLeaderboard(reports);

  // 9. Compute Evaluation Center Summary Metrics (Prompt 34 & 45)
  const evaluatedList = Object.values(reports);
  const totalCount = evaluatedList.length;
  const avgScore =
    totalCount > 0
      ? Math.round((evaluatedList.reduce((acc, r) => acc + r.finalScore, 0) / totalCount) * 10) / 10
      : 0;
  const avgAccuracy =
    totalCount > 0
      ? Math.round(
          (evaluatedList.reduce((acc, r) => acc + r.accuracyPercentage, 0) / totalCount) * 10
        ) / 10
      : 0;

  // Fastest correct solver
  const correctSolvers = evaluatedList.filter(
    (r) => r.isSubmitted && r.scoreBreakdown.finalAnswerDetails.culpritScore > 0
  );
  correctSolvers.sort((a, b) => a.timeTakenSeconds - b.timeTakenSeconds);
  const fastestSolver =
    correctSolvers.length > 0
      ? { playerName: correctSolvers[0].playerName, time: correctSolvers[0].timeTakenFormatted }
      : null;

  // Highest accuracy
  const sortedByAccuracy = [...evaluatedList].sort((a, b) => b.accuracyPercentage - a.accuracyPercentage);
  const highestAccuracy =
    sortedByAccuracy.length > 0
      ? { playerName: sortedByAccuracy[0].playerName, accuracy: sortedByAccuracy[0].accuracyPercentage }
      : null;

  // Most clues discovered
  const sortedByClues = [...evaluatedList].sort((a, b) => {
    const aCount =
      a.investigationSummary.criticalCluesFoundCount + a.investigationSummary.supportingCluesFoundCount;
    const bCount =
      b.investigationSummary.criticalCluesFoundCount + b.investigationSummary.supportingCluesFoundCount;
    return bCount - aCount;
  });
  const mostCluesDiscovered =
    sortedByClues.length > 0
      ? {
          playerName: sortedByClues[0].playerName,
          count:
            sortedByClues[0].investigationSummary.criticalCluesFoundCount +
            sortedByClues[0].investigationSummary.supportingCluesFoundCount,
        }
      : null;

  // Most complete investigation
  const sortedByCompleteness = [...evaluatedList].sort(
    (a, b) => b.investigationSummary.investigationCompleteness - a.investigationSummary.investigationCompleteness
  );
  const mostCompleteInvestigation =
    sortedByCompleteness.length > 0
      ? {
          playerName: sortedByCompleteness[0].playerName,
          percentage: sortedByCompleteness[0].investigationSummary.investigationCompleteness,
        }
      : null;

  return {
    reports,
    leaderboard,
    summary: {
      totalPlayers: totalCount,
      playersEvaluated: totalCount,
      playersPending: 0,
      averageScore: avgScore,
      averageAccuracy: avgAccuracy,
      fastestSolver,
      highestAccuracy,
      mostCluesDiscovered,
      mostCompleteInvestigation,
    },
  };
}

export function exportLeaderboardCSV(leaderboard: ReturnType<typeof generateLeaderboard>): string {
  const headers = ['Rank', 'Player Name', 'Username', 'Score (Max 100)', 'Accuracy %', 'Time Taken', 'Clues Found', 'Status'];
  const rows = leaderboard.map((e) => [
    e.rank,
    `"${e.playerName.replace(/"/g, '""')}"`,
    `"${e.username}"`,
    e.finalScore,
    `${e.accuracyPercentage}%`,
    `"${e.timeTakenFormatted}"`,
    `"${e.cluesFoundCount}/${e.totalCluesCount}"`,
    e.status,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
