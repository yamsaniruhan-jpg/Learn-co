import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FormattedMathText } from '../common/FormattedMathText';

function logGammaApprox(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z - 1 + i);
  const t = z - 1 + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z - 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPdf(x: number, a: number, b: number): number {
  if (x <= 0.001 || x >= 0.999) return 0;
  const logBeta = logGammaApprox(a) + logGammaApprox(b) - logGammaApprox(a + b);
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta);
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-0.5 * z * z);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + 1.330274 * t))));
  return z > 0 ? 1 - p : p;
}

export const DataScienceBayesROCLab: React.FC = () => {
  const [labMode, setLabMode] = useState<'bayes' | 'roc'>('bayes');
  // Bayes Beta-Binomial state
  const [alpha0, setAlpha0] = useState<number>(2);
  const [beta0, setBeta0] = useState<number>(2);
  const [successes, setSuccesses] = useState<number>(14);
  const [trials, setTrials] = useState<number>(20);

  // ROC Threshold state
  const [threshold, setThreshold] = useState<number>(0.5);
  const [separation, setSeparation] = useState<number>(1.8);

  const postAlpha = alpha0 + successes;
  const postBeta = beta0 + Math.max(0, trials - successes);

  const bayesSvg = useMemo(() => {
    const priorPts: string[] = [];
    const postPts: string[] = [];
    let maxVal = 1.5;
    const samples: Array<{ x: number; p0: number; p1: number }> = [];
    for (let i = 1; i < 60; i++) {
      const p = i / 60;
      const y0 = betaPdf(p, alpha0, beta0);
      const y1 = betaPdf(p, postAlpha, postBeta);
      maxVal = Math.max(maxVal, y0, y1);
      samples.push({ x: p, p0: y0, p1: y1 });
    }
    for (const s of samples) {
      const sx = 35 + s.x * 395;
      const py0 = 160 - (s.p0 / maxVal) * 130;
      const py1 = 160 - (s.p1 / maxVal) * 130;
      priorPts.push(`${sx.toFixed(1)},${py0.toFixed(1)}`);
      postPts.push(`${sx.toFixed(1)},${py1.toFixed(1)}`);
    }
    const postMean = postAlpha / (postAlpha + postBeta);
    const std = Math.sqrt((postAlpha * postBeta) / (Math.pow(postAlpha + postBeta, 2) * (postAlpha + postBeta + 1)));
    return { priorPts: priorPts.join(' '), postPts: postPts.join(' '), postMean, std };
  }, [alpha0, beta0, postAlpha, postBeta]);

  // ROC confusion metrics (100 negatives, 100 positives centered at 0 and separation)
  const rocStats = useMemo(() => {
    const zThreshold = (threshold - 0.5) * 4; // map [0.1, 0.9] -> [-1.6, 1.6]
    const tpr = 1 - normalCdf(zThreshold - separation * 0.5);
    const fpr = 1 - normalCdf(zThreshold + separation * 0.5);
    const tp = Math.round(tpr * 100);
    const fn = 100 - tp;
    const fp = Math.round(fpr * 100);
    const tn = 100 - fp;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tpr;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const aucApprox = normalCdf(separation / Math.SQRT2);

    const curvePts: string[] = [];
    for (let z = -3.5; z <= 3.5; z += 0.25) {
      const cFpr = 1 - normalCdf(z + separation * 0.5);
      const cTpr = 1 - normalCdf(z - separation * 0.5);
      curvePts.push(`${(40 + cFpr * 180).toFixed(1)},${(160 - cTpr * 135).toFixed(1)}`);
    }
    return { tpr, fpr, tp, fn, fp, tn, precision, recall, f1, aucApprox, curvePts: curvePts.join(' ') };
  }, [threshold, separation]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Data Science &amp; Statistics Virtual Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Bayesian Conjugate Updater &amp; ROC Classification Threshold Lab
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualize conjugate Beta priors collapsing toward evidence or slide decision boundaries to inspect Confusion Matrix precision/recall tradeoffs.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLabMode('bayes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              labMode === 'bayes' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Bayesian Beta
          </button>
          <button
            type="button"
            onClick={() => setLabMode('roc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              labMode === 'roc' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ROC &amp; Confusion Matrix
          </button>
        </div>
      </div>

      {labMode === 'bayes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Prior α₀</span>
                  <span className="font-mono tabular-nums text-teal-600">{alpha0}</span>
                </div>
                <input type="range" min="1" max="15" value={alpha0} onChange={(e) => setAlpha0(Number(e.target.value))} className="w-full h-2 accent-teal-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Prior β₀</span>
                  <span className="font-mono tabular-nums text-teal-600">{beta0}</span>
                </div>
                <input type="range" min="1" max="15" value={beta0} onChange={(e) => setBeta0(Number(e.target.value))} className="w-full h-2 accent-teal-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Observed Trials (N)</span>
                  <span className="font-mono tabular-nums text-indigo-600">{trials}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={trials}
                  onChange={(e) => {
                    const nextT = Number(e.target.value);
                    setTrials(nextT);
                    if (successes > nextT) setSuccesses(nextT);
                  }}
                  className="w-full h-2 accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Successes (k)</span>
                  <span className="font-mono tabular-nums text-indigo-600">{successes}</span>
                </div>
                <input type="range" min="0" max={trials} value={successes} onChange={(e) => setSuccesses(Number(e.target.value))} className="w-full h-2 accent-indigo-600" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Posterior Beta(α, β):</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">Beta({postAlpha}, {postBeta})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Posterior Mean E[θ]:</span>
                <span className="font-bold tabular-nums">{bayesSvg.postMean.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">95% Credible Approx:</span>
                <span className="font-bold tabular-nums">
                  [{(bayesSvg.postMean - 1.96 * bayesSvg.std).toFixed(2)}, {(bayesSvg.postMean + 1.96 * bayesSvg.std).toFixed(2)}]
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between text-white">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-teal-300">Dashed: Prior Beta(α₀, β₀) · Solid: Posterior</span>
              <span className="text-slate-400">θ ∈ [0, 1]</span>
            </div>
            <svg viewBox="0 0 460 185" className="w-full h-56 my-2">
              <line x1="35" y1="160" x2="430" y2="160" stroke="#475569" strokeWidth="1.5" />
              <polyline points={bayesSvg.priorPts} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <polyline points={bayesSvg.postPts} fill="none" stroke="#2dd4bf" strokeWidth="3" />
              <text x="35" y="176" fill="#94a3b8" fontSize="10" fontFamily="monospace">0.0</text>
              <text x="225" y="176" fill="#94a3b8" fontSize="10" fontFamily="monospace">0.5</text>
              <text x="415" y="176" fill="#94a3b8" fontSize="10" fontFamily="monospace">1.0</text>
            </svg>
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <FormattedMathText text="$$P(\theta \mid k, N) \propto \theta^{\alpha_0 + k - 1}(1-\theta)^{\beta_0 + N - k - 1}$$" />
              <button
                type="button"
                onClick={() => { setAlpha0(2); setBeta0(2); setTrials(20); setSuccesses(14); }}
                className="text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Decision Threshold τ</span>
                  <span className="font-mono tabular-nums text-teal-600">{threshold.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="0.9" step="0.05" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full h-2 accent-teal-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Class Separation d&apos;</span>
                  <span className="font-mono tabular-nums text-indigo-600">{separation.toFixed(1)} σ</span>
                </div>
                <input type="range" min="0.4" max="3.2" step="0.2" value={separation} onChange={(e) => setSeparation(Number(e.target.value))} className="w-full h-2 accent-indigo-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] text-slate-500">TP (Pos Correct)</div>
                <div className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">{rocStats.tp}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <div className="text-[10px] text-slate-500">FP (False Alarm)</div>
                <div className="text-lg font-black tabular-nums text-rose-700 dark:text-rose-300">{rocStats.fp}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] text-slate-500">FN (Missed Pos)</div>
                <div className="text-lg font-black tabular-nums text-amber-700 dark:text-amber-300">{rocStats.fn}</div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                <div className="text-[10px] text-slate-500">TN (Neg Correct)</div>
                <div className="text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{rocStats.tn}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-teal-300">ROC Curve (AUC ≈ {rocStats.aucApprox.toFixed(3)})</span>
              <span className="text-slate-300">
                Precision {(rocStats.precision * 100).toFixed(0)}% · Recall {(rocStats.recall * 100).toFixed(0)}% · F1 {rocStats.f1.toFixed(2)}
              </span>
            </div>
            <svg viewBox="0 0 260 185" className="w-full h-56 my-2">
              <rect x="40" y="25" width="180" height="135" fill="#0f172a" stroke="#334155" />
              <line x1="40" y1="160" x2="220" y2="25" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
              <polyline points={rocStats.curvePts} fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
              <circle cx={40 + rocStats.fpr * 180} cy={160 - rocStats.tpr * 135} r="5.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
              <text x="95" y="176" fill="#94a3b8" fontSize="10" fontFamily="monospace">FPR = {rocStats.fpr.toFixed(2)}</text>
              <text x="6" y="95" fill="#94a3b8" fontSize="10" fontFamily="monospace">TPR</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
