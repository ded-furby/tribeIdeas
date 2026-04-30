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
  visual: { x: 655, y: 252, rx: 54, ry: 34 },
  place: { x: 635, y: 342, rx: 60, ry: 36 },
  salience: { x: 555, y: 286, rx: 50, ry: 31 },
  valuation: { x: 484, y: 320, rx: 54, ry: 31 },
  language: { x: 405, y: 262, rx: 50, ry: 30 },
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
  const cortexDepth = meshMode === "Inflated" ? [-66, -44, -22, 0, 22, 44, 66] : [-48, -32, -16, 0, 16, 32, 48];
  const selectedAnchor = selected ? getAnchor(selected) : null;

  return (
    <div
      className="relative h-full w-full [transform-style:preserve-3d]"
      role="img"
      aria-label="Interactive predicted brain response"
    >
      <div
        className="absolute left-[19%] top-[8%] h-[76%] w-[66%] rounded-[52%_48%_44%_50%] border border-white/14 bg-white/[0.055] shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] backdrop-blur-sm"
        style={{
          opacity: skullMode === "Open" ? 0.42 : 0.72,
          transform: "translateZ(-86px) rotateY(-8deg)",
        }}
      />
      <div
        className="absolute left-[24%] top-[22%] h-[46%] w-[52%] rounded-full border border-white/10 bg-white/[0.035]"
        style={{ transform: "translateZ(92px) rotateY(8deg)" }}
      />
      <div
        className="absolute left-[17%] top-[55%] h-[35%] w-[21%] rounded-[40%] border border-white/8 bg-white/[0.025]"
        style={{ transform: "translateZ(-34px) rotateZ(-18deg)" }}
      />
      <div
        className="absolute left-[20%] top-[62%] h-[30%] w-[16%] rounded-full border border-white/8 bg-white/[0.025]"
        style={{ transform: "translateZ(38px) rotateZ(10deg)" }}
      />

      {cortexDepth.map((z, index) => {
        const distance = Math.abs(z);
        const isCore = z === 0;
        return (
          <div
            key={z}
            className="absolute left-[9%] top-[2%] h-[82%] w-[86%] bg-contain bg-center bg-no-repeat drop-shadow-[0_28px_40px_rgba(0,0,0,0.42)]"
            style={{
              backgroundImage: "url('/brain-assets/ad-cortex-tribe-stage.png')",
              opacity: isCore ? 1 : 0.18 + (cortexDepth.length - index) * 0.018,
              filter: isCore ? "none" : `blur(${distance > 40 ? 1.4 : 0.7}px) grayscale(0.15)`,
              transform: `translateZ(${z}px) scale(${1 + (z > 0 ? z * 0.0009 : 0)})`,
            }}
          />
        );
      })}

      {report.brainSignals.map((signal, index) => {
        const anchor = getAnchor(signal);
        const isActive = signal.id === activeSignal;
        const left = `${(anchor.x / 900) * 100}%`;
        const top = `${(anchor.y / 760) * 100}%`;
        const z = -18 + index * 14;
        return (
          <div
            key={signal.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left,
              top,
              width: `${anchor.rx + signal.value / 3}px`,
              height: `${anchor.ry + signal.value / 5}px`,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,100,94,0.82) 18%, rgba(219,32,28,0.48) 52%, rgba(219,32,28,0) 76%)",
              filter: "blur(8px)",
              opacity: isActive ? 0.95 : 0.42 + signal.value / 190,
              transform: `translate3d(-50%, -50%, ${z + 72}px)`,
            }}
          />
        );
      })}

      {report.brainSignals.map((signal, index) => {
        const anchor = getAnchor(signal);
        const isActive = signal.id === activeSignal;
        return (
          <button
            key={signal.id}
            type="button"
            aria-label={signal.label}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseEnter={() => setActiveSignal(signal.id)}
            onFocus={() => setActiveSignal(signal.id)}
            onClick={() => setActiveSignal(signal.id)}
            className={`absolute z-30 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border transition ${
              isActive
                ? "border-white bg-white/28 shadow-[0_0_32px_rgba(255,255,255,0.32)]"
                : "border-white/28 bg-white/10 hover:border-white"
            }`}
            style={{
              left: `${(anchor.x / 900) * 100}%`,
              top: `${(anchor.y / 760) * 100}%`,
              transform: `translate3d(-50%, -50%, ${86 + index * 12}px)`,
            }}
          />
        );
      })}

      {selected && selectedAnchor ? (
        <>
          <div
            className="absolute h-[3px] w-[210px] origin-left rounded-full bg-white/70"
            style={{
              left: `${(selectedAnchor.x / 900) * 100}%`,
              top: `${((selectedAnchor.y + 34) / 760) * 100}%`,
              transform: "translate3d(0, 0, 106px) rotate(128deg)",
            }}
          />
          <div
            className="absolute left-1/2 top-[80%] w-[min(74%,390px)] -translate-x-1/2 rounded-[20px] border border-white/22 bg-black/60 px-5 py-3 text-center text-lg font-semibold text-white shadow-2xl backdrop-blur-2xl"
            style={{ transform: "translate3d(-50%, 0, 124px)" }}
          >
            {selected.label}
          </div>
        </>
      ) : null}
    </div>
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
        Drag orbit · wheel zoom
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
