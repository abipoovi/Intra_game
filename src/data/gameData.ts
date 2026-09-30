import { Suspect, Clue } from '../types/game';

export const SUSPECTS: Record<string, Suspect> = {
  vicky: {
    id: 'vicky',
    name: 'Vicky',
    tamilName: 'விக்கி',
    role: 'The Nephew — Arrogant & Defensive',
    age: 28,
    relation: "Varadarajan's Nephew (Late Brother's Son)",
    demeanor: 'Hostile, cynical, chain-smoker attitude, arrogant towards police and servants',
    portrait: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    accentColor: 'border-red-600/50 bg-red-950/20 text-red-400',
    officialAlibi: "Listen Inspector! I was inside my room listening to heavy metal with my headphones on! I didn't even notice the power went out!",
    secret1Trigger: 'Excuse for Red Mud (10:30 PM garden walk in rain)',
    secret2Trigger: '3-Way Confession: Red Mud + EB Fuse + Perumal',
    quickQuestions: [
      "Where were you around 11:15 PM when the bungalow went dark?",
      "Why is there fresh red garden mud all over your leather boots?",
      "What do you know about the pulled EB main power switch in the storeroom?",
      "We found red mud on your boots, the pulled EB fuse, and Perumal named you. Confess, Vicky!",
    ],
  },
  divya: {
    id: 'divya',
    name: 'Divya',
    tamilName: 'திவ்யா',
    role: 'The Daughter — Emotional & Innocent',
    age: 24,
    relation: "Varadarajan's Only Daughter & Sole Will Beneficiary",
    demeanor: 'Tearful, anxious, clutching a family prayer photo, terrified for her father',
    portrait: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    accentColor: 'border-amber-600/50 bg-amber-950/20 text-amber-400',
    officialAlibi: "I was in my room praying for my father's health, Inspector sir. I fell asleep around 10:00 PM.",
    secret1Trigger: 'Explanation for Half-Burned Letter (9:00 PM marriage argument)',
    quickQuestions: [
      "When did you last see your father Varadarajan before he vanished?",
      "We found a half-burned letter in the fireplace reading '...cutting you out of the property...'. What happened?",
      "Did you hear any footsteps or commotion during the 11:15 PM power outage?",
      "Were you aware your father phoned his lawyer at 11:00 PM to finalize the ₹50 Crore will?",
    ],
  },
  perumal: {
    id: 'perumal',
    name: 'Perumal',
    tamilName: 'பெருமாள்',
    role: 'The Cook — Nervous Servant',
    age: 58,
    relation: 'Head Cook & Domestic Caretaker for 22 Years',
    demeanor: 'Sweating profusely, trembling hands, terrified of being arrested by police',
    portrait: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    accentColor: 'border-emerald-600/50 bg-emerald-950/20 text-emerald-400',
    officialAlibi: "Inspector sir! I was in the kitchen boiling hot milk for Varadarajan sir from 11:00 PM to 11:30 PM!",
    secret1Trigger: 'Excuse for Fuse Box (Checking buzzing noise for lizards)',
    secret2Trigger: '2-Way Confession: Pulled Fuse + Vicky/Red Mud',
    quickQuestions: [
      "What were you doing in the kitchen between 11:00 PM and 11:30 PM?",
      "Why were you seen outside near the EB fuse box right before the blackout?",
      "The EB power switch was pulled and Vicky's red mud boots prove he climbed the window. Confess your role, Perumal!",
      "How did you plan to pay off your daughter's huge wedding debt on a cook's salary?",
    ],
  },
};

export const CLUES: Clue[] = [
  {
    id: 'red_clay_footprints',
    title: 'Red Clay Footprints',
    tamilTitle: 'சிவப்பு களிமண் கால்தடங்கள்',
    shortDesc: "Fresh red mud footprints found directly under Varadarajan's bedroom window.",
    fullDesc: "Fresh red mud footprints found directly under Varadarajan's bedroom window (Red clay is only found in the ECR garden bed). Forensic cast measures Men's Size 10 heavy tread boots matching Vicky's footwear.",
    category: 'Forensic Footwear & Soil',
    foundLocation: "Directly under Master Bedroom Window, East Wing Garden",
    timeLogged: '11:38 PM (Post-Incident Sweep)',
    forensicReport: "Mineral spectrograph confirms coastal ECR iron-oxide clay, distinct to the flower beds outside the bedroom window. The ground was saturated due to heavy coastal rain, leaving pristine indentation depths indicative of a hasty climb.",
    iconName: 'Footprints',
    isKeyClue: true,
  },
  {
    id: 'half_burned_letter',
    title: 'Half-Burned Letter',
    tamilTitle: 'பாதி எரிந்த கடிதம்',
    shortDesc: "A torn paper scrap found in the fireplace reading '...cutting you out of the property...'.",
    fullDesc: "A torn paper scrap found in the fireplace reading '...cutting you out of the property...'. Inked in Varadarajan's personal Parker fountain pen on heritage bond paper.",
    category: 'Questioned Document Scrap',
    foundLocation: 'Bedroom Fireplace Hearth, amongst charred embers',
    timeLogged: '11:42 PM (Forensics Sweep)',
    forensicReport: "The draft was torn violently and thrown into hot coals around 9:00 - 9:30 PM. Reveals intense family tension regarding the division of the ₹50 Crore estate and an intended disinheritance, explaining Divya's emotional confrontation earlier that night.",
    iconName: 'FileText',
    isKeyClue: false,
  },
  {
    id: 'pulled_eb_fuse',
    title: 'Pulled EB Main Fuse',
    tamilTitle: 'இழுக்கப்பட்ட மின்சார மெயின் ஃபியூஸ்',
    shortDesc: 'The main electricity switch outside in the store room was manually pulled down at 11:15 PM.',
    fullDesc: 'The main electricity switch outside in the store room was manually pulled down at 11:15 PM. Plunged the entire bungalow into total darkness and disabled the CCTV server.',
    category: 'Electrical Sabotage',
    foundLocation: 'Outdoor Electrical Distribution Box, Rear Pantry Wall',
    timeLogged: '11:28 PM (First Officer Response)',
    forensicReport: "Heavy 63A porcelain knife switch pulled down forcibly. Circuit logs show sudden grid disconnect at precisely 11:15:22 PM. Flour and turmeric traces found on the Bakelite handle indicate handling by domestic staff right before the incident.",
    iconName: 'ZapOff',
    isKeyClue: true,
  },
];

export const BRIEFING_DATA = {
  title: "The ₹50 Crore Will — Investigation Portal",
  tamilTitle: "தி 50 கோடி உயில் — விசாரணை மையம்",
  policeDivision: "Tamil Nadu Police • Crime Branch CID • ECR Circle, Chennai",
  caseNumber: "TN-CR-ECR-0924-2026",
  briefingText: "At 11:00 PM on a stormy night in ECR, Chennai, wealthy industrialist Varadarajan called his lawyer saying he was leaving his ₹50 Crore fortune to his daughter Divya. At 11:15 PM, the bungalow's main electricity fuse was pulled. By 11:20 PM, Varadarajan vanished from his locked room, and his new unsigned will went missing! You have 30 minutes to investigate.",
  victim: "Varadarajan (Age 64, Chennai Shipping & Real Estate Tycoon)",
  disappearanceLocation: "Seaside Villa 'Kurinji Illam', 14th Avenue, East Coast Road (ECR), Chennai",
  incidentTime: "11:15 PM (Blackout) — 11:20 PM (Discovery)",
  stake: "₹50,00,00,000 (Fifty Crore Rupees Estate & Shipping Line)",
};

export const WINNING_BACKSTORY = `CASE SOLVED! 🎉

THE BACKSTORY:
Vicky was drowning in heavy race-course debts and found out his uncle Varadarajan was cutting him out of the ₹50 Crore property will!

Vicky bribed the old cook Perumal with ₹10 Lakhs to pull down the outdoor EB Main Fuse at 11:15 PM, plunging the ECR bungalow into total darkness and cutting off the CCTV.

During those 5 minutes of darkness, Vicky stepped through the garden mud with his boots, opened the bedroom window, stole the signed will paper, and locked Varadarajan in the back storeroom!

You caught them red-handed using the Red Clay Footprints and the Pulled EB Fuse!`;
