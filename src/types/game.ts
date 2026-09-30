export type SuspectId = 'vicky' | 'divya' | 'perumal';

export interface Suspect {
  id: SuspectId;
  name: string;
  tamilName: string;
  role: string;
  age: number;
  relation: string;
  demeanor: string;
  portrait: string;
  accentColor: string;
  officialAlibi: string;
  secret1Trigger: string;
  secret2Trigger?: string;
  quickQuestions: string[];
}

export type ClueId = 'red_clay_footprints' | 'half_burned_letter' | 'pulled_eb_fuse';

export interface Clue {
  id: ClueId;
  title: string;
  tamilTitle: string;
  shortDesc: string;
  fullDesc: string;
  category: string;
  foundLocation: string;
  timeLogged: string;
  forensicReport: string;
  iconName: string;
  isKeyClue: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'detective' | SuspectId;
  senderName: string;
  text: string;
  timestamp: string;
  isConfession?: boolean;
  isKeyClueRevealed?: boolean;
}

export type TabType = 'briefing' | 'interrogation' | 'evidence' | 'resolution';

export interface CaseSubmission {
  culprit: string;
  selectedClues: string[];
  motive: string;
}
