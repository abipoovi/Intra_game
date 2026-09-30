import { ClueConfig, ScoringRubricConfig } from './types';

export interface ClueEvaluationResult {
  investigationScore: number;
  criticalCluesScore: number;
  criticalCluesMax: number;
  supportingCluesScore: number;
  supportingCluesMax: number;
  interpretationScore: number;
  interpretationMax: number;
  completenessScore: number;
  completenessMax: number;
  criticalCluesFound: string[];
  supportingCluesFound: string[];
  importantQuestionsCount: number;
  incorrectAssumptions: string[];
  evidenceCorrectlyInterpreted: string[];
  completenessPercentage: number;
}

export function evaluatePlayerClues(
  cluesFound: string[],
  suspectsInvestigated: string[],
  notes: string,
  totalQuestions: number,
  playerQuestions: string[],
  clueWeights: Record<string, ClueConfig>,
  criticalClueIds: string[],
  supportingClueIds: string[],
  rubric: ScoringRubricConfig
): ClueEvaluationResult {
  const criticalMax = rubric.investigationBreakdown.criticalCluesWeight;
  const supportingMax = rubric.investigationBreakdown.supportingCluesWeight;
  const interpretationMax = rubric.investigationBreakdown.evidenceInterpretationWeight;
  const completenessMax = rubric.investigationBreakdown.investigationCompletenessWeight;

  // 1. Critical Clues Scoring
  const foundCritical = criticalClueIds.filter((id) => cluesFound.includes(id));
  const criticalFraction = criticalClueIds.length > 0 ? foundCritical.length / criticalClueIds.length : 0;
  const criticalCluesScore = Math.round(criticalFraction * criticalMax * 10) / 10;

  // 2. Supporting Clues Scoring
  const foundSupporting = supportingClueIds.filter((id) => cluesFound.includes(id));
  const supportingFraction = supportingClueIds.length > 0 ? foundSupporting.length / supportingClueIds.length : 0;
  const supportingCluesScore = Math.round(supportingFraction * supportingMax * 10) / 10;

  // 3. Evidence Interpretation in Notes / Chats
  const notesLower = (notes || '').toLowerCase();
  const evidenceCorrectlyInterpreted: string[] = [];
  const incorrectAssumptions: string[] = [];

  // Check correct interpretations
  if (cluesFound.includes('clue-breaker-tripped')) {
    if (notesLower.includes('breaker') || notesLower.includes('power') || notesLower.includes('blackout') || notesLower.includes('9:42') || notesLower.includes('electric') || notesLower.includes('perumal')) {
      evidenceCorrectlyInterpreted.push('Main breaker recognized as manually tripped inside the house');
    }
  }

  if (cluesFound.includes('clue-advance-payment')) {
    if (notesLower.includes('perumal') || notesLower.includes('10 lakh') || notesLower.includes('bribe') || notesLower.includes('daughter') || notesLower.includes('wedding')) {
      evidenceCorrectlyInterpreted.push('Deposit slip recognized as ₹10 Lakh bribe to cook Perumal for the blackout');
    }
  }

  if (cluesFound.includes('clue-failed-deal')) {
    if (notesLower.includes('vicky') || notesLower.includes('debt') || notesLower.includes('85') || notesLower.includes('creditor') || notesLower.includes('financial')) {
      evidenceCorrectlyInterpreted.push("Vicky's debt notices recognized as desperate financial motive");
    }
  }

  if (cluesFound.includes('clue-missing-settlement')) {
    if (notesLower.includes('settlement') || notesLower.includes('deed') || notesLower.includes('safe') || notesLower.includes('disinherit') || notesLower.includes('property')) {
      evidenceCorrectlyInterpreted.push('Missing deed recognized as purpose of the study confrontation');
    }
  }

  if (cluesFound.includes('clue-police-cctv')) {
    if (notesLower.includes('rangan') && (notesLower.includes('alibi') || notesLower.includes('police') || notesLower.includes('cctv') || notesLower.includes('station') || notesLower.includes('innocent'))) {
      evidenceCorrectlyInterpreted.push("Rangan's police station presence correctly identified as alibi");
    }
  }

  // Detect incorrect assumptions (e.g. blaming innocent cook, daughter, or rival without evidence)
  if (notesLower.includes('perumal killed') || notesLower.includes('perumal is the murderer') || notesLower.includes('cook killed')) {
    incorrectAssumptions.push('Assumed cook Perumal was the murderer (he only switched the breaker for money)');
  }
  if (notesLower.includes('meena killed') || notesLower.includes('meena is the murderer') || notesLower.includes('daughter killed')) {
    incorrectAssumptions.push('Assumed daughter Meena was the murderer contrary to evidence (red herring ledger)');
  }
  if (notesLower.includes('rangan killed') || notesLower.includes('rangan is the murderer')) {
    incorrectAssumptions.push('Assumed rival Rangan was the murderer despite certified police station alibi');
  }

  let interpretationScore = 0;
  if (evidenceCorrectlyInterpreted.length >= 2) {
    interpretationScore = interpretationMax;
  } else if (evidenceCorrectlyInterpreted.length === 1) {
    interpretationScore = Math.round(interpretationMax * 0.6 * 10) / 10;
  } else if (cluesFound.length > 0) {
    // Player found clues but did not synthesize in notes
    interpretationScore = Math.round(interpretationMax * 0.3 * 10) / 10;
  }

  // Penalty for major incorrect assumptions
  if (incorrectAssumptions.length > 0) {
    interpretationScore = Math.max(0, interpretationScore - incorrectAssumptions.length * 1.5);
  }

  // 4. Investigation Completeness
  // 4 suspects investigated + at least 4 clues found + at least 6 questions asked
  const suspectsCovered = suspectsInvestigated.length;
  let completenessFraction = 0;
  completenessFraction += (Math.min(suspectsCovered, 4) / 4) * 0.4;
  completenessFraction += (Math.min(cluesFound.length, 6) / 6) * 0.4;
  completenessFraction += (Math.min(totalQuestions, 8) / 8) * 0.2;
  const completenessPercentage = Math.min(100, Math.round(completenessFraction * 100));
  const completenessScore = Math.round((completenessPercentage / 100) * completenessMax * 10) / 10;

  // 5. Count Important Questions asked
  // Important questions touch on: loan, 3.5 crore, audit, torn, mud, boots, shed, car keys, safe, diary
  const importantKeywords = [
    'loan', 'guarantee', '3.5', 'audit', 'torn', 'wastebasket',
    'mud', 'boot', 'veranda', 'car shed', 'shed', 'ambassador', 'key',
    'safe', 'diary', 'confrontation', 'argument',
  ];

  let importantQuestionsCount = 0;
  for (const q of playerQuestions) {
    const qLower = q.toLowerCase();
    if (importantKeywords.some((kw) => qLower.includes(kw))) {
      importantQuestionsCount++;
    }
  }

  const investigationScore = Math.min(
    rubric.maxInvestigationScore,
    Math.round((criticalCluesScore + supportingCluesScore + interpretationScore + completenessScore) * 10) / 10
  );

  return {
    investigationScore,
    criticalCluesScore,
    criticalCluesMax: criticalMax,
    supportingCluesScore,
    supportingCluesMax: supportingMax,
    interpretationScore,
    interpretationMax,
    completenessScore,
    completenessMax,
    criticalCluesFound: foundCritical,
    supportingCluesFound: foundSupporting,
    importantQuestionsCount,
    incorrectAssumptions,
    evidenceCorrectlyInterpreted,
    completenessPercentage,
  };
}
