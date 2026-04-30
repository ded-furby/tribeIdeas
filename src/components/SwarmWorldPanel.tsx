"use client";

import { GitBranch, Radio, ScrollText, Workflow } from "lucide-react";
import type { ValidationReport } from "@/lib/validation-model";

type SwarmWorldPanelProps = {
  report: ValidationReport;
};

const phases = [
  "Seed idea",
  "Build memory graph",
  "Generate audience",
  "Run reactions",
  "Extract verdict",
];

export function SwarmWorldPanel({ report }: SwarmWorldPanelProps) {
  const nodes = report.audienceGroups.map((group, index) => ({
    ...group,
    x: [18, 68, 38, 78][index % 4],
    y: [28, 26, 68, 72][index % 4],
  }));

  const logs = [
    `Project seed loaded: ${report.ideaTitle}`,
    `Audience graph created for ${report.audience}`,
    `${report.audienceGroups[0]?.label ?? "Validators"} accepted the core promise`,
    `${report.audienceGroups[1]?.label ?? "Skeptics"} requested proof and failure modes`,
    `Brain reference matched: ${report.summary}`,
    `Verdict emitted: ${report.verdict} at ${report.confidence}/100 confidence`,
  ];

  return (
    <section className="grid gap-0 border border-[var(--hairline)] bg-[var(--surface)] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative min-h-[460px] overflow-hidden border-b border-[var(--hairline)] bg-[#090908] lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#f7f7f4_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
          <Workflow size={15} />
          MiroFish-style parallel world
        </div>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {nodes.map((node, index) =>
            nodes.slice(index + 1).map((target) => (
              <line
                key={`${node.label}-${target.label}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke="#3a3831"
                strokeWidth="0.35"
                strokeDasharray="1 1.8"
              />
            )),
          )}
        </svg>

        {nodes.map((node, index) => (
          <div
            key={node.label}
            className="absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2 border border-[var(--hairline-strong)] bg-[rgba(17,17,15,0.88)] p-3 backdrop-blur"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                agent cluster {index + 1}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  node.stance === "validate"
                    ? "bg-[var(--success)]"
                    : node.stance === "doubt"
                      ? "bg-[var(--danger)]"
                      : "bg-[var(--primary)]"
                }`}
              />
            </div>
            <div className="mt-2 text-sm font-medium">{node.label}</div>
            <div className="mt-1 font-mono text-xs text-[var(--primary)]">
              {node.share}% · {node.stance}
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 left-4 right-4 z-30 grid gap-2 sm:grid-cols-5">
          {phases.map((phase, index) => (
            <div
              key={phase}
              className="border border-[var(--hairline)] bg-black/50 px-3 py-2 backdrop-blur"
            >
              <div className="font-mono text-[10px] text-[var(--primary)]">
                0{index + 1}
              </div>
              <div className="mt-1 text-xs text-[var(--muted-strong)]">{phase}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-h-[460px] grid-rows-[auto_1fr]">
        <div className="border-b border-[var(--hairline)] p-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
            <Radio size={15} />
            Live simulation console
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            The validation is shown as a swarm world: agents form a memory graph,
            react, debate, and produce a verdict.
          </p>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_0.86fr] lg:grid-cols-1 xl:grid-cols-[1fr_0.86fr]">
          <div className="border-b border-[var(--hairline)] p-4 sm:border-b-0 sm:border-r lg:border-b lg:border-r-0 xl:border-b-0 xl:border-r">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <ScrollText size={14} />
              Agent log
            </div>
            <div className="space-y-2 font-mono text-xs leading-5 text-[var(--muted-strong)]">
              {logs.map((log, index) => (
                <div key={log} className="border border-[var(--hairline)] bg-[#0b0b09] p-2">
                  <span className="text-[var(--primary)]">
                    t+{String(index * 7 + 4).padStart(2, "0")}s
                  </span>{" "}
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <GitBranch size={14} />
              Outcome routes
            </div>
            <div className="space-y-3">
              {report.audienceGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{group.label}</span>
                    <span className="font-mono text-[var(--muted)]">{group.share}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-[#080807]">
                    <div
                      className="h-full bg-[var(--primary)]"
                      style={{ width: `${group.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

