"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AdPredictionReport, BrainAdSignal } from "@/lib/ad-model";

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

type BrainWebGLSceneProps = {
  report: AdPredictionReport;
  selectedId?: string;
  meshMode: "Normal" | "Inflated";
  skullMode: "Open" | "Close";
  orbit: OrbitState;
  pickTargetsRef: MutableRefObject<PickTarget[]>;
};

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

function brainSpace(point: Vec3) {
  return new THREE.Vector3(point.x * 0.68 + 0.3, point.y * 0.72 + 0.16, point.z * 0.74);
}

function cortexPoint(row: number, col: number, rows: number, cols: number, inflated: boolean): Vec3 {
  const theta = -Math.PI * 0.88 + (col / (cols - 1)) * Math.PI * 1.76;
  const phi = -Math.PI * 0.43 + (row / (rows - 1)) * Math.PI * 0.86;
  const foldA = Math.sin(theta * 9.8 + phi * 10.5 + Math.sin(theta * 2.1));
  const foldB = Math.cos(theta * 15.5 - phi * 7.2 + Math.cos(phi * 4.4));
  const foldC = Math.sin(theta * 23.5 + phi * 3.4);
  const sulci =
    -Math.pow(Math.max(0, foldA), 3) * 0.095 -
    Math.pow(Math.max(0, foldB), 3) * 0.068 -
    Math.pow(Math.max(0, foldC), 4) * 0.035;
  const gyri =
    Math.pow(Math.max(0, -foldA), 1.7) * 0.055 +
    Math.pow(Math.max(0, -foldB), 1.8) * 0.036 +
    Math.sin(theta * 5.4 + phi * 8.6) * 0.018;
  const centralSulcus =
    -Math.exp(-Math.pow((theta + 0.04) / 0.17, 2)) * Math.exp(-Math.pow(phi / 0.54, 2)) * 0.08;
  const frontal = Math.max(0, Math.cos(theta - 0.9)) * 0.18;
  const posterior = Math.max(0, Math.cos(theta + 1.2)) * 0.12;
  const inflate = inflated ? 1.1 : 1;
  const radius = (1 + gyri + sulci + centralSulcus + frontal + posterior) * inflate;

  return {
    x: Math.cos(phi) * Math.cos(theta) * 1.62 * radius,
    y: Math.sin(phi) * 0.92 * radius + Math.sin(theta * 3.2 + phi * 4.2) * 0.045,
    z: Math.cos(phi) * Math.sin(theta) * 0.86 * radius,
  };
}

function makeBrainGeometry(inflated: boolean) {
  const rows = 54;
  const cols = 96;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const point = cortexPoint(row, col, rows, cols, inflated);
      const mapped = brainSpace(point);
      positions.push(mapped.x, mapped.y, mapped.z);

      const ridge =
        0.72 +
        Math.sin(row * 0.58 + col * 0.2) * 0.12 +
        Math.cos(col * 0.36 - row * 0.22) * 0.1 +
        point.z * 0.08;
      const light = clamp(ridge, 0.38, 0.96);
      colors.push(light, light, light);
    }
  }

  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      const a = row * cols + col;
      const b = a + 1;
      const c = (row + 1) * cols + col + 1;
      const d = (row + 1) * cols + col;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeHeadShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0.08, -1.78);
  shape.bezierCurveTo(-0.48, -1.78, -0.94, -1.46, -1.06, -1.05);
  shape.bezierCurveTo(-1.12, -0.84, -1.3, -0.72, -1.43, -0.58);
  shape.bezierCurveTo(-1.52, -0.5, -1.3, -0.45, -1.12, -0.39);
  shape.bezierCurveTo(-0.98, -0.33, -1.18, -0.25, -1.04, -0.16);
  shape.bezierCurveTo(-0.9, -0.08, -0.88, 0.2, -0.68, 0.44);
  shape.bezierCurveTo(-0.5, 0.64, -0.2, 0.68, -0.08, 1.04);
  shape.bezierCurveTo(0.04, 1.45, 0.32, 1.86, 0.7, 1.86);
  shape.bezierCurveTo(0.98, 1.55, 1.02, 0.9, 1.36, 0.34);
  shape.bezierCurveTo(1.72, -0.28, 1.46, -1.18, 0.84, -1.58);
  shape.bezierCurveTo(0.58, -1.72, 0.26, -1.82, 0.08, -1.78);
  return shape;
}

function makeHeadShell() {
  const group = new THREE.Group();
  const shape = makeHeadShape();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.045,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });

  [-0.58, -0.28, 0, 0.28, 0.58].forEach((z, index) => {
    const scale = 1 - Math.abs(z) * 0.1;
    const geometry = new THREE.ShapeGeometry(shape, 64);
    geometry.scale(scale, 1 - Math.abs(z) * 0.02, 1);
    geometry.translate(0, 0, z);
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.material.opacity = index === 2 ? 0.06 : 0.022;
    mesh.material.userData.baseOpacity = mesh.material.opacity;
    group.add(mesh);

    const points = shape.getPoints(96).map((point) => new THREE.Vector3(point.x * scale, point.y, z));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), edgeMaterial.clone());
    line.material.opacity = index === 2 ? 0.2 : 0.075;
    line.material.userData.baseOpacity = line.material.opacity;
    group.add(line);
  });

  group.position.set(0, 0, 0);
  return group;
}

function makeActivationSprite(size: number, opacity: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
    gradient.addColorStop(0.16, `rgba(255,112,104,${opacity * 0.95})`);
    gradient.addColorStop(0.5, `rgba(220,34,32,${opacity * 0.52})`);
    gradient.addColorStop(1, "rgba(220,34,32,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(size);
  return sprite;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
  } else {
    material.dispose();
  }
}

function fitBrainModel(model: THREE.Object3D, material: THREE.Material) {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.material) {
      disposeMaterial(mesh.material as THREE.Material | THREE.Material[]);
    }
    mesh.material = material;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  const fitted = new THREE.Group();
  model.position.copy(center).multiplyScalar(-1);
  fitted.add(model);
  fitted.scale.setScalar(2.22 / maxAxis);
  fitted.rotation.set(0.02, 0, -0.02);
  return fitted;
}

function disposeObject(object: THREE.Object3D, sharedMaterial: THREE.Material) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const material = mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) {
      material.forEach((item) => {
        if (item !== sharedMaterial) item.dispose();
      });
    } else if (material !== sharedMaterial) {
      material.dispose();
    }
  });
}

export function BrainWebGLScene({
  report,
  selectedId,
  meshMode,
  skullMode,
  orbit,
  pickTargetsRef,
}: BrainWebGLSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const liveStateRef = useRef({ orbit, skullMode });
  const renderSceneRef = useRef<(() => void) | null>(null);
  const responsiveFrameRef = useRef({ scale: 1, panX: 0, panY: 0 });
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    liveStateRef.current = { orbit, skullMode };
    renderSceneRef.current?.();
  }, [orbit, skullMode]);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const canvasHost: HTMLDivElement = hostEl;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      window.setTimeout(() => setWebglError(false), 0);
    } catch {
      window.setTimeout(() => setWebglError(true), 0);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasHost.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const head = makeHeadShell();
    root.add(head);

    const proceduralBrainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2f2f2,
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0.06,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
    const modelBrainMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      roughness: 0.72,
      metalness: 0,
      clearcoat: 0.12,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
      side: THREE.DoubleSide,
    });
    const brainMesh = new THREE.Mesh(makeBrainGeometry(meshMode === "Inflated"), proceduralBrainMaterial);
    root.add(brainMesh);

    const brainModelRoot = new THREE.Group();
    brainModelRoot.position.copy(brainSpace({ x: 0, y: 0, z: 0 }));
    brainModelRoot.visible = false;
    root.add(brainModelRoot);

    const activations = new Map<string, THREE.Sprite>();
    report.brainSignals.forEach((signal) => {
      const center = brainSpace(getActivationCenter(signal));
      const sprite = makeActivationSprite(0.82 + signal.value / 145, signal.id === selectedId ? 0.94 : 0.62);
      sprite.position.copy(center);
      activations.set(signal.id, sprite);
      root.add(sprite);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(-2.4, 2.8, 4.2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.05);
    rim.position.set(3.6, -1.2, 2.4);
    scene.add(rim);
    const red = new THREE.PointLight(0xff4d45, 1.65, 5.4);
    red.position.set(1.05, -0.82, 1.2);
    root.add(red);

    function resize() {
      const rect = canvasHost.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      responsiveFrameRef.current =
        width < 520
          ? { scale: 0.54, panX: -0.42, panY: 0.24 }
          : width < 820
            ? { scale: 0.74, panX: -0.2, panY: 0.1 }
            : { scale: 1, panX: 0, panY: 0 };
      camera.position.z = width < 520 ? 8.2 : width < 820 ? 7.7 : 7.2;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function applyState() {
      const { orbit: liveOrbit, skullMode: liveSkullMode } = liveStateRef.current;
      const frame = responsiveFrameRef.current;
      root.rotation.x = (liveOrbit.rotateX * Math.PI) / 180;
      root.rotation.y = (liveOrbit.rotateY * Math.PI) / 180;
      root.position.x = liveOrbit.panX / 220 + frame.panX;
      root.position.y = -liveOrbit.panY / 220 + frame.panY;
      root.scale.setScalar(liveOrbit.zoom * frame.scale);
      head.visible = true;
      head.traverse((child) => {
        if ("material" in child) {
          const material = child.material as THREE.Material & { opacity?: number };
          if (typeof material.opacity === "number") {
            const baseOpacity =
              typeof material.userData.baseOpacity === "number" ? material.userData.baseOpacity : material.opacity;
            material.opacity = baseOpacity * (liveSkullMode === "Close" ? 1.45 : 1);
          }
        }
      });
    }

    function updatePickTargets() {
      const rect = canvasHost.getBoundingClientRect();
      const targets: PickTarget[] = [];
      report.brainSignals.forEach((signal) => {
        const sprite = activations.get(signal.id);
        if (!sprite) return;
        const projected = sprite.getWorldPosition(new THREE.Vector3()).project(camera);
        targets.push({
          id: signal.id,
          x: ((projected.x + 1) / 2) * rect.width,
          y: ((-projected.y + 1) / 2) * rect.height,
          radius: 34,
        });
      });
      pickTargetsRef.current = targets;
    }

    function renderScene() {
      applyState();
      renderer.render(scene, camera);
      updatePickTargets();
    }

    renderSceneRef.current = renderScene;
    resize();
    renderScene();

    let disposed = false;
    let loadedBrainModel: THREE.Object3D | null = null;
    new GLTFLoader().load(
      "/models/human-brain.glb",
      (gltf) => {
        if (disposed) return;
        loadedBrainModel = fitBrainModel(gltf.scene, modelBrainMaterial);
        brainModelRoot.add(loadedBrainModel);
        brainModelRoot.visible = true;
        brainMesh.visible = false;
        renderScene();
      },
      undefined,
      () => {
        brainModelRoot.visible = false;
        brainMesh.visible = true;
        renderScene();
      },
    );

    const observer = new ResizeObserver(() => {
      resize();
      renderScene();
    });
    observer.observe(canvasHost);

    return () => {
      disposed = true;
      observer.disconnect();
      pickTargetsRef.current = [];
      if (renderer.domElement.parentNode === canvasHost) {
        canvasHost.removeChild(renderer.domElement);
      }
      if (renderSceneRef.current === renderScene) {
        renderSceneRef.current = null;
      }
      brainMesh.geometry.dispose();
      if (loadedBrainModel) {
        disposeObject(loadedBrainModel, modelBrainMaterial);
      }
      proceduralBrainMaterial.dispose();
      modelBrainMaterial.dispose();
      renderer.dispose();
      activations.forEach((sprite) => {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      });
      head.traverse((child) => {
        if ("geometry" in child) {
          (child.geometry as THREE.BufferGeometry).dispose();
        }
        if ("material" in child) {
          const material = child.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else (material as THREE.Material).dispose();
        }
      });
    };
  }, [meshMode, pickTargetsRef, report.brainSignals, selectedId]);

  if (webglError) {
    return (
      <div
        ref={hostRef}
        className="flex h-full w-full items-center justify-center px-8 text-center text-sm text-white/58"
        aria-label="Interactive TRIBE-style 3D brain"
      >
        Enable WebGL or hardware acceleration to view the interactive 3D brain.
      </div>
    );
  }

  return <div ref={hostRef} className="h-full w-full" aria-label="Interactive TRIBE-style 3D brain" />;
}
