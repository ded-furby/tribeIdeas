"use client";

import {
  BarChart3,
  Brain,
  Check,
  Clipboard,
  FileVideo,
  Link as LinkIcon,
  Loader2,
  Play,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { BrainAdStage } from "@/components/BrainAdStage";
import { createLocalAdPrediction } from "@/lib/ad-prediction";
import type { AdGoal, AdInputMode, AdPredictionReport, ViewerAudience } from "@/lib/ad-model";

const audiences: ViewerAudience[] = [
  "Cold buyers",
  "Warm prospects",
  "Founders",
  "Gen Z scrollers",
  "B2B operators",
  "Creators",
];

const goals: AdGoal[] = [
  "Stop scroll",
  "Drive signups",
  "Sell product",
  "Increase trust",
  "Get installs",
];

const sampleRequest = {
  title: "AI ad teardown reel",
  mode: "link" as AdInputMode,
  reelUrl: "https://instagram.com/reel/example",
  audience: "Cold buyers",
  goal: "Drive signups",
  product: "A launch analytics tool for founders",
  promise:
    "Paste a campaign and see which creative makes buyers trust the product before they click.",
  notes:
    "The opening shows the dashboard result first, then a founder reacting to the score.",
};

function scoreClass(value: number) {
  if (value >= 74) return "text-white";
  if (value >= 56) return "text-[#d8d8d8]";
  return "text-[#9c9c9c]";
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-[var(--hairline)] bg-[var(--surface)] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className={`mt-3 text-4xl font-semibold ${scoreClass(value)}`}>{value}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-white" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function AdCortexApp() {
  const initialReport = useMemo(() => createLocalAdPrediction(sampleRequest), []);
  const [mode, setMode] = useState<AdInputMode>("link");
  const [title, setTitle] = useState(sampleRequest.title);
  const [reelUrl, setReelUrl] = useState(sampleRequest.reelUrl);
  const [audience, setAudience] = useState<ViewerAudience>("Cold buyers");
  const [goal, setGoal] = useState<AdGoal>("Drive signups");
  const [product, setProduct] = useState(sampleRequest.product);
  const [promise, setPromise] = useState(sampleRequest.promise);
  const [notes, setNotes] = useState(sampleRequest.notes);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [duration, setDuration] = useState<number | undefined>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [report, setReport] = useState<AdPredictionReport>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canAnalyze =
    title.trim().length > 1 &&
    product.trim().length > 1 &&
    promise.trim().length > 5 &&
    (mode === "upload" ? Boolean(fileName) : reelUrl.trim().length > 5);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMode("upload");
    setFileName(file.name);
    setFileSize(file.size);
    setPreviewUrl(URL.createObjectURL(file));
    if (title === sampleRequest.title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  async function analyzeAd() {
    if (!canAnalyze || loading) return;
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/analyze-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mode,
          reelUrl,
          uploadedFileName: fileName,
          uploadedFileSize: fileSize,
          uploadedDuration: duration,
          audience,
          goal,
          product,
          promise,
          notes,
        }),
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error ?? "Could not analyze ad");
      setReport(payload.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze ad");
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    await navigator.clipboard.writeText(
      `${report.outcome} · ${report.confidence}/100\n${report.headline}\nProjected lift: ${report.projectedLift}%\nDominant feeling: ${report.dominantFeeling}\n${report.recommendations.join("\n")}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--hairline)] bg-black/80">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--hairline-strong)] bg-white text-black">
              <Brain size={21} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                AdCortex
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Predict how your ad feels before people scroll past it.
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--hairline)] px-3 py-2">
              TRIBE-style brain map
            </span>
            <span className="rounded-full border border-[var(--hairline)] px-3 py-2">
              MiroFish-like prediction
            </span>
            <span className="rounded-full border border-[var(--hairline)] px-3 py-2">
              DeepSeek-ready
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1540px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[430px_1fr]">
        <section className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            <Sparkles size={15} />
            creative input
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["link", "upload"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex h-11 items-center justify-center gap-2 rounded-[14px] border text-sm transition ${
                  mode === item
                    ? "border-white bg-white text-black"
                    : "border-[var(--hairline)] bg-black text-[var(--muted-strong)] hover:border-white/50"
                }`}
              >
                {item === "link" ? <LinkIcon size={15} /> : <Upload size={15} />}
                {item === "link" ? "Reel link" : "Upload"}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {mode === "link" ? (
              <label className="block">
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  reel / ad URL
                </span>
                <input
                  value={reelUrl}
                  onChange={(event) => setReelUrl(event.target.value)}
                  className="mt-2 h-12 w-full rounded-[14px] border border-[var(--hairline)] bg-black px-3 text-sm outline-none transition focus:border-white"
                  placeholder="https://..."
                />
              </label>
            ) : (
              <label className="grid min-h-36 cursor-pointer place-items-center rounded-[18px] border border-dashed border-[var(--hairline-strong)] bg-black p-4 text-center transition hover:border-white/50">
                <input type="file" accept="video/*" className="hidden" onChange={onFileChange} />
                <FileVideo className="mb-3 text-white" />
                <span className="text-sm font-medium">{fileName || "Drop a reel/ad video"}</span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  metadata stays local; only duration/name go to the predictor
                </span>
              </label>
            )}

            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                className="aspect-video w-full rounded-[18px] border border-[var(--hairline)] bg-black object-cover"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              />
            ) : null}

            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">ad name</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 h-12 w-full rounded-[14px] border border-[var(--hairline)] bg-black px-3 text-sm outline-none transition focus:border-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  audience
                </span>
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as ViewerAudience)}
                  className="mt-2 h-12 w-full rounded-[14px] border border-[var(--hairline)] bg-black px-3 text-sm outline-none transition focus:border-white"
                >
                  {audiences.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">goal</span>
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value as AdGoal)}
                  className="mt-2 h-12 w-full rounded-[14px] border border-[var(--hairline)] bg-black px-3 text-sm outline-none transition focus:border-white"
                >
                  {goals.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">product</span>
              <input
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                className="mt-2 h-12 w-full rounded-[14px] border border-[var(--hairline)] bg-black px-3 text-sm outline-none transition focus:border-white"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                promise / hook
              </span>
              <textarea
                value={promise}
                onChange={(event) => setPromise(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-[14px] border border-[var(--hairline)] bg-black px-3 py-3 text-sm leading-6 outline-none transition focus:border-white"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                scene notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-[14px] border border-[var(--hairline)] bg-black px-3 py-3 text-sm leading-6 outline-none transition focus:border-white"
              />
            </label>

            <button
              type="button"
              onClick={analyzeAd}
              disabled={!canAnalyze || loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-semibold text-black transition hover:bg-[#dcdcdc] disabled:cursor-not-allowed disabled:bg-[#2a2a2a] disabled:text-[#777]"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Predict viewer response
            </button>

            {error ? (
              <div className="rounded-[16px] border border-white/20 bg-white/5 p-3 text-sm text-[var(--muted-strong)]">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          <BrainAdStage report={report} />

          <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    prediction
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">{report.outcome}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">
                    {report.headline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyReport}
                  className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[var(--hairline-strong)] px-4 text-sm text-white transition hover:border-white"
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="attention" value={report.attentionScore} />
                <Metric label="trust" value={report.trustScore} />
                <Metric label="recall" value={report.recallScore} />
                <Metric label="low friction" value={100 - report.frictionScore} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                projected lift
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-semibold">{report.projectedLift}</span>
                <span className="pb-2 text-sm text-[var(--muted)]">%</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
                Dominant viewer feeling: <span className="text-white">{report.dominantFeeling}</span>.
                The strongest predicted activity is {report.activationLabel}.
              </p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                <Users size={15} />
                viewer clusters
              </div>
              <div className="space-y-3">
                {report.viewerSegments.map((segment) => (
                  <div key={segment.label} className="rounded-[18px] border border-[var(--hairline)] bg-black p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{segment.label}</div>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{segment.feeling}</p>
                      </div>
                      <div className="text-right text-sm font-semibold">{segment.share}%</div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-white" style={{ width: `${segment.conversionIntent}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">{segment.risk}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                <BarChart3 size={15} />
                predictive analysis
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  {report.predictiveRounds.map((round, index) => (
                    <div key={round.label} className="rounded-[18px] border border-[var(--hairline)] bg-black p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                        0{index + 1} · {round.status}
                      </div>
                      <div className="mt-2 font-medium">{round.label}</div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{round.output}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {report.timeline.map((moment) => (
                    <div key={moment.time} className="rounded-[18px] border border-[var(--hairline)] bg-black p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{moment.event}</div>
                        <div className="text-xs text-[var(--muted)]">{moment.time}</div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{moment.response}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-white" style={{ width: `${moment.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="mb-4 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                make the ad better
              </div>
              <div className="space-y-3">
                {report.recommendations.map((item) => (
                  <div key={item} className="rounded-[16px] border border-[var(--hairline)] bg-black p-4 text-sm leading-6 text-[var(--muted-strong)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--hairline)] bg-[var(--panel)] p-5">
              <div className="mb-4 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                next tests
              </div>
              <div className="space-y-3">
                {report.experiments.map((item) => (
                  <div key={item} className="rounded-[16px] border border-[var(--hairline)] bg-black p-4 text-sm leading-6 text-[var(--muted-strong)]">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-[var(--hairline)] pt-4 text-xs leading-5 text-[var(--muted)]">
                {report.sourceNote}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
