"use client";

import {
  Brain,
  Check,
  Clipboard,
  FileVideo,
  Link as LinkIcon,
  Loader2,
  Play,
  Upload,
} from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { BrainAdStage } from "@/components/BrainAdStage";
import type { AdInputMode, AdPredictionReport } from "@/lib/ad-model";

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur-2xl">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/42">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export function AdCortexApp() {
  const [mode, setMode] = useState<AdInputMode>("link");
  const [reelUrl, setReelUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [duration, setDuration] = useState<number | undefined>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [report, setReport] = useState<AdPredictionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canAnalyze = brief.trim().length > 4 && (mode === "upload" ? Boolean(fileName) : reelUrl.trim().length > 5);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMode("upload");
    setFileName(file.name);
    setFileSize(file.size);
    setPreviewUrl(URL.createObjectURL(file));
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
          title: fileName || "Ad creative",
          mode,
          brief,
          reelUrl,
          uploadedFileName: fileName,
          uploadedFileSize: fileSize,
          uploadedDuration: duration,
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
    if (!report) return;
    await navigator.clipboard.writeText(
      `${report.outcome} · ${report.confidence}/100\n${report.brainSummary}\nDetected: ${report.detectedProduct}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.16),transparent_32rem),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_24rem)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1540px] flex-col gap-5 px-4 py-5 sm:px-6">
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <Brain size={22} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/44">AdCortex</div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Predict the feeling behind a reel.
              </h1>
            </div>
          </div>

          <div className="grid gap-2 md:min-w-[620px] md:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-2 rounded-[18px] border border-white/10 bg-black/35 p-1 backdrop-blur-2xl">
              {(["link", "upload"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-semibold transition ${
                    mode === item ? "bg-white text-black" : "text-white/54 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item === "link" ? <LinkIcon size={15} /> : <Upload size={15} />}
                  {item === "link" ? "Link" : "Video"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={analyzeAd}
              disabled={!canAnalyze || loading}
              className="flex h-[52px] items-center justify-center gap-2 rounded-[18px] bg-white px-5 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(255,255,255,0.14)] transition hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:bg-white/14 disabled:text-white/35"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Analyze
            </button>
          </div>
        </header>

        <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl lg:grid-cols-[0.86fr_1.14fr]">
          <div className="grid gap-3">
            {mode === "link" ? (
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-white/42">reel or video URL</span>
                <input
                  value={reelUrl}
                  onChange={(event) => setReelUrl(event.target.value)}
                  className="mt-2 h-14 w-full rounded-[20px] border border-white/10 bg-black/42 px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-white/34"
                  placeholder="https://..."
                />
              </label>
            ) : (
              <label className="grid min-h-28 cursor-pointer place-items-center rounded-[24px] border border-dashed border-white/18 bg-black/38 p-4 text-center transition hover:border-white/38">
                <input type="file" accept="video/*" className="hidden" onChange={onFileChange} />
                <FileVideo className="mb-2 text-white" />
                <span className="text-sm font-medium text-white">{fileName || "Drop any reel or video"}</span>
                <span className="mt-1 text-xs text-white/38">preview stays in browser</span>
              </label>
            )}

            <label className="block">
              <span className="text-xs uppercase tracking-[0.16em] text-white/42">
                product + audience in one line
              </span>
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-[20px] border border-white/10 bg-black/42 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-white/34"
                placeholder="Example: skincare serum for women who want glass skin before a party"
              />
            </label>

            {error ? (
              <div className="rounded-[18px] border border-white/16 bg-white/[0.07] p-3 text-sm text-white/70">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_0.9fr]">
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                className="aspect-video w-full rounded-[24px] border border-white/10 bg-black object-cover"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-[24px] border border-white/10 bg-black/42 text-center">
                <div>
                  <div className="text-sm font-medium text-white">Ready for creative</div>
                  <div className="mt-1 text-xs text-white/38">Paste a link or upload a video.</div>
                </div>
              </div>
            )}

            {report ? (
              <div className="rounded-[24px] border border-white/10 bg-black/34 p-4 backdrop-blur-2xl">
                <div className="text-xs uppercase tracking-[0.16em] text-white/42">detected</div>
                <p className="mt-2 text-sm leading-6 text-white/78">{report.detectedProduct}</p>
                <p className="mt-4 text-xs leading-5 text-white/42">{report.transcriptSummary}</p>
              </div>
            ) : (
              <div className="grid rounded-[24px] border border-white/10 bg-black/34 p-4 text-center backdrop-blur-2xl">
                <div className="m-auto">
                  <div className="text-sm font-medium text-white">No analysis yet</div>
                  <div className="mt-1 text-xs text-white/38">Run once to reveal the brain response.</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {report ? (
          <BrainAdStage report={report} />
        ) : (
          <section className="grid min-h-[520px] place-items-center rounded-[32px] border border-white/10 bg-black/62 shadow-[0_28px_120px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:min-h-[680px]">
            <div className="px-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.06]">
                <Brain size={25} className="text-white/78" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Brain response waits here.</h2>
              <p className="mt-2 text-sm text-white/42">No predictions are shown until analysis runs.</p>
            </div>
          </section>
        )}

        {report ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricPill label="attention" value={report.attentionScore} />
                <MetricPill label="trust" value={report.trustScore} />
                <MetricPill label="memory" value={report.recallScore} />
                <MetricPill label="ease" value={100 - report.frictionScore} />
              </div>

              <button
                type="button"
                onClick={copyReport}
                className="flex min-h-16 items-center justify-center gap-2 rounded-[24px] border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-white shadow-2xl backdrop-blur-2xl transition hover:border-white/25"
              >
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
                {copied ? "Copied" : "Copy readout"}
              </button>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {report.recommendations.slice(0, 3).map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/68 shadow-2xl backdrop-blur-2xl"
                >
                  {item}
                </div>
              ))}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
