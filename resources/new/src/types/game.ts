import type { LevelTimeRecord } from '../utils/timing';
export type MascotEmotion = 'happy' | 'puzzled' | 'shocked' | 'speechless' | 'celebrating';

export type WordColorTheme = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface WordBlock {
  id: string;
  text: string;           // Display text (e.g. "ONLY" or "Only" or "likes")
  cleanWord: string;      // Lowercase clean word (e.g. "only")
  punctuation?: string;   // e.g. "." or ","
  pos: string;            // Part of speech, e.g. "副词 (adv.)"
  phonetic: string;       // e.g. "/ˈoʊnli/"
  translation: string;    // Common Chinese translation
  simpleEn?: string;       // Plain-English core definition
  senseNotes?: string;     // Core sense notes and usage distinctions
  sentenceMeaning: string;// Meaning in this specific sentence
  colorTheme: WordColorTheme;
}

export interface Phase {
  id: number;
  phaseTitle: string;     // e.g. "阶段 1/3：从句部分"
  phaseDesc: string;      // e.g. "先组装尽管暴风雨来临的让步从句"
  targetChinese: string;
  targetEnglish: string;
  wordIds: string[];
}

export interface LevelData {
  id: number;
  levelNumber: number;
  tier: 1 | 2 | 3 | 4 | 5;
  tierName: string;
  targetChinese: string;
  targetEnglish: string;
  words: WordBlock[];
  correctSequence: string[]; // array of word texts in correct order
  alternatives?: {
    sequence: string[];
    translation: string;
    comment: string;
    emotion: MascotEmotion;
  }[];
  grammarExplanation: string;
  tieredAssembly?: {
    phases: Phase[];
  };
}

export interface BgmTrack {
  id: string;
  title: string;
  url?: string;
  isBuiltIn: boolean;
  addedAt?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  currentLevelIndex: number;
  /** V8+: explicitly tracked resume cursor; absent in legacy backups. */
  progressVersion?: 2 | 3;
  completedLevelIds: number[];
  masteredWordIds: string[]; // Word IDs mastered through practice
  mistakeHistory: {
    levelId: number;
    wrongSentence: string;
    targetSentence: string;
    timestamp: number;
  }[];
  starredWordIds: string[];
  streakDays: number;
  totalAttempts: number;
  correctAttempts: number;
  soundEnabled: boolean;
  speechEnabled: boolean;
  totalWordGoal: number; // e.g. 1200 words goal
  timingRecords?: Record<string, LevelTimeRecord>; // V10: per-level stopwatch + PB
  totalSentenceGoal: number; // e.g. 500 sentences goal
}
