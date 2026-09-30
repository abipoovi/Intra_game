import { ScoringRubricConfig } from './types';

export interface TimeEvaluationResult {
  timeScore: number;
  timeMax: number;
  timeTakenSeconds: number;
  timeTakenFormatted: string;
  isSubmitted: boolean;
}

export function evaluatePlayerTime(
  startTimeMs: number | null,
  submissionTimeMs: number | null,
  eventDurationMinutes: number,
  rubric: ScoringRubricConfig,
  isAccuracySubstantial: boolean // true if player scored at least 40% on clues & conclusion
): TimeEvaluationResult {
  const maxScore = rubric.maxTimeScore; // default: 10
  const durationSeconds = (eventDurationMinutes || 60) * 60;

  let timeTakenSeconds = durationSeconds;
  let isSubmitted = false;

  if (startTimeMs && submissionTimeMs && submissionTimeMs >= startTimeMs) {
    timeTakenSeconds = Math.min(durationSeconds, Math.round((submissionTimeMs - startTimeMs) / 1000));
    isSubmitted = true;
  } else if (startTimeMs) {
    // Player never submitted before event ended; use event duration
    timeTakenSeconds = durationSeconds;
    isSubmitted = false;
  }

  // Calculate controlled time bonus: 10 * (1 - player_time / event_duration)
  // Clamp between 0 and maxScore
  const fractionRemaining = Math.max(0, Math.min(1, 1 - timeTakenSeconds / durationSeconds));
  let calculatedTimeScore = Math.round(maxScore * fractionRemaining * 10) / 10;

  // IMPORTANT FAIRNESS GUARD (Prompt 28):
  // "DO NOT allow the time score to compensate for a substantially incorrect investigation."
  // If the player did not reach substantial investigation accuracy, cap time bonus to avoid false wins
  if (!isAccuracySubstantial) {
    calculatedTimeScore = Math.min(calculatedTimeScore * 0.3, 3);
  }

  const timeScore = Math.max(0, Math.min(maxScore, Math.round(calculatedTimeScore * 10) / 10));

  // Format time taken: "X min Y sec"
  const mins = Math.floor(timeTakenSeconds / 60);
  const secs = timeTakenSeconds % 60;
  const timeTakenFormatted = `${mins} min ${String(secs).padStart(2, '0')} sec`;

  return {
    timeScore,
    timeMax: maxScore,
    timeTakenSeconds,
    timeTakenFormatted,
    isSubmitted,
  };
}
