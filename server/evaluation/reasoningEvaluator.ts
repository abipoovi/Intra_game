import { GoogleGenAI } from '@google/genai';
import { AnswerKeyConfig, ScoringRubricConfig } from './types';

export interface ReasoningEvaluationResult {
  reasoningScore: number;
  reasoningMax: number;
  logicalConnectionsScore: number;
  suspectSuspicionScore: number;
  eliminationScore: number;
  multipleCluesScore: number;
  sequenceExplanationScore: number;
  reasoningStrengths: string[];
  reasoningWeaknesses: string[];
  reasoningSummary: string;
}

export async function evaluatePlayerReasoning(
  accusationText: string,
  notesText: string,
  cluesFound: string[],
  answerKey: AnswerKeyConfig,
  rubric: ScoringRubricConfig,
  aiClient?: GoogleGenAI
): Promise<ReasoningEvaluationResult> {
  const maxScore = rubric.maxReasoningScore; // default 20
  const combinedText = `${accusationText || ''}\n${notesText || ''}`.trim();

  // If player wrote nothing or trivial words (< 5 characters)
  if (!combinedText || combinedText.length < 5) {
    return {
      reasoningScore: 0,
      reasoningMax: maxScore,
      logicalConnectionsScore: 0,
      suspectSuspicionScore: 0,
      eliminationScore: 0,
      multipleCluesScore: 0,
      sequenceExplanationScore: 0,
      reasoningStrengths: [],
      reasoningWeaknesses: ['No reasoning or notes were provided by the player.'],
      reasoningSummary: 'No deduction logic presented.',
    };
  }

  // If AI client is available, try evaluating reasoning with Gemini
  if (aiClient) {
    try {
      const prompt = `
You are the Chief Detective Evaluator for "The Hidden Mystery" campus challenge.
Evaluate the detective reasoning submitted by a player based strictly on the official Case Answer Key.

OFFICIAL CASE ANSWER KEY:
- Culprit: ${answerKey.correctCulpritName}
- Motive: ${answerKey.correctMotive}
- Key Evidence: ₹3.5 Crore unauthorized loan guarantee, red mud boot prints to car shed, stolen Ambassador car keys, missing private diary.
- Correct Reasoning Requirements:
${answerKey.requiredReasoningPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

PLAYER SUBMISSION:
Accusation & Motive: "${accusationText}"
Detective Notes: "${notesText}"
Clues Collected: ${cluesFound.join(', ')}

EVALUATION RULES:
1. Concise, logically sound reasoning scores HIGHER than long rambling text with incorrect assumptions.
2. Award points across 5 dimensions:
   - logicalConnections (0-5 pts): Does player connect evidence to perpetrator logically?
   - suspectSuspicion (0-5 pts): Clearly explains why suspect is guilty?
   - elimination (0-4 pts): Explains why innocent suspects (Meena/Kamatchi) are cleared?
   - multipleClues (0-3 pts): Correlates at least 2 distinct clues together?
   - sequenceExplanation (0-3 pts): Outlines timeline/sequence of the disappearance?
Total maximum is 20 points.

Respond ONLY with valid JSON in this exact structure:
{
  "logicalConnectionsScore": 4.5,
  "suspectSuspicionScore": 4.0,
  "eliminationScore": 3.0,
  "multipleCluesScore": 2.5,
  "sequenceExplanationScore": 2.5,
  "reasoningStrengths": ["string", "string"],
  "reasoningWeaknesses": ["string"],
  "reasoningSummary": "1-2 sentence overall appraisal"
}
`;
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Evaluation AI timeout')), 3500)
      );

      const generatePromise = (async () => {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });
        return response.text?.trim() || '';
      })();

      const raw = await Promise.race([generatePromise, timeoutPromise]);
      if (!raw) throw new Error('Empty AI response');
      const parsed = JSON.parse(raw);
      if (typeof parsed.logicalConnectionsScore === 'number') {
        const lScore = Math.min(5, Math.max(0, parsed.logicalConnectionsScore));
        const sScore = Math.min(5, Math.max(0, parsed.suspectSuspicionScore));
        const eScore = Math.min(4, Math.max(0, parsed.eliminationScore));
        const mScore = Math.min(3, Math.max(0, parsed.multipleCluesScore));
        const seqScore = Math.min(3, Math.max(0, parsed.sequenceExplanationScore));
        const total = Math.min(maxScore, Math.round((lScore + sScore + eScore + mScore + seqScore) * 10) / 10);

        return {
          reasoningScore: total,
          reasoningMax: maxScore,
          logicalConnectionsScore: lScore,
          suspectSuspicionScore: sScore,
          eliminationScore: eScore,
          multipleCluesScore: mScore,
          sequenceExplanationScore: seqScore,
          reasoningStrengths: Array.isArray(parsed.reasoningStrengths) ? parsed.reasoningStrengths : [],
          reasoningWeaknesses: Array.isArray(parsed.reasoningWeaknesses) ? parsed.reasoningWeaknesses : [],
          reasoningSummary: parsed.reasoningSummary || 'AI-assisted reasoning evaluation complete.',
        };
      }
    } catch {
      // Fallback seamlessly to deterministic rule-based semantic evaluator
    }
  }

  // DETERMINISTIC RULE-BASED REASONING EVALUATOR (100% Consistent & Auditable)
  const textLower = combinedText.toLowerCase();

  // 1. Logical Connections (Max 5 pts)
  let logicalConnectionsScore = 0;
  const connectsMotiveAndCrime =
    (textLower.includes('because') || textLower.includes('in order to') || textLower.includes('so that') || textLower.includes('due to')) &&
    (textLower.includes('debt') || textLower.includes('settlement') || textLower.includes('disinherit') || textLower.includes('property') || textLower.includes('85') || textLower.includes('money'));
  const connectsEvidenceToSuspect =
    textLower.includes('vicky') &&
    (textLower.includes('breaker') || textLower.includes('blackout') || textLower.includes('10 lakh') || textLower.includes('perumal') || textLower.includes('deed') || textLower.includes('safe') || textLower.includes('cufflink') || textLower.includes('watch'));

  if (connectsMotiveAndCrime && connectsEvidenceToSuspect) {
    logicalConnectionsScore = 5;
  } else if (connectsMotiveAndCrime || connectsEvidenceToSuspect) {
    logicalConnectionsScore = 3.5;
  } else if (textLower.includes('vicky')) {
    logicalConnectionsScore = 2;
  }

  // 2. Suspect Suspicion (Max 5 pts)
  let suspectSuspicionScore = 0;
  const mentionsVickyBehavior =
    textLower.includes('blackout') || textLower.includes('power cut') || textLower.includes('study') || textLower.includes('confront') || textLower.includes('scuffle');
  const mentionsVickyFinancials =
    textLower.includes('debt') || textLower.includes('failed deal') || textLower.includes('settlement') || textLower.includes('10 lakh') || textLower.includes('bribe');

  if (mentionsVickyBehavior && mentionsVickyFinancials) {
    suspectSuspicionScore = 5;
  } else if (mentionsVickyBehavior || mentionsVickyFinancials) {
    suspectSuspicionScore = 3;
  } else if (textLower.includes('vicky')) {
    suspectSuspicionScore = 1.5;
  }

  // 3. Elimination of Innocent Suspects (Max 4 pts)
  let eliminationScore = 0;
  const mentionsMeenaInnocent =
    textLower.includes('meena') && (textLower.includes('innocent') || textLower.includes('ledger') || textLower.includes('red herring') || textLower.includes('cleared') || textLower.includes('daughter'));
  const mentionsPerumalInnocent =
    textLower.includes('perumal') && (textLower.includes('innocent') || textLower.includes('bribe') || textLower.includes('breaker only') || textLower.includes('cook') || textLower.includes('daughter\'s wedding') || textLower.includes('didn\'t kill'));
  const mentionsRanganInnocent =
    textLower.includes('rangan') && (textLower.includes('alibi') || textLower.includes('police') || textLower.includes('cctv') || textLower.includes('station'));

  const innocentCount = [mentionsMeenaInnocent, mentionsPerumalInnocent, mentionsRanganInnocent].filter(Boolean).length;
  if (innocentCount >= 2) {
    eliminationScore = 4;
  } else if (innocentCount === 1) {
    eliminationScore = 2.5;
  } else {
    eliminationScore = 1;
  }

  // 4. Connecting Multiple Clues (Max 3 pts)
  let multipleCluesScore = 0;
  const clueHits = [
    textLower.includes('breaker') || textLower.includes('power cut') || textLower.includes('blackout'),
    textLower.includes('10 lakh') || textLower.includes('deposit') || textLower.includes('bribe'),
    textLower.includes('debt') || textLower.includes('85 lakh') || textLower.includes('creditor'),
    textLower.includes('settlement') || textLower.includes('deed') || textLower.includes('safe'),
    textLower.includes('cufflink') || textLower.includes('watch'),
    textLower.includes('police') || textLower.includes('cctv'),
    textLower.includes('ledger'),
  ].filter(Boolean).length;

  if (clueHits >= 3) {
    multipleCluesScore = 3;
  } else if (clueHits >= 2) {
    multipleCluesScore = 2;
  } else if (clueHits === 1) {
    multipleCluesScore = 1;
  }

  // 5. Sequence / Timeline Explanation (Max 3 pts)
  let sequenceExplanationScore = 0;
  const mentionsTimesOrSequence =
    textLower.includes('9:42') || textLower.includes('9:50') || textLower.includes('9:20') || textLower.includes('9:30') ||
    textLower.includes('blackout') || textLower.includes('then') || textLower.includes('afterwards') || textLower.includes('before');

  if (mentionsTimesOrSequence && (textLower.includes('9:42') || textLower.includes('blackout'))) {
    sequenceExplanationScore = 3;
  } else if (mentionsTimesOrSequence) {
    sequenceExplanationScore = 2;
  } else {
    sequenceExplanationScore = 0.5;
  }

  // Penalty for rambling text without actual substance (anti-fluff rule)
  const isRambling = combinedText.length > 500 && clueHits <= 1 && !connectsMotiveAndCrime;
  const deduction = isRambling ? 3 : 0;

  const reasoningScore = Math.min(
    maxScore,
    Math.max(0, Math.round((logicalConnectionsScore + suspectSuspicionScore + eliminationScore + multipleCluesScore + sequenceExplanationScore - deduction) * 10) / 10)
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (logicalConnectionsScore >= 4) strengths.push('Directly correlated financial motive to physical movements');
  if (multipleCluesScore >= 2) strengths.push(`Synthesized ${clueHits} independent physical/documentary clues`);
  if (eliminationScore >= 2.5) strengths.push('Demonstrated methodological elimination of innocent witnesses');

  if (logicalConnectionsScore < 3) weaknesses.push('Could further bridge the cause-and-effect link between the audit threat and the physical abduction');
  if (multipleCluesScore < 2) weaknesses.push('Relied on minimal clues without cross-referencing timeline evidence');
  if (isRambling) weaknesses.push('Explanation contained excessive narrative without core forensic deductions');

  const reasoningSummary =
    reasoningScore >= 16
      ? 'Exceptional logical rigor; interconnected motive, forensic footprints, and chronological timeline with precision.'
      : reasoningScore >= 10
      ? 'Solid detective reasoning with sound deductions, though some evidential links could be tightened.'
      : 'Basic or incomplete reasoning; failed to fully demonstrate the causal chain of events.';

  return {
    reasoningScore,
    reasoningMax: maxScore,
    logicalConnectionsScore,
    suspectSuspicionScore,
    eliminationScore,
    multipleCluesScore,
    sequenceExplanationScore,
    reasoningStrengths: strengths,
    reasoningWeaknesses: weaknesses,
    reasoningSummary,
  };
}
