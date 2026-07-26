export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface Pillar {
  id: number;
  name: string;
  icon: string;
  tags: string[];
}

export interface PillarAnswers {
  answers: Record<string, string>;  // questionId → selected option
  supplements: string[];
  status: "idle" | "progress" | "done";
}

export interface DiaryEntryData {
  id: string;
  entryType: "emotion" | "behavior" | "intake" | "narrative";
  coreTag: string | null;
  intensity: number | null;
  source: string | null;
  note: string | null;
  aiHook: string | null;
  score: number | null;
  entryDate: string;
  createdAt: string;
}

export interface UserProfileData {
  basicAnswers: Record<string, Record<string, string>>;
  deepTags: string[];
  pillarCompleted: number[];
}

export interface ConsentData {
  agreedToTerms: boolean;
  agreedToAI: boolean;
  consentedAt: string;
}

export type TabType = "1" | "2" | "3" | "4";
