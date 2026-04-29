export type Audience =
  | "Founders"
  | "Junior builders"
  | "Investors"
  | "Recruiters"
  | "LinkedIn general"
  | "Custom";

export type Context =
  | "LinkedIn post"
  | "Startup idea"
  | "Pitch"
  | "Product launch"
  | "Demo script";

export type Verdict = "Validated" | "Promising" | "Needs Reframe" | "Invalidated";

export type ReactionType =
  | "curiosity"
  | "clarity"
  | "confusion"
  | "skepticism"
  | "envy"
  | "trust"
  | "overload"
  | "amplification";

export type BrainRegionScore = {
  id: string;
  label: string;
  value: number;
  insight: string;
};

export type PhraseInsight = {
  text: string;
  salience: number;
  reaction: ReactionType;
  validates: string[];
  invalidates: string[];
  question: string;
  rewrite: string;
  brainRegion: string;
};

export type AudienceGroup = {
  label: string;
  share: number;
  stance: "validate" | "doubt" | "misread" | "amplify";
  note: string;
};

export type ValidationReport = {
  id: string;
  ideaTitle: string;
  ideaBody: string;
  audience: Audience | string;
  context: Context | string;
  verdict: Verdict;
  confidence: number;
  confidenceReason: string;
  archetypeId: string;
  summary: string;
  brainRegions: BrainRegionScore[];
  phraseInsights: PhraseInsight[];
  audienceGroups: AudienceGroup[];
  topQuestions: string[];
  objections: string[];
  rewrite: string;
  generatedAt: string;
  sourceNote: string;
};

export type ValidationRequest = {
  ideaTitle: string;
  ideaBody: string;
  audience: Audience | string;
  context: Context | string;
  customAudience?: string;
};

