import { ClueEvaluationResult } from './clueEvaluator';
import { FinalAnswerEvaluationResult } from './answerEvaluator';
import { ReasoningEvaluationResult } from './reasoningEvaluator';

export function calculateInvestigationAccuracy(
  clueResult: ClueEvaluationResult,
  answerResult: FinalAnswerEvaluationResult,
  reasoningResult: ReasoningEvaluationResult,
  totalAvailableCluesCount: number = 5
): number {
  // Accuracy components (100% total weight):
  // 1. Evidence Identified & Discovered: 35%
  // 2. Correct Interpretation of Evidence: 15%
  // 3. Suspect Identification: 20%
  // 4. Motive Identification: 15%
  // 5. Logical Sequence & Conclusion: 15%

  const cluesFoundCount = clueResult.criticalCluesFound.length + clueResult.supportingCluesFound.length;
  const evidenceFraction = Math.min(1, cluesFoundCount / Math.max(1, totalAvailableCluesCount));
  const evidenceComponent = evidenceFraction * 35;

  const interpretationFraction =
    clueResult.interpretationMax > 0
      ? clueResult.interpretationScore / clueResult.interpretationMax
      : 0;
  const interpretationComponent = interpretationFraction * 15;

  const suspectComponent = answerResult.isCorrectCulprit ? 20 : 0;

  const motiveFraction =
    answerResult.motiveMax > 0 ? answerResult.motiveScore / answerResult.motiveMax : 0;
  const motiveComponent = motiveFraction * 15;

  const conclusionFraction =
    answerResult.conclusionMax > 0 ? answerResult.conclusionScore / answerResult.conclusionMax : 0;
  const sequenceFraction =
    reasoningResult.reasoningMax > 0 ? reasoningResult.reasoningScore / reasoningResult.reasoningMax : 0;
  const conclusionComponent = (conclusionFraction * 0.6 + sequenceFraction * 0.4) * 15;

  const rawAccuracy = evidenceComponent + interpretationComponent + suspectComponent + motiveComponent + conclusionComponent;
  return Math.max(0, Math.min(100, Math.round(rawAccuracy * 10) / 10));
}
