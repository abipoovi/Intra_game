import { AnswerKeyConfig, ClueConfig, ScoringRubricConfig } from './types';

// OFFICIAL CASE ANSWER KEY (Prompt 23)
// Remained securely on server; never leaked to players
export const DEFAULT_ANSWER_KEY: AnswerKeyConfig = {
  caseTitle: 'The Hidden Mystery — The 8-Minute Blackout at 9:42 PM',
  correctCulpritId: 'vicky',
  correctCulpritName: 'Vicky (Varadarajan\'s Nephew)',
  correctConclusion:
    'Vicky murdered Varadarajan in his study during the 8-minute blackout (between 9:42 PM and 9:50 PM) after paying cook Perumal ₹10 Lakh to switch off the main electrical breaker. Vicky confronted Varadarajan to steal the property settlement deed that would disinherit him and expose his ₹85 Lakh business debt.',
  correctMotive:
    'Severe financial debt of over ₹85 Lakh from a failed business deal. Vicky learned that Varadarajan was finalizing a property settlement deed the next day leaving commercial assets to Meena and leaving Vicky with almost nothing. Desperate to avoid financial ruin and creditor seizures, Vicky planned to steal the deed during the planned blackout.',
  correctSequenceOfEvents: [
    { time: '09:20 PM', event: 'Varadarajan receives a phone call from rival Rangan regarding the land dispute. Varadarajan says: "Tomorrow, we\'ll settle this."' },
    { time: '09:30 PM', event: 'Vicky arrives at the ancestral house behaving normally. Meanwhile, Rangan arrives at Nilgiris Town Police Station.' },
    { time: '09:40 PM', event: 'Cook Perumal moves toward the exterior electrical breaker panel with a flashlight.' },
    { time: '09:42 PM', event: 'Perumal switches off the main electrical breaker, plunging the entire house into darkness.' },
    { time: '09:43 PM - 09:48 PM', event: 'Meena sneaks toward the study to hide her secret financial ledger. Vicky enters the study in the dark, confronts Varadarajan, demands the settlement deed. A violent scuffle ensues; Vicky kills Varadarajan and takes the deed.' },
    { time: '09:50 PM', event: 'Perumal turns the power back on. Electricity returns. Vicky behaves normally; Perumal is terrified; Meena hides her financial issue; Varadarajan is found dead in the study.' },
  ],
  criticalClueIds: [
    'clue-breaker-tripped',
    'clue-advance-payment',
    'clue-failed-deal',
    'clue-missing-settlement',
  ],
  supportingClueIds: [
    'clue-vicky-watch',
    'clue-police-cctv',
  ],
  redHerringClueIds: [
    'clue-meena-ledger',
  ],
  requiredReasoningPoints: [
    'Connects cook Perumal manually tripping the main electrical breaker at 9:42 PM to the power cut',
    'Identifies the ₹10 Lakh bribe offered by Vicky to Perumal for creating the blackout window',
    'Establishes Vicky\'s critical motive: ₹85 Lakh business debt and disinheritance under the pending property settlement',
    'Demonstrates that Vicky confronted Varadarajan in the study during the 8-minute blackout (9:42 PM - 9:50 PM) and took the deed',
    'Exonerates daughter Meena: her movement toward the study was solely to retrieve her company account ledger (red herring)',
    'Exonerates rival Rangan: verified Town Police Station diary entry and CCTV prove his alibi during the murder window',
  ],
  acceptableAlternativeExplanations: [
    'vicky killed varadarajan in the study during the 9:42 blackout after paying perumal 10 lakhs to cut the power to steal the property settlement deed',
    'vicky is the murderer who paid perumal 10 lakh to turn off breaker at 9:42 pm because of his debts and property disinheritance',
    'vicky murdered his uncle in the study during darkness to take the will/settlement document due to failed business debt',
    'vicky bribed perumal for a power cut at 9:42 to confront and kill varadarajan for property documents',
  ],
};

// CLUE WEIGHTING SYSTEM (Prompt 24)
// Critical = 15, Important = 10, Minor = 5, Red Herring = 0
export const DEFAULT_CLUE_WEIGHTS: Record<string, ClueConfig> = {
  'clue-breaker-tripped': {
    id: 'clue-breaker-tripped',
    title: 'Manually Tripped Main Breaker Switch',
    type: 'Critical',
    weight: 15,
    description: 'The 63-amp main breaker was manually pulled down at 9:42 PM on the exterior panel; grid power was continuous.',
    expectedInterpretation: 'Proves the blackout was planned and executed inside the house, not an external grid failure.',
  },
  'clue-advance-payment': {
    id: 'clue-advance-payment',
    title: "Perumal's Bank Deposit Slip & ₹10 Lakh Agreement",
    type: 'Critical',
    weight: 15,
    description: "Deposit slip for ₹2,00,000 in cash into Perumal's daughter's account, tied to ₹10 Lakh promise for cutting power at 9:42 PM.",
    expectedInterpretation: 'Links the deliberate power cut directly to Perumal being paid off by an insider.',
  },
  'clue-failed-deal': {
    id: 'clue-failed-deal',
    title: "Vicky's Urgent Debt Demands & Creditor Notices",
    type: 'Critical',
    weight: 15,
    description: 'Demand letters totaling ₹85 Lakh against Vicky from aggressive creditors threatening asset seizure within 48 hours.',
    expectedInterpretation: 'Establishes Vicky\'s desperate financial crisis and urgent motive for immediate cash/property.',
  },
  'clue-missing-settlement': {
    id: 'clue-missing-settlement',
    title: 'Torn Property Settlement Draft & Empty Safe File',
    type: 'Critical',
    weight: 15,
    description: "Varadarajan's unbolted desk safe and empty settlement deed folder disinheriting Vicky in favor of Meena.",
    expectedInterpretation: 'Proves the victim was targeted specifically to stop the new property settlement from being finalized.',
  },
  'clue-vicky-watch': {
    id: 'clue-vicky-watch',
    title: 'Scratched Wristwatch & Broken Cufflink at Study Threshold',
    type: 'Important',
    weight: 10,
    description: "Broken monogrammed cufflink initialed 'V' and scuff marks indicating a violent physical struggle in the dark.",
    expectedInterpretation: 'Physically places Vicky inside the study engaging in a violent confrontation during the blackout.',
  },
  'clue-police-cctv': {
    id: 'clue-police-cctv',
    title: "Rangan's Town Police Station Alibi & CCTV Timestamp",
    type: 'Important',
    weight: 10,
    description: 'Certified police station register and CCTV showing Rangan filing a complaint between 9:30 PM and 10:15 PM.',
    expectedInterpretation: 'Completely eliminates Rangan as a suspect despite his vocal threats and public motive.',
  },
  'clue-meena-ledger': {
    id: 'clue-meena-ledger',
    title: 'Company Account Ledger Hidden by Meena (Red Herring)',
    type: 'RedHerring',
    weight: 0,
    description: 'Ledger showing Meena\'s secret ₹25 Lakh personal withdrawal; she hid it during the blackout to avoid discovery.',
    expectedInterpretation: 'Explains Meena\'s suspicious movement near the study as an unrelated financial secret (red herring).',
  },
};

// SCORING RUBRIC CONFIGURATION (Prompt 25-29)
// 100-Point System: Investigation 40, Final Answer 30, Reasoning 20, Time 10
export const DEFAULT_SCORING_RUBRIC: ScoringRubricConfig = {
  maxInvestigationScore: 40,
  maxFinalAnswerScore: 30,
  maxReasoningScore: 20,
  maxTimeScore: 10,
  investigationBreakdown: {
    criticalCluesWeight: 20,
    supportingCluesWeight: 10,
    evidenceInterpretationWeight: 5,
    investigationCompletenessWeight: 5,
  },
  finalAnswerBreakdown: {
    conclusionWeight: 10,
    culpritWeight: 8,
    motiveWeight: 5,
    explanationWeight: 4,
    supportingEvidenceWeight: 3,
  },
};
