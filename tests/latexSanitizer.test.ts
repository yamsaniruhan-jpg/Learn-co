import { describe, it, expect } from 'vitest';
import { latexToPlainText, toCleanDocumentText, resourceToPlainText } from '../src/utils/textSanitizer';
import { CreatorResource } from '../src/types/creator';

describe('LaTeX to normal readable format sanitizer', () => {
  it('converts nested fractions, square roots, subscripts, and delimiters cleanly', () => {
    const input = String.raw`$$Attention(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$`;
    const result = latexToPlainText(input);
    expect(result).not.toContain('$');
    expect(result).not.toContain('\\frac');
    expect(result).not.toContain('\\sqrt');
    expect(result).not.toContain('\\text');
    expect(result).toContain('softmax');
    expect(result).toContain('√(dₖ)');
    expect(result).toContain('/');
  });

  it('converts inline \\(...\\) and block \\[...\\] formulas to normal text', () => {
    const input = String.raw`Given \(x_{1} + x_{2} = \frac{a}{b}\) and \[E = mc^{2}\], verify conservation.`;
    const result = latexToPlainText(input);
    expect(result).not.toContain('\\(');
    expect(result).not.toContain('\\)');
    expect(result).not.toContain('\\[');
    expect(result).not.toContain('\\]');
    expect(result).not.toContain('\\frac');
    expect(result).toContain('x₁ + x₂ = a/b');
    expect(result).toContain('E = mc²');
  });

  it('cleans slide deck markdown and speaker notes for PDF/handout export', () => {
    const res: CreatorResource = {
      id: 'res-test-slides',
      userId: 'u1',
      title: String.raw`Derivatives of \(x^{2}\)`,
      subjectId: 'math',
      difficulty: 'medium',
      version: 1,
      resourceType: 'slides',
      sourceId: 'src-1',
      tags: [],
      isPublic: true,
      status: 'ready',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      content: {
        slides: [
          {
            slideNumber: 1,
            title: String.raw`Chain Rule: \(\frac{dy}{dx}\)`,
            bullets: [String.raw`Compute \(f'(g(x)) \cdot g'(x)\) cleanly.`],
            calloutFormula: String.raw`$$\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$$`,
            speakerNotes: String.raw`Emphasize inner rate \(g'(x)\).`,
          },
        ],
      },
    };

    const output = resourceToPlainText(res);
    expect(output).not.toContain('$');
    expect(output).not.toContain('\\frac');
    expect(output).not.toContain('\\cdot');
    expect(output).toContain('d/dx');
    expect(output).toContain('·');
    expect(toCleanDocumentText('**Bold** $\\alpha + \\beta$')).toBe('Bold α + β');
  });
});
