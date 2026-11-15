import React, { useMemo, useState } from 'react';
import { Flame, RotateCcw, Sliders } from 'lucide-react';
import { FormattedMathText } from '../common/FormattedMathText';

const R_GAS = 8.314;
const FARADAY = 96485;

export const ChemistryElectroEquilibriumLab: React.FC = () => {
  const [deltaHKJ, setDeltaHKJ] = useState<number>(42); // kJ/mol (+ endo, - exo)
  const [tempK, setTempK] = useState<number>(320); // 250 .. 450 K
  const [eStandard, setEStandard] = useState<number>(1.10); // Zn/Cu standard 1.10 V
  const [nElectrons, setNElectrons] = useState<number>(2);
  const [log10Q, setLog10Q] = useState<number>(0); // log10([Products]/[Reactants])

  // Anchor K(298.15 K) = 1.0 for Van 't Hoff curve
  const metrics = useMemo(() => {
    const tRef = 298.15;
    const lnK = (-deltaHKJ * 1000 / R_GAS) * (1 / tempK - 1 / tRef);
    const kEq = Math.exp(lnK);
    const qVal = Math.pow(10, log10Q);
    const eCell = eStandard - ((R_GAS * tempK) / (nElectrons * FARADAY)) * Math.log(qVal);
    const deltaGKJ = (-nElectrons * FARADAY * eCell) / 1000;
    const spontaneous = eCell > 0;
    return { lnK, kEq, qVal, eCell, deltaGKJ, spontaneous };
  }, [deltaHKJ, tempK, eStandard, nElectrons, log10Q]);

  const vantHoffCurve = useMemo(() => {
    const tRef = 298.15;
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const invT = 1 / 450 + (i / 40) * (1 / 250 - 1 / 450); // right = colder (higher 1/T)
      const lnKVal = (-deltaHKJ * 1000 / R_GAS) * (invT - 1 / tRef);
      const clampedLnK = Math.max(-12, Math.min(12, lnKVal));
      const x = 35 + (i / 40) * 390;
      const y = 95 - (clampedLnK / 12) * 70;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const curInvT = 1 / tempK;
    const curFrac = (curInvT - 1 / 450) / (1 / 250 - 1 / 450);
    const curX = 35 + curFrac * 390;
    const curLnKClamped = Math.max(-12, Math.min(12, metrics.lnK));
    const curY = 95 - (curLnKClamped / 12) * 70;
    return { pts: pts.join(' '), curX, curY };
  }, [deltaHKJ, tempK, metrics.lnK]);

  const resetAll = () => {
    setDeltaHKJ(42);
    setTempK(320);
    setEStandard(1.10);
    setNElectrons(2);
    setLog10Q(0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            IChO Thermodynamics &amp; Electrochemistry Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Van &apos;t Hoff Temperature Shift &amp; Nernst Galvanic Cell Simulator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adjust enthalpy ΔH°, temperature T, and reaction quotient Q to inspect equilibrium shifts and real-time cell potential E_cell.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Cell
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Reaction Enthalpy ΔH°
                </span>
                <span className={`font-mono tabular-nums ${deltaHKJ >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {deltaHKJ >= 0 ? `+${deltaHKJ}` : deltaHKJ} kJ/mol
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="3"
                value={deltaHKJ}
                onChange={(e) => setDeltaHKJ(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-slate-200 dark:bg-slate-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Exothermic (-90)</span>
                <span>Endothermic (+90)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Temperature T</span>
                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">{tempK} K</span>
              </div>
              <input
                type="range"
                min="250"
                max="450"
                step="5"
                value={tempK}
                onChange={(e) => setTempK(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 bg-slate-200 dark:bg-slate-700"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Quotient log₁₀(Q)
                </span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  10^{log10Q}
                </span>
              </div>
              <input
                type="range"
                min="-6"
                max="12"
                step="1"
                value={log10Q}
                onChange={(e) => setLog10Q(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">E°_cell (V)</label>
                <select
                  value={eStandard}
                  onChange={(e) => setEStandard(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                >
                  <option value={1.10}>1.10 V (Zn/Cu)</option>
                  <option value={0.76}>0.76 V (Zn/H₂)</option>
                  <option value={1.56}>1.56 V (Zn/Ag⁺)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Electrons (n)</label>
                <select
                  value={nElectrons}
                  onChange={(e) => setNElectrons(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                >
                  <option value={1}>n = 1 e⁻</option>
                  <option value={2}>n = 2 e⁻</option>
                  <option value={3}>n = 3 e⁻</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">E_cell (Nernst):</span>
              <span className={`font-bold tabular-nums ${metrics.spontaneous ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {metrics.eCell.toFixed(3)} V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ΔG = -nFE_cell:</span>
              <span className="font-bold tabular-nums">{metrics.deltaGKJ.toFixed(1)} kJ/mol</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">K(T) / K(298K):</span>
              <span className="font-bold tabular-nums">{metrics.kEq.toExponential(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Direction:</span>
              <span className="font-bold">
                {metrics.spontaneous ? 'Spontaneous Forward' : 'Reverse Driven'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          {/* Galvanic Cell Schematic */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-white">
            <div className="flex items-center justify-between text-xs font-mono text-amber-300 mb-2">
              <span>Galvanic Cell Potential Readout</span>
              <span>Voltmeter: {metrics.eCell.toFixed(3)} V</span>
            </div>
            <svg viewBox="0 0 460 155" className="w-full h-36">
              {/* Anode Beaker */}
              <rect x="40" y="60" width="120" height="80" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="82" y="40" width="16" height="85" fill="#94a3b8" />
              <text x="58" y="132" fill="#94a3b8" fontSize="10" fontFamily="monospace">Anode (Oxidation)</text>

              {/* Cathode Beaker */}
              <rect x="300" y="60" width="120" height="80" rx="8" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
              <rect x="352" y="40" width="16" height="85" fill="#d97706" />
              <text x="315" y="132" fill="#7dd3fc" fontSize="10" fontFamily="monospace">Cathode (Reduction)</text>

              {/* Salt Bridge */}
              <path d="M 135 88 L 135 55 L 325 55 L 325 88" fill="none" stroke="#a855f7" strokeWidth="12" strokeLinecap="round" opacity="0.45" />
              <text x="195" y="72" fill="#e9d5ff" fontSize="10" fontFamily="monospace">Salt Bridge (KNO₃)</text>

              {/* Wire + Voltmeter */}
              <polyline points="90,40 90,18 205,18" fill="none" stroke="#eab308" strokeWidth="2.5" />
              <polyline points="255,18 360,18 360,40" fill="none" stroke="#eab308" strokeWidth="2.5" />
              <rect x="195" y="4" width="70" height="28" rx="6" fill="#0f172a" stroke={metrics.spontaneous ? '#10b981' : '#f43f5e'} strokeWidth="2" />
              <text x="206" y="22" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                {metrics.eCell.toFixed(2)}V
              </text>
              <text x="115" y="13" fill="#fde047" fontSize="10" fontFamily="monospace">
                {metrics.spontaneous ? 'e⁻ flow →' : '← e⁻ reverse'}
              </text>
            </svg>
          </div>

          {/* Van 't Hoff Plot */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
              <span className="font-mono text-sky-300">Van &apos;t Hoff Plot: ln(K) vs 1/T</span>
              <span className="font-mono text-slate-400">Slope = -ΔH° / R</span>
            </div>
            <svg viewBox="0 0 460 185" className="w-full h-40">
              <line x1="35" y1="95" x2="425" y2="95" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="35" y1="20" x2="35" y2="170" stroke="#475569" strokeWidth="1" />
              <polyline points={vantHoffCurve.pts} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx={vantHoffCurve.curX} cy={vantHoffCurve.curY} r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              <text x="42" y="172" fill="#94a3b8" fontSize="10" fontFamily="monospace">450 K (Hot)</text>
              <text x="365" y="172" fill="#94a3b8" fontSize="10" fontFamily="monospace">250 K (Cold)</text>
            </svg>
            <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <FormattedMathText text="$$E = E^\circ - \frac{RT}{nF}\ln Q$$" />
              <span className="font-mono text-amber-400">ln(K) = {metrics.lnK.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
