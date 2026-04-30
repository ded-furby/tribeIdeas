"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { BrainWebGLScene } from "@/components/BrainWebGLScene";
import type { AdPredictionReport, BrainAdSignal } from "@/lib/ad-model";

type BrainAdStageProps = {
  report: AdPredictionReport;
};

const viewModes = ["True", "Compare", "Predicted"] as const;
const meshModes = ["Normal", "Inflated"] as const;
const skullModes = ["Open", "Close"] as const;

type OrbitState = {
  rotateX: number;
  rotateY: number;
  panX: number;
  panY: number;
  zoom: number;
};

type PickTarget = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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
          className={`h-9 rounded-[13px] text-xs font-semibold transition sm:h-10 sm:text-sm ${
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
  const [skullMode, setSkullMode] = useState<(typeof skullModes)[number]>("Open");
  const [activeSignal, setActiveSignal] = useState(report.brainSignals[1]?.id ?? report.brainSignals[0]?.id);
  const [orbit, setOrbit] = useState<OrbitState>({ rotateX: -6, rotateY: 0, panX: 0, panY: 0, zoom: 1.12 });
  const [isDragging, setIsDragging] = useState(false);
  const pickTargetsRef = useRef<PickTarget[]>([]);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    panX: number;
    panY: number;
    panMode: boolean;
    moved: boolean;
  } | null>(null);

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
      rotateX: orbit.rotateX,
      rotateY: orbit.rotateY,
      panX: orbit.panX,
      panY: orbit.panY,
      panMode: event.shiftKey,
      moved: false,
    };
    setIsDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) {
      drag.moved = true;
    }
    setOrbit((current) =>
      drag.panMode
        ? {
            ...current,
            panX: drag.panX + dx,
            panY: drag.panY + dy,
          }
        : {
            ...current,
            rotateX: clamp(drag.rotateX - dy * 0.18, -68, 62),
            rotateY: clamp(drag.rotateY + dx * 0.28, -180, 180),
          },
    );
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragStart.current;
    if (drag?.pointerId === event.pointerId) {
      if (!drag.moved) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const picked = pickTargetsRef.current
          .map((target) => ({
            ...target,
            distance: Math.hypot(target.x - x, target.y - y),
          }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (picked && picked.distance <= picked.radius) {
          setActiveSignal(picked.id);
        }
      }
      dragStart.current = null;
      setIsDragging(false);
    }
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setOrbit((current) => ({
      ...current,
      zoom: clamp(current.zoom - event.deltaY * 0.0012, 0.7, 1.46),
    }));
  }

  function resetOrbit() {
    setOrbit({ rotateX: -6, rotateY: 0, panX: 0, panY: 0, zoom: 1.12 });
  }

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_28px_120px_rgba(0,0,0,0.58)] sm:min-h-[640px]">
      <div className="absolute left-5 top-5 z-40 hidden items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs text-white/72 shadow-2xl backdrop-blur-2xl sm:flex">
        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
        Drag orbit · wheel zoom · double-click reset
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
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={resetOrbit}
        style={{
          transition: isDragging ? "none" : "transform 260ms ease",
        }}
      >
        <BrainWebGLScene
          report={report}
          selectedId={activeSignal}
          meshMode={meshMode}
          skullMode={skullMode}
          orbit={orbit}
          pickTargetsRef={pickTargetsRef}
        />
      </div>

      <div className="absolute left-4 right-4 top-16 z-40 rounded-[22px] border border-white/12 bg-black/50 p-3 text-white shadow-2xl backdrop-blur-2xl sm:left-5 sm:right-auto sm:max-w-[360px] sm:p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-white/48">what is happening</div>
        <div className="mt-2 max-h-[82px] overflow-hidden text-xs leading-5 text-white/82 sm:text-sm">
          {selected?.meaning ?? report.brainSummary}
        </div>
        <div className="mt-2 truncate text-[11px] leading-5 text-white/52 sm:text-xs">
          Detected: <span className="text-white/78">{report.detectedProduct}</span>
        </div>
      </div>

      <div className="absolute bottom-[82px] right-4 z-40 grid gap-2 sm:bottom-[92px]">
        <button
          type="button"
          onClick={resetOrbit}
          className="rounded-[18px] border border-white/12 bg-white/[0.07] px-4 py-2 text-sm font-semibold text-white/72 shadow-2xl backdrop-blur-2xl transition hover:border-white/24 hover:text-white"
        >
          Reset view
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-40 grid gap-2 sm:bottom-5 sm:left-5 sm:right-5 lg:grid-cols-[1.2fr_0.84fr_0.84fr]">
        <SegmentedControl options={viewModes} value={viewMode} onChange={setViewMode} />
        <div className="grid grid-cols-2 rounded-[22px] border border-white/12 bg-white/[0.055] p-1 shadow-2xl backdrop-blur-2xl">
          {meshModes.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMeshMode(option)}
              className={`h-9 rounded-[13px] text-xs font-semibold transition sm:h-10 sm:text-sm ${
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
              className={`h-9 rounded-[13px] text-xs font-semibold transition sm:h-10 sm:text-sm ${
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
