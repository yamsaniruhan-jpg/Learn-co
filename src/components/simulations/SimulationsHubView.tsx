import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Atom,
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Sliders,
  ChevronRight,
  Info,
  Brain,
  Layers,
  Box,
  Compass,
  Activity,
  Flame,
  Globe,
  Gauge,
  TrendingDown,
  Eye,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Calculus3DLab } from './Calculus3DLab';

interface SimulationsHubViewProps {
  onNavigateToTab: (tabId: string, context?: any) => void;
}

export const SimulationsHubView: React.FC<SimulationsHubViewProps> = ({ onNavigateToTab }) => {
  const [selectedSim, setSelectedSim] = useState<'calculus' | 'gradient' | 'chemistry' | 'pendulum' | 'quantum'>('calculus');

  // Calculus View Mode
  const [calculusMode, setCalculusMode] = useState<'3d_spatial' | 'analytical_slice'>('3d_spatial');
  const [calcX, setCalcX] = useState<number>(1.5);

  // Gradient Descent State
  const [lossSurfaceType, setLossSurfaceType] = useState<'quadratic' | 'saddle' | 'rosenbrock'>('quadratic');
  const [gdRate, setGdRate] = useState<number>(0.12);
  const [gdMomentum, setGdMomentum] = useState<number>(0.3);
  const [gdW, setGdW] = useState<number>(2.4);
  const [gdB, setGdB] = useState<number>(1.8);
  const [gdEpoch, setGdEpoch] = useState<number>(0);
  const [gdHistory, setGdHistory] = useState<Array<{ w: number; b: number; loss: number }>>([
    { w: 2.4, b: 1.8, loss: 0.5 * (2.4 * 2.4 + 1.8 * 1.8) },
  ]);
  const [isGdRunning, setIsGdRunning] = useState<boolean>(false);
  const gdVelocity = useRef<{ dw: number; db: number }>({ dw: 0, db: 0 });

  // Compute Loss and Gradient
  const computeLossAndGrad = (w: number, b: number, type: 'quadratic' | 'saddle' | 'rosenbrock') => {
    if (type === 'quadratic') {
      const loss = 0.5 * (w * w + 2 * b * b);
      return { loss, gradW: w, gradB: 2 * b };
    } else if (type === 'saddle') {
      const loss = 0.5 * (w * w - b * b);
      return { loss, gradW: w, gradB: -b };
    } else {
      // Rosenbrock
      const loss = Math.pow(1 - w, 2) + 10 * Math.pow(b - w * w, 2);
      const gradW = -2 * (1 - w) - 40 * w * (b - w * w);
      const gradB = 20 * (b - w * w);
      return { loss, gradW, gradB };
    }
  };

  // Step Gradient Descent
  const stepOptimizer = () => {
    setGdHistory((prev) => {
      const current = prev[prev.length - 1];
      const { loss, gradW, gradB } = computeLossAndGrad(current.w, current.b, lossSurfaceType);

      // Heavy-ball momentum update
      const newVw = gdMomentum * gdVelocity.current.dw - gdRate * gradW;
      const newVb = gdMomentum * gdVelocity.current.db - gdRate * gradB;
      gdVelocity.current = { dw: newVw, db: newVb };

      const newW = current.w + newVw;
      const newB = current.b + newVb;
      const newLossData = computeLossAndGrad(newW, newB, lossSurfaceType);

      setGdW(newW);
      setGdB(newB);
      setGdEpoch((e) => e + 1);

      return [...prev.slice(-30), { w: newW, b: newB, loss: newLossData.loss }];
    });
  };

  const resetOptimizer = () => {
    setIsGdRunning(false);
    gdVelocity.current = { dw: 0, db: 0 };
    const initW = lossSurfaceType === 'rosenbrock' ? -1.2 : 2.2;
    const initB = lossSurfaceType === 'rosenbrock' ? 1.0 : 1.8;
    setGdW(initW);
    setGdB(initB);
    setGdEpoch(0);
    const { loss } = computeLossAndGrad(initW, initB, lossSurfaceType);
    setGdHistory([{ w: initW, b: initB, loss }]);
  };

  useEffect(() => {
    if (!isGdRunning) return;
    const timer = setInterval(() => {
      setGdHistory((prev) => {
        const current = prev[prev.length - 1];
        if (Math.abs(current.loss) < 0.0005 && lossSurfaceType === 'quadratic') {
          setIsGdRunning(false);
          return prev;
        }
        const { gradW, gradB } = computeLossAndGrad(current.w, current.b, lossSurfaceType);
        const newVw = gdMomentum * gdVelocity.current.dw - gdRate * gradW;
        const newVb = gdMomentum * gdVelocity.current.db - gdRate * gradB;
        gdVelocity.current = { dw: newVw, db: newVb };

        const newW = current.w + newVw;
        const newB = current.b + newVb;
        const newLossData = computeLossAndGrad(newW, newB, lossSurfaceType);

        setGdW(newW);
        setGdB(newB);
        setGdEpoch((e) => e + 1);

        return [...prev.slice(-40), { w: newW, b: newB, loss: newLossData.loss }];
      });
    }, 180);
    return () => clearInterval(timer);
  }, [isGdRunning, gdRate, gdMomentum, lossSurfaceType]);

  // Chemistry SN2 State
  const [chemPhase, setChemPhase] = useState<number>(1);
  const [nucleophile, setNucleophile] = useState<'OH' | 'CN' | 'I' | 'N3'>('OH');
  const [leavingGroup, setLeavingGroup] = useState<'Br' | 'Cl' | 'I' | 'F'>('Br');
  const [substrateHindrance, setSubstrateHindrance] = useState<'methyl' | 'primary' | 'secondary' | 'tertiary'>('methyl');

  const getNucleophileStrength = (nu: string): { label: string; pKa: number; speedMultiplier: number } => {
    switch (nu) {
      case 'CN':
        return { label: 'Cyanide (CN⁻) — Excellent Nucleophile', pKa: 9.2, speedMultiplier: 1.4 };
      case 'I':
        return { label: 'Iodide (I⁻) — Strong Polarizable Nu⁻', pKa: -10, speedMultiplier: 1.25 };
      case 'N3':
        return { label: 'Azide (N₃⁻) — Good Nucleophile', pKa: 4.7, speedMultiplier: 1.1 };
      default:
        return { label: 'Hydroxide (OH⁻) — Strong Hard Base/Nu⁻', pKa: 15.7, speedMultiplier: 1.0 };
    }
  };

  const getSubstrateRate = (sub: string) => {
    switch (sub) {
      case 'methyl':
        return { rate: 'Fastest (Relative Rate: 30,000x)', allowed: true, warning: null };
      case 'primary':
        return { rate: 'Fast (Relative Rate: 1x reference)', allowed: true, warning: null };
      case 'secondary':
        return { rate: 'Sluggish (Relative Rate: 0.02x)', allowed: true, warning: 'Significant steric crowding; competing E2 elimination pathway likely.' };
      case 'tertiary':
        return { rate: 'Prohibited (Rate: ~0x)', allowed: false, warning: 'Severe steric hindrance prevents 180° backside approach. Exclusively proceeds via SN1/E1!' };
    }
  };

  // Physics Pendulum State
  const [pendulumGravity, setPendulumGravity] = useState<number>(9.81);
  const [pendulumDamping, setPendulumDamping] = useState<number>(0.02);
  const [pendulumLength, setPendulumLength] = useState<number>(1.2);
  const [initialAngle, setInitialAngle] = useState<number>(45);
  const [isPendulumRunning, setIsPendulumRunning] = useState<boolean>(true);
  const pendulumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pendulum simulation internal physics
  const thetaRef = useRef<number>((initialAngle * Math.PI) / 180);
  const omegaRef = useRef<number>(0);
  const phaseTrailRef = useRef<Array<{ theta: number; omega: number }>>([]);

  useEffect(() => {
    thetaRef.current = (initialAngle * Math.PI) / 180;
    omegaRef.current = 0;
    phaseTrailRef.current = [];
  }, [initialAngle, pendulumLength, pendulumGravity]);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.04);
      lastTime = currentTime;

      if (isPendulumRunning) {
        // RK2 integration of d2theta/dt2 = -(g/L)*sin(theta) - damping*omega
        const g = pendulumGravity;
        const L = pendulumLength;
        const b = pendulumDamping;

        const currentTheta = thetaRef.current;
        const currentOmega = omegaRef.current;

        const alpha1 = -(g / L) * Math.sin(currentTheta) - b * currentOmega;
        const midTheta = currentTheta + 0.5 * currentOmega * dt;
        const midOmega = currentOmega + 0.5 * alpha1 * dt;

        const alpha2 = -(g / L) * Math.sin(midTheta) - b * midOmega;
        const nextTheta = currentTheta + midOmega * dt;
        const nextOmega = currentOmega + alpha2 * dt;

        thetaRef.current = nextTheta;
        omegaRef.current = nextOmega;

        // Record phase space
        if (phaseTrailRef.current.length > 70) {
          phaseTrailRef.current.shift();
        }
        phaseTrailRef.current.push({
          theta: (nextTheta * 180) / Math.PI,
          omega: nextOmega,
        });
      }

      // Render canvas
      const canvas = pendulumCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const originX = w * 0.32;
          const originY = 35;
          const visualLength = (pendulumLength / 2.0) * (h * 0.65);

          const bobX = originX + visualLength * Math.sin(thetaRef.current);
          const bobY = originY + visualLength * Math.cos(thetaRef.current);

          // Pivot support
          ctx.beginPath();
          ctx.fillStyle = '#64748b';
          ctx.fillRect(originX - 35, originY - 10, 70, 10);

          // Support bracket
          ctx.beginPath();
          ctx.arc(originX, originY, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#cbd5e1';
          ctx.fill();

          // String
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(bobX, bobY);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Bob with glow
          const grad = ctx.createRadialGradient(bobX, bobY, 2, bobX, bobY, 16);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#b45309');

          ctx.beginPath();
          ctx.arc(bobX, bobY, 15, 0, 2 * Math.PI);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fef3c7';
          ctx.stroke();

          // Phase Space Drawing on Right Half of Canvas
          const phaseOriginX = w * 0.74;
          const phaseOriginY = h * 0.5;

          // Phase axes
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(phaseOriginX - 80, phaseOriginY);
          ctx.lineTo(phaseOriginX + 80, phaseOriginY);
          ctx.moveTo(phaseOriginX, phaseOriginY - 80);
          ctx.lineTo(phaseOriginX, phaseOriginY + 80);
          ctx.stroke();

          // Axis labels
          ctx.font = '10px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('θ (deg)', phaseOriginX + 55, phaseOriginY + 14);
          ctx.fillText('ω (rad/s)', phaseOriginX + 6, phaseOriginY - 65);

          // Phase trajectory
          if (phaseTrailRef.current.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            phaseTrailRef.current.forEach((pt, idx) => {
              const px = phaseOriginX + pt.theta * 0.85;
              const py = phaseOriginY - pt.omega * 12;
              if (idx === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();

            // Head of phase
            const head = phaseTrailRef.current[phaseTrailRef.current.length - 1];
            ctx.beginPath();
            ctx.arc(phaseOriginX + head.theta * 0.85, phaseOriginY - head.omega * 12, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#f43f5e';
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPendulumRunning, pendulumGravity, pendulumLength, pendulumDamping]);

  // Quantum Simulation State
  const [quantumN, setQuantumN] = useState<number>(2);
  const [quantumBoxWidth, setQuantumBoxWidth] = useState<number>(1.0);
  const [showProbabilityDensity, setShowProbabilityDensity] = useState<boolean>(true);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-300 border border-white/15">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive STEM Laboratories & Real-Time Simulations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Virtual Simulations & 3D Labs
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Experience multivariable calculus in 3D WebGL, watch machine learning optimizers navigate loss landscapes, witness Walden inversion in organic chemistry, investigate mechanical phase space, and examine quantum wavefunctions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigateToTab('practice')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Practice Arena
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateToTab('copilot')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              Ask Socratic AI
            </Button>
          </div>
        </div>
      </div>

      {/* Simulation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedSim('calculus')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'calculus'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">📈</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'calculus' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              3D WebGL
            </span>
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm">Calculus 3D Lab</h3>
            <p className={`text-[11px] mt-0.5 ${selectedSim === 'calculus' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Tangent Plane & ∇f
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedSim('gradient')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'gradient'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">🤖</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'gradient' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              AI Engine
            </span>
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm">Loss Landscape</h3>
            <p className={`text-[11px] mt-0.5 ${selectedSim === 'gradient' ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Gradient Descent & Momentum
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedSim('chemistry')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'chemistry'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">⚗️</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'chemistry' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Stereo Lab
            </span>
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm">SN2 Organic Lab</h3>
            <p className={`text-[11px] mt-0.5 ${selectedSim === 'chemistry' ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Walden Umbrella Inversion
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedSim('pendulum')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'pendulum'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">⚡</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'pendulum' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Dynamics
            </span>
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm">Physics Mechanics</h3>
            <p className={`text-[11px] mt-0.5 ${selectedSim === 'pendulum' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Harmonic Phase Space
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedSim('quantum')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
            selectedSim === 'quantum'
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-md ring-2 ring-cyan-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">🌌</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'quantum' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Quantum
            </span>
          </div>
          <div>
            <h3 className="font-black text-xs sm:text-sm">Wavefunction Lab</h3>
            <p className={`text-[11px] mt-0.5 ${selectedSim === 'quantum' ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
              Particle in a Box & |ψ|²
            </p>
          </div>
        </button>
      </div>

      {/* Active Simulation Container */}
      <div className="p-4 sm:p-6 lg:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* SIMULATION 1: CALCULUS 3D LAB */}
        {selectedSim === 'calculus' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Calculus 3D Spatial Virtual Lab
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  Multivariable Surfaces, Partial Derivatives & Tangent Planes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Interact with real-time Three.js WebGL geometry with mouse orbit controls, surface probes, and analytical gradient vector indicators.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCalculusMode('3d_spatial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    calculusMode === '3d_spatial'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Three.js 3D View
                </button>
                <button
                  type="button"
                  onClick={() => setCalculusMode('analytical_slice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    calculusMode === 'analytical_slice'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  2D Cross-Section
                </button>
              </div>
            </div>

            {calculusMode === '3d_spatial' ? (
              <Calculus3DLab />
            ) : (
              <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between text-white shadow-inner">
                <div className="z-10 flex items-center justify-between text-xs font-mono text-indigo-300">
                  <span className="bg-indigo-500/20 px-3 py-1 rounded-md border border-indigo-500/30 font-bold">
                    Analytical Coordinate Slice
                  </span>
                  <span>f(x) = x², df/dx = 2x</span>
                </div>

                <div className="my-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Live Analytical State</div>
                      <div className="flex justify-between text-xs font-mono">
                        <span>Position x:</span>
                        <span className="text-indigo-400 font-bold">{calcX.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span>Height z = f(x):</span>
                        <span className="text-amber-400 font-bold">{(calcX * calcX).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span>Slope df/dx:</span>
                        <span className="text-emerald-400 font-bold">{(2 * calcX).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Adjust Coordinate Position (x)</span>
                        <span className="font-mono text-indigo-300">{calcX}</span>
                      </div>
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="0.1"
                        value={calcX}
                        onChange={(e) => setCalcX(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="relative h-48 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-900/50 flex items-center justify-center p-4">
                    <div className="w-full h-full relative flex items-center justify-center">
                      <div className="absolute inset-x-0 bottom-4 h-px bg-slate-700" />
                      <div className="absolute inset-y-4 left-1/2 w-px bg-slate-700" />
                      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 200 100">
                        <path d="M 20 80 Q 100 10 180 80" fill="none" stroke="#6366f1" strokeWidth="3" />
                        <circle
                          cx={100 + calcX * 25}
                          cy={80 - Math.pow(calcX, 2) * 8}
                          r="6"
                          className="fill-amber-400 stroke-white stroke-2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SIMULATION 2: AI OPTIMIZER & GRADIENT DESCENT */}
        {selectedSim === 'gradient' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  AI & Machine Learning Loss Landscape
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  Gradient Descent, Heavy-Ball Momentum & Learning Rate Dynamics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tune hyperparameters in real time, observe convergence trajectories across convex bowls or non-convex saddle points, and detect gradient explosions.
                </p>
              </div>

              {/* Surface Preset */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                {(['quadratic', 'saddle', 'rosenbrock'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setLossSurfaceType(type);
                      resetOptimizer();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      lossSurfaceType === type
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Learning Rate (α)
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {gdRate.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.65"
                    step="0.01"
                    value={gdRate}
                    onChange={(e) => setGdRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {gdRate > 0.45 ? '⚠️ High α: Risk of overshoot & oscillating divergence!' : 'Stable step size ensures monotonic loss minimization.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Momentum Factor (β)
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {gdMomentum.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.9"
                    step="0.05"
                    value={gdMomentum}
                    onChange={(e) => setGdMomentum(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Accumulates velocity vector to accelerate through shallow plateaus and ravines.
                  </p>
                </div>

                {/* Step / Run Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isGdRunning ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setIsGdRunning(!isGdRunning)}
                    leftIcon={isGdRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    className={isGdRunning ? '' : 'bg-purple-600 hover:bg-purple-500 text-white'}
                  >
                    {isGdRunning ? 'Pause' : 'Auto Step'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGdRunning}
                    onClick={stepOptimizer}
                    leftIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Single Step
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetOptimizer}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Reset
                  </Button>
                </div>

                {/* State Readout */}
                <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Iteration:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">Epoch {gdEpoch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Parameters (w, b):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ({gdW.toFixed(3)}, {gdB.toFixed(3)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Loss L(w, b):</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {gdHistory[gdHistory.length - 1].loss.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2D Contour Landscape Visualization */}
              <div className="lg:col-span-2 relative min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between overflow-hidden shadow-inner text-white">
                <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                  <span>Parameter Space Contour Map: L(w, b)</span>
                  <span>Target Minimum: (0.00, 0.00)</span>
                </div>

                {/* SVG Contour & Path */}
                <div className="relative my-auto w-full h-56 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="-120 -80 240 160">
                    {/* Elliptic contour lines */}
                    {[10, 25, 45, 70, 100].map((r, i) => (
                      <ellipse
                        key={i}
                        cx="0"
                        cy="0"
                        rx={r * 1.2}
                        ry={r * 0.75}
                        fill="none"
                        stroke="#475569"
                        strokeDasharray={i % 2 === 1 ? '3 3' : 'none'}
                        strokeWidth="1"
                        opacity={0.4 + i * 0.12}
                      />
                    ))}

                    {/* Coordinate axes */}
                    <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeWidth="1" />
                    <line x1="0" y1="-70" x2="0" y2="70" stroke="#334155" strokeWidth="1" />

                    {/* Global Minimum Star */}
                    <circle cx="0" cy="0" r="4" fill="#10b981" />
                    <text x="6" y="4" fontSize="8" fill="#10b981" fontFamily="monospace">
                      w*
                    </text>

                    {/* Trajectory Polyline */}
                    {gdHistory.length > 1 && (
                      <polyline
                        points={gdHistory.map((pt) => `${pt.w * 35},${-pt.b * 25}`).join(' ')}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Current Position Marker */}
                    <circle
                      cx={gdW * 35}
                      cy={-gdB * 25}
                      r="6"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Optimizer Path: {gdHistory.length} Recorded Steps</span>
                  <span className="text-purple-400 font-bold">
                    {Math.abs(gdHistory[gdHistory.length - 1].loss) < 0.05
                      ? '🎯 Optimal Convergence Achieved'
                      : 'Step Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATION 3: CHEMISTRY SN2 STEREOCHEMICAL LAB */}
        {selectedSim === 'chemistry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Organic Chemistry Reaction Dynamics
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  SN2 Bimolecular Substitution & Stereochemical Walden Inversion
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Inspect backside nucleophilic attack at 180°, trigonal bipyramidal transition state geometry, and complete umbrella stereoinversion.
                </p>
              </div>

              {/* Substrate Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                {(['methyl', 'primary', 'secondary', 'tertiary'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubstrateHindrance(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      substrateHindrance === sub
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning if tertiary */}
            {getSubstrateRate(substrateHindrance).warning && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{getSubstrateRate(substrateHindrance).warning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chemical Reactants Panel */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    1. Incoming Nucleophile (Nu⁻)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['OH', 'CN', 'I', 'N3'] as const).map((nu) => (
                      <button
                        key={nu}
                        onClick={() => setNucleophile(nu)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          nucleophile === nu
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {nu === 'OH' ? 'OH⁻ (Hydroxide)' : nu === 'CN' ? 'CN⁻ (Cyanide)' : nu === 'I' ? 'I⁻ (Iodide)' : 'N₃⁻ (Azide)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {getNucleophileStrength(nucleophile).label}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    2. Leaving Group (LG⁻)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Br', 'Cl', 'I', 'F'] as const).map((lg) => (
                      <button
                        key={lg}
                        onClick={() => setLeavingGroup(lg)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          leavingGroup === lg
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lg === 'Br' ? 'Br⁻ (Bromide)' : lg === 'Cl' ? 'Cl⁻ (Chloride)' : lg === 'I' ? 'I⁻ (Iodide)' : 'F⁻ (Fluoride)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reaction Phase Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    3. Reaction Coordinate Step
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 1, label: '1. Approach' },
                      { id: 2, label: '2. TS [‡]' },
                      { id: 3, label: '3. Inverted' },
                    ].map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setChemPhase(step.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          chemPhase === step.id
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Molecular Visualizer Box */}
              <div className="lg:col-span-2 relative min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between text-white shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-rose-300">
                  <span>Concerted Stereochemical Inversion</span>
                  <span>{chemPhase === 1 ? 'Reactants' : chemPhase === 2 ? 'Transition State (D3h)' : 'Inverted Product'}</span>
                </div>

                {/* Schematic Molecular Animation */}
                <div className="my-auto relative h-48 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 320 140">
                    {/* Carbon Center */}
                    <circle cx="160" cy="70" r="16" fill="#334155" stroke="#64748b" strokeWidth="2" />
                    <text x="156" y="74" fontSize="11" fill="#f8fafc" fontWeight="bold">
                      C
                    </text>

                    {/* Nucleophile */}
                    <g transform={`translate(${chemPhase === 1 ? 40 : chemPhase === 2 ? 100 : 120}, 70)`}>
                      <circle cx="0" cy="0" r="14" fill="#e11d48" stroke="#fda4af" strokeWidth="2" />
                      <text x="-8" y="4" fontSize="10" fill="#ffffff" fontWeight="bold">
                        {nucleophile}
                      </text>
                      {/* Attack Arrow */}
                      {chemPhase === 1 && (
                        <path d="M 18 0 L 60 0" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                      )}
                    </g>

                    {/* Leaving Group */}
                    <g transform={`translate(${chemPhase === 1 ? 220 : chemPhase === 2 ? 225 : 280}, 70)`}>
                      <circle cx="0" cy="0" r="14" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
                      <text x="-6" y="4" fontSize="10" fill="#ffffff" fontWeight="bold">
                        {leavingGroup}
                      </text>
                    </g>

                    {/* Partial bonds in Transition State */}
                    {chemPhase === 2 && (
                      <>
                        <line x1="114" y1="70" x2="144" y2="70" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
                        <line x1="176" y1="70" x2="211" y2="70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                      </>
                    )}

                    {/* Peripheral Umbrella Bonds (Walden flip) */}
                    <g>
                      {/* Top substituent */}
                      <line
                        x1="160"
                        y1="54"
                        x2={chemPhase === 1 ? '175' : chemPhase === 2 ? '160' : '145'}
                        y2="25"
                        stroke="#94a3b8"
                        strokeWidth="3"
                      />
                      <circle
                        cx={chemPhase === 1 ? '175' : chemPhase === 2 ? '160' : '145'}
                        cy="25"
                        r="8"
                        fill="#64748b"
                      />

                      {/* Bottom substituent 1 */}
                      <line
                        x1="160"
                        y1="86"
                        x2={chemPhase === 1 ? '175' : chemPhase === 2 ? '160' : '145'}
                        y2="115"
                        stroke="#94a3b8"
                        strokeWidth="3"
                      />
                      <circle
                        cx={chemPhase === 1 ? '175' : chemPhase === 2 ? '160' : '145'}
                        cy="115"
                        r="8"
                        fill="#64748b"
                      />
                    </g>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Backside Attack Angle: 180° Invariant</span>
                  <span className="text-rose-400 font-bold">
                    {chemPhase === 3 ? 'Complete (100%) Inversion of Configuration' : 'Reaction in Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATION 4: PHYSICS HARMONIC OSCILLATOR & PENDULUM */}
        {selectedSim === 'pendulum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Physics Classical Mechanics Lab
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  Harmonic Oscillations, Phase Space Portraits & Energy Conservation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Examine mechanical energy interchange E = U + K and phase space orbits across gravitational environments.
                </p>
              </div>

              {/* Gravity Environment */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                {[
                  { name: 'Earth', g: 9.81 },
                  { name: 'Moon', g: 1.62 },
                  { name: 'Mars', g: 3.71 },
                  { name: 'Jupiter', g: 24.79 },
                ].map((planet) => (
                  <button
                    key={planet.name}
                    onClick={() => setPendulumGravity(planet.g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pendulumGravity === planet.g
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {planet.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Release Angle (θ₀)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {initialAngle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={initialAngle}
                    onChange={(e) => setInitialAngle(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Air Damping Friction (b)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                      {pendulumDamping.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.005"
                    value={pendulumDamping}
                    onChange={(e) => setPendulumDamping(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-600"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pendulumDamping === 0 ? 'Frictionless: Total energy perfectly invariant.' : 'Damped: Phase space spirals into attractor (0, 0).'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isPendulumRunning ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setIsPendulumRunning(!isPendulumRunning)}
                    leftIcon={isPendulumRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    className={isPendulumRunning ? '' : 'bg-amber-600 hover:bg-amber-500 text-white'}
                  >
                    {isPendulumRunning ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      thetaRef.current = (initialAngle * Math.PI) / 180;
                      omegaRef.current = 0;
                      phaseTrailRef.current = [];
                    }}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Reset Angle
                  </Button>
                </div>
              </div>

              {/* Animated Canvas with Visual Pendulum & Phase Space */}
              <div className="lg:col-span-2 relative min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between overflow-hidden shadow-inner text-white">
                <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                  <span>Physical Space (Left) & Phase Space Orbit (Right)</span>
                  <span>g = {pendulumGravity.toFixed(2)} m/s²</span>
                </div>

                <canvas
                  ref={pendulumCanvasRef}
                  width={560}
                  height={220}
                  className="w-full h-56 my-auto"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Conservation Law: E = mgh + ½mv²</span>
                  <span className="text-amber-400 font-bold">Continuous RK2 Integration</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIMULATION 5: QUANTUM WAVEFUNCTION & PARTICLE IN A BOX */}
        {selectedSim === 'quantum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Quantum Mechanics Virtual Lab
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  1D Infinite Square Well & Probability Density |ψ(x)|²
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visualize stationary state wavefunctions ψₙ(x), quantum nodes, and spatial probability distributions inside an infinite potential well.
                </p>
              </div>

              {/* Quantum Number n */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuantumN(n)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quantumN === n
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    n = {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Box Width (L)
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {quantumBoxWidth.toFixed(1)} nm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={quantumBoxWidth}
                    onChange={(e) => setQuantumBoxWidth(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Display Layer
                  </span>
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Show Probability Density |ψ|² (Filled)
                    </span>
                    <input
                      type="checkbox"
                      checked={showProbabilityDensity}
                      onChange={(e) => setShowProbabilityDensity(e.target.checked)}
                      className="w-4 h-4 accent-cyan-600 rounded-sm cursor-pointer"
                    />
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Energy Level Eₙ:</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">
                      {(quantumN * quantumN).toFixed(0)} E₁
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Interior Nodes:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {quantumN - 1} Nodes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Normalization:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">∫ |ψ|² dx = 1.0</span>
                  </div>
                </div>
              </div>

              {/* Quantum Well Graph */}
              <div className="lg:col-span-2 relative min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between text-white shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                  <span>ψₙ(x) = √(2/L) sin(nπx/L)</span>
                  <span>Infinite Potential Walls at x = 0, x = L</span>
                </div>

                {/* SVG Wave Plot */}
                <div className="my-auto relative h-48 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 300 120">
                    {/* Infinite Barrier Walls */}
                    <rect x="25" y="5" width="8" height="110" fill="#475569" />
                    <rect x="267" y="5" width="8" height="110" fill="#475569" />

                    {/* Zero Line */}
                    <line x1="33" y1="60" x2="267" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Wave Path points */}
                    {(() => {
                      const points: string[] = [];
                      const densityPoints: string[] = [];
                      const steps = 80;
                      const startX = 33;
                      const endX = 267;
                      const width = endX - startX;

                      for (let i = 0; i <= steps; i++) {
                        const xFrac = i / steps;
                        const x = startX + xFrac * width;
                        const psi = Math.sin(quantumN * Math.PI * xFrac);
                        const y = 60 - psi * 40;
                        points.push(`${x},${y}`);

                        const densityY = 110 - psi * psi * 48;
                        densityPoints.push(`${x},${densityY}`);
                      }

                      return (
                        <>
                          {showProbabilityDensity && (
                            <polygon
                              points={`33,110 ${densityPoints.join(' ')} 267,110`}
                              fill="rgba(6, 182, 212, 0.25)"
                              stroke="#06b6d4"
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Amplitude Curve ψ(x) */}
                          <polyline
                            points={points.join(' ')}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                  <span>Cyan Fill: Probability Density |ψₙ(x)|²</span>
                  <span className="text-cyan-400 font-bold">Blue Line: Wave Amplitude ψₙ(x)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
