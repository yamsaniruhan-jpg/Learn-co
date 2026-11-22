import React, { useMemo, useState } from 'react';
import { Eye, Sparkles, Sliders, RotateCcw } from 'lucide-react';
import { FormattedMathText } from '../common/FormattedMathText';

function wavelengthToHex(nm: number): string {
  if (nm < 440) return '#8b5cf6';
  if (nm < 490) return '#3b82f6';
  if (nm < 510) return '#06b6d4';
  if (nm < 580) return '#10b981';
  if (nm < 645) return '#f59e0b';
  return '#ef4444';
}

export const PhysicsWaveOpticsLab: React.FC = () => {
  const [mode, setMode] = useState<'thin_film' | 'double_slit'>('thin_film');
  const [wavelengthNm, setWavelengthNm] = useState<number>(550);
  const [filmThicknessNm, setFilmThicknessNm] = useState<number>(200);
  const [n1, setN1] = useState<number>(1.0); // Air
  const [n2, setN2] = useState<number>(1.38); // MgF2 / Soap
  const [n3, setN3] = useState<number>(1.52); // Crown glass

  // Double-slit parameters
  const [slitSepUm, setSlitSepUm] = useState<number>(12);
  const [slitWidthUm, setSlitWidthUm] = useState<number>(3);
  const [screenDistCm, setScreenDistCm] = useState<number>(100);

  const beamColor = wavelengthToHex(wavelengthNm);

  const thinFilmMetrics = useMemo(() => {
    const shift1 = n2 > n1 ? 0.5 : 0; // wave phases in cycles
    const shift2 = n3 > n2 ? 0.5 : 0;
    const netPhaseReversalCycles = Math.abs(shift1 - shift2); // 0 or 0.5
    const opticalPathCycles = (2 * n2 * filmThicknessNm) / wavelengthNm;
    const totalPhaseCycles = opticalPathCycles + netPhaseReversalCycles;
    const fractional = totalPhaseCycles - Math.floor(totalPhaseCycles);
    const cosSq = Math.pow(Math.cos(Math.PI * totalPhaseCycles), 2);
    const stateLabel =
      cosSq > 0.88 ? 'Constructive Reflection' : cosSq < 0.12 ? 'Destructive Reflection (Anti-Reflective)' : 'Partial Interference';

    const mZeroMinDestructiveNm =
      netPhaseReversalCycles === 0.5
        ? wavelengthNm / (2 * n2)
        : wavelengthNm / (4 * n2);

    return {
      shift1Deg: shift1 * 360,
      shift2Deg: shift2 * 360,
      netReversal: netPhaseReversalCycles > 0,
      opticalPathNm: 2 * n2 * filmThicknessNm,
      orderM: opticalPathCycles.toFixed(2),
      reflectancePct: (cosSq * 100).toFixed(1),
      stateLabel,
      minAntiReflectiveNm: mZeroMinDestructiveNm.toFixed(1),
      fractional,
    };
  }, [n1, n2, n3, filmThicknessNm, wavelengthNm]);

  const fringePath = useMemo(() => {
    const pts: string[] = [];
    const width = 460;
    const baseLineY = 128;
    const maxAmp = 98;
    const lamUm = wavelengthNm / 1000;
    for (let i = 0; i <= 230; i++) {
      const u = i / 230; // 0 .. 1
      const yScreenMm = (u - 0.5) * 40; // -20mm to +20mm
      const sinTheta = (yScreenMm / 1000) / (screenDistCm / 100);
      const beta = (Math.PI * slitWidthUm * sinTheta) / lamUm;
      const delta = (Math.PI * slitSepUm * sinTheta) / lamUm;
      const singleEnvelope = Math.abs(beta) < 1e-4 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      const doubleInterference = Math.pow(Math.cos(delta), 2);
      const intensity = singleEnvelope * doubleInterference;
      const px = 20 + u * width;
      const py = baseLineY - intensity * maxAmp;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [wavelengthNm, slitSepUm, slitWidthUm, screenDistCm]);

  const fringeSpacingMm = useMemo(() => {
    const lamM = wavelengthNm * 1e-9;
    const dM = slitSepUm * 1e-6;
    const LM = screenDistCm * 1e-2;
    return ((lamM * LM) / dM) * 1000;
  }, [wavelengthNm, slitSepUm, screenDistCm]);

  const handleReset = () => {
    setWavelengthNm(550);
    setFilmThicknessNm(200);
    setN1(1.0);
    setN2(1.38);
    setN3(1.52);
    setSlitSepUm(12);
    setSlitWidthUm(3);
    setScreenDistCm(100);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            IPhO Wave Optics Virtual Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Thin-Film Phase Reversal &amp; Fraunhofer Double-Slit Interference
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect boundary 180° reflection phase shifts across optical media or observe diffraction-modulated fringe intensities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode('thin_film')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'thin_film'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Thin-Film Optics
            </button>
            <button
              type="button"
              onClick={() => setMode('double_slit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'double_slit'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Double-Slit Fringe
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Reset optics parameters"
            aria-label="Reset optics parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-500" />
                Wavelength λ
              </span>
              <span className="font-mono tabular-nums px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" style={{ color: beamColor }}>
                {wavelengthNm} nm
              </span>
            </div>
            <input
              type="range"
              min="390"
              max="700"
              step="5"
              value={wavelengthNm}
              onChange={(e) => setWavelengthNm(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {mode === 'thin_film' ? (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Film Thickness t</span>
                    <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">{filmThicknessNm} nm</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="600"
                    step="5"
                    value={filmThicknessNm}
                    onChange={(e) => setFilmThicknessNm(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-slate-200 dark:bg-slate-700"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">n₁ (Top)</label>
                    <select
                      value={n1}
                      onChange={(e) => setN1(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    >
                      <option value={1.0}>1.00 (Air)</option>
                      <option value={1.33}>1.33 (H₂O)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">n₂ (Film)</label>
                    <select
                      value={n2}
                      onChange={(e) => setN2(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    >
                      <option value={1.33}>1.33 (Soap)</option>
                      <option value={1.38}>1.38 (MgF₂)</option>
                      <option value={1.46}>1.46 (Oil)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">n₃ (Sub)</label>
                    <select
                      value={n3}
                      onChange={(e) => setN3(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    >
                      <option value={1.0}>1.00 (Air)</option>
                      <option value={1.52}>1.52 (Glass)</option>
                      <option value={1.65}>1.65 (Flint)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Optical Path 2n₂t:</span>
                  <span className="font-bold tabular-nums">{thinFilmMetrics.opticalPathNm.toFixed(0)} nm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Top / Bottom Phase Shift:</span>
                  <span className="font-bold tabular-nums">{thinFilmMetrics.shift1Deg}° / {thinFilmMetrics.shift2Deg}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Relative Reflectance:</span>
                  <span className="font-bold tabular-nums text-sky-700 dark:text-sky-300">{thinFilmMetrics.reflectancePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min Destructive t:</span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{thinFilmMetrics.minAntiReflectiveNm} nm</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Slit Separation d</span>
                    <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">{slitSepUm} μm</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    step="1"
                    value={slitSepUm}
                    onChange={(e) => setSlitSepUm(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-slate-200 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Slit Width a</span>
                    <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">{slitWidthUm} μm</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={slitWidthUm}
                    onChange={(e) => setSlitWidthUm(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-slate-200 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Screen Distance L</span>
                    <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">{screenDistCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={screenDistCm}
                    onChange={(e) => setScreenDistCm(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-sky-600 bg-slate-200 dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fringe Spacing Δy = λL/d:</span>
                  <span className="font-bold tabular-nums text-sky-700 dark:text-sky-300">{fringeSpacingMm.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Missing Orders (d / a):</span>
                  <span className="font-bold tabular-nums">{(slitSepUm / slitWidthUm).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Visualization Stage */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-950 border border-slate-800 p-5 flex flex-col justify-between text-white min-h-[340px]">
          {mode === 'thin_film' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-sky-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  Interference Regime: {thinFilmMetrics.stateLabel}
                </span>
                <span className="font-mono text-slate-400">
                  Phase Difference Δφ = {((2 * Math.PI * (2 * n2 * filmThicknessNm)) / wavelengthNm + (thinFilmMetrics.netReversal ? Math.PI : 0)).toFixed(2)} rad
                </span>
              </div>

              <svg viewBox="0 0 500 220" className="w-full h-56 my-2">
                {/* Top medium */}
                <rect x="20" y="10" width="460" height="58" fill="#0f172a" />
                <text x="32" y="32" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  Medium 1 (n₁ = {n1.toFixed(2)})
                </text>

                {/* Thin film layer */}
                <rect x="20" y="68" width="460" height="72" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="32" y="108" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                  Film (n₂ = {n2.toFixed(2)}, t = {filmThicknessNm} nm)
                </text>

                {/* Substrate */}
                <rect x="20" y="140" width="460" height="65" fill="#020617" />
                <text x="32" y="175" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  Substrate (n₃ = {n3.toFixed(2)})
                </text>

                {/* Incident ray */}
                <line x1="115" y1="15" x2="210" y2="68" stroke={beamColor} strokeWidth="3" />
                {/* Reflected ray 1 */}
                <line x1="210" y1="68" x2="305" y2="15" stroke={beamColor} strokeWidth="2.5" strokeDasharray={thinFilmMetrics.shift1Deg > 0 ? 'none' : '4 3'} />
                {/* Refracted + bottom reflected ray 2 */}
                <line x1="210" y1="68" x2="265" y2="140" stroke={beamColor} strokeWidth="2.5" opacity="0.85" />
                <line x1="265" y1="140" x2="320" y2="68" stroke={beamColor} strokeWidth="2.5" opacity="0.85" />
                <line x1="320" y1="68" x2="415" y2="15" stroke={beamColor} strokeWidth="2.5" />

                {/* Phase annotations */}
                <circle cx="210" cy="68" r="5" fill={thinFilmMetrics.shift1Deg > 0 ? '#f43f5e' : '#10b981'} />
                <text x="155" y="60" fill={thinFilmMetrics.shift1Deg > 0 ? '#fda4af' : '#6ee7b7'} fontSize="10" fontFamily="monospace">
                  {thinFilmMetrics.shift1Deg}° flip
                </text>
                <circle cx="265" cy="140" r="5" fill={thinFilmMetrics.shift2Deg > 0 ? '#f43f5e' : '#10b981'} />
                <text x="275" y="156" fill={thinFilmMetrics.shift2Deg > 0 ? '#fda4af' : '#6ee7b7'} fontSize="10" fontFamily="monospace">
                  {thinFilmMetrics.shift2Deg}° flip
                </text>
              </svg>

              <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <FormattedMathText text="$$2n_2 t = (m + \frac{1}{2})\lambda \text{ for net } \pi \text{ phase difference}$$" />
                <span className="font-mono text-sky-400 font-bold">Order m = {thinFilmMetrics.orderM}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Intensity I(θ) = I₀ cos²(δ) · sinc²(β)
                </span>
                <span className="font-mono text-slate-400">Screen Span: -20 mm to +20 mm</span>
              </div>

              <svg viewBox="0 0 500 175" className="w-full h-56 my-2">
                <line x1="20" y1="128" x2="480" y2="128" stroke="#334155" strokeWidth="1" />
                <line x1="250" y1="18" x2="250" y2="145" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <polyline points={fringePath} fill="none" stroke={beamColor} strokeWidth="2.5" />
                <text x="242" y="160" fill="#94a3b8" fontSize="10" fontFamily="monospace">0 mm</text>
                <text x="20" y="160" fill="#94a3b8" fontSize="10" fontFamily="monospace">-20 mm</text>
                <text x="445" y="160" fill="#94a3b8" fontSize="10" fontFamily="monospace">+20 mm</text>
              </svg>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Broad sinc²(β) single-slit envelope modulates cos²(δ) fringes</span>
                <span className="font-mono text-sky-400 font-bold">Δy = {fringeSpacingMm.toFixed(2)} mm</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
