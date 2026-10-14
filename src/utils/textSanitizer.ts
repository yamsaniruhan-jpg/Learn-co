import { CreatorResource } from '../types/creator';

/**
 * Sanitizes LaTeX code and mathematical notation into clean, readable plain text.
 * e.g., transforms $$\frac{d}{dx}[f(x)]$$ into (d/dx)[f(x)] and removes markdown noise.
 */
export function latexToPlainText(input: string | undefined | null): string {
  if (!input) return '';

  let text = input;

  // Remove surrounding display math $$...$$ and inline math $...$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  text = text.replace(/\$([^$]+)\$/g, '$1');

  // Fractions: \frac{a}{b} -> (a / b)
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
  text = text.replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  // Square roots: \sqrt{x} -> √(x), \sqrt[n]{x} -> n√(x)
  text = text.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$1√($2)');
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Superscripts & Subscripts common in STEM
  text = text.replace(/\^\{2\}/g, '²');
  text = text.replace(/\^2/g, '²');
  text = text.replace(/\^\{3\}/g, '³');
  text = text.replace(/\^3/g, '³');
  text = text.replace(/\^\{([0-9a-zA-Z+-]+)\}/g, '^($1)');
  text = text.replace(/_\{([0-9a-zA-Z+-]+)\}/g, '_{$1}');

  // Greek letters to Unicode symbols
  const greekMap: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\Gamma': 'Γ',
    '\\delta': 'δ',
    '\\Delta': 'Δ',
    '\\epsilon': 'ε',
    '\\varepsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\Theta': 'Θ',
    '\\lambda': 'λ',
    '\\Lambda': 'Λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\Pi': 'Π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\Sigma': 'Σ',
    '\\tau': 'τ',
    '\\phi': 'φ',
    '\\Phi': 'Φ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    '\\Omega': 'Ω',
  };

  for (const [tex, unicode] of Object.entries(greekMap)) {
    text = text.replaceAll(tex, unicode);
  }

  // Operators & Relations
  const operatorMap: Record<string, string> = {
    '\\times': '×',
    '\\cdot': '·',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\le': '≤',
    '\\leq': '≤',
    '\\ge': '≥',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\infty': '∞',
    '\\int': '∫',
    '\\iint': '∬',
    '\\iiint': '∭',
    '\\oint': '∮',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\subseteq': '⊆',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\to': '➔',
    '\\rightarrow': '➔',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\iff': '⟺',
  };

  for (const [tex, unicode] of Object.entries(operatorMap)) {
    text = text.replaceAll(tex, unicode);
  }

  // Clean common LaTeX formatting wrappers
  text = text.replace(/\\text\{([^}]+)\}/g, '$1');
  text = text.replace(/\\textbf\{([^}]+)\}/g, '$1');
  text = text.replace(/\\textit\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  text = text.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  text = text.replace(/\\left\(/g, '(');
  text = text.replace(/\\right\)/g, ')');
  text = text.replace(/\\left\[/g, '[');
  text = text.replace(/\\right\]/g, ']');
  text = text.replace(/\\left\{/g, '{');
  text = text.replace(/\\right\}/g, '}');
  text = text.replace(/\\left\|/g, '|');
  text = text.replace(/\\right\|/g, '|');

  // Remove trailing slashes and clean excess spaces
  text = text.replace(/\\\\/g, '\n');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Converts any CreatorResource into human-readable, beautifully structured normal text.
 * No raw JSON or raw Markdown hashes.
 */
export function resourceToPlainText(resource: CreatorResource): string {
  const divider = '==================================================';
  const subDivider = '--------------------------------------------------';

  let out = `${divider}\n`;
  out += `${resource.title.toUpperCase()}\n`;
  out += `Resource Type: ${resource.resourceType.replace(/_/g, ' ').toUpperCase()}\n`;
  out += `Subject: ${resource.subjectId.toUpperCase()} | Difficulty: ${resource.difficulty.toUpperCase()} | Version: v${resource.version}\n`;
  out += `${divider}\n\n`;

  const content = resource.content;

  // 1. Slides
  if (resource.resourceType === 'slides' && content.slides && Array.isArray(content.slides)) {
    content.slides.forEach((slide: any, index: number) => {
      out += `SLIDE ${index + 1}: ${slide.title}\n`;
      if (slide.subtitle) {
        out += `Topic: ${slide.subtitle}\n`;
      }
      out += `${subDivider}\n`;

      if (slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0) {
        out += `Key Concepts:\n`;
        slide.bullets.forEach((b: string) => {
          out += `  • ${latexToPlainText(b)}\n`;
        });
        out += `\n`;
      }

      if (slide.calloutFormula) {
        out += `Core Equation / Derivation:\n`;
        out += `  ${latexToPlainText(slide.calloutFormula)}\n\n`;
      }

      if (slide.speakerNotes) {
        out += `Presenter Script & Explanations:\n`;
        out += `  ${latexToPlainText(slide.speakerNotes)}\n\n`;
      }

      out += `\n`;
    });
    return out.trim();
  }

  // 2. Quiz
  if (resource.resourceType === 'quiz' && content.quiz && Array.isArray(content.quiz)) {
    out += `PRACTICE QUESTIONS & DIAGNOSTICS\n\n`;
    content.quiz.forEach((q: any, index: number) => {
      out += `Question ${index + 1}: ${latexToPlainText(q.question)}\n`;
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt: string, optIdx: number) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isCorrect = optIdx === q.correctIndex ? ' (CORRECT ANSWER)' : '';
          out += `  [${letter}] ${latexToPlainText(opt)}${isCorrect}\n`;
        });
      }
      if (q.explanation) {
        out += `\nExplanation:\n  ${latexToPlainText(q.explanation)}\n`;
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
      out += `Front / Prompt: ${latexToPlainText(card.front)}\n`;
      out += `Back / Answer:  ${latexToPlainText(card.back)}\n`;
      if (card.formula) {
        out += `Formula:        ${latexToPlainText(card.formula)}\n`;
      }
      out += `\n${subDivider}\n\n`;
    });
    return out.trim();
  }

  // 4. Summary
  if (resource.resourceType === 'summary' && content.summary) {
    const s = content.summary;
    out += `EXECUTIVE SUMMARY\n\n${latexToPlainText(s.executiveSummary || '')}\n\n`;

    if (s.theoremsAndPrinciples && Array.isArray(s.theoremsAndPrinciples)) {
      out += `THEOREMS & PRINCIPLES:\n`;
      s.theoremsAndPrinciples.forEach((t: any) => {
        out += `• ${latexToPlainText(t.name)}: ${latexToPlainText(t.statement)}\n`;
      });
      out += `\n`;
    }

    if (s.actionableTakeaways && Array.isArray(s.actionableTakeaways)) {
      out += `ACTIONABLE TAKEAWAYS:\n`;
      s.actionableTakeaways.forEach((t: string) => {
        out += `• ${latexToPlainText(t)}\n`;
      });
      out += `\n`;
    }
    return out.trim();
  }

  // 5. Notes
  if (resource.resourceType === 'notes' && content.notes) {
    const n = content.notes;
    out += `COMPREHENSIVE LECTURE NOTES\n\n`;
    if (n.overview) out += `Overview:\n${latexToPlainText(n.overview)}\n\n`;

    if (n.sections && Array.isArray(n.sections)) {
      n.sections.forEach((sec: any) => {
        out += `SECTION: ${sec.heading}\n`;
        out += `${sec.content ? latexToPlainText(sec.content) : ''}\n\n`;
      });
    }
    return out.trim();
  }

  // 6. Worksheet
  if (resource.resourceType === 'worksheet' && content.worksheet) {
    const w = content.worksheet;
    out += `PRACTICE WORKSHEET\n\n`;
    if (w.instructions) out += `Instructions: ${latexToPlainText(w.instructions)}\n\n`;

    if (w.problems && Array.isArray(w.problems)) {
      w.problems.forEach((p: any, idx: number) => {
        out += `Problem ${idx + 1} (${p.difficulty || 'medium'}):\n`;
        out += `${latexToPlainText(p.question || p.problemText)}\n`;
        if (p.solution) {
          out += `Solution / Working:\n${latexToPlainText(p.solution)}\n`;
        }
        out += `\n${subDivider}\n\n`;
      });
    }
    return out.trim();
  }

  // Fallback: Format keys nicely without raw JSON markup
  Object.entries(content).forEach(([k, v]) => {
    out += `${k.toUpperCase()}:\n`;
    if (typeof v === 'string') {
      out += `${latexToPlainText(v)}\n\n`;
    } else {
      out += `${JSON.stringify(v, null, 2)}\n\n`;
    }
  });

  return out.trim();
}
