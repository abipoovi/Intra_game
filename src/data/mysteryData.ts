import { Suspect, Clue, TimelineEvent } from '../types/mystery';

export const CASE_BASELINE = {
  title: 'The Hidden Mystery',
  subtitle: 'At 9:42 PM, the lights went out. At 9:50 PM, everything changed.',
  caseId: 'THM-2026-VR',
  missingPerson: 'Varadarajan (Age 62, Wealthy Businessman & Estate Owner)',
  disappearanceLocation: "Varadarajan's Ancestral House",
  disappearanceWindow: 'Between 9:42 PM and 9:50 PM (The 8-Minute Blackout)',
  synopsis: `Varadarajan is a wealthy businessman who owns several properties and businesses. He lives in his ancestral house with his daughter Meena. His nephew Vicky frequently visits the house. Perumal is the family's long-time cook. Rangan is Varadarajan's former business partner and current rival because of a long-running land dispute.

The night before the incident, Varadarajan announced to the people around him:
"Tomorrow, I'm going to finalize the property settlement."

At 9:42 PM, the lights went out. At 9:50 PM, everything changed. Varadarajan was found dead in his study.

Detectives must cross-examine all suspects, expose inconsistencies through multi-stage interrogation, and piece together the evidence to identify the true culprit and motive.`,
};

export const SUSPECTS: Suspect[] = [
  {
    id: 'vicky',
    name: 'Vicky',
    role: 'Nephew',
    age: 28,
    relation: "Varadarajan's Nephew",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    demeanor: 'Calm, polite, cooperative, confident, perfectly composed.',
    baselineInfo: "Varadarajan's nephew who frequently visits the ancestral home. He arrived at the house at 9:30 PM for what he describes as a pleasant family visit.",
    initialMessage: 'Good evening, Inspector. I am shocked and deeply saddened by what has happened to my uncle. I arrived around 9:30 PM for a routine family visit. I am completely at your disposal to answer any questions.',
    suggestedQuestions: [
      'What was your exact reason for visiting Varadarajan at 9:30 PM?',
      'Where were you during the 8-minute blackout between 9:42 PM and 9:50 PM?',
      'Did your uncle discuss his new property settlement with you?',
      'Have any of your recent business investments run into serious financial debt?',
    ],
  },
  {
    id: 'perumal',
    name: 'Perumal',
    role: 'Family Cook',
    age: 56,
    relation: 'Long-time Family Cook (20 Years)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    demeanor: 'Nervous, respectful, emotional, cautious, wiping trembling hands on his apron.',
    baselineInfo: 'The longstanding cook who has served the household for two decades. Known to be struggling financially with his daughter\'s upcoming wedding expenses.',
    initialMessage: 'Ayya... greetings. I have cooked for Varadarajan ayya for over twenty years with my own hands. I was in the kitchen doing my night chores when the power cut happened. What has happened to our master? Please don\'t suspect a poor cook!',
    suggestedQuestions: [
      'What were you doing near the exterior electrical panel around 9:40 PM?',
      'Why did the main breaker switch trip at exactly 9:42 PM if the grid was fine?',
      'Did anyone offer you money or make a special request regarding the power?',
      'How are you funding your daughter\'s upcoming wedding expenses?',
    ],
  },
  {
    id: 'meena',
    name: 'Meena',
    role: 'Daughter',
    age: 24,
    relation: "Varadarajan's Daughter & Architect",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    demeanor: 'Calm but emotionally affected, guarded, visibly distressed, holding her hands tightly.',
    baselineInfo: "Varadarajan's daughter who lives with him in the ancestral house. She manages her own architectural studio and has access to family accounts.",
    initialMessage: 'Officer... I still cannot process that my father is gone. Everything seemed normal until the power suddenly went out. Please tell me you are examining all the physical evidence.',
    suggestedQuestions: [
      'Where were you when the house went completely dark at 9:42 PM?',
      'Were you seen moving downstairs toward your father\'s study during the blackout?',
      'Did you have any disagreements with your father regarding company business accounts?',
      'What did you hear from the study before the lights came back on at 9:50 PM?',
    ],
  },
  {
    id: 'rangan',
    name: 'Rangan',
    role: 'Former Business Partner & Rival',
    age: 58,
    relation: 'Former Business Partner & Current Land Rival',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    demeanor: 'Aggressive, defensive, proud, sharp-tongued, impatient.',
    baselineInfo: "Varadarajan's former commercial partner turned bitter rival over a long-running land dispute. Known to have publicly threatened Varadarajan at business meetings.",
    initialMessage: 'Look here, Detective. Everyone knows Varadarajan and I were fighting tooth and nail over the highway bypass land. But I settle disputes in courtrooms, not in the dark. Ask your questions quickly.',
    suggestedQuestions: [
      'Did you call Varadarajan on his study landline at 9:20 PM?',
      'What did you mean when you publicly threatened to make him pay for the land dispute?',
      'Where exactly were you between 9:20 PM and 10:00 PM on the night of the murder?',
      'Can anyone officially verify your whereabouts during the 8-minute blackout?',
    ],
  },
];

export const DISCOVERABLE_CLUES: Clue[] = [
  {
    id: 'clue-breaker-tripped',
    title: 'Manually Tripped Main Breaker Switch',
    category: 'Forensic Evidence',
    description: 'The 63-amp main electrical breaker switch on the exterior porch panel was forcibly pulled down at exactly 9:42 PM. The Electricity Board verified the main town grid was continuous and uninterrupted.',
    foundAt: 'Exterior electrical breaker panel behind kitchen porch',
    suspectSource: 'perumal',
    icon: 'Zap',
  },
  {
    id: 'clue-advance-payment',
    title: "Perumal's Bank Deposit Slip & ₹10 Lakh Agreement",
    category: 'Financial Evidence',
    description: "A bank deposit slip for ₹2,00,000 cash deposited into Perumal's daughter's wedding account earlier that day, matching an agreement promising ₹10 Lakh in total for cutting the power at 9:42 PM.",
    foundAt: 'Kitchen pantry cabinet beneath flour tin',
    suspectSource: 'perumal',
    icon: 'Receipt',
  },
  {
    id: 'clue-failed-deal',
    title: "Vicky's Urgent Debt Demands & Creditor Notices",
    category: 'Documentary Evidence',
    description: 'Urgent legal notices and dishonored promissory notes totaling ₹85 Lakh against Vicky from aggressive private financiers, demanding immediate settlement or total asset seizure within 48 hours.',
    foundAt: "Vicky's leather briefcase in the front foyer",
    suspectSource: 'vicky',
    icon: 'FileWarning',
  },
  {
    id: 'clue-missing-settlement',
    title: 'Torn Property Settlement Draft & Empty Safe File',
    category: 'Physical Evidence',
    description: "Varadarajan's study desk safe was unbolted. An empty legal folder labeled 'Ancestral Properties Settlement Deed' was discarded. A torn draft corner reveals Varadarajan planned to leave his commercial holdings to Meena, leaving Vicky with almost nothing.",
    foundAt: 'Master study safe behind mahogany bookshelf',
    suspectSource: 'vicky',
    icon: 'Unlock',
  },
  {
    id: 'clue-vicky-watch',
    title: 'Scratched Wristwatch & Broken Cufflink at Study Threshold',
    category: 'Forensic Artifact',
    description: "A gold monogrammed cufflink initialed 'V' and deep scuff marks at the study threshold, confirming a violent physical struggle occurred during the blackout when Vicky confronted Varadarajan.",
    foundAt: 'Study doorway carpet',
    suspectSource: 'vicky',
    icon: 'Watch',
  },
  {
    id: 'clue-police-cctv',
    title: "Rangan's Town Police Station Alibi & CCTV Timestamp",
    category: 'Official Alibi Record',
    description: 'Certified police duty register and time-stamped CCTV recording proving Rangan was seated inside the Nilgiris Town Police Station from 9:30 PM to 10:15 PM lodging a formal fraud complaint against Varadarajan.',
    foundAt: 'Town Police Station Duty Officer Log',
    suspectSource: 'rangan',
    icon: 'ShieldCheck',
  },
  {
    id: 'clue-meena-ledger',
    title: 'Company Account Ledger Hidden by Meena (Red Herring)',
    category: 'Financial Record',
    description: 'Commercial passbook and ledger showing an unauthorized ₹25 Lakh withdrawal by Meena for her architectural firm. She secretly moved toward the study during the blackout to retrieve and hide this ledger, completely unaware of the murder.',
    foundAt: "Meena's bedroom closet beneath handloom shawls",
    suspectSource: 'meena',
    icon: 'BookOpen',
  },
];

export const MASTER_TIMELINE: TimelineEvent[] = [
  {
    id: 't1',
    time: '09:20 PM',
    title: 'Mysterious Phone Call in the Study',
    description: 'Varadarajan receives an aggressive phone call from former partner Rangan regarding their land dispute. Varadarajan replies: "Tomorrow, we\'ll settle this," before hanging up.',
    source: 'Study Landline Call Register',
  },
  {
    id: 't2',
    time: '09:30 PM',
    title: 'Vicky Arrives at the House',
    description: 'Vicky arrives at the ancestral estate behaving normally, greeted by cook Perumal in the hallway.',
    source: 'Perumal Deposition',
  },
  {
    id: 't3',
    time: '09:40 PM',
    title: 'Perumal Approaches the Electrical Panel',
    description: 'Perumal slips out to the exterior electrical panel carrying a flashlight, positioning himself by the main breaker.',
    source: 'Forensic Reconstruction',
  },
  {
    id: 't4',
    time: '09:42 PM',
    title: 'The Blackout: Main Breaker Tripped',
    description: 'Perumal manually trips the 63-amp main breaker. The entire ancestral house plunges into total pitch-black darkness.',
    source: 'EB Technical Log & Breaker Analysis',
  },
  {
    id: 't5',
    time: '09:43 PM - 09:48 PM',
    title: 'Confrontation in the Study & Meena\'s Movement',
    description: 'Meena sneaks toward the study to retrieve and hide her company ledger. Meanwhile, Vicky enters the study, confronts Varadarajan, and demands the settlement deed. When Varadarajan resists and attempts to call for help, a violent scuffle breaks out and Vicky kills Varadarajan.',
    source: 'Forensic Pathology Sweep & Clue Chain',
  },
  {
    id: 't6',
    time: '09:50 PM',
    title: 'Electricity Restored & Crime Discovered',
    description: 'Perumal switches the main breaker back on. Electricity returns. Vicky walks out into the corridor acting composed; Perumal is terrified; Meena hides her ledger; Varadarajan is discovered lifeless in his study.',
    source: 'First Response Police Report',
  },
];
