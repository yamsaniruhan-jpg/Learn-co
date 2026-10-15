import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Sliders, Play, Pause, Eye, Info, Layers, Compass, Sparkles } from 'lucide-react';
import { FormattedMathText } from '../common/FormattedMathText';

type SurfaceType = 'paraboloid' | 'saddle' | 'gaussian' | 'wave';

export const Calculus3DLab: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('paraboloid');
  const [probeX, setProbeX] = useState<number>(0.8);
  const [probeY, setProbeY] = useState<number>(0.6);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showTangentPlane, setShowTangentPlane] = useState<boolean>(true);
  const [showGradientVector, setShowGradientVector] = useState<boolean>(true);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  // Mathematical surface functions: z = f(x, y)
  const computeZ = (x: number, y: number, type: SurfaceType): number => {
    switch (type) {
      case 'paraboloid':
        return 0.3 * (x * x + y * y);
      case 'saddle':
        return 0.3 * (x * x - y * y);
      case 'gaussian':
        return 2.2 * Math.exp(-0.8 * (x * x + y * y));
      case 'wave':
        return 0.6 * Math.sin(1.8 * Math.sqrt(x * x + y * y));
    }
  };

  // Partial derivatives df/dx and df/dy
  const computeDerivatives = (x: number, y: number, type: SurfaceType): { dzdx: number; dzdy: number } => {
    const eps = 0.001;
    const z = computeZ(x, y, type);
    const dzdx = (computeZ(x + eps, y, type) - z) / eps;
    const dzdy = (computeZ(x, y + eps, type) - z) / eps;
    return { dzdx, dzdy };
  };

  const currentZ = computeZ(probeX, probeY, surfaceType);
  const { dzdx, dzdy } = computeDerivatives(probeX, probeY, surfaceType);
  const gradMagnitude = Math.sqrt(dzdx * dzdx + dzdy * dzdy);

  // References to dynamic Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const surfaceMeshRef = useRef<THREE.Mesh | null>(null);
  const wireMeshRef = useRef<THREE.Mesh | null>(null);
  const probeMeshRef = useRef<THREE.Mesh | null>(null);
  const tangentPlaneRef = useRef<THREE.Mesh | null>(null);
  const normalArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const gradArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Re-generate Surface Geometry when surfaceType changes
  const updateSurfaceGeometry = (type: SurfaceType) => {
    if (!surfaceMeshRef.current) return;

    const size = 5;
    const segments = 44;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const z = computeZ(u, v, type);
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    surfaceMeshRef.current.geometry.dispose();
    surfaceMeshRef.current.geometry = geometry;

    if (wireMeshRef.current) {
      wireMeshRef.current.geometry.dispose();
      wireMeshRef.current.geometry = geometry.clone();
    }
  };

  // Initial Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 6.5, 6.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL is not supported or context could not be created:', e);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.2; // Don't flip under ground
    controls.minDistance = 3;
    controls.maxDistance = 20;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x818cf8, 1.8);
    dirLight1.position.set(8, 12, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-8, 5, -8);
    scene.add(dirLight2);

    // 4. Ground Grid & 3D Coordinate Reference Axes
    const gridHelper = new THREE.GridHelper(6, 12, 0x6366f1, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Axes Helpers (X: Red, Y: Green, Z: Blue in Three.js coordinate convention)
    const axesHelper = new THREE.AxesHelper(3.5);
    (axesHelper.material as any).linewidth = 2;
    scene.add(axesHelper);

    // 5. Parametric Surface Mesh
    const planeGeo = new THREE.PlaneGeometry(5, 5, 44, 44);
    // Orient plane so that X and Y correspond to horizontal ground, and Z is up in Three.js coordinates
    planeGeo.rotateX(-Math.PI / 2);

    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.35,
      metalness: 0.25,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const surfaceMesh = new THREE.Mesh(planeGeo, surfaceMat);
    scene.add(surfaceMesh);
    surfaceMeshRef.current = surfaceMesh;

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa5b4fc,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireMesh = new THREE.Mesh(planeGeo.clone(), wireMat);
    scene.add(wireMesh);
    wireMeshRef.current = wireMesh;

    // 6. Interactive Probe Sphere
    const probeGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const probeMesh = new THREE.Mesh(probeGeo, probeMat);
    scene.add(probeMesh);
    probeMeshRef.current = probeMesh;

    // 7. Dynamic Tangent Plane Mesh
    const tangentGeo = new THREE.PlaneGeometry(1.6, 1.6);
    tangentGeo.rotateX(-Math.PI / 2);
    const tangentMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.5,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const tangentPlane = new THREE.Mesh(tangentGeo, tangentMat);
    scene.add(tangentPlane);
    tangentPlaneRef.current = tangentPlane;

    // 8. Normal Vector & Gradient Arrows
    const normalArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.2,
      0x10b981,
      0.2,
      0.12
    );
    scene.add(normalArrow);
    normalArrowRef.current = normalArrow;

    const gradArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.0,
      0xf43f5e,
      0.2,
      0.12
    );
    scene.add(gradArrow);
    gradArrowRef.current = gradArrow;

    // Initial geometry build
    updateSurfaceGeometry('paraboloid');

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        if (isAutoRotating) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 1.2;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
      }
      planeGeo.dispose();
      surfaceMat.dispose();
      probeGeo.dispose();
      probeMat.dispose();
      tangentGeo.dispose();
      tangentMat.dispose();
      if (container && renderer?.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Surface when surfaceType changes
  useEffect(() => {
    updateSurfaceGeometry(surfaceType);
  }, [surfaceType]);

  // Update Probe, Tangent Plane, and Vectors when probeX or probeY or surfaceType changes
  useEffect(() => {
    if (!sceneRef.current || !probeMeshRef.current || !tangentPlaneRef.current || !normalArrowRef.current || !gradArrowRef.current) {
      return;
    }

    // In Three.js: X is horizontal, Z is depth/other horizontal axis, Y is vertical height!
    // We map math coordinates (x, y) -> Three.js (x, z) and math z -> Three.js Y!
    const heightY = computeZ(probeX, probeY, surfaceType);
    const probePos = new THREE.Vector3(probeX, heightY, probeY);

    probeMeshRef.current.position.copy(probePos);

    // Tangent plane position
    tangentPlaneRef.current.position.copy(probePos);
    tangentPlaneRef.current.visible = showTangentPlane;

    // Normal vector: in math, for z = f(x, y), F(x, y, z) = f(x, y) - z = 0
    // Gradient of F is (dz/dx, dz/dy, -1) -> Normal vector pointing upwards is (-dz/dx, 1, -dz/dy)
    const { dzdx, dzdy } = computeDerivatives(probeX, probeY, surfaceType);
    const normal = new THREE.Vector3(-dzdx, 1, -dzdy).normalize();

    // Orient tangent plane to match normal
    tangentPlaneRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    // Update normal arrow
    normalArrowRef.current.position.copy(probePos);
    normalArrowRef.current.setDirection(normal);
    normalArrowRef.current.visible = showTangentPlane;

    // Gradient vector: in math (dz/dx, dz/dy) lying on horizontal coordinate ground
    const gradDir = new THREE.Vector3(dzdx, 0, dzdy);
    const gradLen = Math.max(0.3, Math.min(2.5, gradDir.length() * 0.8));
    if (gradDir.length() > 0.001) {
      gradArrowRef.current.setDirection(gradDir.normalize());
    }
    gradArrowRef.current.setLength(gradLen, 0.2, 0.12);
    // Position gradient vector slightly above ground at (x, 0.05, y)
    gradArrowRef.current.position.set(probeX, 0.05, probeY);
    gradArrowRef.current.visible = showGradientVector;

    // Wireframe toggle
    if (wireMeshRef.current) {
      wireMeshRef.current.visible = showWireframe;
    }
  }, [probeX, probeY, surfaceType, showTangentPlane, showGradientVector, showWireframe]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setProbeX(0.8);
    setProbeY(0.6);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>3D Surface:</span>
          </span>
          {[
            { id: 'paraboloid', label: 'Paraboloid (x² + y²)' },
            { id: 'saddle', label: 'Hyperbolic Saddle (x² - y²)' },
            { id: 'gaussian', label: 'Gaussian Peak' },
            { id: 'wave', label: 'Ripple Wave' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSurfaceType(s.id as SurfaceType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                surfaceType === s.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              isAutoRotating
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
            }`}
            title="Toggle 3D Auto-Rotation"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Orbit</span>
          </button>

          <button
            onClick={resetCamera}
            className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Reset 3D Camera & Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main 3D WebGL Viewport Container */}
      <div className="relative aspect-[16/9] w-full min-h-[380px] max-h-[560px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D HUD Overlay: Navigation Help */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebGL 3D Surface Engine • Left-Click + Drag to Rotate</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-slate-900/60 backdrop-blur-xs text-[10px] text-slate-400 font-mono">
            Scroll to Zoom • Right-Click + Drag to Pan
          </div>
        </div>

        {/* 3D HUD Overlay: Coordinate Axes Legend */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-white text-[10px] font-mono space-y-1 shadow-lg">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[9px]">Axes Orientation</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>X Axis (Ground Left/Right)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Y Axis (Ground Depth)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Z Axis (Vertical Height = f(x, y))</span>
          </div>
        </div>

        {/* 3D HUD Overlay: Live Derivative & Tangent Readout */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 text-white shadow-xl flex items-center gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Probe Coordinates</span>
              <span className="text-xs font-mono font-black text-amber-400">
                P({probeX.toFixed(2)}, {probeY.toFixed(2)}, {currentZ.toFixed(2)})
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">∂z/∂x (Slope X)</span>
              <span className="text-xs font-mono font-black text-indigo-400">
                {dzdx >= 0 ? `+${dzdx.toFixed(2)}` : dzdx.toFixed(2)}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">∂z/∂y (Slope Y)</span>
              <span className="text-xs font-mono font-black text-indigo-400">
                {dzdy >= 0 ? `+${dzdy.toFixed(2)}` : dzdy.toFixed(2)}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Steepest Gradient ||∇f||</span>
              <span className="text-xs font-mono font-black text-rose-400">
                {gradMagnitude.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coordinate & Visual Layer Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sliders for Probe X and Y */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Interactive Coordinate Probing</span>
          </h4>

          {/* Slider X */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">X-Coordinate Position</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{probeX.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={probeX}
              onChange={(e) => setProbeX(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Slider Y */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Y-Coordinate Position</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{probeY.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={probeY}
              onChange={(e) => setProbeY(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        {/* Toggles for Visual Overlays */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Geometric Layer Overlays</span>
          </h4>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Show 3D Tangent Plane (Green)</span>
              <input
                type="checkbox"
                checked={showTangentPlane}
                onChange={(e) => setShowTangentPlane(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Show Gradient Vector ∇f (Red Arrow)</span>
              <input
                type="checkbox"
                checked={showGradientVector}
                onChange={(e) => setShowGradientVector(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Show Surface Wireframe Grid</span>
              <input
                type="checkbox"
                checked={showWireframe}
                onChange={(e) => setShowWireframe(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded-sm cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* KaTeX Formatted Mathematical Derivation Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Multivariable Analytical Invariants</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
          <p>
            The 3D tangent plane to the surface at point (x₀, y₀, z₀) is defined by:
          </p>
          <div className="py-1">
            <FormattedMathText
              text="z - z_0 = \frac{\partial f}{\partial x}(x - x_0) + \frac{\partial f}{\partial y}(y - y_0)"
              className="text-indigo-900 dark:text-indigo-200 font-bold"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            The gradient vector ∇f = (∂f/∂x, ∂f/∂y) points in the direction of greatest rate of increase; its magnitude represents the maximum instantaneous slope.
          </p>
        </div>
      </div>
    </div>
  );
};
