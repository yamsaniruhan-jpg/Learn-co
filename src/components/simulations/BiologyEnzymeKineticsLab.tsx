import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FormattedMathText } from '../common/FormattedMathText';

type InhibitorType = 'none' | 'competitive' | 'noncompetitive' | 'uncompetitive';

export const BiologyEnzymeKineticsLab: React.FC = () => {
  const [vmax, setVmax] = useState<number>(100); // uM/min
  const [km, setKm] = useState<number>(20); // uM
  const [inhibitorType, setInhibitorType] = useState<InhibitorType>('none');
  const [inhibitorRatio, setInhibitorRatio] = useState<number>(1.5); // [I]/Ki

  const params = useMemo(() => {
    const factor = 1 + inhibitorRatio;
    if (inhibitorType === 'competitive') {
      return { vmaxApp: vmax, kmApp: km * factor, note: 'Apparent Km increases; Vmax remains unchanged at high [S].' };
    }
    if (inhibitorType === 'noncompetitive') {
      return { vmaxApp: vmax / factor, kmApp: km, note: 'Apparent Vmax decreases; substrate binding affinity Km stays unchanged.' };
    }
    if (inhibitorType === 'uncompetitive') {
      return { vmaxApp: vmax / factor, kmApp: km / factor, note: 'Both Vmax and Km drop proportionally (parallel Lineweaver-Burk lines).' };
    }
    return { vmaxApp: vmax, kmApp: km, note: 'Baseline uninhibited Michaelis-Menten saturation kinetics.' };
  }, [vmax, km, inhibitorType, inhibitorRatio]);

  const curves = useMemo(() => {
    const maxS = 140;
    const basePts: string[] = [];
    const inhPts: string[] = [];
    for (let i = 0; i <= 45; i++) {
      const s = (i / 45) * maxS;
      const vBase = (vmax * s) / (km + s);
      const vInh = (params.vmaxApp * s) / (params.kmApp + s);
      const x = 40 + (s / maxS) * 400;
      const yBase = 165 - (vBase / 160) * 140;
      const yInh = 165 - (vInh / 160) * 140;
      basePts.push(`${x.toFixed(1)},${yBase.toFixed(1)}`);
      inhPts.push(`${x.toFixed(1)},${yInh.toFixed(1)}`);
    }
    const kmX = 40 + Math.min(1, params.kmApp / maxS) * 400;
    const halfVY = 165 - (params.vmaxApp / 2 / 160) * 140;
    return { basePts: basePts.join(' '), inhPts: inhPts.join(' '), kmX, halfVY };
  }, [vmax, km, params]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            IBHO &amp; IJSO Enzymology Virtual Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Michaelis-Menten Enzyme Kinetics &amp; Allosteric Inhibition
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare competitive, noncompetitive, and uncompetitive inhibition effects on apparent V_max and K_m.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setVmax(100); setKm(20); setInhibitorType('none'); setInhibitorRatio(1.5); }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Assay
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Baseline V_max</span>
                <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">{vmax} μM/min</span>
              </div>
              <input type="range" min="40" max="150" step="5" value={vmax} onChange={(e) => setVmax(Number(e.target.value))} className="w-full h-2 accent-rose-600" />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Baseline K_m</span>
                <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">{km} μM</span>
              </div>
              <input type="range" min="5" max="60" step="2" value={km} onChange={(e) => setKm(Number(e.target.value))} className="w-full h-2 accent-rose-600" />
            </div>

            <div>
              <span className="text-xs font-bold block mb-1.5">Inhibition Mechanism</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['none', 'competitive', 'noncompetitive', 'uncompetitive'] as InhibitorType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInhibitorType(t)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold capitalize border cursor-pointer ${
                      inhibitorType === t
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {inhibitorType !== 'none' && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Inhibitor Ratio [I]/K_i</span>
                  <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">{inhibitorRatio.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="4.0" step="0.25" value={inhibitorRatio} onChange={(e) => setInhibitorRatio(Number(e.target.value))} className="w-full h-2 accent-amber-600" />
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Apparent V_max:</span>
              <span className="font-bold tabular-nums text-rose-700 dark:text-rose-300">{params.vmaxApp.toFixed(1)} μM/min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Apparent K_m:</span>
              <span className="font-bold tabular-nums">{params.kmApp.toFixed(1)} μM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Catalytic Efficiency Ratio:</span>
              <span className="font-bold tabular-nums">{(params.vmaxApp / params.kmApp).toFixed(2)} min⁻¹</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-rose-300">Velocity v₀ vs Substrate [S]</span>
            <span className="text-slate-400">Dashed: Baseline · Solid: Active Assay</span>
          </div>

          <svg viewBox="0 0 460 190" className="w-full h-56 my-2">
            <line x1="40" y1="165" x2="440" y2="165" stroke="#475569" strokeWidth="1.5" />
            <line x1="40" y1="15" x2="40" y2="165" stroke="#475569" strokeWidth="1.5" />

            {/* Baseline dashed curve */}
            <polyline points={curves.basePts} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5 4" />
            {/* Active solid curve */}
            <polyline points={curves.inhPts} fill="none" stroke="#fb7185" strokeWidth="3" />

            {/* Half Vmax marker */}
            <line x1="40" y1={curves.halfVY} x2={curves.kmX} y2={curves.halfVY} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1" />
            <line x1={curves.kmX} y1={curves.halfVY} x2={curves.kmX} y2="165" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx={curves.kmX} cy={curves.halfVY} r="4.5" fill="#38bdf8" />
            <text x={Math.min(365, curves.kmX + 6)} y={curves.halfVY - 6} fill="#7dd3fc" fontSize="10" fontFamily="monospace">
              (K_m^app, V_max^app/2)
            </text>
            <text x="200" y="182" fill="#94a3b8" fontSize="10" fontFamily="monospace">Substrate [S] (0 → 140 μM)</text>
          </svg>

          <div className="border-t border-slate-800 pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <FormattedMathText text="$$v_0 = \frac{V_{\max}[S]}{K_m + [S]}$$" />
            <span className="text-slate-400">{params.note}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
