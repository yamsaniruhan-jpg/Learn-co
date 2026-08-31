import { CopilotMode, GeneratedResource, ResourceType } from '../types';

export class ApiClient {
  static async sendCopilotMessage(
    prompt: string,
    mode: CopilotMode = 'socratic_hint',
    context?: string
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, context }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data.reply;
    } catch (err) {
      console.warn('Backend chat API offline or unreachable, using client-side Socratic fallback.', err);
      return this.getLocalFallbackResponse(prompt, mode, context);
    }
  }

  static async generateEducationalResource(
    content: string,
    type: ResourceType,
    title: string
  ): Promise<GeneratedResource> {
    try {
      const response = await fetch('/api/ai/generate-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, title }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data.resource;
    } catch (err) {
      console.warn('Backend generation API offline, using local synthesized generator.', err);
      return this.getLocalGeneratedResource(content, type, title);
    }
  }

  private static getLocalFallbackResponse(prompt: string, mode: CopilotMode, context?: string): string {
    if (mode === 'socratic_hint') {
      return `### Socratic Diagnostic Hint\n\nLet's analyze what you are solving: **"${prompt.slice(0, 60)}..."**\n\n1. **Identify the Core Invariant**: What property remains constant across state transitions or algebraic steps?\n2. **Check the First Derivative / Sign Change**: If you're analyzing optimization or extrema, does the rate of change pass through zero, or is there a boundary discontinuity?\n3. **Guiding Question**: If you set the primary equation to balance under zero acceleration or equilibrium, what expression does your unknown term reduce to?`;
    }

    if (mode === 'conceptual_explainer') {
      return `### First-Principles Explanation\n\nTo truly grasp **"${prompt.slice(0, 50)}"**, let's build the intuition without memorized shortcuts:\n\n* **Ground Truth**: Every complex theorem is just a chain of simple conservation rules and boundary constraints.\n* **Mental Model**: Think of this system like potential energy in a gravitational well—nature always seeks the lowest energy state (or steepest gradient).\n* **Mathematical Form**: The rate of adjustment is proportional to the gradient $\\nabla f(x)$, scaled by our step-size parameter $\\eta$.\n\nDoes this intuition give you a clearer visual map of why the theorem holds?`;
    }

    return `### Step-by-Step Analytical Derivation\n\nHere is the rigorous derivation for your inquiry:\n\n1. **Step 1 — State Definitions & Invariants**:\n   Let $x \\in \\mathbb{R}^n$ and define the objective function $f(x)$.\n\n2. **Step 2 — Apply Differential Operators**:\n   Taking the partial derivative with respect to each component:\n   $$\\frac{\\partial f}{\\partial x_i} = \\lim_{h \\to 0} \\frac{f(x + h e_i) - f(x)}{h}$$\n\n3. **Step 3 — Critical Value Resolution**:\n   Setting the gradient equal to the zero vector $\\nabla f(x) = \\mathbf{0}$ yields the stationary points.\n\n4. **Step 4 — Verification of Concavity**:\n   Compute the Hessian matrix $\\mathbf{H}$. If $\\mathbf{H} \\succ 0$ (positive definite), the point is a strict local minimum.`;
  }

  private static getLocalGeneratedResource(
    content: string,
    type: ResourceType,
    title: string
  ): GeneratedResource {
    const id = `res-${Date.now()}`;
    const createdAt = new Date().toISOString();

    if (type === 'flashcards') {
      return {
        id,
        title: title || 'Extracted Core Concepts',
        sourceType: 'text',
        resourceType: 'flashcards',
        createdAt,
        content: {
          flashcards: [
            {
              question: 'What is the First Derivative Criterion for monotonicity?',
              answer: 'If $f\'(x) > 0$ on $(a, b)$, then $f$ is strictly increasing. If $f\'(x) < 0$, $f$ is strictly decreasing.',
            },
            {
              question: 'Why does learning rate $\\eta$ cause divergence if too large?',
              answer: 'Large step sizes overshoot the convex bowl minima, oscillating outward into regions of steeper gradients.',
            },
            {
              question: 'What is the stereochemical signature of an SN2 mechanism?',
              answer: 'Concerted backside nucleophilic attack causing 100% Walden inversion of configuration at the chiral center.',
            },
            {
              question: 'State the Work-Energy Theorem in conservative fields.',
              answer: 'Total work done equals the change in kinetic energy: $W_{net} = \\Delta K = -\\Delta U$.',
            },
          ],
        },
      };
    }

    if (type === 'quiz') {
      return {
        id,
        title: title || 'Synthesized Concept Quiz',
        sourceType: 'text',
        resourceType: 'quiz',
        createdAt,
        content: {
          quiz: [
            {
              question: 'Which condition guarantees an extremum at $x = c$ for differentiable $f(x)$?',
              options: [
                '$f\'(c) = 0$ and $f\'(x)$ changes sign across $c$',
                'Only $f\'(c) = 0$',
                '$f\'\'(c) = 0$',
                '$f(c) = 0$',
              ],
              answerIndex: 0,
              explanation: 'A zero derivative is necessary but insufficient alone (e.g. $y=x^3$). The derivative must change signs to constitute a true extremum.',
            },
            {
              question: 'In gradient descent with momentum $\\beta = 0.9$, what does the velocity vector accumulate?',
              options: [
                'Exponentially decaying running average of past gradients',
                'Second-order Hessian curvatures',
                'Random stochastic noise',
                'Step count powers',
              ],
              answerIndex: 0,
              explanation: 'Momentum exponentially averages historical directional updates, dampening high-frequency oscillations across ravines.',
            },
          ],
        },
      };
    }

    return {
      id,
      title: title || 'Executive Concept Summary',
      sourceType: 'text',
      resourceType: 'summary',
      createdAt,
      content: {
        summary: `### Executive Conceptual Synthesis: ${title}\n\n* **Primary Thesis**: The provided material focuses on fundamental mathematical and physical principles governing equilibrium and optimization.\n* **Key Theorems**: Monotonicity criteria, conservative energy invariants, and gradient convergence bounds.\n* **Common Student Misconceptions**: Conflating critical points where $f'(x)=0$ with inflection points where $f''(x)=0$.\n* **Actionable Next Step**: Solve 3 calibrated practice questions to reinforce retention strength.`,
      },
    };
  }
}
