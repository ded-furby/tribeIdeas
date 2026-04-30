import { NextResponse } from "next/server";
import { z } from "zod";
import { createLocalValidation } from "@/lib/local-validation";
import type { ValidationReport } from "@/lib/validation-model";

export const runtime = "nodejs";

const validationSchema = z.object({
  ideaTitle: z.string().min(2).max(140),
  ideaBody: z.string().min(12).max(4000),
  audience: z.string().min(2).max(120),
  context: z.string().min(2).max(80),
  customAudience: z.string().max(240).optional(),
});

function extractJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function askDeepSeek(seed: ValidationReport): Promise<ValidationReport | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You refine an idea-validation report. Preserve the exact JSON shape and do not add extra keys. Be concrete, skeptical, and useful. Never claim mind-reading or individualized fMRI prediction.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Improve this report as a MiroFish-inspired swarm validation plus TRIBE-derived brain-reference explanation. Keep ids, archetypeId, brainRegions, and phraseInsights array lengths.",
            report: seed,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return null;

  return extractJson(content) as ValidationReport;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = validationSchema.parse(json);
    const seed = createLocalValidation(parsed);

    try {
      const enhanced = await askDeepSeek(seed);
      return NextResponse.json({
        ok: true,
        report: enhanced ?? seed,
        mode: enhanced ? "deepseek" : "local",
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        report: {
          ...seed,
          confidenceReason: `${seed.confidenceReason} DeepSeek enhancement was unavailable, so this report used the local validation engine.`,
        },
        mode: "local",
        warning: error instanceof Error ? error.message : "DeepSeek unavailable",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not validate this idea. Check the input and try again.",
      },
      { status: 400 },
    );
  }
}
