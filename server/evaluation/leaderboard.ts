import { LeaderboardEntry, PlayerEvaluationReport } from './types';

export function generateLeaderboard(reports: Record<string, PlayerEvaluationReport>): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = Object.values(reports).map((r) => {
    let status: 'Completed' | 'Incomplete' | 'Not Started' = 'Not Started';
    if (r.isSubmitted) {
      status = 'Completed';
    } else if (r.investigationSummary.questionsAsked > 0 || r.investigationSummary.criticalCluesFoundCount > 0) {
      status = 'Incomplete';
    }

    const cluesFoundCount =
      r.investigationSummary.criticalCluesFoundCount + r.investigationSummary.supportingCluesFoundCount;
    const totalCluesCount =
      r.investigationSummary.totalCriticalClues + r.investigationSummary.totalSupportingClues;

    return {
      rank: 0,
      playerId: r.playerId,
      playerName: r.playerName,
      username: r.username,
      finalScore: r.finalScore,
      accuracyPercentage: r.accuracyPercentage,
      timeTakenFormatted: r.timeTakenFormatted,
      timeTakenSeconds: r.timeTakenSeconds,
      cluesFoundCount,
      totalCluesCount,
      status,
      criticalCluesScore: r.scoreBreakdown.investigationDetails.criticalCluesScore,
      reasoningScore: r.scoreBreakdown.reasoningScore,
    };
  });

  // DETERMINISTIC TIE-BREAKER SORTING (Prompt 37 & 38)
  // 1. FINAL SCORE (higher ranks higher)
  // 2. INVESTIGATION ACCURACY (higher ranks higher)
  // 3. CORRECT CRITICAL CLUES SCORE (higher ranks higher)
  // 4. REASONING SCORE (higher ranks higher)
  // 5. TIME TAKEN (lower time ranks higher)
  entries.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    if (b.accuracyPercentage !== a.accuracyPercentage) {
      return b.accuracyPercentage - a.accuracyPercentage;
    }
    if (b.criticalCluesScore !== a.criticalCluesScore) {
      return b.criticalCluesScore - a.criticalCluesScore;
    }
    if (b.reasoningScore !== a.reasoningScore) {
      return b.reasoningScore - a.reasoningScore;
    }
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  // Assign deterministic ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
    if (reports[entry.playerId]) {
      reports[entry.playerId].rank = entry.rank;
    }
  });

  return entries;
}
