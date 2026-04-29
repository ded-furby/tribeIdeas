"use client";

import { Activity, Brain, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { getArchetype } from "@/lib/brain-archetypes";
import type { BrainRegionScore } from "@/lib/validation-model";

type BrainSurfaceProps = {
  archetypeId: string;
  regions: BrainRegionScore[];
};

export function BrainSurface({ archetypeId, regions }: BrainSurfaceProps) {
  const archetype = useMemo(() => getArchetype(archetypeId), [archetypeId]);
  const [activeRegion, setActiveRegion] = useState(regions[0]?.id ?? "language");

  const selected =
    regions.find((region) => region.id === activeRegion) ?? regions[0];

  return (
    <section className="min-h-[560px] border border-[var(--hairline)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 border-b border-[var(--hairline)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--primary)]">
            <Brain size={16} />
            TRIBE v2-derived brain reference
          </div>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">
            {archetype.label}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {archetype.description}
          </p>
        </div>
        <div className="flex items-center gap-2 border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 py-2 font-mono text-xs text-[var(--muted-strong)]">
          <Activity size={14} />
          reference asset, not mind reading
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[380px] overflow-hidden border-b border-[var(--hairline)] bg-[#0b0b09] p-4 lg:border-b-0 lg:border-r">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[rgba(245,78,0,0.16)] to-transparent" />
          <div className="absolute left-0 top-0 h-full w-full opacity-[0.05] [background-image:linear-gradient(var(--hairline)_1px,transparent_1px),linear-gradient(90deg,var(--hairline)_1px,transparent_1px)] [background-size:32px_32px]" />
          <svg
            viewBox="0 0 720 460"
            role="img"
            aria-label="Interactive cortical surface reference map"
            className="relative z-10 h-full min-h-[360px] w-full"
          >
            <defs>
              <radialGradient id="brainGlow" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor="#353129" />
                <stop offset="72%" stopColor="#171611" />
                <stop offset="100%" stopColor="#0b0b09" />
              </radialGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M119 228C114 136 178 69 267 72c47 2 73 22 91 52 17-30 48-50 96-52 90-3 153 64 148 156-5 91-68 150-151 156-43 3-73-8-93-33-20 25-50 36-93 33-83-6-141-65-146-156Z"
              fill="url(#brainGlow)"
              stroke="#3a3831"
              strokeWidth="2"
            />
            <path
              d="M360 123c-8 44-8 84 0 119 8 36 8 72 0 109"
              fill="none"
              stroke="#4b493f"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[
              "M176 171c39-18 74-19 105-3",
              "M164 231c42-24 87-25 133-4",
              "M194 294c35 12 70 12 105-2",
              "M434 168c42-18 82-17 119 4",
              "M421 229c48-21 94-20 138 4",
              "M422 294c38 12 77 11 116-2",
              "M246 111c18 32 21 63 10 94",
              "M479 111c-18 32-22 63-11 94",
            ].map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke="#5d594d"
                strokeLinecap="round"
                strokeWidth="2"
                opacity="0.45"
              />
            ))}

            {archetype.activationPath.map((spot, index) => (
              <g key={`${spot.x}-${spot.y}`}>
                <circle
                  cx={(spot.x / 100) * 720}
                  cy={(spot.y / 100) * 460}
                  r={spot.r * 2.35}
                  fill={archetype.color}
                  opacity={0.12 + spot.value * 0.28}
                  filter="url(#softGlow)"
                  style={{
                    animation: `brain-pulse ${2.2 + index * 0.4}s ease-in-out infinite`,
                  }}
                />
                <circle
                  cx={(spot.x / 100) * 720}
                  cy={(spot.y / 100) * 460}
                  r={spot.r * 0.88}
                  fill={archetype.color}
                  opacity={0.4 + spot.value * 0.32}
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Info size={15} />
            Select a region to see why the map matters for validation.
          </div>
          <div className="space-y-3">
            {regions.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setActiveRegion(region.id)}
                className={`w-full border p-3 text-left transition ${
                  activeRegion === region.id
                    ? "border-[var(--primary)] bg-[rgba(245,78,0,0.12)]"
                    : "border-[var(--hairline)] bg-[var(--surface-soft)] hover:border-[var(--hairline-strong)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{region.label}</span>
                  <span className="font-mono text-sm text-[var(--muted-strong)]">
                    {region.value}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden bg-[#080807]">
                  <div
                    className="h-full bg-[var(--primary)]"
                    style={{ width: `${region.value}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="mt-5 border border-[var(--hairline)] bg-[#0d0d0b] p-4">
              <div className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--primary)]">
                Insight
              </div>
              <h3 className="mt-2 text-lg font-medium">{selected.label}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                {selected.insight}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

