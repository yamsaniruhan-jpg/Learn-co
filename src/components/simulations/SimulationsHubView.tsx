import React, { useState } from 'react';
import {
  FlaskConical,
  Atom,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Search,
  Sliders,
  ChevronRight,
  Info,
  Brain,
  Layers,
  Box,
  Compass,
  Activity,
  Flame,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SimulationsHubViewProps {
  onNavigateToTab: (tabId: string, context?: any) => void;
}

export const SimulationsHubView: React.FC<SimulationsHubViewProps> = ({ onNavigateToTab }) => {
  const [selectedSim, setSelectedSim] = useState<'calculus' | 'gradient' | 'chemistry' | 'pendulum'>('calculus');

  // Calculus 3D Coordinate / Function Surface State
  const [calcX, setCalcX] = useState<number>(1.5);
  const [calcPower, setCalcPower] = useState<number>(2);

  // Gradient Descent 3D Loss Landscape State
  const [gdRate, setGdRate] = useState<number>(0.15);
  const [gdEpoch, setGdEpoch] = useState<number>(12);

  // Chemistry 3D Molecular / Orbital Simulation State
  const [chemPhase, setChemPhase] = useState<number>(1); // 1: Reactants approach, 2: Transition State / Walden Inversion, 3: Products Inverted
  const [nucleophileStrength, setNucleophileStrength] = useState<number>(85);

  // Pendulum Phase State
  const [angleTheta, setAngleTheta] = useState<number>(45);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-300 border border-white/15">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Virtual STEM Laboratories & Interactive Models</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Virtual Simulations & 3D Labs
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore complex mathematics, gradient optimization, organic chemistry SN2 inversions, and physics dynamics through immersive 3D coordinate spaces and real-time interactive simulations.
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
          </div>
        </div>
      </div>

      {/* Simulation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedSim('calculus')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'calculus'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">📈</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'calculus' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Calculus 3D
            </span>
          </div>
          <h3 className="font-black text-sm">3D Surface & Derivative Slope</h3>
        </button>

        <button
          onClick={() => setSelectedSim('gradient')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'gradient'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">🤖</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'gradient' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              AI Optimizer
            </span>
          </div>
          <h3 className="font-black text-sm">3D Loss Landscape & GD</h3>
        </button>

        <button
          onClick={() => setSelectedSim('chemistry')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'chemistry'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">⚗️</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'chemistry' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Chemistry Lab
            </span>
          </div>
          <h3 className="font-black text-sm">SN2 Molecular Orbital Inversion</h3>
        </button>

        <button
          onClick={() => setSelectedSim('pendulum')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedSim === 'pendulum'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">⚡</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedSim === 'pendulum' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              Physics Lab
            </span>
          </div>
          <h3 className="font-black text-sm">Mechanical Energy Dynamics</h3>
        </button>
      </div>

      {/* Active Simulation Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {selectedSim === 'calculus' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Calculus 3D Coordinate Laboratory
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Multivariable Surface & Tangent Slope (f(x, y) = x² + y²)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Explore partial derivatives and tangent planes across a 3D parabolic coordinate grid.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  X Coordinate: {calcX.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 3D Wireframe / Coordinate View Simulation Canvas */}
            <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between text-white shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

              {/* 3D Grid Overlay Header */}
              <div className="z-10 flex items-center justify-between text-xs font-mono text-indigo-300">
                <span className="bg-indigo-500/20 px-3 py-1 rounded-md border border-indigo-500/30 font-bold">
                  3D Coordinate System (X, Y, Z)
                </span>
                <span>f(x,y) = x² + y² (Paraboloid Well)</span>
              </div>

              {/* Visual 3D Surface Simulation Box */}
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

                {/* 3D Simulated Paraboloid Curve Visualization */}
                <div className="relative h-48 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-900/50 flex items-center justify-center p-4">
                  <div className="absolute inset-x-4 bottom-8 h-24 flex items-end justify-center">
                    {/* Simulated Parabola curve */}
                    <div className="w-full h-full relative flex items-center justify-center">
                      <div className="absolute inset-x-0 bottom-0 h-px bg-slate-700" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700" />
                      
                      {/* Curve visual using SVG */}
                      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 200 100">
                        <path
                          d="M 20 80 Q 100 10 180 80"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />
                        {/* Interactive probe point */}
                        <circle
                          cx={100 + calcX * 25}
                          cy={80 - Math.pow(calcX, 2) * 8}
                          r="6"
                          className="fill-amber-400 stroke-white stroke-2 transition-all duration-75"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400">
                    Interactive 3D Paraboloid Slice
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="z-10 text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
                <span>First-Principles Derivative Slope Visualization</span>
                <span className="text-indigo-400 font-semibold">Move slider to inspect tangent behavior</span>
              </div>
            </div>
          </div>
        )}

        {selectedSim === 'gradient' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  AI & Machine Learning 3D Optimizer
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Gradient Descent Loss Surface & Learning Rate Convergence
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tune hyperparameter learning rate alpha and observe step trajectory across a 3D convex loss bowl.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  Learning Rate α: {gdRate}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between text-white shadow-inner">
              <div className="my-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Optimizer Metrics</div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Epoch / Step:</span>
                      <span className="text-purple-400 font-bold">{gdEpoch}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Current Loss L(w):</span>
                      <span className="text-amber-400 font-bold">{(Math.max(0.01, 2.5 - gdRate * gdEpoch)).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Convergence Status:</span>
                      <span className="text-emerald-400 font-bold">{gdRate > 0.8 ? 'Overshooting / Diverging ⚠️' : 'Converging to Minimum 🚀'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Learning Rate (α)</span>
                      <span className="font-mono text-purple-300">{gdRate}</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.9"
                      step="0.02"
                      value={gdRate}
                      onChange={(e) => setGdRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                {/* 3D Loss Well Representation */}
                <div className="relative h-48 rounded-xl bg-gradient-to-b from-purple-950/60 to-slate-900 border border-purple-900/50 flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <div className="text-xs font-bold text-purple-300 uppercase tracking-widest">3D Loss Basin</div>
                    <div className="text-2xl font-mono font-black text-amber-400">
                      w* = {(2.5 - gdRate * gdEpoch).toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {gdRate > 0.5 ? 'High learning rate causes steep oscillations around global minimum.' : 'Optimal step size smoothly descends toward the loss minimum.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="z-10 text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
                <span>Convex Optimization Simulator</span>
                <span className="text-purple-400 font-semibold">Interactive Gradient Descent</span>
              </div>
            </div>
          </div>
        )}

        {selectedSim === 'chemistry' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Organic Chemistry Virtual Lab
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  SN2 Bimolecular Substitution & Stereochemical Inversion
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visualize backside nucleophilic attack (180°) and tetrahedral Walden inversion in real time.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  Reaction Phase: {chemPhase === 1 ? '1. Approach' : chemPhase === 2 ? '2. Transition State (Walden)' : '3. Inverted Product'}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between text-white shadow-inner">
              <div className="my-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Stereochemical State</div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Nucleophile Attack Angle:</span>
                      <span className="text-rose-400 font-bold">180° Backside</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Leaving Group Departure:</span>
                      <span className="text-amber-400 font-bold">Simultaneous (Concerted)</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Configuration:</span>
                      <span className="text-emerald-400 font-bold">{chemPhase === 3 ? 'Inverted (R ➔ S)' : 'Standard (R)'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant={chemPhase === 1 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setChemPhase(1)}
                      className="text-xs"
                    >
                      1. Approach
                    </Button>
                    <Button
                      variant={chemPhase === 2 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setChemPhase(2)}
                      className="text-xs"
                    >
                      2. Transition State
                    </Button>
                    <Button
                      variant={chemPhase === 3 ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setChemPhase(3)}
                      className="text-xs"
                    >
                      3. Inverted Product
                    </Button>
                  </div>
                </div>

                {/* 3D Molecular Orbital Visualization */}
                <div className="relative h-48 rounded-xl bg-gradient-to-b from-rose-950/60 to-slate-900 border border-rose-900/50 flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <div className="text-xs font-bold text-rose-300 uppercase tracking-widest">HOMO-LUMO Frontier Orbitals</div>
                    <div className="text-lg font-black text-white">
                      {chemPhase === 1 && 'Nu⁻ approaching C-X bond from 180°'}
                      {chemPhase === 2 && 'Trigonal bipyramidal transition state'}
                      {chemPhase === 3 && 'Umbrella inverted tetrahedral product'}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Bimolecular nucleophilic substitution proceeds in a single concerted step with complete stereochemical inversion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="z-10 text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
                <span>Organic Chemistry Virtual Lab</span>
                <span className="text-rose-400 font-semibold">Walden Inversion Model</span>
              </div>
            </div>
          </div>
        )}

        {selectedSim === 'pendulum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Physics Mechanics Laboratory
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Mechanical Energy Conservation & Phase Space Dynamics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Inspect the interconversion between potential energy (mgh) and kinetic energy (½mv²) in frictionless motion.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  Amplitude: {angleTheta}°
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-6 flex flex-col justify-between text-white shadow-inner">
              <div className="my-auto z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">Energy Breakdown</div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Potential Energy (U):</span>
                      <span className="text-amber-400 font-bold">{(100 * (1 - Math.cos((angleTheta * Math.PI) / 180))).toFixed(1)} J</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Kinetic Energy (K):</span>
                      <span className="text-emerald-400 font-bold">{(100 * Math.cos((angleTheta * Math.PI) / 180)).toFixed(1)} J</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span>Total Mechanical Energy:</span>
                      <span className="text-indigo-400 font-bold">100.0 J (Conserved)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Release Angle (θ)</span>
                      <span className="font-mono text-amber-300">{angleTheta}°</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="85"
                      step="5"
                      value={angleTheta}
                      onChange={(e) => setAngleTheta(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                <div className="relative h-48 rounded-xl bg-gradient-to-b from-amber-950/60 to-slate-900 border border-amber-900/50 flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">Harmonic Oscillator</div>
                    <div className="text-xl font-black text-white">
                      E = U + K = Constant
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Total mechanical energy remains rigorously invariant in the absence of non-conservative damping forces.
                    </p>
                  </div>
                </div>
              </div>

              <div className="z-10 text-[11px] text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
                <span>Physics Virtual Lab</span>
                <span className="text-amber-400 font-semibold">Energy Conservation Invariance</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
