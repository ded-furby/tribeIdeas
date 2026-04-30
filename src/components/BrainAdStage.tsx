"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, PointerEvent, WheelEvent } from "react";
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

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type PickTarget = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

type BrainSurfacePoint = ReturnType<typeof projectPoint> & Vec3 & { shade: number };

const activationCenters: Record<string, Vec3> = {
  visual: { x: 1.18, y: -0.14, z: 0.42 },
  place: { x: 1.12, y: 0.34, z: 0.33 },
  salience: { x: 0.42, y: -0.08, z: 0.58 },
  valuation: { x: -0.22, y: 0.2, z: 0.55 },
  language: { x: -0.86, y: -0.16, z: 0.4 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getActivationCenter(signal: BrainAdSignal) {
  return (
    activationCenters[signal.id] ?? {
      x: (signal.x - 50) / 32,
      y: (signal.y - 50) / 38,
      z: 0.38,
    }
  );
}

function brainSpace(point: Vec3): Vec3 {
  return {
    x: point.x * 0.68 + 0.3,
    y: point.y * 0.72 - 0.72,
    z: point.z * 0.74,
  };
}

function rotatePoint(point: Vec3, orbit: OrbitState): Vec3 {
  const rx = (orbit.rotateX * Math.PI) / 180;
  const ry = (orbit.rotateY * Math.PI) / 180;
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  return {
    x: point.x * cosY + z1 * sinY,
    y: y1,
    z: -point.x * sinY + z1 * cosY,
  };
}

function projectPoint(point: Vec3, width: number, height: number, orbit: OrbitState) {
  const rotated = rotatePoint(point, orbit);
  const camera = 4.4;
  const depth = camera - rotated.z;
  const baseScale = Math.min(width, height) * 0.72 * orbit.zoom;
  const scale = baseScale / depth;
  return {
    x: width * 0.6 + orbit.panX + rotated.x * scale,
    y: height * 0.48 + orbit.panY + rotated.y * scale,
    scale,
    z: rotated.z,
  };
}

function cortexPoint(row: number, col: number, rows: number, cols: number, inflated: boolean): Vec3 {
  const theta = -Math.PI * 0.88 + (col / (cols - 1)) * Math.PI * 1.76;
  const phi = -Math.PI * 0.43 + (row / (rows - 1)) * Math.PI * 0.86;
  const gyri =
    Math.sin(theta * 8.5 + phi * 5.1) * 0.035 +
    Math.sin(theta * 14.2 - phi * 3.4) * 0.025 +
    Math.cos(theta * 4.3 + row * 0.4) * 0.02;
  const frontal = Math.max(0, Math.cos(theta - 0.9)) * 0.18;
  const posterior = Math.max(0, Math.cos(theta + 1.2)) * 0.11;
  const inflate = inflated ? 1.08 : 1;
  const radius = (1 + gyri + frontal + posterior) * inflate;
  return {
    x: Math.cos(phi) * Math.cos(theta) * 1.62 * radius,
    y: Math.sin(phi) * 0.92 * radius + Math.sin(theta * 3.2) * 0.04,
    z: Math.cos(phi) * Math.sin(theta) * 0.86 * radius,
  };
}

const headProfile: Array<{ x: number; y: number }> = [
  { x: 0.1, y: -1.78 },
  { x: -0.52, y: -1.67 },
  { x: -0.92, y: -1.42 },
  { x: -1.12, y: -1.08 },
  { x: -1.04, y: -0.84 },
  { x: -1.26, y: -0.68 },
  { x: -1.42, y: -0.56 },
  { x: -1.15, y: -0.46 },
  { x: -1.02, y: -0.29 },
  { x: -1.15, y: -0.2 },
  { x: -0.98, y: -0.1 },
  { x: -0.9, y: 0.16 },
  { x: -0.66, y: 0.46 },
  { x: -0.28, y: 0.62 },
  { x: -0.1, y: 1.02 },
  { x: 0.08, y: 1.56 },
  { x: 0.44, y: 1.88 },
  { x: 0.92, y: 1.82 },
  { x: 1.1, y: 1.26 },
  { x: 1.26, y: 0.72 },
  { x: 1.58, y: 0.08 },
  { x: 1.66, y: -0.64 },
  { x: 1.36, y: -1.25 },
  { x: 0.82, y: -1.64 },
];

const facialFeatureLines: Vec3[][] = [
  [
    { x: -1.05, y: -0.78, z: 0.52 },
    { x: -1.24, y: -0.72, z: 0.56 },
    { x: -1.38, y: -0.58, z: 0.54 },
  ],
  [
    { x: -1.07, y: -0.28, z: 0.55 },
    { x: -1.28, y: -0.2, z: 0.58 },
    { x: -1.05, y: -0.13, z: 0.55 },
  ],
  [
    { x: -0.72, y: -0.84, z: 0.56 },
    { x: -0.52, y: -0.78, z: 0.58 },
  ],
  [
    { x: -0.54, y: 0.42, z: 0.5 },
    { x: -0.2, y: 0.7, z: 0.46 },
    { x: 0.04, y: 1.18, z: 0.38 },
  ],
];

function projectedPath(
  ctx: CanvasRenderingContext2D,
  points: Vec3[],
  width: number,
  height: number,
  orbit: OrbitState,
) {
  points.forEach((point, index) => {
    const projected = projectPoint(point, width, height, orbit);
    if (index === 0) ctx.moveTo(projected.x, projected.y);
    else ctx.lineTo(projected.x, projected.y);
  });
}

function traceHeadProfile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orbit: OrbitState,
  z: number,
  taper = 1,
) {
  const point = (x: number, y: number) =>
    projectPoint(
      {
        x: x * taper + (x > 1 ? -(1 - taper) * 0.34 : 0),
        y: y * (0.98 + taper * 0.02),
        z,
      },
      width,
      height,
      orbit,
    );
  const move = point(0.08, -1.78);
  ctx.moveTo(move.x, move.y);

  [
    [-0.48, -1.78, -0.94, -1.46, -1.06, -1.05],
    [-1.12, -0.84, -1.3, -0.72, -1.43, -0.58],
    [-1.52, -0.5, -1.3, -0.45, -1.12, -0.39],
    [-0.98, -0.33, -1.18, -0.25, -1.04, -0.16],
    [-0.9, -0.08, -0.88, 0.2, -0.68, 0.44],
    [-0.5, 0.64, -0.2, 0.68, -0.08, 1.04],
    [0.04, 1.45, 0.32, 1.86, 0.7, 1.86],
    [0.98, 1.55, 1.02, 0.9, 1.36, 0.34],
    [1.72, -0.28, 1.46, -1.18, 0.84, -1.58],
    [0.58, -1.72, 0.26, -1.82, 0.08, -1.78],
  ].forEach(([c1x, c1y, c2x, c2y, ex, ey]) => {
    const c1 = point(c1x, c1y);
    const c2 = point(c2x, c2y);
    const end = point(ex, ey);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  });
}

function drawHumanHeadShell(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orbit: OrbitState,
  skullMode: (typeof skullModes)[number],
) {
  const shellAlpha = skullMode === "Open" ? 0.22 : 0.38;
  const edgeAlpha = skullMode === "Open" ? 0.2 : 0.32;
  const slices = [-0.62, -0.32, 0, 0.32, 0.62]
    .map((z, index) => {
      const taper = 1 - Math.abs(z) * 0.16;
      const depthOffset = Math.abs(z) * 0.08;
      const points = headProfile.map(({ x, y }) => ({
        x: x * taper + (x > 1 ? -depthOffset : 0),
        y: y * (1 - Math.abs(z) * 0.035),
        z,
      }));
      const averageZ =
        points.reduce((sum, point) => sum + rotatePoint(point, orbit).z, 0) / Math.max(1, points.length);
      return { index, averageZ, points };
    })
    .sort((a, b) => a.averageZ - b.averageZ);

  ctx.save();
  ctx.beginPath();
  traceHeadProfile(ctx, width, height, orbit, 0.04);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${skullMode === "Open" ? 0.08 : 0.16})`;
  ctx.strokeStyle = `rgba(255,255,255,${skullMode === "Open" ? 0.22 : 0.36})`;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = "rgba(255,255,255,0.12)";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.stroke();

  slices.forEach((slice) => {
    const isMiddle = slice.index === 2;
    ctx.beginPath();
    traceHeadProfile(ctx, width, height, orbit, slice.points[0]?.z ?? 0, 1 - Math.abs(slice.points[0]?.z ?? 0) * 0.16);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${isMiddle ? shellAlpha * 0.2 : shellAlpha * 0.06})`;
    ctx.strokeStyle = `rgba(255,255,255,${edgeAlpha * (isMiddle ? 0.9 : 0.28)})`;
    ctx.lineWidth = isMiddle ? 1.2 : 0.7;
    ctx.fill();
    ctx.stroke();
  });

  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = "rgba(255,255,255,0.18)";
  ctx.shadowBlur = 16;
  facialFeatureLines.forEach((line) => {
    ctx.beginPath();
    projectedPath(ctx, line, width, height, orbit);
    ctx.strokeStyle = `rgba(255,255,255,${skullMode === "Open" ? 0.12 : 0.22})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
  ctx.restore();
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

function BrainVolumeCanvas({
  report,
  selectedId,
  meshMode,
  skullMode,
  orbit,
  pickTargetsRef,
}: {
  report: AdPredictionReport;
  selectedId?: string;
  meshMode: (typeof meshModes)[number];
  skullMode: (typeof skullModes)[number];
  orbit: OrbitState;
  pickTargetsRef: MutableRefObject<PickTarget[]>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    function draw() {
      if (!canvasEl || !ctx) return;
      const rect = canvasEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      if (canvasEl.width !== Math.round(width * dpr) || canvasEl.height !== Math.round(height * dpr)) {
        canvasEl.width = Math.round(width * dpr);
        canvasEl.height = Math.round(height * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      drawHumanHeadShell(ctx, width, height, orbit, skullMode);

      const rows = 36;
      const cols = 72;
      const inflated = meshMode === "Inflated";
      const grid: BrainSurfacePoint[][] = [];

      for (let row = 0; row < rows; row += 1) {
        const projectedRow: BrainSurfacePoint[] = [];
        for (let col = 0; col < cols; col += 1) {
          const point = cortexPoint(row, col, rows, cols, inflated);
          const projected = projectPoint(brainSpace(point), width, height, orbit);
          const shade = clamp(
            0.56 +
              projected.z * 0.2 +
              Math.sin(row * 0.58 + col * 0.18) * 0.08 +
              Math.cos(col * 0.34 - row * 0.22) * 0.06,
            0.24,
            0.98,
          );
          const stored = { ...point, ...projected, shade };
          projectedRow.push(stored);
        }
        grid.push(projectedRow);
      }

      const cells: Array<{
        z: number;
        shade: number;
        points: readonly [BrainSurfacePoint, BrainSurfacePoint, BrainSurfacePoint, BrainSurfacePoint];
      }> = [];
      for (let row = 0; row < rows - 1; row += 1) {
        for (let col = 0; col < cols - 1; col += 1) {
          const points = [grid[row][col], grid[row][col + 1], grid[row + 1][col + 1], grid[row + 1][col]] as const;
          cells.push({
            z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
            shade: points.reduce((sum, point) => sum + point.shade, 0) / points.length,
            points,
          });
        }
      }

      ctx.save();
      cells
        .sort((a, b) => a.z - b.z)
        .forEach((cell) => {
          const light = Math.round(148 + cell.shade * 104);
          ctx.beginPath();
          ctx.moveTo(cell.points[0].x, cell.points[0].y);
          ctx.lineTo(cell.points[1].x, cell.points[1].y);
          ctx.lineTo(cell.points[2].x, cell.points[2].y);
          ctx.lineTo(cell.points[3].x, cell.points[3].y);
          ctx.closePath();
          ctx.fillStyle = `rgba(${light},${light},${light},0.9)`;
          ctx.fill();
        });
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.lineCap = "round";
      for (let row = 2; row < rows - 2; row += 2) {
        ctx.beginPath();
        for (let col = 2; col < cols - 2; col += 1) {
          const point = grid[row][col];
          if (col === 2) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(32,32,32,0.34)";
        ctx.lineWidth = inflated ? 7 : 5;
        ctx.stroke();
      }
      for (let col = 5; col < cols - 4; col += 5) {
        ctx.beginPath();
        for (let row = 3; row < rows - 3; row += 1) {
          const point = grid[row][col];
          if (row === 3) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(30,30,30,0.22)";
        ctx.lineWidth = inflated ? 5 : 3.5;
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = "rgba(255,255,255,0.3)";
      ctx.shadowBlur = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let row = 2; row < rows - 2; row += 2) {
        ctx.beginPath();
        for (let col = 2; col < cols - 2; col += 1) {
          const point = grid[row][col];
          if (col === 2) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.34)";
        ctx.lineWidth = inflated ? 5.5 : 4.2;
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.58)";
        ctx.lineWidth = inflated ? 2.2 : 1.5;
        ctx.stroke();
      }
      for (let col = 5; col < cols - 4; col += 5) {
        ctx.beginPath();
        for (let row = 3; row < rows - 3; row += 1) {
          const point = grid[row][col];
          if (row === 3) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = inflated ? 3.4 : 2.4;
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.lineCap = "round";
      for (let row = 2; row < rows - 2; row += 4) {
        ctx.beginPath();
        for (let col = 2; col < cols - 2; col += 1) {
          const point = grid[row][col];
          if (col === 2) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      for (let col = 4; col < cols - 3; col += 8) {
        ctx.beginPath();
        for (let row = 2; row < rows - 2; row += 1) {
          const point = grid[row][col];
          if (row === 2) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.restore();

      const pickTargets: PickTarget[] = [];
      report.brainSignals.forEach((signal) => {
        const center = projectPoint(brainSpace(getActivationCenter(signal)), width, height, orbit);
        const isActive = signal.id === selectedId;
        const radius = clamp((signal.value / 100) * Math.min(width, height) * 0.16 * orbit.zoom, 42, 110);
        const glow = ctx.createRadialGradient(center.x, center.y, 2, center.x, center.y, radius);
        glow.addColorStop(0, "rgba(255,255,255,0.88)");
        glow.addColorStop(0.18, "rgba(255,104,96,0.82)");
        glow.addColorStop(0.52, "rgba(222,37,34,0.5)");
        glow.addColorStop(1, "rgba(222,37,34,0)");
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = glow;
        ctx.globalAlpha = isActive ? 0.96 : 0.5;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.strokeStyle = isActive ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.28)";
        ctx.lineWidth = isActive ? 1.7 : 1;
        ctx.arc(center.x, center.y, 13, 0, Math.PI * 2);
        ctx.stroke();
        pickTargets.push({ id: signal.id, x: center.x, y: center.y, radius: 28 });
      });
      pickTargetsRef.current = pickTargets;

      const selectedSignal = report.brainSignals.find((signal) => signal.id === selectedId);
      if (selectedSignal) {
        const center = projectPoint(brainSpace(getActivationCenter(selectedSignal)), width, height, orbit);
        const labelX = width * 0.63;
        const labelY = height * 0.78;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.66)";
        ctx.lineWidth = 2.2;
        ctx.moveTo(center.x + 12, center.y + 16);
        ctx.lineTo(labelX, labelY - 20);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;
        const boxWidth = Math.min(390, width * 0.46);
        const boxHeight = 46;
        const boxX = labelX - boxWidth / 2;
        const boxY = labelY - boxHeight / 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 22);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "700 16px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(selectedSignal.label, labelX, labelY);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    resizeObserver.observe(canvasEl);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [meshMode, orbit, pickTargetsRef, report.brainSignals, selectedId, skullMode]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-label="Interactive predicted brain response" />;
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
      <div className="absolute left-5 top-5 z-40 flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs text-white/72 shadow-2xl backdrop-blur-2xl">
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
        <BrainVolumeCanvas
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
