"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AdPredictionReport, BrainAdSignal } from "@/lib/ad-model";

type BrainAdStageProps = {
  report: AdPredictionReport;
};

const viewModes = ["True", "Compare", "Predicted"] as const;
const meshModes = ["Normal", "Inflated"] as const;
const skullModes = ["Open", "Close"] as const;

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-3 rounded-[18px] border border-[var(--stage-border)] bg-black/70 p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-10 rounded-[13px] text-sm font-semibold transition ${
            option === value
              ? "bg-[#2d2d2d] text-white"
              : "text-[#a9a9a9] hover:bg-white/5 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function BrainAdStage({ report }: BrainAdStageProps) {
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]>("Predicted");
  const [meshMode, setMeshMode] = useState<(typeof meshModes)[number]>("Normal");
  const [skullMode, setSkullMode] = useState<(typeof skullModes)[number]>("Close");
  const [activeSignal, setActiveSignal] = useState(report.brainSignals[1]?.id ?? report.brainSignals[0]?.id);

  const selected = useMemo<BrainAdSignal | undefined>(
    () => report.brainSignals.find((signal) => signal.id === activeSignal) ?? report.brainSignals[0],
    [activeSignal, report.brainSignals],
  );

  return (
    <section className="relative min-h-[720px] overflow-hidden rounded-[26px] border border-[var(--stage-border)] bg-black">
      <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/70 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-white" />
        TRIBE-style predicted response
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/70 backdrop-blur">
        {report.confidence}/100 confidence
      </div>

      <Image
        src="/brain-assets/ad-cortex-tribe-stage.png"
        alt="Predicted ad response brain scene"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 70vw"
        className={`object-contain transition duration-500 ${
          meshMode === "Inflated" ? "scale-[1.03] brightness-110" : ""
        } ${skullMode === "Open" ? "opacity-90" : "opacity-100"}`}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_43%,transparent_0%,transparent_42%,rgba(0,0,0,0.28)_78%,rgba(0,0,0,0.72)_100%)]" />

      {report.brainSignals.map((signal) => (
        <button
          key={signal.id}
          type="button"
          onMouseEnter={() => setActiveSignal(signal.id)}
          onFocus={() => setActiveSignal(signal.id)}
          onClick={() => setActiveSignal(signal.id)}
          className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border transition ${
            selected?.id === signal.id
              ? "border-white bg-white/30 shadow-[0_0_34px_rgba(255,255,255,0.22)]"
              : "border-white/30 bg-white/10 hover:border-white"
          }`}
          style={{
            left: `${signal.x}%`,
            top: `${signal.y}%`,
            height: `${18 + signal.value / 8}px`,
            width: `${18 + signal.value / 8}px`,
          }}
          aria-label={signal.label}
        />
      ))}

      <div className="absolute bottom-[96px] left-1/2 z-30 w-[min(84vw,420px)] -translate-x-1/2 rounded-[18px] border border-white/30 bg-black/72 px-5 py-3 text-center shadow-2xl backdrop-blur">
        <div className="text-lg font-semibold text-white underline decoration-white/30 underline-offset-4">
          {selected?.label ?? report.activationLabel}
        </div>
        <div className="mt-1 text-xs leading-5 text-white/62">
          {selected?.meaning ?? report.neuralReadout}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-30 grid gap-3 lg:grid-cols-[1.2fr_0.84fr_0.84fr]">
        <SegmentedControl options={viewModes} value={viewMode} onChange={setViewMode} />
        <div className="grid grid-cols-2 rounded-[18px] border border-[var(--stage-border)] bg-black/70 p-1">
          {meshModes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMeshMode(option)}
              className={`h-10 rounded-[13px] text-sm font-semibold transition ${
                option === meshMode ? "bg-[#2d2d2d] text-white" : "text-[#a9a9a9] hover:bg-white/5 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 rounded-[18px] border border-[var(--stage-border)] bg-black/70 p-1">
          {skullModes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSkullMode(option)}
              className={`h-10 rounded-[13px] text-sm font-semibold transition ${
                option === skullMode ? "bg-[#2d2d2d] text-white" : "text-[#a9a9a9] hover:bg-white/5 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute left-6 top-20 z-20 hidden w-52 rounded-[18px] border border-white/10 bg-black/58 p-3 text-xs leading-5 text-white/60 backdrop-blur md:block">
        {viewMode === "Predicted"
          ? report.neuralReadout
          : viewMode === "Compare"
            ? "Compare mode keeps the predicted heat while showing where proof and CTA changes may reduce friction."
            : "True mode is reserved for future real viewer study imports."}
      </div>
    </section>
  );
}
