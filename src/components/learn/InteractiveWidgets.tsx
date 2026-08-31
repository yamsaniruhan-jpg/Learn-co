import React, { useState, useEffect } from 'react';
import { InteractiveWidgetType } from '../../types/curriculum';
import { Play, RotateCcw, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface InteractiveWidgetProps {
  type: InteractiveWidgetType;
}

export const InteractiveWidgets: React.FC<InteractiveWidgetProps> = ({ type }) => {
  switch (type) {
    case 'sign_chart':
      return <SignChartWidget />;
    case 'gradient_descent':
      return <GradientDescentWidget />;
    case 'energy_conservation':
      return <EnergyConservationWidget />;
    case 'sn2_inversion':
      return <SN2InversionWidget />;
    case 'dna_transcription':
      return <DNATranscriptionWidget />;
    case 'vector_projection':
    default:
      return <VectorProjectionWidget />;
  }
};

/**
 * 1. Calculus Sign Chart & Monotonicity Simulator
 */
const SignChartWidget: React.FC = () => {
  const [testPoint, setTestPoint] = useState<number>(1.5);

  // f'(x) = 6(x - 1)(x - 2) = 6x^2 - 18x + 12
  const slopeValue = 6 * (testPoint - 1) * (testPoint - 2);
  const isIncreasing = slopeValue > 0;
  const isDecreasing = slopeValue < 0;
  const isStationary = Math.abs(slopeValue) < 0.001;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-indigo-400">Interactive Derivative Sign Chart</h4>
          <p className="text-xs text-slate-400">Function: $f\'(x) = 6(x-1)(x-2)$</p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
            isIncreasing
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
              : isDecreasing
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
              : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
          }`}
        >
          {isIncreasing ? 'Strictly Increasing (Slope > 0)' : isDecreasing ? 'Strictly Decreasing (Slope < 0)' : 'Critical Point (Slope = 0)'}
        </span>
      </div>

      {/* Interactive Slider */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Test Point $x = {testPoint.toFixed(2)}$</span>
          <span className="font-mono text-indigo-300">$f\'({testPoint.toFixed(2)}) = {slopeValue.toFixed(2)}$</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="0.05"
          value={testPoint}
          onChange={(e) => setTestPoint(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Number Line Visualizer */}
      <div className="relative pt-6 pb-2">
        <div className="h-1.5 w-full bg-slate-700 rounded-full relative">
          {/* Critical Point 1 */}
          <div className="absolute left-[33.33%] -top-2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-950 flex items-center justify-center text-[9px] font-bold text-white">1</div>
            <span className="text-[10px] text-slate-400 mt-1">x = 1</span>
          </div>

          {/* Critical Point 2 */}
          <div className="absolute left-[66.66%] -top-2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-950 flex items-center justify-center text-[9px] font-bold text-white">2</div>
            <span className="text-[10px] text-slate-400 mt-1">x = 2</span>
          </div>

          {/* Active Probe Marker */}
          <div
            className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-75"
            style={{ left: `${(testPoint / 3) * 100}%` }}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold ${
                isIncreasing ? 'bg-emerald-500' : isDecreasing ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            >
              •
            </div>
          </div>
        </div>

        {/* Intervals Legend */}
        <div className="grid grid-cols-3 gap-2 mt-8 text-center text-xs">
          <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
            <span className="font-semibold">$(-\\infty, 1)$</span>
            <div className="text-[10px] text-emerald-400/80">Sign: $(+) \implies$ Inc</div>
          </div>
          <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
            <span className="font-semibold">$(1, 2)$</span>
            <div className="text-[10px] text-rose-400/80">Sign: $(-) \implies$ Dec</div>
          </div>
          <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
            <span className="font-semibold">$(2, \\infty)$</span>
            <div className="text-[10px] text-emerald-400/80">Sign: $(+) \implies$ Inc</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Gradient Descent & Learning Rate Convergence Simulator
 */
const GradientDescentWidget: React.FC = () => {
  const [learningRate, setLearningRate] = useState<number>(0.15);
  const [currentTheta, setCurrentTheta] = useState<number>(0.0);
  const [stepHistory, setStepHistory] = useState<number[]>([0.0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Convex loss: L(theta) = (theta - 2)^2 + 1 => grad = 2*(theta - 2)
  const computeGrad = (th: number) => 2 * (th - 2);
  const currentLoss = Math.pow(currentTheta - 2, 2) + 1;

  const takeStep = () => {
    const grad = computeGrad(currentTheta);
    const nextTheta = currentTheta - learningRate * grad;
    setCurrentTheta(nextTheta);
    setStepHistory((prev) => [...prev.slice(-8), nextTheta]);
  };

  const reset = () => {
    setCurrentTheta(0.0);
    setStepHistory([0.0]);
    setIsRunning(false);
  };

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        takeStep();
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentTheta, learningRate]);

  const isDiverging = Math.abs(currentTheta) > 10;
  const isOptimal = Math.abs(currentTheta - 2) < 0.05;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-amber-400">Gradient Descent Step Simulator</h4>
          <p className="text-xs text-slate-400">Target Loss: $L(\\theta) = (\\theta - 2)^2 + 1$ (Optimum at $\\theta^* = 2$)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Play className="w-3 h-3" /> {isRunning ? 'Pause' : 'Auto Step'}
          </button>
          <button
            onClick={reset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Learning Rate $\\eta$: {learningRate.toFixed(2)}</span>
            <span className={learningRate > 0.9 ? 'text-rose-400 font-bold' : 'text-amber-300'}>
              {learningRate > 0.9 ? 'Overshooting risk!' : 'Stable'}
            </span>
          </div>
          <input
            type="range"
            min="0.02"
            max="1.1"
            step="0.02"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">Current Parameter $\\theta$</div>
            <div className="text-base font-mono font-bold text-amber-400">{currentTheta.toFixed(3)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">Loss $L(\\theta)$</div>
            <div className="text-sm font-mono text-slate-200">{currentLoss.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* Visual representation */}
      <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-xs">
        <div className="text-slate-400 mb-2 flex items-center justify-between">
          <span>Convergence Path:</span>
          {isOptimal && (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Converged at Optimum ($\theta = 2$)
            </span>
          )}
          {isDiverging && (
            <span className="text-rose-400 font-semibold">Diverged! $\eta$ too large ($&gt; 2/L$).</span>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {stepHistory.map((val, idx) => (
            <div key={idx} className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                idx === stepHistory.length - 1 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {val.toFixed(2)}
              </span>
              {idx < stepHistory.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Physics Energy Conservation & Invariants Simulator
 */
const EnergyConservationWidget: React.FC = () => {
  const [dropHeight, setDropHeight] = useState<number>(5);
  const [mass] = useState<number>(2);
  const [k] = useState<number>(400);

  // Compute maximum compression x from 200x^2 - 20x - 20h = 0 => 10x^2 - x - h = 0
  const discriminant = 1 + 4 * 10 * dropHeight;
  const maxCompression = (1 + Math.sqrt(discriminant)) / 20;
  const maxPotentialEnergy = mass * 10 * (dropHeight + maxCompression);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-sky-400">Vertical Spring Energy Invariant</h4>
          <p className="text-xs text-slate-400">Total Mechanical Energy E = K + Ug + Uspring = Constant</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
          k = 400 N/m, m = 2 kg
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Release Height h = {dropHeight} m</span>
          <span className="text-sky-300 font-mono">Max Compression x = {maxCompression.toFixed(3)} m</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={dropHeight}
          onChange={(e) => setDropHeight(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
      </div>

      {/* Energy Partition Bar */}
      <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs">
        <div className="flex justify-between text-slate-400 mb-2">
          <span>Total Mechanical Energy Accounting</span>
          <span className="font-mono text-slate-200">{maxPotentialEnergy.toFixed(1)} Joules</span>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full flex overflow-hidden">
          <div className="bg-sky-500 h-full" style={{ width: '50%' }} title="Gravitational U_g" />
          <div className="bg-emerald-500 h-full" style={{ width: '50%' }} title="Spring Elastic U_s" />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-2">
          <span className="text-sky-400">• Gravitational Drop Work $mg(h+x)$</span>
          <span className="text-emerald-400">• Elastic Spring Storage $\frac{1}{2}kx^2$</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. Chemistry SN2 Walden Inversion & Stereochemistry
 */
const SN2InversionWidget: React.FC = () => {
  const [progress, setProgress] = useState<number>(0);

  const getPhaseName = () => {
    if (progress < 25) return '1. Reactants: (R)-2-Bromobutane + CN⁻ approaching backside';
    if (progress < 75) return '2. Transition State: Pentacoordinate [NC···C···Br]⁻ (Inversion point)';
    return '3. Inverted Product: (S)-2-Methylbutanenitrile + Br⁻ departed';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-emerald-400">SN2 Concerted Walden Inversion Simulator</h4>
          <p className="text-xs text-slate-400">Concerted single-step backside orbital attack</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
          {progress === 100 ? '100% Inversion Complete' : 'Reaction in Progress'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Reaction Coordinate: {progress}%</span>
          <span className="text-emerald-300">{getPhaseName()}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Visual Umbrella Representation */}
      <div className="bg-slate-950 p-4 rounded border border-slate-800 flex items-center justify-around text-center text-xs">
        <div className={`p-3 rounded border transition-all ${
          progress < 40 ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 text-slate-500'
        }`}>
          <div className="font-bold text-sm">(R) Geometry</div>
          <div className="text-[11px]">Leaving group at front</div>
        </div>

        <ArrowRight className="w-5 h-5 text-slate-600" />

        <div className={`p-3 rounded border transition-all ${
          progress >= 40 && progress <= 70 ? 'border-amber-500 bg-amber-950/40 text-amber-300' : 'border-slate-800 text-slate-500'
        }`}>
          <div className="font-bold text-sm">[NC···C···Br]‡</div>
          <div className="text-[11px]">Planar Transition State</div>
        </div>

        <ArrowRight className="w-5 h-5 text-slate-600" />

        <div className={`p-3 rounded border transition-all ${
          progress > 70 ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 text-slate-500'
        }`}>
          <div className="font-bold text-sm">(S) Inverted</div>
          <div className="text-[11px]">100% Walden Inversion</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. Biology Central Dogma DNA Transcription Widget
 */
const DNATranscriptionWidget: React.FC = () => {
  const [dnaSeq] = useState<string>('3\'- TAC GGC TTA ATT - 5\'');
  const [isTranscribed, setIsTranscribed] = useState<boolean>(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-rose-400">Central Dogma: Directional RNA Transcription</h4>
          <p className="text-xs text-slate-400">Antiparallel $5\' \to 3\'$ RNA synthesis</p>
        </div>
        <button
          onClick={() => setIsTranscribed(!isTranscribed)}
          className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-xs transition-colors"
        >
          {isTranscribed ? 'Reset' : 'Transcribe Strand'}
        </button>
      </div>

      <div className="space-y-3 text-xs font-mono">
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-sans mb-0.5">DNA Template Strand ($3\' \to 5\'$)</div>
          <div className="text-sm text-slate-300 tracking-wider">{dnaSeq}</div>
        </div>

        {isTranscribed && (
          <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/40">
            <div className="text-[10px] text-rose-400 uppercase font-sans mb-0.5">Synthesized mRNA Transcript ($5\' \to 3\'$)</div>
            <div className="text-sm text-rose-300 tracking-wider">5'- AUG CCG AAU UAA - 3'</div>
          </div>
        )}

        {isTranscribed && (
          <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40">
            <div className="text-[10px] text-emerald-400 uppercase font-sans mb-0.5">Translated Amino Acid Polypeptide ($N \to C$)</div>
            <div className="text-sm text-emerald-300 tracking-wider">Met — Pro — Asn — [STOP]</div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 6. Vector Projection Widget
 */
const VectorProjectionWidget: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 text-xs">
      <h4 className="text-sm font-semibold text-indigo-400 mb-2">Linear Transformation Invariant</h4>
      <p className="text-slate-400 mb-3">Eigenvectors $v$ satisfy $Av = \lambda v$, representing invariant axes where matrix $A$ acts as pure scalar scaling.</p>
      <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-center text-indigo-300">
        $\det(A - \lambda I) = 0 \implies \lambda_1, \lambda_2 \dots \lambda_n$
      </div>
    </div>
  );
};
