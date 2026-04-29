import { brainArchetypes, getArchetype } from "./brain-archetypes";
import type {
  AudienceGroup,
  PhraseInsight,
  ValidationReport,
  ValidationRequest,
  Verdict,
} from "./validation-model";

const strongWords = [
  "validate",
  "founder",
  "revenue",
  "proof",
  "workflow",
  "simulate",
  "brain",
  "audience",
  "launch",
  "insight",
  "trust",
  "fast",
  "one-click",
];

const riskyWords = [
  "revolutionary",
  "guaranteed",
  "mind",
  "therapy",
  "viral",
  "jealous",
  "replace",
  "secret",
  "hack",
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function tokenizeIdea(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|,\s+|;\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function chooseArchetype(body: string) {
  const text = body.toLowerCase();
  const risky = riskyWords.filter((word) => text.includes(word)).length;
  const strong = strongWords.filter((word) => text.includes(word)).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 12) return getArchetype("generic-boring");
  if (risky >= 2) return getArchetype("confusing-claim");
  if (wordCount > 85) return getArchetype("high-cognitive-load");
  if (text.includes("api") || text.includes("model") || text.includes("agent")) {
    return getArchetype("technical-depth");
  }
  if (strong >= 4) return getArchetype("strong-hook");
  if (text.includes("save") || text.includes("faster") || text.includes("before")) {
    return getArchetype("clear-payoff");
  }
  return brainArchetypes[0];
}

function verdictFromScore(score: number): Verdict {
  if (score >= 78) return "Validated";
  if (score >= 63) return "Promising";
  if (score >= 45) return "Needs Reframe";
  return "Invalidated";
}

function createPhraseInsights(parts: string[], archetypeId: string): PhraseInsight[] {
  const archetype = getArchetype(archetypeId);

  return parts.map((text, index) => {
    const lower = text.toLowerCase();
    const strong = strongWords.some((word) => lower.includes(word));
    const risky = riskyWords.some((word) => lower.includes(word));
    const salience = clamp(
      45 + (strong ? 26 : 0) + (risky ? 18 : 0) + index * 3,
      22,
      94,
    );
    const region = archetype.regions[index % archetype.regions.length];

    return {
      text,
      salience,
      reaction: risky ? "skepticism" : strong ? archetype.defaultReaction : "curiosity",
      validates: strong
        ? ["builders who want speed", "founders who test before shipping"]
        : ["curious early adopters"],
      invalidates: risky
        ? ["serious operators", "technical skeptics"]
        : ["people who need a clearer payoff"],
      question: risky
        ? "Is this claim actually defensible, or just loud?"
        : "What proof would make this feel immediately real?",
      rewrite: risky
        ? text.replace(/guaranteed|revolutionary|viral|jealous/gi, "measurable")
        : `${text} — with a concrete before/after outcome.`,
      brainRegion: region.label,
    };
  });
}

function audienceGroups(audience: string, score: number): AudienceGroup[] {
  return [
    {
      label: `${audience} validators`,
      share: clamp(score - 12, 18, 76),
      stance: "validate",
      note: "They understand the promise and can imagine using or sharing it.",
    },
    {
      label: "Technical skeptics",
      share: clamp(82 - score, 8, 42),
      stance: "doubt",
      note: "They ask for implementation proof, data sources, and false-positive handling.",
    },
    {
      label: "Fast scrollers",
      share: clamp(58 - score / 3, 10, 36),
      stance: "misread",
      note: "They need a sharper first sentence before the deeper concept lands.",
    },
    {
      label: "Amplifiers",
      share: clamp(score - 35, 8, 44),
      stance: "amplify",
      note: "They repeat the simplest, most status-relevant version of the idea.",
    },
  ];
}

export function createLocalValidation(request: ValidationRequest): ValidationReport {
  const body = `${request.ideaTitle}. ${request.ideaBody}`.trim();
  const archetype = chooseArchetype(body);
  const parts = tokenizeIdea(request.ideaBody || request.ideaTitle);
  const phraseInsights = createPhraseInsights(parts, archetype.id);
  const averageSalience =
    phraseInsights.reduce((total, item) => total + item.salience, 0) /
    Math.max(phraseInsights.length, 1);
  const clarityBonus = request.ideaBody.length > 120 ? 8 : -4;
  const confidence = clamp(
    averageSalience * 0.58 +
      archetype.regions.reduce((sum, region) => sum + region.value, 0) /
        archetype.regions.length *
        0.28 +
      clarityBonus,
  );

  return {
    id: `tribe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ideaTitle: request.ideaTitle || "Untitled idea",
    ideaBody: request.ideaBody,
    audience:
      request.audience === "Custom" && request.customAudience
        ? request.customAudience
        : request.audience,
    context: request.context,
    verdict: verdictFromScore(confidence),
    confidence,
    confidenceReason:
      confidence >= 70
        ? "The idea has enough hook clarity and audience agreement to test publicly."
        : "The idea has signal, but the first sentence and proof point need tightening.",
    archetypeId: archetype.id,
    summary: `${archetype.tone}: ${archetype.description}`,
    brainRegions: archetype.regions,
    phraseInsights,
    audienceGroups: audienceGroups(String(request.audience), confidence),
    topQuestions: [
      "What evidence makes this more than an interesting simulation?",
      "Who gets value in the first minute of using it?",
      "What would make a skeptical expert trust the result?",
    ],
    objections: [
      "The audience may see this as a fancy score unless the report shows clear reasoning.",
      "The brain layer must be labelled as TRIBE-derived reference, not mind reading.",
      "The best proof will be side-by-side examples where the rewrite clearly improves the idea.",
    ],
    rewrite: `Before you launch: ${request.ideaTitle}. Show the audience split, the strongest objection, and the phrase that creates the clearest response.`,
    generatedAt: new Date().toISOString(),
    sourceNote:
      "Brain panel uses TRIBE v2-derived reference archetypes for the MVP. Live user validation is powered by the audience simulation layer.",
  };
}

