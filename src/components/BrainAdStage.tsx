"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { AdPredictionReport, BrainAdSignal } from "@/lib/ad-model";

type BrainAdStageProps = {
  report: AdPredictionReport;
};

const viewModes = ["True", "Compare", "Predicted"] as const;
const meshModes = ["Normal", "Inflated"] as const;
const skullModes = ["Open", "Close"] as const;

const signalAnchors: Record<string, { x: number; y: number; rx: number; ry: number }> = {
  visual: { x: 660, y: 280, rx: 70, ry: 42 },
  place: { x: 660, y: 418, rx: 76, ry: 46 },
  salience: { x: 555, y: 310, rx: 62, ry: 36 },
  valuation: { x: 470, y: 355, rx: 68, ry: 38 },
  language: { x: 390, y: 285, rx: 62, ry: 34 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getAnchor(signal: BrainAdSignal) {
  return signalAnchors[signal.id] ?? {
    x: 270 + signal.x * 4.8,
    y: 155 + signal.y * 4.4,
    rx: 54,
    ry: 32,
  };
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

function BrainHeadScene({
  report,
  selected,
  meshMode,
  skullMode,
  activeSignal,
  setActiveSignal,
}: {
  report: AdPredictionReport;
  selected?: BrainAdSignal;
  meshMode: (typeof meshModes)[number];
  skullMode: (typeof skullModes)[number];
  activeSignal?: string;
  setActiveSignal: (id: string) => void;
}) {
  return (
    <svg viewBox="0 0 900 760" className="h-full w-full" role="img" aria-label="Interactive predicted brain response">
      <defs>
        <radialGradient id="brain-white" cx="38%" cy="24%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#eeeeec" />
          <stop offset="72%" stopColor="#bdbdb8" />
          <stop offset="100%" stopColor="#767671" />
        </radialGradient>
        <radialGradient id="activation-red" cx="45%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#ff6f66" stopOpacity="0.96" />
          <stop offset="54%" stopColor="#e52925" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#e52925" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="head-glass" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={skullMode === "Open" ? "0.12" : "0.2"} />
          <stop offset="48%" stopColor="#ffffff" stopOpacity={skullMode === "Open" ? "0.035" : "0.08"} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={skullMode === "Open" ? "0.018" : "0.055"} />
        </linearGradient>
        <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#000000" floodOpacity="0.55" />
        </filter>
        <filter id="activation-blur" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect x="0" y="0" width="900" height="760" fill="transparent" />
      <path
        d="M316 82C442 24 620 58 716 167c72 81 83 206 43 311-29 76-72 128-72 209H405c0-68-18-107-84-121-66-14-129-46-153-110-18-47 11-95 7-138-4-45-54-81-35-132 22-58 100-71 176-104Z"
        fill="url(#head-glass)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
      />
      <path
        d="M168 344c-52 23-83 63-84 101-1 32 25 53 55 47 31-6 57-39 66-86"
        fill="rgba(255,255,255,0.035)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />
      <path
        d="M286 570c35 56 32 112 14 160"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="26"
        strokeLinecap="round"
      />

      <g
        filter="url(#soft-shadow)"
        transform={`translate(8 0) scale(${meshMode === "Inflated" ? 1.05 : 1})`}
        style={{ transformOrigin: "500px 350px" }}
      >
        <path
          d="M263 306c-18-59 20-113 78-122 18-50 79-74 131-47 45-40 121-26 151 25 56-2 101 40 106 94 52 26 61 93 21 134 22 58-24 118-90 112-25 45-86 65-137 41-45 36-112 29-144-15-66 9-118-35-114-95-50-30-50-99-2-127Z"
          fill="url(#brain-white)"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="3"
        />
        <path
          d="M332 211c35 5 43 33 20 57m85-123c-15 45 23 57 63 50m86-28c-25 23-24 52 7 69m93 42c-52-3-79 22-78 72m85 70c-45-16-80-6-105 32m-67 77c-14-43-47-55-96-34m-100-20c46-33 37-75-10-96m-49-59c45 13 75-7 84-52m82 14c32 26 75 22 105-8m-139 99c53 5 87-16 101-63m-146 129c34-29 78-35 128-16"
          fill="none"
          stroke="rgba(58,58,58,0.32)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M332 211c35 5 43 33 20 57m85-123c-15 45 23 57 63 50m86-28c-25 23-24 52 7 69m93 42c-52-3-79 22-78 72m85 70c-45-16-80-6-105 32m-67 77c-14-43-47-55-96-34m-100-20c46-33 37-75-10-96m-49-59c45 13 75-7 84-52m82 14c32 26 75 22 105-8m-139 99c53 5 87-16 101-63m-146 129c34-29 78-35 128-16"
          fill="none"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {report.brainSignals.map((signal) => {
          const anchor = getAnchor(signal);
          const isActive = signal.id === activeSignal;
          const opacity = 0.28 + signal.value / 150;
          return (
            <g key={signal.id}>
              <ellipse
                cx={anchor.x}
                cy={anchor.y}
                rx={anchor.rx + signal.value / 6}
                ry={anchor.ry + signal.value / 10}
                fill="url(#activation-red)"
                filter="url(#activation-blur)"
                opacity={isActive ? 0.98 : opacity}
              />
              <foreignObject x={anchor.x - 18} y={anchor.y - 18} width="36" height="36">
                <button
                  type="button"
                  aria-label={signal.label}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseEnter={() => setActiveSignal(signal.id)}
                  onFocus={() => setActiveSignal(signal.id)}
                  onClick={() => setActiveSignal(signal.id)}
                  className={`h-9 w-9 rounded-full border transition ${
                    isActive
                      ? "border-white bg-white/28 shadow-[0_0_32px_rgba(255,255,255,0.32)]"
                      : "border-white/28 bg-white/10 hover:border-white"
                  }`}
                />
              </foreignObject>
            </g>
          );
        })}
      </g>

      {selected ? (
        <g>
          <path
            d={`M${getAnchor(selected).x} ${getAnchor(selected).y + 34} L470 628`}
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="276" y="606" width="388" height="48" rx="24" fill="rgba(0,0,0,0.62)" stroke="rgba(255,255,255,0.24)" />
          <text x="470" y="637" fill="#fff" textAnchor="middle" fontSize="20" fontWeight="700">
            {selected.label}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export function BrainAdStage({ report }: BrainAdStageProps) {
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]>("Predicted");
  const [meshMode, setMeshMode] = useState<(typeof meshModes)[number]>("Normal");
  const [skullMode, setSkullMode] = useState<(typeof skullModes)[number]>("Open");
  const [activeSignal, setActiveSignal] = useState(report.brainSignals[1]?.id ?? report.brainSignals[0]?.id);
  const [orbit, setOrbit] = useState({ rotateX: -4, rotateY: 0, panX: 0, panY: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    rotateX: number;
    rotateY: number;
    panX: number;
    panY: number;
    panMode: boolean;
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
    };
    setIsDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    setOrbit((current) =>
      drag.panMode
        ? {
            ...current,
            panX: drag.panX + dx,
            panY: drag.panY + dy,
          }
        : {
            ...current,
            rotateX: clamp(drag.rotateX - dy * 0.16, -34, 28),
            rotateY: clamp(drag.rotateY + dx * 0.2, -48, 48),
          },
    );
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current?.pointerId === event.pointerId) {
      dragStart.current = null;
      setIsDragging(false);
    }
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setOrbit((current) => ({
      ...current,
      zoom: clamp(current.zoom - event.deltaY * 0.0012, 0.82, 1.28),
    }));
  }

  function resetOrbit() {
    setOrbit({ rotateX: -4, rotateY: 0, panX: 0, panY: 0, zoom: 1 });
  }

  return (
    <section className="relative min-h-[590px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_28px_120px_rgba(0,0,0,0.58)] sm:min-h-[720px]">
      <div className="absolute left-5 top-5 z-40 flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs text-white/72 shadow-2xl backdrop-blur-2xl">
        <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
        Orbit model
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
          perspective: "1100px",
          transition: isDragging ? "none" : "transform 260ms ease",
        }}
      >
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transform: `translate3d(${orbit.panX}px, ${orbit.panY}px, 0) rotateX(${orbit.rotateX}deg) rotateY(${orbit.rotateY}deg) scale(${orbit.zoom})`,
            transformStyle: "preserve-3d",
          }}
        >
          <BrainHeadScene
            report={report}
            selected={selected}
            meshMode={meshMode}
            skullMode={skullMode}
            activeSignal={activeSignal}
            setActiveSignal={setActiveSignal}
          />
        </div>
      </div>

      <div className="absolute left-4 right-4 top-16 z-40 rounded-[22px] border border-white/12 bg-white/[0.07] p-4 text-white shadow-2xl backdrop-blur-2xl sm:left-5 sm:right-auto sm:max-w-[440px]">
        <div className="text-xs uppercase tracking-[0.18em] text-white/48">what is happening</div>
        <div className="mt-2 text-sm leading-5 text-white/82">{selected?.meaning ?? report.brainSummary}</div>
        <div className="mt-3 text-xs leading-5 text-white/52">
          Detected: <span className="text-white/78">{report.detectedProduct}</span>
        </div>
      </div>

      <div className="absolute bottom-[148px] left-4 z-40 grid gap-2 sm:left-auto sm:right-5 lg:bottom-[96px]">
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
