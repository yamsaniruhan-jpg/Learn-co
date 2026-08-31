import React, { useMemo } from 'react';
import katex from 'katex';

interface FormattedMathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * FormattedMathText converts standard math, superscript (^), subscript (_),
 * LaTeX delimiters ($...$ and $$...$$), chemical notations, and Unicode symbols
 * into crisp, mathematically accurate rendered typography.
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = '',
  inline = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Pattern to match $$...$$ (display math) or $...$ (inline math)
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    const parts = text.split(mathRegex);

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
              className="inline-block my-1.5 max-w-full overflow-x-auto text-slate-900 dark:text-slate-100"
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
              className="inline text-slate-900 dark:text-slate-100"
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
      // We process plain text to make superscripts & subscripts look optical and legible
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
  // Regex to catch ^(...) or ^{...} or ^\w+ as superscript and _(...) or _{...} or _\w+ as subscript
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
