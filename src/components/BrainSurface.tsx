"use client";

import { Activity, Brain, Info } from "lucide-react";
import Image from "next/image";
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
        <div className="relative min-h-[380px] overflow-hidden border-b border-[var(--hairline)] bg-[#0b0b09] lg:border-b-0 lg:border-r">
          <Image
            src="/brain-assets/cortical-surface-reference.svg"
            alt="Cortical brain surface reference map with activation heat spots"
            width={1200}
            height={760}
            priority
            className="h-full min-h-[420px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070706] via-transparent to-transparent" />
          {archetype.activationPath.map((spot, index) => {
            const region = regions[index % regions.length];
            return (
              <button
                key={`${spot.x}-${spot.y}`}
                type="button"
                aria-label={`Open ${region?.label ?? "brain"} insight`}
                onClick={() => setActiveRegion(region?.id ?? activeRegion)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-white/20 shadow-[0_0_40px_rgba(245,78,0,0.75)] transition hover:scale-110"
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${22 + spot.r}px`,
                  height: `${22 + spot.r}px`,
                  backgroundColor: archetype.color,
                  opacity: 0.52 + spot.value * 0.32,
                  animation: `brain-pulse ${2.2 + index * 0.4}s ease-in-out infinite`,
                }}
              />
            );
          })}
          <div className="absolute bottom-4 left-4 right-4 z-20 grid gap-2 sm:grid-cols-3">
            {regions.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => setActiveRegion(region.id)}
                className={`border px-3 py-2 text-left backdrop-blur transition ${
                  activeRegion === region.id
                    ? "border-[var(--primary)] bg-[rgba(245,78,0,0.24)]"
                    : "border-white/10 bg-black/45 hover:border-white/30"
                }`}
              >
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">
                  {region.value}/100
                </span>
                <span className="block text-xs text-white">{region.label}</span>
              </button>
            ))}
          </div>
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
