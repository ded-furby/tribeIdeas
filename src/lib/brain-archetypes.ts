import type { BrainRegionScore, ReactionType } from "./validation-model";

export type BrainArchetype = {
  id: string;
  label: string;
  tone: string;
  description: string;
  color: string;
  regions: BrainRegionScore[];
  defaultReaction: ReactionType;
  activationPath: Array<{ x: number; y: number; r: number; value: number }>;
};

export const brainArchetypes: BrainArchetype[] = [
  {
    id: "strong-hook",
    label: "Strong hook",
    tone: "Immediate attention",
    description: "The opening idea produces a fast language-and-salience response.",
    color: "#f54e00",
    defaultReaction: "curiosity",
    regions: [
      {
        id: "language",
        label: "Language network",
        value: 86,
        insight: "The core sentence is easy to parse and likely to hold attention.",
      },
      {
        id: "default",
        label: "Meaning / self-reference",
        value: 71,
        insight: "The idea invites people to imagine themselves using it.",
      },
      {
        id: "control",
        label: "Cognitive control",
        value: 48,
        insight: "The hook is not too mentally expensive yet.",
      },
    ],
    activationPath: [
      { x: 41, y: 42, r: 18, value: 0.92 },
      { x: 58, y: 36, r: 13, value: 0.74 },
      { x: 53, y: 61, r: 10, value: 0.52 },
    ],
  },
  {
    id: "high-cognitive-load",
    label: "High cognitive load",
    tone: "Complex but fragile",
    description: "The idea sounds deep, but too many abstractions land at once.",
    color: "#c0a8dd",
    defaultReaction: "overload",
    regions: [
      {
        id: "control",
        label: "Cognitive control",
        value: 88,
        insight: "People need to work hard to keep the idea in memory.",
      },
      {
        id: "language",
        label: "Language network",
        value: 69,
        insight: "The wording has substance, but may be too dense.",
      },
      {
        id: "salience",
        label: "Salience network",
        value: 57,
        insight: "The idea is noticeable, but not obviously simple.",
      },
    ],
    activationPath: [
      { x: 47, y: 31, r: 15, value: 0.78 },
      { x: 63, y: 45, r: 17, value: 0.86 },
      { x: 43, y: 65, r: 12, value: 0.64 },
    ],
  },
  {
    id: "technical-depth",
    label: "Technical depth",
    tone: "Respect signal",
    description: "Technical users see craft and difficulty; casual users may need translation.",
    color: "#9fbbe0",
    defaultReaction: "trust",
    regions: [
      {
        id: "language",
        label: "Language network",
        value: 78,
        insight: "Technical phrasing is meaningful to the right crowd.",
      },
      {
        id: "control",
        label: "Cognitive control",
        value: 73,
        insight: "The idea asks for expertise, which can create respect.",
      },
      {
        id: "default",
        label: "Meaning / self-reference",
        value: 55,
        insight: "The personal payoff needs to be clearer.",
      },
    ],
    activationPath: [
      { x: 36, y: 50, r: 14, value: 0.76 },
      { x: 57, y: 52, r: 16, value: 0.81 },
      { x: 66, y: 34, r: 9, value: 0.49 },
    ],
  },
  {
    id: "confusing-claim",
    label: "Confusing claim",
    tone: "Attention without belief",
    description: "The claim lights up, but because people need to resolve ambiguity.",
    color: "#cf2d56",
    defaultReaction: "confusion",
    regions: [
      {
        id: "salience",
        label: "Salience network",
        value: 82,
        insight: "The claim gets noticed quickly.",
      },
      {
        id: "control",
        label: "Cognitive control",
        value: 84,
        insight: "Listeners spend effort figuring out what is meant.",
      },
      {
        id: "language",
        label: "Language network",
        value: 51,
        insight: "The wording should be made more concrete.",
      },
    ],
    activationPath: [
      { x: 51, y: 38, r: 20, value: 0.88 },
      { x: 67, y: 57, r: 13, value: 0.69 },
      { x: 35, y: 62, r: 10, value: 0.46 },
    ],
  },
  {
    id: "clear-payoff",
    label: "Clear payoff",
    tone: "Believable utility",
    description: "The idea makes the outcome visible, which improves validation.",
    color: "#1f8a65",
    defaultReaction: "clarity",
    regions: [
      {
        id: "default",
        label: "Meaning / self-reference",
        value: 82,
        insight: "People can see why the idea matters to them.",
      },
      {
        id: "language",
        label: "Language network",
        value: 74,
        insight: "The benefit is stated in usable language.",
      },
      {
        id: "salience",
        label: "Salience network",
        value: 63,
        insight: "The payoff is memorable without feeling loud.",
      },
    ],
    activationPath: [
      { x: 44, y: 58, r: 17, value: 0.8 },
      { x: 56, y: 44, r: 15, value: 0.73 },
      { x: 62, y: 67, r: 11, value: 0.58 },
    ],
  },
  {
    id: "generic-boring",
    label: "Generic idea",
    tone: "Low signal",
    description: "The idea is understandable but does not create a sharp reaction.",
    color: "#807d72",
    defaultReaction: "skepticism",
    regions: [
      {
        id: "language",
        label: "Language network",
        value: 44,
        insight: "The sentence parses, but it does not create novelty.",
      },
      {
        id: "salience",
        label: "Salience network",
        value: 31,
        insight: "The audience is unlikely to stop scrolling.",
      },
      {
        id: "default",
        label: "Meaning / self-reference",
        value: 39,
        insight: "The personal stakes are not yet visible.",
      },
    ],
    activationPath: [
      { x: 45, y: 45, r: 12, value: 0.42 },
      { x: 58, y: 57, r: 9, value: 0.35 },
      { x: 38, y: 64, r: 7, value: 0.28 },
    ],
  },
];

export function getArchetype(id: string) {
  return brainArchetypes.find((item) => item.id === id) ?? brainArchetypes[0];
}

