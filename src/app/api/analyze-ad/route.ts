import { NextResponse } from "next/server";
import { z } from "zod";
import { createLocalAdPrediction } from "@/lib/ad-prediction";
import type { AdPredictionReport } from "@/lib/ad-model";

export const runtime = "nodejs";

const LINK_CONTEXT_TIMEOUT_MS = 1800;
const DEFAULT_MODEL_TIMEOUT_MS = 9000;

const adSchema = z.object({
  title: z.string().min(2).max(140).optional(),
  mode: z.enum(["upload", "link"]),
  brief: z.string().min(4).max(700).optional(),
  reelUrl: z.string().max(600).optional(),
  uploadedFileName: z.string().max(240).optional(),
  uploadedFileSize: z.number().nonnegative().optional(),
  uploadedDuration: z.number().nonnegative().optional(),
  audience: z.string().min(2).max(120).optional(),
  goal: z.string().min(2).max(80).optional(),
  product: z.string().min(2).max(180).optional(),
  promise: z.string().min(6).max(900).optional(),
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

function readMeta(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern);
  return match?.[1] ?? match?.[2] ?? "";
}

function cleanHtmlText(html: string) {
  return html
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/g, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
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

async function getLinkContext(url?: string) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_CONTEXT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AdCortex/1.0; +https://github.com/ded-furby/tribeIdeas)",
      },
    });
    if (!response.ok) return "";
    const html = (await response.text()).slice(0, 140_000);
    const title = cleanHtmlText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const meta = [
      readMeta(html, "og:title"),
      readMeta(html, "og:description"),
      readMeta(html, "twitter:title"),
      readMeta(html, "twitter:description"),
      readMeta(html, "description"),
    ]
      .map(cleanHtmlText)
      .filter((item) => item && !/data:image|base64|<img|width=|height=/i.test(item));
    const caption =
      html.match(/"shortDescription":"([^"]+)"/)?.[1] ??
      html.match(/"captionTracks":\[(.*?)\]/)?.[1] ??
      "";
    const visible = cleanHtmlText(html).slice(0, 650);
    return [title, ...meta, cleanHtmlText(caption), visible]
      .join(" ")
      .replace(/\\"/g, '"')
      .replace(/data:image\/[a-zA-Z+.-]+;base64,[^\s"'<]+/g, " ")
      .replace(/\b(?:width|height|style|src|class|loading|alt)=["']?[^"'\s]+["']?/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1250);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function enhanceWithModel(seed: AdPredictionReport) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.provider.com";
  const model = process.env.AI_MODEL ?? "chat-model";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? DEFAULT_MODEL_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.28,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Refine ad prediction JSON. Preserve exact keys and array lengths. Be concrete. Do not claim real fMRI, medical insight, or mind reading.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task:
                "Sharpen this TRIBE-style ad brain-response prediction using synthetic audience simulation. Keep numeric fields between 0 and 100 except projectedLift.",
              report: seed,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Model request failed with ${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;
    return extractJson(content) as AdPredictionReport;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Model request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = adSchema.parse(json);
    const linkContext = parsed.mode === "link" ? await getLinkContext(parsed.reelUrl) : "";
    const brief = parsed.brief?.trim() || parsed.product || parsed.promise || "ad creative for likely buyers";
    const seed = createLocalAdPrediction({
      title: parsed.title || parsed.uploadedFileName || "Ad creative",
      mode: parsed.mode,
      brief,
      reelUrl: parsed.reelUrl,
      uploadedFileName: parsed.uploadedFileName,
      uploadedFileSize: parsed.uploadedFileSize,
      uploadedDuration: parsed.uploadedDuration,
      audience: parsed.audience || "Cold buyers",
      goal: parsed.goal || "Stop scroll",
      product: parsed.product || brief,
      promise: parsed.promise || brief,
      notes: parsed.notes,
      linkContext,
    });

    try {
      const enhanced = await enhanceWithModel(seed);
      return NextResponse.json({
        ok: true,
        mode: enhanced ? "model" : "instant",
        report: enhanced ?? seed,
      });
    } catch (error) {
      return NextResponse.json({
        ok: true,
        mode: "instant",
        report: {
          ...seed,
          sourceNote: `${seed.sourceNote} Model enhancement was unavailable, so this used the instant predictor.`,
        },
        warning: error instanceof Error ? error.message : "Model unavailable",
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
