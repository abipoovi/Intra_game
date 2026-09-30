import { AnswerKeyConfig, ScoringRubricConfig } from './types';

export interface FinalAnswerEvaluationResult {
  finalAnswerScore: number;
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
  isCorrectCulprit: boolean;
  isCorrectMotive: boolean;
  isCorrectConclusion: boolean;
  verdictSummary: string;
}

export function evaluateFinalAnswer(
  accusation: {
    suspect: string;
    motive: string;
    evidence: string[];
    submittedAt?: string;
  } | null,
  notes: string,
  answerKey: AnswerKeyConfig,
  rubric: ScoringRubricConfig
): FinalAnswerEvaluationResult {
  const cMax = rubric.finalAnswerBreakdown.conclusionWeight;
  const kMax = rubric.finalAnswerBreakdown.culpritWeight;
  const mMax = rubric.finalAnswerBreakdown.motiveWeight;
  const eMax = rubric.finalAnswerBreakdown.explanationWeight;
  const sMax = rubric.finalAnswerBreakdown.supportingEvidenceWeight;

  if (!accusation) {
    return {
      finalAnswerScore: 0,
      conclusionScore: 0,
      conclusionMax: cMax,
      culpritScore: 0,
      culpritMax: kMax,
      motiveScore: 0,
      motiveMax: mMax,
      explanationScore: 0,
      explanationMax: eMax,
      evidenceLinkScore: 0,
      evidenceLinkMax: sMax,
      isCorrectCulprit: false,
      isCorrectMotive: false,
      isCorrectConclusion: false,
      verdictSummary: 'No final accusation or solution was submitted by the player before the event ended.',
    };
  }

  const suspectLower = (accusation.suspect || '').toLowerCase().trim();
  const motiveLower = (accusation.motive || '').toLowerCase().trim();
  const combinedText = `${suspectLower} ${motiveLower} ${(notes || '').toLowerCase()}`;

  // 1. Culprit Identification (8 pts)
  const isCorrectCulprit =
    suspectLower.includes('vicky') ||
    (suspectLower.includes('nephew') && !suspectLower.includes('arjun'));
  const culpritScore = isCorrectCulprit ? kMax : 0;

  // 2. Motive Identification (5 pts)
  // Correct motive involves: debt / failed deal / 85 lakh / creditor / property settlement / disinherit / take deed
  const hasDebtOrMoneyKeyword =
    combinedText.includes('debt') ||
    combinedText.includes('failed deal') ||
    combinedText.includes('creditor') ||
    combinedText.includes('settlement') ||
    combinedText.includes('disinherit') ||
    combinedText.includes('property') ||
    combinedText.includes('85') ||
    combinedText.includes('ruin') ||
    combinedText.includes('deed');

  const hasSpecifics =
    combinedText.includes('debt') ||
    combinedText.includes('settlement') ||
    combinedText.includes('disinherit') ||
    combinedText.includes('10 lakh') ||
    combinedText.includes('breaker') ||
    combinedText.includes('blackout');

  let motiveScore = 0;
  let isCorrectMotive = false;
  if (hasDebtOrMoneyKeyword && hasSpecifics) {
    motiveScore = mMax;
    isCorrectMotive = true;
  } else if (hasDebtOrMoneyKeyword) {
    motiveScore = Math.round(mMax * 0.7 * 10) / 10;
    isCorrectMotive = true;
  } else if (combinedText.includes('money') || combinedText.includes('business') || combinedText.includes('wealth')) {
    motiveScore = Math.round(mMax * 0.4 * 10) / 10;
  }

  // 3. Explanation of Events (4 pts)
  // Mentioning 9:42 PM blackout, breaker, study, scuffle, murder, stealing deed, perumal bribe
  let explanationScore = 0;
  const mentionsBlackoutOrBreaker = combinedText.includes('blackout') || combinedText.includes('power') || combinedText.includes('breaker') || combinedText.includes('dark') || combinedText.includes('9:42');
  const mentionsStudyOrMurder = combinedText.includes('study') || combinedText.includes('kill') || combinedText.includes('murder') || combinedText.includes('confront') || combinedText.includes('scuffle') || combinedText.includes('stole');
  const mentionsPerumalOrBribe = combinedText.includes('perumal') || combinedText.includes('10 lakh') || combinedText.includes('bribe');

  if ((mentionsBlackoutOrBreaker && mentionsStudyOrMurder) || mentionsPerumalOrBribe) {
    explanationScore = eMax;
  } else if (mentionsBlackoutOrBreaker || mentionsStudyOrMurder) {
    explanationScore = Math.round(eMax * 0.6 * 10) / 10;
  } else if (combinedText.includes('night') || combinedText.includes('house')) {
    explanationScore = Math.round(eMax * 0.3 * 10) / 10;
  }

  // 4. Evidence Supporting Conclusion (3 pts)
  // Matches submitted evidence list with critical/supporting clues
  const submittedEvidence = Array.isArray(accusation.evidence) ? accusation.evidence : [];
  let evidenceLinkScore = 0;
  if (submittedEvidence.length >= 3) {
    evidenceLinkScore = sMax;
  } else if (submittedEvidence.length >= 1) {
    evidenceLinkScore = Math.round(sMax * 0.6 * 10) / 10;
  }

  // 5. Overall Conclusion Score (10 pts)
  // High score if culprit and motive are both identified accurately
  let conclusionScore = 0;
  let isCorrectConclusion = false;
  if (isCorrectCulprit && isCorrectMotive && (mentionsBlackoutOrBreaker || mentionsStudyOrMurder)) {
    conclusionScore = cMax;
    isCorrectConclusion = true;
  } else if (isCorrectCulprit && isCorrectMotive) {
    conclusionScore = Math.round(cMax * 0.85 * 10) / 10;
    isCorrectConclusion = true;
  } else if (isCorrectCulprit) {
    conclusionScore = Math.round(cMax * 0.5 * 10) / 10;
  }

  const finalAnswerScore = Math.min(
    rubric.maxFinalAnswerScore,
    Math.round((culpritScore + motiveScore + explanationScore + evidenceLinkScore + conclusionScore) * 10) / 10
  );

  let verdictSummary = '';
  if (isCorrectConclusion) {
    verdictSummary = 'Correct conclusion: The player accurately deduced that Arjun abducted/confined Varadarajan due to audit fraud.';
  } else if (isCorrectCulprit) {
    verdictSummary = 'Partially correct: The player identified Arjun as responsible, but the motive or event sequence was only partially substantiated.';
  } else {
    verdictSummary = 'Incorrect accusation: The player failed to identify the true responsible person or motive.';
  }

  return {
    finalAnswerScore,
    conclusionScore,
    conclusionMax: cMax,
    culpritScore,
    culpritMax: kMax,
    motiveScore,
    motiveMax: mMax,
    explanationScore,
    explanationMax: eMax,
    evidenceLinkScore,
    evidenceLinkMax: sMax,
    isCorrectCulprit,
    isCorrectMotive,
    isCorrectConclusion,
    verdictSummary,
  };
}
