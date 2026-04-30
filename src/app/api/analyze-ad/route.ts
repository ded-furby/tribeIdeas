import { NextResponse } from "next/server";
import { z } from "zod";
import { createLocalAdPrediction } from "@/lib/ad-prediction";
import type { AdPredictionReport } from "@/lib/ad-model";

export const runtime = "nodejs";

const adSchema = z.object({
  title: z.string().min(2).max(140),
  mode: z.enum(["upload", "link"]),
  reelUrl: z.string().max(600).optional(),
  uploadedFileName: z.string().max(240).optional(),
  uploadedFileSize: z.number().nonnegative().optional(),
  uploadedDuration: z.number().nonnegative().optional(),
  audience: z.string().min(2).max(120),
  goal: z.string().min(2).max(80),
  product: z.string().min(2).max(180),
  promise: z.string().min(6).max(900),
  notes: z.string().max(1400).optional(),
});

function extractJson(text: string) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function enhanceWithDeepSeek(seed: AdPredictionReport) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.38,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You refine ad prediction reports. Preserve the exact JSON shape and keys. Be sharp, concrete, and useful for improving ads. Do not claim real fMRI measurement, medical insight, or mind reading.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Improve this TRIBE-style ad brain-response prediction using MiroFish-inspired persona simulation. Keep all arrays the same lengths and keep numeric fields between 0 and 100 unless projectedLift.",
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
  return extractJson(content) as AdPredictionReport;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = adSchema.parse(json);
    const seed = createLocalAdPrediction(parsed);

    try {
      const enhanced = await enhanceWithDeepSeek(seed);
      return NextResponse.json({
        ok: true,
        mode: enhanced ? "deepseek" : "local",
        report: enhanced ?? seed,
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        mode: "local",
        report: {
          ...seed,
          sourceNote: `${seed.sourceNote} DeepSeek enhancement was unavailable, so this used the local predictor.`,
        },
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
            : "Could not analyze this ad. Check the input and try again.",
      },
      { status: 400 },
    );
  }
}
