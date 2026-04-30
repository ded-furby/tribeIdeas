"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
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
    <div className="grid min-w-0 flex-1 grid-cols-3 rounded-[22px] border border-white/12 bg-white/[0.055] p-1 shadow-2xl backdrop-blur-2xl">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-10 rounded-[13px] text-sm font-semibold transition ${
            option === value
              ? "bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
              : "text-white/48 hover:bg-white/8 hover:text-white"
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);

  const selected = useMemo<BrainAdSignal | undefined>(
    () => report.brainSignals.find((signal) => signal.id === activeSignal) ?? report.brainSignals[0],
    [activeSignal, report.brainSignals],
  );

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.panX + event.clientX - drag.x,
      y: drag.panY + event.clientY - drag.y,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current?.pointerId === event.pointerId) {
      dragStart.current = null;
      setIsDragging(false);
    }
  }

  return (
    <section className="relative min-h-[720px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_28px_120px_rgba(0,0,0,0.58)]">
      <div className="absolute left-5 top-5 z-40 flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs text-white/72 shadow-2xl backdrop-blur-2xl">
        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
        Drag the brain
      </div>

      <div className="absolute right-5 top-5 z-40 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs text-white/72 shadow-2xl backdrop-blur-2xl">
        {report.confidence}/100 confidence
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_43%,transparent_0%,transparent_42%,rgba(0,0,0,0.28)_78%,rgba(0,0,0,0.72)_100%)]" />

      <div
        className="absolute inset-0 z-10 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setPan({ x: 0, y: 0 })}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${meshMode === "Inflated" ? 1.07 : 1})`,
          transition: isDragging ? "none" : "transform 260ms ease",
        }}
      >
        <Image
          src="/brain-assets/ad-cortex-tribe-stage.png"
          alt="Predicted ad response brain scene"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 70vw"
          className={`object-contain transition duration-500 ${
            meshMode === "Inflated" ? "brightness-110" : ""
          } ${skullMode === "Open" ? "opacity-90" : "opacity-100"}`}
        />

        {report.brainSignals.map((signal) => (
          <button
            key={signal.id}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
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
      </div>

      <div className="absolute left-5 top-16 z-40 max-w-[min(84vw,390px)] rounded-[22px] border border-white/12 bg-white/[0.07] p-4 text-white shadow-2xl backdrop-blur-2xl">
        <div className="text-xs uppercase tracking-[0.18em] text-white/48">what is happening</div>
        <div className="mt-2 text-sm leading-5 text-white/82">{report.brainSummary}</div>
        <div className="mt-3 text-xs leading-5 text-white/52">
          Looks like: <span className="text-white/78">{report.detectedProduct}</span>
        </div>
      </div>

      <div className="absolute bottom-[96px] left-1/2 z-40 w-[min(84vw,380px)] -translate-x-1/2 rounded-[20px] border border-white/22 bg-white/[0.08] px-5 py-3 text-center shadow-2xl backdrop-blur-2xl">
        <div className="text-lg font-semibold text-white underline decoration-white/30 underline-offset-4">
          {selected?.label ?? report.activationLabel}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-40 grid gap-3 lg:grid-cols-[1.2fr_0.84fr_0.84fr]">
        <SegmentedControl options={viewModes} value={viewMode} onChange={setViewMode} />
        <div className="grid grid-cols-2 rounded-[22px] border border-white/12 bg-white/[0.055] p-1 shadow-2xl backdrop-blur-2xl">
          {meshModes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMeshMode(option)}
              className={`h-10 rounded-[13px] text-sm font-semibold transition ${
                option === meshMode ? "bg-white/18 text-white" : "text-white/48 hover:bg-white/8 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 rounded-[22px] border border-white/12 bg-white/[0.055] p-1 shadow-2xl backdrop-blur-2xl">
          {skullModes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSkullMode(option)}
              className={`h-10 rounded-[13px] text-sm font-semibold transition ${
                option === skullMode ? "bg-white/18 text-white" : "text-white/48 hover:bg-white/8 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {viewMode !== "Predicted" ? (
        <div className="absolute bottom-36 right-5 z-40 rounded-full border border-white/12 bg-white/[0.07] px-4 py-2 text-xs text-white/60 backdrop-blur-2xl">
          {viewMode === "Compare" ? "comparing current hook vs predicted fix" : "true mode needs imported study data"}
        </div>
      ) : null}
    </section>
  );
}
