"use client";

import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clipboard,
  Loader2,
  MessageSquare,
  MousePointer2,
  Radar,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BrainSurface } from "@/components/BrainSurface";
import { SwarmWorldPanel } from "@/components/SwarmWorldPanel";
import type {
  Audience,
  Context,
  PhraseInsight,
  ValidationReport,
} from "@/lib/validation-model";

const audiences: Audience[] = [
  "Founders",
  "Junior builders",
  "Investors",
  "Recruiters",
  "LinkedIn general",
  "Custom",
];

const contexts: Context[] = [
  "LinkedIn post",
  "Startup idea",
  "Pitch",
  "Product launch",
  "Demo script",
];

const sampleIdea =
  "A one-click idea validator that simulates how founders, builders, and investors react before you post. It combines audience simulation with TRIBE-derived brain response references so you can see which phrase creates clarity, confusion, or trust.";

function confidenceLabel(value: number) {
  if (value >= 78) return "High";
  if (value >= 58) return "Medium";
  return "Low";
}

function VerdictGlyph({ verdict }: { verdict: string }) {
  if (verdict === "Validated") {
    return <CheckCircle2 size={28} className="mt-1 text-[var(--primary)]" />;
  }
  if (verdict === "Invalidated") {
    return <XCircle size={28} className="mt-1 text-[var(--primary)]" />;
  }
  return <Radar size={28} className="mt-1 text-[var(--primary)]" />;
}

function PhraseChip({
  item,
  active,
  onActivate,
}: {
  item: PhraseInsight;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={onActivate}
        onFocus={onActivate}
        onMouseEnter={onActivate}
        className="mx-0.5 my-1 border border-[rgba(245,78,0,0.38)] bg-[rgba(245,78,0,0.12)] px-2 py-1 text-left text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[rgba(245,78,0,0.22)]"
        style={{ boxShadow: `inset 0 -2px 0 rgba(245,78,0,${item.salience / 135})` }}
      >
        {item.text}
      </button>
      {active ? (
        <span className="absolute left-0 top-full z-30 mt-2 w-[min(88vw,340px)] border border-[var(--hairline-strong)] bg-[#11110f] p-3 text-left shadow-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--primary)]">
            {item.brainRegion} · salience {item.salience}
          </span>
          <span className="mt-2 block text-sm text-[var(--muted-strong)]">
            Reaction: {item.reaction}. {item.question}
          </span>
          <span className="mt-3 block text-xs text-[var(--muted)]">
            Validates: {item.validates.join(", ")}
          </span>
          <span className="mt-1 block text-xs text-[var(--muted)]">
            Invalidates: {item.invalidates.join(", ")}
          </span>
          <span className="mt-3 block border-t border-[var(--hairline)] pt-3 text-xs text-[var(--foreground)]">
            Rewrite: {item.rewrite}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export function IdeaValidator() {
  const [ideaTitle, setIdeaTitle] = useState("tribeIdeas");
  const [ideaBody, setIdeaBody] = useState(sampleIdea);
  const [audience, setAudience] = useState<Audience>("Founders");
  const [context, setContext] = useState<Context>("LinkedIn post");
  const [customAudience, setCustomAudience] = useState("");
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [activePhrase, setActivePhrase] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"local" | "deepseek" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit = ideaTitle.trim().length > 1 && ideaBody.trim().length > 12;
  const progressCopy = useMemo(
    () => [
      "Building a synthetic audience",
      "Running MiroFish-style reaction rounds",
      "Matching TRIBE-derived brain reference",
      "Scoring objections and confidence",
    ],
    [],
  );

  async function runValidation() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaTitle,
          ideaBody,
          audience,
          context,
          customAudience,
        }),
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error ?? "Validation failed");
      setReport(payload.report);
      setMode(payload.mode);
      setActivePhrase(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not validate idea");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!report) return;
    await navigator.clipboard.writeText(
      `${report.verdict} (${report.confidence}/100): ${report.summary}\n\nRewrite: ${report.rewrite}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--hairline)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[var(--hairline-strong)] bg-[var(--surface)]">
              <Brain size={21} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--primary)]">
                tribeIdeas
              </div>
              <h1 className="text-xl font-medium tracking-tight">
                Validate your idea before the room hears it.
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
            <span className="border border-[var(--hairline)] px-3 py-2">
              DeepSeek-ready
            </span>
            <span className="border border-[var(--hairline)] px-3 py-2">
              TRIBE reference maps
            </span>
            <span className="border border-[var(--hairline)] px-3 py-2">
              MiroFish-style world
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr]">
        <section className="border border-[var(--hairline)] bg-[var(--surface)]">
          <div className="border-b border-[var(--hairline)] p-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
              <Sparkles size={15} />
              Idea input
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Enter the version you would actually post or pitch. The report will
              judge clarity, audience pull, objections, and brain-response fit.
            </p>
          </div>

          <div className="space-y-5 p-4">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Name
              </span>
              <input
                value={ideaTitle}
                onChange={(event) => setIdeaTitle(event.target.value)}
                className="mt-2 w-full border border-[var(--hairline)] bg-[#0b0b09] px-3 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                placeholder="tribeIdeas"
              />
            </label>

            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Idea / post / pitch
              </span>
              <textarea
                value={ideaBody}
                onChange={(event) => setIdeaBody(event.target.value)}
                rows={9}
                className="mt-2 w-full resize-none border border-[var(--hairline)] bg-[#0b0b09] px-3 py-3 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
                placeholder="Describe the idea as your audience would see it..."
              />
            </label>

            <div>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Audience
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {audiences.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setAudience(item)}
                    className={`min-h-10 border px-3 py-2 text-sm transition ${
                      audience === item
                        ? "border-[var(--primary)] bg-[rgba(245,78,0,0.12)] text-white"
                        : "border-[var(--hairline)] bg-[#0b0b09] text-[var(--muted-strong)] hover:border-[var(--hairline-strong)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {audience === "Custom" ? (
                <input
                  value={customAudience}
                  onChange={(event) => setCustomAudience(event.target.value)}
                  className="mt-2 w-full border border-[var(--hairline)] bg-[#0b0b09] px-3 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="e.g. AI founders in Sydney"
                />
              ) : null}
            </div>

            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                Context
              </span>
              <select
                value={context}
                onChange={(event) => setContext(event.target.value as Context)}
                className="mt-2 w-full border border-[var(--hairline)] bg-[#0b0b09] px-3 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              >
                {contexts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={runValidation}
              disabled={!canSubmit || loading}
              className="flex h-12 w-full items-center justify-between bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:bg-[var(--primary-active)] disabled:cursor-not-allowed disabled:bg-[var(--surface-raised)] disabled:text-[var(--muted)]"
            >
              <span>{loading ? "Running validation" : "Run validation"}</span>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            </button>

            {error ? (
              <p className="border border-[var(--danger)] bg-[rgba(207,45,86,0.12)] p-3 text-sm text-[var(--muted-strong)]">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="min-h-[720px]">
          {loading ? (
            <div className="min-h-[720px] border border-[var(--hairline)] bg-[var(--surface)]">
              <div className="grid min-h-[720px] gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative overflow-hidden border-b border-[var(--hairline)] bg-[#090908] p-5 lg:border-b-0 lg:border-r">
                  <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#f7f7f4_1px,transparent_0)] [background-size:28px_28px]" />
                  <div className="relative z-10 flex items-center gap-3">
                    <Loader2 className="animate-spin text-[var(--primary)]" />
                    <div>
                      <h2 className="text-2xl font-medium">Building the parallel room.</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Agent clusters are forming, debating, and mapping the idea to a brain reference.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-10 h-[430px]">
                    {[
                      ["Seed", "18%", "25%"],
                      ["Validators", "72%", "22%"],
                      ["Skeptics", "35%", "66%"],
                      ["Amplifiers", "78%", "72%"],
                      ["Brain map", "51%", "45%"],
                    ].map(([label, left, top], index) => (
                      <div
                        key={label}
                        className="absolute w-36 -translate-x-1/2 -translate-y-1/2 border border-[var(--hairline-strong)] bg-black/65 p-3 backdrop-blur"
                        style={{ left, top }}
                      >
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--primary)]">
                          node 0{index + 1}
                        </div>
                        <div className="mt-2 text-sm">{label}</div>
                      </div>
                    ))}
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                      <path d="M18 25L72 22L51 45L35 66L78 72L51 45L18 25" stroke="#f54e00" strokeOpacity="0.32" strokeWidth="0.45" fill="none" strokeDasharray="1 2" />
                    </svg>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    real-time simulation phases
                  </div>
                  <div className="space-y-3">
                    {progressCopy.map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 border border-[var(--hairline)] bg-[#0b0b09] p-3"
                      >
                        <span className="font-mono text-xs text-[var(--primary)]">
                          0{index + 1}
                        </span>
                        <span className="text-sm text-[var(--muted-strong)]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border border-[var(--hairline)] bg-[#0b0b09] p-4 font-mono text-xs leading-6 text-[var(--muted-strong)]">
                    <div><span className="text-[var(--primary)]">t+04s</span> seed idea parsed</div>
                    <div><span className="text-[var(--primary)]">t+11s</span> audience memory graph expanding</div>
                    <div><span className="text-[var(--primary)]">t+19s</span> agent objections forming</div>
                    <div><span className="text-[var(--primary)]">t+27s</span> cortical reference matching</div>
                  </div>
                </div>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-6">
              <section className="border border-[var(--hairline)] bg-[var(--surface)]">
                <div className="grid gap-0 md:grid-cols-[1fr_280px]">
                  <div className="border-b border-[var(--hairline)] p-5 md:border-b-0 md:border-r">
                    <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--muted)]">
                      <span>{mode === "deepseek" ? "DeepSeek enhanced" : "Local engine"}</span>
                      <span>/</span>
                      <span>{report.context}</span>
                      <span>/</span>
                      <span>{report.audience}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <VerdictGlyph verdict={report.verdict} />
                      <div>
                        <h2 className="text-3xl font-medium tracking-tight">
                          {report.verdict}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      confidence
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-5xl font-medium">{report.confidence}</span>
                      <span className="pb-2 font-mono text-sm text-[var(--muted)]">
                        /100 · {confidenceLabel(report.confidence)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {report.confidenceReason}
                    </p>
                  </div>
                </div>
              </section>

              <SwarmWorldPanel report={report} />

              <BrainSurface
                archetypeId={report.archetypeId}
                regions={report.brainRegions}
              />

              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="border border-[var(--hairline)] bg-[var(--surface)] p-5">
                  <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    <MousePointer2 size={15} />
                    Hover or tap phrases
                  </div>
                  <div className="text-lg leading-9">
                    {report.phraseInsights.map((item, index) => (
                      <PhraseChip
                        key={`${item.text}-${index}`}
                        item={item}
                        active={activePhrase === index}
                        onActivate={() => setActivePhrase(index)}
                      />
                    ))}
                  </div>
                  <p className="mt-5 border-t border-[var(--hairline)] pt-4 text-sm leading-6 text-[var(--muted)]">
                    {report.sourceNote}
                  </p>
                </div>

                <div className="border border-[var(--hairline)] bg-[var(--surface)] p-5">
                  <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    <Users size={15} />
                    Audience split
                  </div>
                  <div className="space-y-3">
                    {report.audienceGroups.map((group) => (
                      <div key={group.label} className="border border-[var(--hairline)] bg-[#0b0b09] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">{group.label}</span>
                          <span className="font-mono text-xs text-[var(--muted-strong)]">
                            {group.share}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-[var(--surface-raised)]">
                          <div
                            className="h-full bg-[var(--primary)]"
                            style={{ width: `${group.share}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          {group.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-3">
                <div className="border border-[var(--hairline)] bg-[var(--surface)] p-5">
                  <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    <MessageSquare size={15} />
                    Questions
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-[var(--muted-strong)]">
                    {report.topQuestions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="border border-[var(--hairline)] bg-[var(--surface)] p-5">
                  <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    objections
                  </div>
                  <ul className="space-y-3 text-sm leading-6 text-[var(--muted-strong)]">
                    {report.objections.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="border border-[var(--hairline)] bg-[var(--surface)] p-5">
                  <div className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
                    stronger version
                  </div>
                  <p className="text-sm leading-6 text-[var(--muted-strong)]">
                    {report.rewrite}
                  </p>
                  <button
                    type="button"
                    onClick={copySummary}
                    className="mt-5 flex h-10 w-full items-center justify-center gap-2 border border-[var(--hairline-strong)] text-sm transition hover:border-[var(--primary)]"
                  >
                    <Clipboard size={15} />
                    {copied ? "Copied" : "Copy summary"}
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="grid min-h-[720px] place-items-center border border-[var(--hairline)] bg-[var(--surface)] p-6">
              <div className="max-w-2xl text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-[var(--hairline-strong)] bg-[#0b0b09]">
                  <Radar size={28} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl font-medium tracking-tight">
                  Run the arena.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                  tribeIdeas validates your idea with a synthetic audience and
                  TRIBE v2-derived brain response references. The first report
                  appears here with hoverable phrases and a live-looking cortical map.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
