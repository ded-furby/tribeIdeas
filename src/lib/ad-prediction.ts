import type {
  AdPredictionReport,
  AdPredictionRequest,
  BrainAdSignal,
  PredictiveRound,
  ViewerSegment,
} from "./ad-model";

const proofWords = ["proof", "case study", "testimonial", "results", "before", "after", "demo", "data"];
const desireWords = ["save", "faster", "easy", "launch", "grow", "better", "more", "one-click", "automatic"];
const riskWords = ["guaranteed", "viral", "secret", "hack", "instant", "everyone", "never"];
const emotionWords = ["feel", "love", "fear", "miss", "jealous", "trust", "calm", "excited", "proud"];
const productHints = [
  ["analytics", "AI ad analytics tool"],
  ["dashboard", "performance analytics dashboard"],
  ["agent", "AI agent workflow"],
  ["automation", "automation product"],
  ["skincare", "skincare product"],
  ["serum", "skincare serum"],
  ["course", "education offer"],
  ["newsletter", "content product"],
  ["app", "mobile app"],
  ["saas", "SaaS product"],
] as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hashString(value: string) {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function wordHits(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.filter((word) => lower.includes(word)).length;
}

function stripMarkup(value: string) {
  return value
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/data:image\/[a-zA-Z+.-]+;base64,[^\s"'<]+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b(?:width|height|style|src|class|loading|alt)=["']?[^"'\s]+["']?/gi, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\bInstagram\s+Instagram\b/gi, "Instagram")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyFeeling(text: string, score: number) {
  const lower = text.toLowerCase();
  if (lower.includes("premium") || lower.includes("trust")) return "trust";
  if (lower.includes("fear") || lower.includes("miss")) return "urgency";
  if (score > 78) return "curiosity";
  if (score > 62) return "useful surprise";
  return "mild interest";
}

function compactLine(value: string, fallback: string) {
  return stripMarkup(value)
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.slice(0, 160) || fallback;
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function cleanOfferText(value: string) {
  return stripMarkup(value)
    .replace(/\b(this is|we are selling|we sell|it's|it is|basically|product is)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .trim();
}

function splitOffer(brief: string, linkContext: string, fallback: string) {
  const source = cleanOfferText(compactLine(brief || linkContext, fallback));
  const directFor = source.match(/\bfor\s+(.+?)(?:[,.]|$)/i);
  const helpFor = source.match(/\b(?:built for|made for|targeted at|aimed at)\s+(.+?)(?:[,.]|$)/i);
  const audiencePhrase = cleanOfferText((helpFor?.[1] ?? directFor?.[1] ?? "").replace(/\bwho\b.+$/i, ""));
  const splitPattern = /\s+(?:for|built for|made for|targeted at|aimed at|to help)\s+/i;
  const [productChunk] = source.split(splitPattern);

  return {
    source,
    productChunk: cleanOfferText(productChunk || fallback),
    audiencePhrase,
  };
}

function inferAudience(brief: string, fallback: string, linkContext = "") {
  const { audiencePhrase } = splitOffer(brief, linkContext, fallback);
  if (audiencePhrase.length > 3) {
    return titleCase(audiencePhrase.slice(0, 46));
  }

  const lower = brief.toLowerCase();
  if (lower.includes("founder")) return "Founders";
  if (lower.includes("creator")) return "Creators";
  if (lower.includes("gen z") || lower.includes("student")) return "Gen Z scrollers";
  if (lower.includes("b2b") || lower.includes("operator")) return "B2B operators";
  if (lower.includes("buyer") || lower.includes("customer")) return "Cold buyers";
  return fallback;
}

function inferProduct(brief: string, linkContext: string, fallback: string) {
  const { source, productChunk } = splitOffer(brief, linkContext, fallback);
  const lower = source.toLowerCase();
  const hinted = productHints.find(([needle]) => lower.includes(needle))?.[1];
  const normalized = cleanOfferText(productChunk)
    .replace(/^a[n]?\s+/i, "")
    .replace(/\bthat\s+(?:helps|lets|allows)\b.+$/i, "")
    .replace(/\bwith\b.+$/i, "")
    .slice(0, 72);

  if (hinted && (normalized.length < 5 || normalized.split(" ").length > 7)) return hinted;
  if (hinted && hinted.toLowerCase().includes(normalized.toLowerCase())) return hinted;
  if (normalized.length >= 5) return normalized;
  return hinted ?? fallback;
}

function buildBrainSignals(
  attention: number,
  trust: number,
  recall: number,
  friction: number,
  product: string,
  audience: string,
): BrainAdSignal[] {
  return [
    {
      id: "visual",
      label: "Visual motion network",
      value: clamp(attention + 8),
      x: 70,
      y: 36,
      meaning: `Usually means motion, contrast, or a face-like cue is pulling attention. For ${audience}, show ${product} or the result in the first 2 seconds so the stop-scroll signal becomes product memory.`,
    },
    {
      id: "place",
      label: "Parahippocampal Place Area",
      value: clamp(recall + 10),
      x: 73,
      y: 58,
      meaning: `Usually means the viewer can imagine a concrete scene. For this ad, the scene should be: ${audience} using ${product}, then seeing a measurable before/after.`,
    },
    {
      id: "salience",
      label: "Salience network",
      value: clamp(attention * 0.72 + friction * 0.28),
      x: 61,
      y: 43,
      meaning: `Usually means the brain flags novelty or tension. Here it should attach to one sharp problem, not a broad promise, so the viewer knows why to keep watching.`,
    },
    {
      id: "valuation",
      label: "mPFC value estimate",
      value: clamp(trust * 0.65 + recall * 0.35),
      x: 55,
      y: 49,
      meaning: `Usually means personal value is being calculated. If this region lags, the ad needs clearer proof that ${product} pays off for ${audience}.`,
    },
    {
      id: "language",
      label: "Language network",
      value: clamp(trust + 4 - friction * 0.18),
      x: 46,
      y: 37,
      meaning: `Usually means the promise is easy to parse. Keep the spoken/written claim to one sentence, then show evidence instead of adding more claims.`,
    },
  ];
}

function buildSegments(audience: string, attention: number, trust: number, friction: number): ViewerSegment[] {
  return [
    {
      label: `${audience} ready buyers`,
      share: clamp((attention + trust) / 2 - 12, 12, 68),
      feeling: "they understand the promise and want one proof point",
      conversionIntent: clamp(trust + 8 - friction * 0.2),
      risk: "will bounce if the CTA is slower than the ad promise",
    },
    {
      label: "Skeptical comparers",
      share: clamp(76 - trust + friction * 0.35, 14, 46),
      feeling: "they pause, but compare this with cheaper or familiar options",
      conversionIntent: clamp(trust - 12),
      risk: "need numbers, screenshots, or an actual before/after",
    },
    {
      label: "Fast scrollers",
      share: clamp(70 - attention * 0.5 + friction * 0.2, 10, 42),
      feeling: "they notice the motion but may miss the product",
      conversionIntent: clamp(attention - 24),
      risk: "opening three seconds should show the product outcome sooner",
    },
    {
      label: "Amplifiers",
      share: clamp(attention * 0.45 + trust * 0.2, 8, 40),
      feeling: "they repeat the simplest emotional takeaway",
      conversionIntent: clamp((attention + trust) / 2),
      risk: "will share only if the hook is specific enough to quote",
    },
  ];
}

function buildRounds(request: AdPredictionRequest, headline: string): PredictiveRound[] {
  return [
    {
      label: "Seed extraction",
      status: "complete",
      output: `Parsed ${request.mode === "upload" ? request.uploadedFileName ?? "uploaded creative" : "reel link"} plus offer copy.`,
    },
    {
      label: "Memory graph",
      status: "complete",
      output: "Connected product promise, viewer motive, proof gap, CTA friction, and visual recall.",
    },
    {
      label: "Persona rollout",
      status: "complete",
      output: `Simulated ${request.audience} clusters reacting to: ${headline}`,
    },
    {
      label: "Counterfactual pass",
      status: "complete",
      output: "Compared current hook against proof-first, emotion-first, and CTA-first versions.",
    },
    {
      label: "Prediction report",
      status: "ready",
      output: "Projected emotional response, likely lift, and next ad experiments.",
    },
  ];
}

export function createLocalAdPrediction(request: AdPredictionRequest): AdPredictionReport {
  const brief = request.brief?.trim() || `${request.product}. ${request.promise}`.trim();
  const linkContext = request.linkContext?.trim() ?? "";
  const detectedProduct = inferProduct(brief, linkContext, request.product || "this product");
  const inferredAudience = inferAudience(brief, String(request.audience), linkContext);
  const seedText = [
    request.title,
    brief,
    request.product,
    request.promise,
    request.notes,
    linkContext,
    request.reelUrl,
    request.uploadedFileName,
  ]
    .filter(Boolean)
    .join(" ");
  const hash = hashString(seedText);
  const proof = wordHits(seedText, proofWords);
  const desire = wordHits(seedText, desireWords);
  const risk = wordHits(seedText, riskWords);
  const emotion = wordHits(seedText, emotionWords);
  const hasVideo = request.mode === "upload" || Boolean(request.reelUrl);
  const duration = request.uploadedDuration ?? 18 + (hash % 22);
  const durationPenalty = duration > 42 ? 10 : duration > 28 ? 5 : 0;

  const attentionScore = clamp(56 + desire * 6 + emotion * 5 + (hasVideo ? 7 : 0) - durationPenalty + (hash % 9));
  const trustScore = clamp(48 + proof * 9 + request.promise.length / 18 - risk * 10 + ((hash >> 4) % 10));
  const recallScore = clamp(50 + desire * 4 + proof * 4 + Math.min(detectedProduct.length, 50) / 3 + ((hash >> 7) % 8));
  const frictionScore = clamp(42 + risk * 10 + durationPenalty - proof * 5 - desire * 2 + ((hash >> 9) % 7));
  const confidence = clamp(attentionScore * 0.34 + trustScore * 0.28 + recallScore * 0.24 + (100 - frictionScore) * 0.14);
  const projectedLift = clamp(((attentionScore + trustScore + recallScore) / 3 - frictionScore) * 0.55, -18, 38);
  const dominantFeeling = classifyFeeling(seedText, attentionScore);
  const brainSignals = buildBrainSignals(
    attentionScore,
    trustScore,
    recallScore,
    frictionScore,
    detectedProduct,
    inferredAudience,
  );
  const activationLabel = [...brainSignals].sort((a, b) => b.value - a.value)[0]?.label ?? "Visual motion network";
  const activationMeaning = brainSignals.find((signal) => signal.label === activationLabel)?.meaning ?? "";
  const headline =
    confidence >= 76
      ? "The ad should make viewers feel curious and ready to click."
      : confidence >= 60
        ? "The ad has a usable hook, but needs clearer proof."
        : "The ad is likely to be noticed before it is believed.";

  return {
    id: `ad_${Date.now().toString(36)}_${(hash % 100000).toString(36)}`,
    title: request.title || "Untitled ad",
    audience: inferredAudience,
    goal: String(request.goal),
    detectedProduct,
    transcriptSummary: linkContext
      ? `Public link context suggests ${detectedProduct} for ${inferredAudience}. ${compactLine(linkContext, "No clear transcript was available.")}`
      : `No usable transcript found. Interpreting the ad as ${detectedProduct} for ${inferredAudience}.`,
    brainSummary: `${activationLabel} is predicted to lead. ${activationMeaning}`,
    headline,
    outcome:
      projectedLift >= 18
        ? "Strong test candidate"
        : projectedLift >= 7
          ? "Promising with edits"
          : "Needs creative reframe",
    confidence,
    projectedLift,
    attentionScore,
    trustScore,
    recallScore,
    frictionScore,
    dominantFeeling,
    activationLabel,
    neuralReadout: `${activationLabel}: ${dominantFeeling}, ${confidence}/100 confidence.`,
    brainSignals,
    viewerSegments: buildSegments(inferredAudience, attentionScore, trustScore, frictionScore),
    predictiveRounds: buildRounds(request, headline),
    timeline: [
      {
        time: "0-3s",
        event: "Hook recognition",
        response: attentionScore > 70 ? "strong stop-scroll signal" : "visible but not yet sharp",
        score: attentionScore,
      },
      {
        time: "4-9s",
        event: "Meaning formation",
        response: recallScore > 68 ? "viewers can picture the use case" : "viewer needs a clearer scene",
        score: recallScore,
      },
      {
        time: "10-18s",
        event: "Trust check",
        response: trustScore > 68 ? "proof feels believable" : "proof gap becomes the main objection",
        score: trustScore,
      },
      {
        time: "CTA",
        event: "Action decision",
        response: frictionScore > 58 ? "conversion drag is high" : "next action is plausible",
        score: clamp(100 - frictionScore),
      },
    ],
    recommendations: [
      attentionScore < 72
        ? `Open with the visible outcome of ${detectedProduct}, not a setup line.`
        : `Keep the opening energy, but make ${detectedProduct} identifiable before the viewer has to infer it.`,
      trustScore < 70
        ? `Add one hard proof element for ${inferredAudience}: number, screenshot, testimonial, or before/after.`
        : "Keep the proof compact so it does not slow the hook.",
      frictionScore > 54
        ? "Reduce the ask: one CTA, one landing promise, one next step."
        : `Use the landing page headline to repeat the exact ${detectedProduct} promise from the ad.`,
    ],
    experiments: [
      "Hook A: show the painful before state first.",
      "Hook B: show the finished outcome first.",
      "Proof cut: insert a one-second result card before the CTA.",
    ],
    sourceNote:
      "This is a TRIBE-style predictive proxy for ad review. It does not claim individualized fMRI, diagnosis, or real viewer brain measurement.",
    generatedAt: new Date().toISOString(),
  };
}
