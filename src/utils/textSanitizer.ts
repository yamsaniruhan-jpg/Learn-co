import { CreatorResource } from '../types/creator';

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
  t: 'ᵗ',
  T: 'ᵀ',
  x: 'ˣ',
  y: 'ʸ',
  k: 'ᵏ',
  m: 'ᵐ',
  p: 'ᵖ',
  r: 'ʳ',
  s: 'ˢ',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  '*': '⁎',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

function toUnicodeSuperscript(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed === '\\circ' || trimmed === 'circ') return '°';
  if (trimmed === '\\prime' || trimmed === "'") return '′';
  let converted = '';
  for (const ch of trimmed) {
    if (SUPERSCRIPT_MAP[ch]) {
      converted += SUPERSCRIPT_MAP[ch];
    } else {
      return `^(${trimmed})`;
    }
  }
  return converted;
}

function toUnicodeSubscript(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  let converted = '';
  for (const ch of trimmed) {
    if (SUBSCRIPT_MAP[ch]) {
      converted += SUBSCRIPT_MAP[ch];
    } else {
      return `_${trimmed}`;
    }
  }
  return converted;
}

/**
 * Converts LaTeX expressions, delimiters ($...$, $$...$$, \(...\), \[...\]),
 * fractions, nested roots, vectors, Greek symbols, and formatting commands into
 * crisp, human-readable normal text with Unicode math symbols.
 */
export function latexToPlainText(input: string | undefined | null): string {
  if (!input) return '';

  let text = String(input);

  // Strip LaTeX delimiters while keeping normal currency amounts intact where unambiguous
  text = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    // Fallback for stray $ delimiters inside malformed fragments (skip obvious "$12" currency followed by space/punctuation if needed)
    .replace(/\$(?=[\\a-zA-Z(])/g, '')
    .replace(/([a-zA-Z0-9})\]])\$/g, '$1');

  // Remove environment wrappers (matrices, aligned, cases)
  text = text
    .replace(/\\begin\{(?:pmatrix|bmatrix|vmatrix|matrix|aligned|align\*?|cases|gather\*?)\}/g, '')
    .replace(/\\end\{(?:pmatrix|bmatrix|vmatrix|matrix|aligned|align\*?|cases|gather\*?)\}/g, '');

  // Sizing & delimiter commands
  text = text
    .replace(/\\left\\lceil/g, '⌈')
    .replace(/\\right\\rceil/g, '⌉')
    .replace(/\\left\\lfloor/g, '⌊')
    .replace(/\\right\\rfloor/g, '⌋')
    .replace(/\\lceil/g, '⌈')
    .replace(/\\rceil/g, '⌉')
    .replace(/\\lfloor/g, '⌊')
    .replace(/\\rfloor/g, '⌋')
    .replace(/\\langle/g, '⟨')
    .replace(/\\rangle/g, '⟩')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|')
    .replace(/\\left\./g, '')
    .replace(/\\right\./g, '')
    .replace(/\\left|\\right|\\big|\\Big|\\bigg|\\Bigg/g, '');

  // Special Blackboard & Calligraphic notations
  text = text
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ')
    .replace(/\\mathbb\{C\}/g, 'ℂ')
    .replace(/\\mathbb\{E\}/g, '𝔼')
    .replace(/\\mathbb\{P\}/g, 'ℙ')
    .replace(/\\mathcal\{O\}/g, 'O')
    .replace(/\\mathcal\{L\}/g, 'L')
    .replace(/\\mathcal\{H\}/g, 'H')
    .replace(/\\mathcal\{E\}/g, 'E')
    .replace(/\\mathcal\{([^}]+)\}/g, '$1')
    .replace(/\\mathbb\{([^}]+)\}/g, '$1');

  // Text formatting & accents (run iteratively to unwrap nested braces cleanly)
  for (let pass = 0; pass < 4; pass++) {
    text = text
      .replace(/\\(?:text|textbf|textit|textrm|textsf|texttt|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|operatorname|underline)\{([^{}]*)\}/g, '$1')
      .replace(/\\vec\{([^{}]*)\}/g, '$1→')
      .replace(/\\overrightarrow\{([^{}]*)\}/g, '$1→')
      .replace(/\\hat\{([^{}]*)\}/g, '$1̂')
      .replace(/\\bar\{([^{}]*)\}/g, '$1̄')
      .replace(/\\overline\{([^{}]*)\}/g, '$1̄')
      .replace(/\\tilde\{([^{}]*)\}/g, '$1̃')
      .replace(/\\dot\{([^{}]*)\}/g, '$1̇')
      .replace(/\\ddot\{([^{}]*)\}/g, '$1̈');
  }

  // Greek letters (longer names first)
  const greekMap: Record<string, string> = {
    '\\varepsilon': 'ε',
    '\\vartheta': 'θ',
    '\\varpi': 'π',
    '\\varrho': 'ρ',
    '\\varphi': 'φ',
    '\\Upsilon': 'Υ',
    '\\upsilon': 'υ',
    '\\epsilon': 'ε',
    '\\Lambda': 'Λ',
    '\\lambda': 'λ',
    '\\Gamma': 'Γ',
    '\\gamma': 'γ',
    '\\Delta': 'Δ',
    '\\delta': 'δ',
    '\\Theta': 'Θ',
    '\\theta': 'θ',
    '\\Sigma': 'Σ',
    '\\sigma': 'σ',
    '\\Omega': 'Ω',
    '\\omega': 'ω',
    '\\alpha': 'α',
    '\\Kappa': 'Κ',
    '\\kappa': 'κ',
    '\\zeta': 'ζ',
    '\\beta': 'β',
    '\\iota': 'ι',
    '\\Phi': 'Φ',
    '\\phi': 'φ',
    '\\Psi': 'Ψ',
    '\\psi': 'ψ',
    '\\chi': 'χ',
    '\\eta': 'η',
    '\\rho': 'ρ',
    '\\tau': 'τ',
    '\\Pi': 'Π',
    '\\pi': 'π',
    '\\Xi': 'Ξ',
    '\\xi': 'ξ',
    '\\mu': 'μ',
    '\\nu': 'ν',
  };

  for (const [tex, unicode] of Object.entries(greekMap)) {
    text = text.replaceAll(tex, unicode);
  }

  // Named functions & modulo
  text = text
    .replace(/\\xrightarrow\{([^{}]*)\}/g, ' →[$1]→ ')
    .replace(/\\pmod\{([^{}]*)\}/g, ' (mod $1)')
    .replace(/\\bmod\b/g, ' mod ')
    .replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|det|min|max|lim|sup|inf|arg|deg|gcd|lcm)\b/g, '$1');

  // Iterative inner-to-outer replacement for nested \frac, \dfrac, \tfrac, \binom, \sqrt
  for (let pass = 0; pass < 6; pass++) {
    const prev = text;
    text = text
      .replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, num, den) => {
        const n = num.trim();
        const d = den.trim();
        const simpleN = /^[a-zA-Z0-9α-ωΑ-ΩΔθλπσμρ]+$/.test(n) ? n : `(${n})`;
        const simpleD = /^[a-zA-Z0-9α-ωΑ-ΩΔθλπσμρ]+$/.test(d) ? d : `(${d})`;
        return `${simpleN}/${simpleD}`;
      })
      .replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, 'C($1, $2)')
      .replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, '$1√($2)')
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
    if (text === prev) break;
  }

  // Calculus bounds and big operators
  text = text
    .replace(/\\int_\{([^{}]*)\}\^\{([^{}]*)\}/g, '∫[$1 to $2] ')
    .replace(/\\int_([a-zA-Z0-9])\^([a-zA-Z0-9])/g, '∫[$1 to $2] ')
    .replace(/\\int_\{([^{}]*)\}/g, '∫[$1] ')
    .replace(/\\sum_\{([^{}]*)\}\^\{([^{}]*)\}/g, '∑($1 to $2) ')
    .replace(/\\prod_\{([^{}]*)\}\^\{([^{}]*)\}/g, '∏($1 to $2) ')
    .replace(/\\lim_\{([^{}]*)\}/g, 'lim($1) ');

  // Operators & Relations (ordered longest match first)
  const operatorMap: Record<string, string> = {
    '\\Longleftrightarrow': ' ⟺ ',
    '\\Longrightarrow': ' ⟹ ',
    '\\leftrightarrow': ' ↔ ',
    '\\rightarrow': ' → ',
    '\\leftarrow': ' ← ',
    '\\Rightarrow': ' ⇒ ',
    '\\Leftarrow': ' ⇐ ',
    '\\subseteq': ' ⊆ ',
    '\\supseteq': ' ⊇ ',
    '\\parallel': ' ∥ ',
    '\\triangle': '△',
    '\\implies': ' ⟹ ',
    '\\partial': '∂',
    '\\emptyset': '∅',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\approx': ' ≈ ',
    '\\propto': ' ∝ ',
    '\\subset': ' ⊂ ',
    '\\supset': ' ⊃ ',
    '\\notin': ' ∉ ',
    '\\iiint': '∭',
    '\\iint': '∬',
    '\\oint': '∮',
    '\\infty': '∞',
    '\\nabla': '∇',
    '\\equiv': ' ≡ ',
    '\\times': ' × ',
    '\\cdot': ' · ',
    '\\cdots': '···',
    '\\ldots': '...',
    '\\dots': '...',
    '\\angle': '∠',
    '\\prime': '′',
    '\\circ': '°',
    '\\land': ' ∧ ',
    '\\lor': ' ∨ ',
    '\\neg': '¬',
    '\\perp': ' ⊥ ',
    '\\prod': '∏',
    '\\sum': '∑',
    '\\int': '∫',
    '\\neq': ' ≠ ',
    '\\leq': ' ≤ ',
    '\\geq': ' ≥ ',
    '\\div': ' ÷ ',
    '\\cap': ' ∩ ',
    '\\cup': ' ∪ ',
    '\\iff': ' ⟺ ',
    '\\sim': '~',
    '\\le': ' ≤ ',
    '\\ge': ' ≥ ',
    '\\ll': ' ≪ ',
    '\\gg': ' ≫ ',
    '\\pm': '±',
    '\\mp': '∓',
    '\\to': ' → ',
    '\\in': ' ∈ ',
  };

  for (const [tex, unicode] of Object.entries(operatorMap)) {
    text = text.replaceAll(tex, unicode);
  }

  // Escaped spacing & symbols
  text = text
    .replace(/\\quad|\\qquad/g, '  ')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\\\/g, '\n');

  // Convert superscripts and subscripts into readable Unicode or clean notation
  text = text
    .replace(/\^\{([^{}]*)\}/g, (_, inner) => toUnicodeSuperscript(inner))
    .replace(/\^([0-9a-zA-Z+-])/g, (_, ch) => toUnicodeSuperscript(ch))
    .replace(/_\{([^{}]*)\}/g, (_, inner) => toUnicodeSubscript(inner))
    .replace(/_([0-9a-zA-Z])/g, (_, ch) => toUnicodeSubscript(ch));

  // Strip any leftover unknown \command backslashes so raw TeX commands never show
  text = text
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\\/g, '');

  // Normalize excessive horizontal spaces while preserving newlines
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * Strips simple markdown decorations (**bold**, *italic*, `code`) in addition
 * to LaTeX so exported text / PDF documents read naturally.
 */
export function toCleanDocumentText(input: string | undefined | null): string {
  const plain = latexToPlainText(input);
  return plain
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/**
 * Converts any CreatorResource into human-readable, cleanly structured normal text.
 * Zero raw JSON or raw LaTeX notation.
 */
export function resourceToPlainText(resource: CreatorResource): string {
  const divider = '==================================================';
  const subDivider = '--------------------------------------------------';

  let out = `${divider}\n`;
  out += `${toCleanDocumentText(resource.title).toUpperCase()}\n`;
  out += `Resource Type: ${resource.resourceType.replace(/_/g, ' ').toUpperCase()}\n`;
  out += `Subject: ${(resource.subjectId || 'general').toUpperCase()} | Difficulty: ${(resource.difficulty || 'medium').toUpperCase()} | Version: v${resource.version || 1}\n`;
  out += `${divider}\n\n`;

  const content = resource.content;

  // 1. Slides
  if (resource.resourceType === 'slides' && content.slides && Array.isArray(content.slides)) {
    content.slides.forEach((slide: any, index: number) => {
      out += `SLIDE ${index + 1}: ${toCleanDocumentText(slide.title)}\n`;
      if (slide.subtitle) {
        out += `Topic: ${toCleanDocumentText(slide.subtitle)}\n`;
      }
      out += `${subDivider}\n`;

      if (slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0) {
        out += `Key Concepts:\n`;
        slide.bullets.forEach((b: string) => {
          out += `  • ${toCleanDocumentText(b)}\n`;
        });
        out += `\n`;
      }

      if (slide.calloutFormula) {
        out += `Core Equation / Principle:\n`;
        out += `  ${toCleanDocumentText(slide.calloutFormula)}\n\n`;
      }

      if (slide.speakerNotes) {
        out += `Presenter Script & Explanations:\n`;
        out += `  ${toCleanDocumentText(slide.speakerNotes)}\n\n`;
      }

      out += `\n`;
    });
    return out.trim();
  }

  // 2. Quiz
  if (resource.resourceType === 'quiz' && content.quiz && Array.isArray(content.quiz)) {
    out += `PRACTICE QUESTIONS & DIAGNOSTICS\n\n`;
    content.quiz.forEach((q: any, index: number) => {
      out += `Question ${index + 1}: ${toCleanDocumentText(q.question)}\n`;
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt: string, optIdx: number) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isCorrect = optIdx === q.correctIndex ? ' (CORRECT ANSWER)' : '';
          out += `  [${letter}] ${toCleanDocumentText(opt)}${isCorrect}\n`;
        });
      }
      if (q.explanation) {
        out += `\nExplanation:\n  ${toCleanDocumentText(q.explanation)}\n`;
      }
      out += `\n${subDivider}\n\n`;
    });
    return out.trim();
  }

  // 3. Flashcards
  if (resource.resourceType === 'flashcards' && content.flashcards && Array.isArray(content.flashcards)) {
    out += `STUDY FLASHCARDS (${content.flashcards.length} Cards)\n\n`;
    content.flashcards.forEach((card: any, index: number) => {
      out += `CARD ${index + 1}\n`;
      out += `Front / Prompt: ${toCleanDocumentText(card.front)}\n`;
      out += `Back / Answer:  ${toCleanDocumentText(card.back)}\n`;
      if (card.formula) {
        out += `Formula:        ${toCleanDocumentText(card.formula)}\n`;
      }
      if (card.hint) {
        out += `Hint:           ${toCleanDocumentText(card.hint)}\n`;
      }
      out += `\n${subDivider}\n\n`;
    });
    return out.trim();
  }

  // 4. Summary
  if (resource.resourceType === 'summary' && content.summary) {
    const s = content.summary;
    out += `EXECUTIVE SUMMARY\n\n${toCleanDocumentText(s.executiveSummary || '')}\n\n`;

    if (s.theoremsAndPrinciples && Array.isArray(s.theoremsAndPrinciples) && s.theoremsAndPrinciples.length > 0) {
      out += `THEOREMS & PRINCIPLES:\n`;
      s.theoremsAndPrinciples.forEach((t: any) => {
        out += `• ${toCleanDocumentText(t.name)}: ${toCleanDocumentText(t.statement)}\n`;
        if (t.formula) {
          out += `  Formula: ${toCleanDocumentText(t.formula)}\n`;
        }
      });
      out += `\n`;
    }

    if (s.misconceptions && Array.isArray(s.misconceptions) && s.misconceptions.length > 0) {
      out += `COMMON MISCONCEPTIONS & CORRECTIONS:\n`;
      s.misconceptions.forEach((m: any) => {
        out += `• Misconception: ${toCleanDocumentText(m.misconception)}\n`;
        out += `  Correction:    ${toCleanDocumentText(m.correction)}\n`;
      });
      out += `\n`;
    }

    if (s.actionableTakeaways && Array.isArray(s.actionableTakeaways)) {
      out += `ACTIONABLE TAKEAWAYS:\n`;
      s.actionableTakeaways.forEach((t: string) => {
        out += `• ${toCleanDocumentText(t)}\n`;
      });
      out += `\n`;
    }
    return out.trim();
  }

  // 5. Notes
  if (resource.resourceType === 'notes' && content.notes) {
    const n = content.notes;
    out += `COMPREHENSIVE LECTURE NOTES\n\n`;
    if (n.overview) out += `Overview:\n${toCleanDocumentText(n.overview)}\n\n`;

    if (n.sections && Array.isArray(n.sections)) {
      n.sections.forEach((sec: any, idx: number) => {
        out += `SECTION ${idx + 1}: ${toCleanDocumentText(sec.heading)}\n`;
        const body = sec.markdownContent || sec.content || '';
        if (body) out += `${toCleanDocumentText(body)}\n`;
        if (sec.formulas && Array.isArray(sec.formulas) && sec.formulas.length > 0) {
          out += `Key Equations:\n`;
          sec.formulas.forEach((f: string) => {
            out += `  • ${toCleanDocumentText(f)}\n`;
          });
        }
        out += `\n`;
      });
    }

    if (n.keyDerivations && Array.isArray(n.keyDerivations) && n.keyDerivations.length > 0) {
      out += `STEP-BY-STEP DERIVATIONS:\n`;
      n.keyDerivations.forEach((d: any) => {
        out += `• ${toCleanDocumentText(d.name)}\n`;
        (d.steps || []).forEach((st: string, sIdx: number) => {
          out += `   ${sIdx + 1}. ${toCleanDocumentText(st)}\n`;
        });
      });
      out += `\n`;
    }
    return out.trim();
  }

  // 6. Worksheet
  if (resource.resourceType === 'worksheet' && content.worksheet) {
    const w = content.worksheet;
    out += `PRACTICE WORKSHEET\n\n`;
    if (w.instructions) out += `Instructions: ${toCleanDocumentText(w.instructions)}\n\n`;

    if (w.problems && Array.isArray(w.problems)) {
      w.problems.forEach((p: any, idx: number) => {
        out += `Problem ${p.problemNumber || idx + 1} (${p.rubricScore || 10} pts):\n`;
        out += `${toCleanDocumentText(p.problemStatement || p.question || p.problemText)}\n`;
        if (p.solutionSteps && Array.isArray(p.solutionSteps)) {
          out += `Solution Steps:\n`;
          p.solutionSteps.forEach((step: string, sIdx: number) => {
            out += `  ${sIdx + 1}. ${toCleanDocumentText(step)}\n`;
          });
        } else if (p.solution) {
          out += `Solution / Working:\n${toCleanDocumentText(p.solution)}\n`;
        }
        if (p.finalAnswer) {
          out += `Final Answer: ${toCleanDocumentText(p.finalAnswer)}\n`;
        }
        out += `\n${subDivider}\n\n`;
      });
    }
    return out.trim();
  }

  // 7. Mind Map
  if (resource.resourceType === 'mindmap' && content.mindmap) {
    const m = content.mindmap;
    out += `CONCEPT MIND MAP: ${toCleanDocumentText(m.rootTopic || resource.title)}\n\n`;
    (m.nodes || []).forEach((node: any, idx: number) => {
      out += `${idx + 1}. ${toCleanDocumentText(node.label)}${node.category ? ` [${node.category}]` : ''}\n`;
      if (node.description) out += `   ${toCleanDocumentText(node.description)}\n`;
      if (node.formula) out += `   Formula: ${toCleanDocumentText(node.formula)}\n`;
      out += `\n`;
    });
    return out.trim();
  }

  // 8. Key Concepts
  if (resource.resourceType === 'key_concepts' && content.keyConcepts && Array.isArray(content.keyConcepts)) {
    out += `KEY CONCEPTS & INVARIANTS (${content.keyConcepts.length})\n\n`;
    content.keyConcepts.forEach((item: any, idx: number) => {
      out += `${idx + 1}. ${toCleanDocumentText(item.concept)}\n`;
      out += `   Definition: ${toCleanDocumentText(item.definition)}\n`;
      if (item.formula) out += `   Formula:    ${toCleanDocumentText(item.formula)}\n`;
      if (item.invariant) out += `   Rule:       ${toCleanDocumentText(item.invariant)}\n`;
      if (item.example) out += `   Example:    ${toCleanDocumentText(item.example)}\n`;
      out += `\n${subDivider}\n\n`;
    });
    return out.trim();
  }

  // Fallback
  Object.entries(content).forEach(([k, v]) => {
    out += `${k.toUpperCase()}:\n`;
    if (typeof v === 'string') {
      out += `${toCleanDocumentText(v)}\n\n`;
    } else {
      out += `${toCleanDocumentText(JSON.stringify(v, null, 2))}\n\n`;
    }
  });

  return out.trim();
}
