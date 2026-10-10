import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, BookOpen, Layers, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';
import katex from 'katex';
import { cleanLatexToNormalText } from './FormattedMathText';

export interface FormulaInspectionData {
  latex: string;
  sourceContext?: string;
}

interface FormulaInspectorModalProps {
  formulaData: FormulaInspectionData | null;
  onClose: () => void;
  onAskCopilot?: (prompt: string) => void;
}

interface FormulaMetadata {
  name: string;
  domain: string;
  dimensionUnits?: string;
  invariantPrinciple: string;
  variableMap: Record<string, string>;
  keyTakeaway: string;
}

function analyzeFormula(latex: string): FormulaMetadata {
  const norm = latex.toLowerCase();

  if (norm.includes('e = mc') || norm.includes('e=mc')) {
    return {
      name: 'Mass-Energy Equivalence',
      domain: 'Special Relativity / Modern Physics',
      dimensionUnits: 'Joules (kg · m² · s⁻² | [M L² T⁻²])',
      invariantPrinciple: 'Invariance of the speed of light $c$ in all inertial reference frames.',
      variableMap: {
        'E': 'Rest-mass energy of the stationary particle',
        'm': 'Rest mass (invariant inertial mass)',
        'c': 'Speed of light in vacuum (~2.998 × 10⁸ m/s)',
      },
      keyTakeaway: 'Mass and energy are interchangeable manifestations of the same invariant four-momentum norm.',
    };
  }

  if (norm.includes('f\'(c) = 0') || norm.includes('df/dx') || norm.includes('\\nabla')) {
    return {
      name: 'Stationary State / Extremum Condition',
      domain: 'Multivariable Calculus & Optimization',
      dimensionUnits: 'Rate of change ([Units of f] / [Units of x])',
      invariantPrinciple: 'First variation vanishes at local extrema: δJ(u; v) = 0.',
      variableMap: {
        'f(x)': 'Objective functional or potential energy scalar field',
        '∇f': 'Gradient operator pointing toward steepest ascent',
        'c': 'Stationary equilibrium coordinate point',
      },
      keyTakeaway: 'A vanishing derivative is a necessary condition for local optimality, but requires second-order Hessian checking for stability.',
    };
  }

  if (norm.includes('\\int') || norm.includes('integral')) {
    return {
      name: 'Integral Conservation Accumulator',
      domain: 'Calculus & Continuous Systems',
      dimensionUnits: 'Accumulated Measure ([f] · [x])',
      invariantPrinciple: 'Fundamental Theorem of Calculus & Noether conservation laws.',
      variableMap: {
        '∫': 'Continuous Riemann / Lebesgue integral summation',
        'f(x)': 'Density or rate function being accumulated over domain Ω',
        'dx': 'Infinitesimal differential volume/length element',
      },
      keyTakeaway: 'Integrals quantify global invariants (total energy, probability, charge) from local continuous densities.',
    };
  }

  if (norm.includes('\\lambda') || norm.includes('eigen')) {
    return {
      name: 'Eigenvalue Characteristic Spectrum',
      domain: 'Linear Algebra & Quantum Mechanics',
      dimensionUnits: 'Observable Operator Spectrum',
      invariantPrinciple: 'Directional invariance under linear transformation: T(v) = λv.',
      variableMap: {
        'λ': 'Scalar eigenvalue / characteristic root',
        'v': 'Eigenvector / stationary state mode',
        'T': 'Linear transformation or Hermitian operator',
      },
      keyTakeaway: 'Eigenvalues represent the fundamental frequencies, energy levels, or principal expansion axes invariant under coordinate rotations.',
    };
  }

  return {
    name: 'Mathematical Invariant Expression',
    domain: 'Formal STEM Symbolic Representation',
    dimensionUnits: 'Dimensionally Consistent Formulation',
    invariantPrinciple: 'Conservation, algebraic symmetry, or dimensional balance.',
    variableMap: {
      'Variables': 'Symbolic parameters defining the physical or mathematical state space',
    },
    keyTakeaway: 'Focus on quantities that remain invariant when parameters are varied or transformed.',
  };
}

export const FormulaInspectorModal: React.FC<FormulaInspectorModalProps> = ({
  formulaData,
  onClose,
  onAskCopilot,
}) => {
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!formulaData) return null;

  const { latex } = formulaData;
  const normalText = cleanLatexToNormalText(latex);
  const meta = analyzeFormula(latex);

  let renderedHtml = '';
  try {
    renderedHtml = katex.renderToString(latex, {
      displayMode: true,
      throwOnError: false,
    });
  } catch {
    renderedHtml = `<code>${latex}</code>`;
  }

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(normalText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleConsultCopilot = () => {
    if (onAskCopilot) {
      onAskCopilot(`Can you explain the first principles, derivation, and boundary invariants for the equation: $${latex}$?`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{meta.name}</span>
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {meta.domain}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Main Equation Visual Showcase */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Symbolic Equation
            </span>
            <div
              className="py-2 overflow-x-auto text-lg sm:text-xl text-slate-900 dark:text-slate-100 font-serif"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyLatex}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedLatex ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedLatex ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
              </button>
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedText ? 'Copied Plain Text' : 'Copy Normal Text'}</span>
              </button>
            </div>
          </div>

          {/* Core Invariant & Dimensional Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                Governing Invariant
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                {meta.invariantPrinciple}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Dimensional Units
              </span>
              <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-snug">
                {meta.dimensionUnits}
              </p>
            </div>
          </div>

          {/* Variable Breakdown */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Parameter & Variable Decomposition
            </span>
            <div className="space-y-1.5">
              {Object.entries(meta.variableMap).map(([sym, def], i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                    {sym}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{def}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Pedagogical Takeaway */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              First-Principles Takeaway
            </span>
            <p className="text-[11px] text-slate-700 dark:text-slate-300">
              {meta.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          {onAskCopilot && (
            <button
              onClick={handleConsultCopilot}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Copilot About Invariant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
