export type AdInputMode = "upload" | "link";

export type ViewerAudience =
  | "Cold buyers"
  | "Warm prospects"
  | "Founders"
  | "Gen Z scrollers"
  | "B2B operators"
  | "Creators";

export type AdGoal =
  | "Stop scroll"
  | "Drive signups"
  | "Sell product"
  | "Increase trust"
  | "Get installs";

export type AdPredictionRequest = {
  title: string;
  mode: AdInputMode;
  brief?: string;
  reelUrl?: string;
  uploadedFileName?: string;
  uploadedFileSize?: number;
  uploadedDuration?: number;
  audience: ViewerAudience | string;
  goal: AdGoal | string;
  product: string;
  promise: string;
  notes?: string;
  linkContext?: string;
};

export type BrainAdSignal = {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  meaning: string;
};

export type ViewerSegment = {
  label: string;
  share: number;
  feeling: string;
  conversionIntent: number;
  risk: string;
};

export type PredictiveRound = {
  label: string;
  status: string;
  output: string;
};

export type AdTimelineMoment = {
  time: string;
  event: string;
  response: string;
  score: number;
};

export type AdPredictionReport = {
  id: string;
  title: string;
  audience: string;
  goal: string;
  detectedProduct: string;
  transcriptSummary: string;
  brainSummary: string;
  headline: string;
  outcome: string;
  confidence: number;
  projectedLift: number;
  attentionScore: number;
  trustScore: number;
  recallScore: number;
  frictionScore: number;
  dominantFeeling: string;
  activationLabel: string;
  neuralReadout: string;
  brainSignals: BrainAdSignal[];
  viewerSegments: ViewerSegment[];
  predictiveRounds: PredictiveRound[];
  timeline: AdTimelineMoment[];
  recommendations: string[];
  experiments: string[];
  sourceNote: string;
  generatedAt: string;
};
