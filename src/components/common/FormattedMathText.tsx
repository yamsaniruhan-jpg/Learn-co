import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { latexToPlainText } from '../../utils/textSanitizer';

interface FormattedMathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
  interactiveInspect?: boolean;
  onInspectFormula?: (latex: string) => void;
  /** When true, always render crisp normal readable notation without KaTeX symbols */
  preferNormalText?: boolean;
}

/**
 * Converts raw LaTeX expressions and command sequences into human-readable normal text.
 */
export function cleanLatexToNormalText(input: string): string {
  return latexToPlainText(input);
}

/**
 * Normalizes \(...\) and \[...\] to $...$ / $$...$$, and wraps unwrapped TeX expressions
 * so mixed prose + LaTeX renders smoothly instead of leaking raw commands.
 */
function prepareLatexString(input: string): string {
  if (!input) return '';

  let normalized = String(input)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`);

  if (normalized.includes('$')) {
    return normalized;
  }

  const hasLatexCommands = /\\(?:frac|dfrac|tfrac|sqrt|int|iint|sum|prod|lim|vec|hat|bar|overline|mathbb|mathcal|text|mathrm|mathbf|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|nabla|partial|times|cdot|leq|geq|neq|approx|equiv|rightarrow|implies|iff|binom)\b/i.test(
    normalized
  );
  if (hasLatexCommands) {
    // Wrap inline LaTeX-only tokens or full expression if predominantly math
    const looksLikeProse = /\b(?:the|and|with|for|that|which|where|when|from|into|is|are|was|were|because)\b/i.test(normalized);
    if (!looksLikeProse) {
      return `$${normalized}$`;
    }
    // In prose with unwrapped commands, let caller format cleanly via normal-text fallback if needed
    return normalized;
  }

  return normalized;
}

/**
 * FormattedMathText converts standard math, superscript (^), subscript (_),
 * LaTeX delimiters ($...$, $$...$$, \(...\), \[...\]), chemical notations, and TeX commands
 * into crisp rendered typography — or normal human-readable notation cleanly.
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = '',
  inline = false,
  interactiveInspect = true,
  onInspectFormula,
  preferNormalText = false,
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

    if (preferNormalText) {
      return <span>{cleanLatexToNormalText(text)}</span>;
    }

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
            throwOnError: true,
          });
          return (
            <span
              key={index}
              onClick={() => handleFormulaClick(formula)}
              title={interactiveInspect ? 'Click to inspect formula invariants & dimensional units' : undefined}
              className={`inline-block my-1.5 max-w-full overflow-x-auto text-slate-900 dark:text-slate-100 font-serif ${
                interactiveInspect ? 'hover:opacity-85 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 p-1 rounded-xl transition-colors cursor-pointer' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <span key={index} className="font-semibold text-indigo-700 dark:text-indigo-300">
              {cleanLatexToNormalText(formula)}
            </span>
          );
        }
      }

      // Inline math $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const formula = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: true,
          });
          return (
            <span
              key={index}
              onClick={() => handleFormulaClick(formula)}
              title={interactiveInspect ? 'Click to inspect formula invariants & dimensional units' : undefined}
              className={`inline text-slate-900 dark:text-slate-100 font-serif ${
                interactiveInspect ? 'hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <span key={index} className="font-semibold text-indigo-700 dark:text-indigo-300">
              {cleanLatexToNormalText(formula)}
            </span>
          );
        }
      }

      // Clean any unwrapped LaTeX tokens mixed inside regular text before sub/superscript formatting
      const cleanedRegular = /\\[a-zA-Z]+/.test(part) ? cleanLatexToNormalText(part) : part;
      return <FormatPlainSubSuperscripts key={index} content={cleanedRegular} />;
    });
  }, [text, preferNormalText]);

  if (inline) {
    return <span className={`inline-math-container ${className}`}>{renderedContent}</span>;
  }

  return <span className={`formatted-math-text block ${className}`}>{renderedContent}</span>;
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
