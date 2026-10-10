import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormattedMathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
  interactiveInspect?: boolean;
  onInspectFormula?: (latex: string) => void;
}

/**
 * Converts raw LaTeX expressions and command sequences into human-readable normal text.
 */
export function cleanLatexToNormalText(input: string): string {
  if (!input) return '';
  let res = input;

  // Remove delimiter markers
  res = res.replace(/\$\$/g, '').replace(/\$/g, '');

  // Fractions & roots (handles nested depth 1-2)
  for (let iter = 0; iter < 3; iter++) {
    res = res.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    res = res.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, '$1√($2)');
    res = res.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  }

  // Common Blackboard & Mathcal
  res = res
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ')
    .replace(/\\mathbb\{C\}/g, 'ℂ')
    .replace(/\\mathcal\{L\}/g, 'ℒ')
    .replace(/\\mathcal\{H\}/g, 'ℋ')
    .replace(/\\mathcal\{O\}/g, '𝒪');

  // Text formatting commands
  res = res
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\mathsf\{([^}]+)\}/g, '$1')
    .replace(/\\underline\{([^}]+)\}/g, '$1');

  // Delimiter sizing
  res = res
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\{/g, '{')
    .replace(/\\right\\}/g, '}')
    .replace(/\\left|\\right/g, '');

  // Binary operators & relations
  res = res
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\equiv/g, ' ≡ ')
    .replace(/\\le(q)?/g, ' ≤ ')
    .replace(/\\ge(q)?/g, ' ≥ ')
    .replace(/\\ll/g, ' ≪ ')
    .replace(/\\gg/g, ' ≫ ')
    .replace(/\\propto/g, ' ∝ ')
    .replace(/\\infty/g, '∞')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\pm/g, '±');

  // Arrows & Logic
  res = res
    .replace(/\\rightarrow|\\to/g, ' → ')
    .replace(/\\leftarrow/g, ' ← ')
    .replace(/\\implies|\\Longrightarrow/g, ' ⟹ ')
    .replace(/\\iff|\\Longleftrightarrow/g, ' ⟺ ')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\in/g, ' ∈ ')
    .replace(/\\notin/g, ' ∉ ')
    .replace(/\\subset/g, ' ⊂ ')
    .replace(/\\cup/g, ' ∪ ')
    .replace(/\\cap/g, ' ∩ ')
    .replace(/\\emptyset/g, '∅');

  // Calculus & Vectors
  res = res
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫[$1..$2]')
    .replace(/\\int_\{([^}]+)\}/g, '∫[$1]')
    .replace(/\\int/g, '∫')
    .replace(/\\iint/g, '∬')
    .replace(/\\iiint/g, '∭')
    .replace(/\\oint/g, '∮')
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑[$1..$2]')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\lim_\{([^}]+)\}/g, 'lim($1)')
    .replace(/\\lim/g, 'lim')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\vec\{([^}]+)\}/g, '$1→')
    .replace(/\\hat\{([^}]+)\}/g, '$1^')
    .replace(/\\bar\{([^}]+)\}/g, '$1̄')
    .replace(/\\dot\{([^}]+)\}/g, '$1̇');

  // Greek letters
  res = res
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon|\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\theta|\\vartheta/g, 'θ')
    .replace(/\\iota/g, 'ι')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\pi|\\varpi/g, 'π')
    .replace(/\\rho|\\varrho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\upsilon/g, 'υ')
    .replace(/\\phi|\\varphi/g, 'φ')
    .replace(/\\chi/g, 'χ')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Theta/g, 'Θ')
    .replace(/\\Lambda/g, 'Λ')
    .replace(/\\Xi/g, 'Ξ')
    .replace(/\\Pi/g, 'Π')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\Upsilon/g, 'Υ')
    .replace(/\\Phi/g, 'Φ')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\\Omega/g, 'Ω');

  // Subscripts & superscripts in braces
  res = res.replace(/\^\{([^}]+)\}/g, '^($1)').replace(/_\{([^}]+)\}/g, '_($1)');

  // Remove matrices / envs
  res = res
    .replace(/\\begin\{pmatrix\}|\\end\{pmatrix\}/g, '')
    .replace(/\\begin\{matrix\}|\\end\{matrix\}/g, '')
    .replace(/\\begin\{aligned\}|\\end\{aligned\}/g, '')
    .replace(/\\\\/g, ', ')
    .replace(/&/g, ' ');

  // Clean trailing backslashes or unmatched tokens
  res = res.replace(/\\([a-zA-Z]+)/g, '$1').replace(/\\/g, '');

  return res.trim();
}

/**
 * Preprocesses text to ensure raw LaTeX commands (e.g. \frac{d}{dx}, \int_0^1, \theta)
 * that aren't explicitly wrapped in $...$ or $$...$$ get automatically wrapped
 * in $...$ delimiters for KaTeX LaTeX rendering.
 */
function prepareLatexString(input: string): string {
  if (!input) return '';

  // If already contains $ or $$, keep existing math delimiters intact
  if (input.includes('$')) {
    return input;
  }

  // Common LaTeX math indicators
  const hasLatexCommands = /\\[a-zA-Z]+|\{|\}|\^|_/g.test(input);
  if (hasLatexCommands) {
    // If the entire string is a math formula (e.g., \frac{d}{dx}[x^3] = 3x^2), wrap in $
    return `$${input}$`;
  }

  return input;
}

/**
 * FormattedMathText converts standard math, superscript (^), subscript (_),
 * LaTeX delimiters ($...$ and $$...$$), chemical notations, and TeX commands
 * into crisp, mathematically accurate rendered LaTeX typography.
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = '',
  inline = false,
  interactiveInspect = true,
  onInspectFormula,
}) => {
  const handleFormulaClick = (latex: string) => {
    if (!interactiveInspect) return;
    if (onInspectFormula) {
      onInspectFormula(latex);
    } else {
      window.dispatchEvent(
        new CustomEvent('learnco-inspect-formula', { detail: { latex } })
      );
    }
  };

  const renderedContent = useMemo(() => {
    if (!text) return null;

    const processedText = prepareLatexString(text);

    // Pattern to match $$...$$ (display math) or $...$ (inline math)
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    const parts = processedText.split(mathRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display math $$...$$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const formula = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              onClick={() => handleFormulaClick(formula)}
              title={interactiveInspect ? "Click to inspect formula invariants & dimensional units" : undefined}
              className={`inline-block my-1.5 max-w-full overflow-x-auto text-slate-900 dark:text-slate-100 font-serif ${
                interactiveInspect ? 'hover:opacity-85 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 p-1 rounded-lg transition-colors cursor-pointer' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={index} className="font-mono text-indigo-500 font-semibold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {formula}
            </code>
          );
        }
      }

      // Inline math $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const formula = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              onClick={() => handleFormulaClick(formula)}
              title={interactiveInspect ? "Click to inspect formula invariants & dimensional units" : undefined}
              className={`inline text-slate-900 dark:text-slate-100 font-serif ${
                interactiveInspect ? 'hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={index} className="font-mono text-indigo-500 font-semibold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {formula}
            </code>
          );
        }
      }

      // Check if the regular text contains simple superscript/subscript notation like x^2, H_2O, v_0, 10^-3
      return <FormatPlainSubSuperscripts key={index} content={part} />;
    });
  }, [text]);

  if (inline) {
    return <span className={`inline-math-container ${className}`}>{renderedContent}</span>;
  }

  return <div className={`formatted-math-text ${className}`}>{renderedContent}</div>;
};

/**
 * Handles plain-text subscripts (e.g. H2O, v_0, a_max) and superscripts (e.g. x^2, 10^-3)
 * if LaTeX delimiters were omitted.
 */
const FormatPlainSubSuperscripts: React.FC<{ content: string }> = ({ content }) => {
  const subSupRegex = /(\^\{[^}]+\}|\^[0-9a-zA-Z+-]+|_\{[^}]+\}|_[0-9a-zA-Z+-]+)/g;
  const tokens = content.split(subSupRegex);

  return (
    <span>
      {tokens.map((tok, i) => {
        if (!tok) return null;

        if (tok.startsWith('^')) {
          const supText = tok.startsWith('^{') && tok.endsWith('}')
            ? tok.slice(2, -1)
            : tok.slice(1);
          return (
            <sup key={i} className="text-[0.75em] leading-none font-semibold text-indigo-600 dark:text-indigo-400 align-super ml-0.5">
              {supText}
            </sup>
          );
        }

        if (tok.startsWith('_')) {
          const subText = tok.startsWith('_{') && tok.endsWith('}')
            ? tok.slice(2, -1)
            : tok.slice(1);
          return (
            <sub key={i} className="text-[0.75em] leading-none font-medium text-slate-600 dark:text-slate-400 align-sub ml-0.5">
              {subText}
            </sub>
          );
        }

        return <span key={i}>{tok}</span>;
      })}
    </span>
  );
};
