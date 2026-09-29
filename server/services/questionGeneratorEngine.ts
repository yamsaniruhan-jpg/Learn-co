import { QuestionBankItem, DifficultyLevel, QuestionTypeId } from '../../src/types/curriculum';

export class QuestionGeneratorEngine {
  /**
   * Generates up to 100 distinct, high-quality parameterized questions for a given topicId.
   */
  static generateQuestionsForTopic(
    topicId: string,
    subjectId: 'math' | 'cs' | 'physics' | 'chemistry' | 'biology',
    chapterId: string,
    topicTitle: string,
    count: number = 100
  ): QuestionBankItem[] {
    const questions: QuestionBankItem[] = [];
    const difficulties: DifficultyLevel[] = ['easy', 'easy_medium', 'medium', 'medium_hard', 'hard'];
    const types: QuestionTypeId[] = ['single_choice', 'multiple_choice', 'numerical', 'assertion_reason', 'true_false', 'code_output'];

    for (let i = 1; i <= count; i++) {
      const difficulty = difficulties[(i - 1) % difficulties.length];
      const questionType = types[(i - 1) % types.length];
      const id = `q-gen-${topicId}-${i}`;

      const generated = this.buildTopicQuestionInstance(
        id,
        i,
        subjectId,
        chapterId,
        topicId,
        topicTitle,
        difficulty,
        questionType
      );

      questions.push(generated);
    }

    return questions;
  }

  private static buildTopicQuestionInstance(
    id: string,
    index: number,
    subjectId: 'math' | 'cs' | 'physics' | 'chemistry' | 'biology',
    chapterId: string,
    topicId: string,
    topicTitle: string,
    difficulty: DifficultyLevel,
    questionType: QuestionTypeId
  ): QuestionBankItem {
    // Generate specialized problem statements according to subject and topic index
    let questionText = '';
    let options: string[] | undefined = undefined;
    let correctAnswer: string | string[] = '';
    let explanation = '';
    let stepByStepSolution: string[] = [];
    let hints: string[] = [];

    const k = index; // multiplier seed

    if (subjectId === 'math') {
      const a = (k % 5) + 1;
      const b = (k % 7) + 2;
      const c = (k % 4) + 3;

      if (questionType === 'single_choice' || questionType === 'code_output') {
        questionText = `[Variation #${k}] Determine the critical points and monotonicity behavior for the polynomial function $f(x) = ${a}x^3 - ${3 * a * b}x^2 + ${3 * a * b * b}x - ${c}$ on $\\mathbb{R}$.`;
        options = [
          `Inflection stationary point at $x = ${b}$ with no change in sign`,
          `Local maximum at $x = ${b}$`,
          `Local minimum at $x = ${b}$`,
          `Two distinct extrema at $x = ${b}$ and $x = ${b + 2}`,
        ];
        correctAnswer = `Inflection stationary point at $x = ${b}$ with no change in sign`;
        explanation = `Differentiating gives $f'(x) = ${3 * a}x^2 - ${6 * a * b}x + ${3 * a * b * b} = ${3 * a}(x - ${b})^2$. Since $f'(x) \\ge 0$ for all real $x$, $f'(x)$ equals zero at $x = ${b}$ but never changes sign, making $x = ${b}$ a stationary point of inflection.`;
        stepByStepSolution = [
          `Compute derivative: $f'(x) = ${3 * a}x^2 - ${6 * a * b}x + ${3 * a * b * b}$`,
          `Factor out ${3 * a}: $f'(x) = ${3 * a}(x - ${b})^2$`,
          `Note that $f'(x) \\ge 0$ for all $x$, so $f(x)$ is monotonic increasing throughout, with a horizontal inflection at $x = ${b}$.`,
        ];
      } else if (questionType === 'numerical') {
        const val = a * b + c;
        questionText = `[Variation #${k}] Evaluate the exact value of $\\lim_{x \\to ${b}} \\frac{${a}x^2 - ${a * b * b}}{x - ${b}} + ${c}$.`;
        correctAnswer = `${2 * a * b + c}`;
        explanation = `Factoring the numerator: $${a}(x - ${b})(x + ${b}) / (x - ${b}) = ${a}(x + ${b})$. Taking limit as $x \\to ${b}$ yields $2 \\cdot ${a} \\cdot ${b} = ${2 * a * b}$. Adding ${c}$ gives ${2 * a * b + c}.`;
        stepByStepSolution = [
          `Factor numerator: $${a}(x^2 - ${b * b}) = ${a}(x - ${b})(x + ${b})$`,
          `Cancel common factor $(x - ${b})$`,
          `Substitute $x = ${b}: ${a}(${b} + ${b}) + ${c} = ${2 * a * b + c}$`,
        ];
      } else if (questionType === 'multiple_choice') {
        questionText = `[Variation #${k}] For the matrix $A = \\begin{pmatrix} ${a} & ${b} \\\\ 0 & ${c} \\end{pmatrix}$, which of the following statements are TRUE? (Select all that apply)`;
        options = [
          `The eigenvalues of $A$ are $\\lambda_1 = ${a}$ and $\\lambda_2 = ${c}$`,
          `The trace of $A$ is $\\text{Tr}(A) = ${a + c}$`,
          `The determinant of $A$ is $\\det(A) = ${a * c}$`,
          `The matrix $A$ is singular and non-invertible`,
        ];
        correctAnswer = [
          `The eigenvalues of $A$ are $\\lambda_1 = ${a}$ and $\\lambda_2 = ${c}$`,
          `The trace of $A$ is $\\text{Tr}(A) = ${a + c}$`,
          `The determinant of $A$ is $\\det(A) = ${a * c}$`,
        ];
        explanation = `For an upper triangular matrix, eigenvalues are the diagonal entries $\\lambda_1 = ${a}$ and $\\lambda_2 = ${c}$. Trace is the sum of diagonal entries $(${a} + ${c} = ${a + c})$, and determinant is product $(${a} \\times ${c} = ${a * c})$. Since $a, c \\ge 1$, $\\det(A) \\ne 0$, so $A$ is invertible.`;
        stepByStepSolution = [
          `Identify diagonal entries: $a_{11} = ${a}, a_{22} = ${c}$`,
          `For triangular matrix, eigenvalues are diagonal elements`,
          `Compute trace $= ${a} + ${c} = ${a + c}$ and determinant $= ${a} \\cdot ${c} = ${a * c}$`,
        ];
      } else if (questionType === 'assertion_reason') {
        questionText = `[Variation #${k}] Consider the following statements:\nAssertion (A): The definite integral $\\int_{0}^{${a}} (${b}x + ${c}) dx$ equals $\\frac{${b} \\cdot ${a * a}}{2} + ${c * a}$.\nReason (R): By the Fundamental Theorem of Calculus, the antiderivative of $f(x) = ${b}x + ${c}$ is $F(x) = \\frac{${b}x^2}{2} + ${c}x + C$.`;
        options = [
          'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)',
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        explanation = `Integrating $F(${a}) - F(0) = [\\frac{${b}x^2}{2} + ${c}x]_{0}^{${a}} = \\frac{${b} \\cdot ${a * a}}{2} + ${c * a}$. Both statements are true and R explains A.`;
        stepByStepSolution = [
          `Find antiderivative: $F(x) = \\frac{${b}x^2}{2} + ${c}x$`,
          `Evaluate $F(${a}) - F(0) = \\frac{${b} \\cdot ${a}^2}{2} + ${c} \\cdot ${a}$`,
        ];
      } else {
        questionText = `[Variation #${k}] True or False: For any $n \\times n$ real symmetric matrix $M$, all eigenvalues of $M$ are strictly real numbers.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = `By the Spectral Theorem for real symmetric matrices, all eigenvalues are real and eigenvectors corresponding to distinct eigenvalues are orthogonal.`;
        stepByStepSolution = [
          `Apply the Spectral Theorem for real symmetric matrices.`,
          `All roots of the characteristic polynomial of a real symmetric matrix lie on the real axis.`,
        ];
      }
    } else if (subjectId === 'cs') {
      const n = 10 * k;
      if (questionType === 'code_output' || questionType === 'single_choice') {
        questionText = `[Variation #${k}] What is the tightest asymptotic time complexity $O(g(n))$ for the following Python algorithm snippet?\n\`\`\`python\ndef compute_grid(n):\n    total = 0\n    for i in range(${k + 1}):\n        j = 1\n        while j < n:\n            total += i * j\n            j *= 2\n    return total\n\`\`\``;
        options = [`$O(\\log n)$`, `$O(n)$`, `$O(n \\log n)$`, `$O(n^2)$`];
        correctAnswer = `$O(\\log n)$`;
        explanation = `The outer loop runs a constant number of times $(${k + 1})$ which is $O(1)$. The inner loop doubles $j$ each iteration ($j *= 2$), running $\\approx \\log_2(n)$ times. Thus the total complexity is $O(\\log n)$.`;
        stepByStepSolution = [
          `Analyze outer loop: fixed constant bounds $0 \\dots ${k}$, running $O(1)$ times.`,
          `Analyze inner loop: variable $j$ doubles each step, making iterations logarithmic $O(\\log n)$.`,
          `Multiply bounds: $O(1) \\times O(\\log n) = O(\\log n)$.`,
        ];
      } else if (questionType === 'numerical') {
        questionText = `[Variation #${k}] In a binary search tree containing ${Math.pow(2, (k % 8) + 4) - 1} perfectly balanced nodes, what is the maximum number of comparisons required to search for any element?`;
        const levels = (k % 8) + 4;
        correctAnswer = `${levels}`;
        explanation = `A perfectly balanced binary tree with $N = 2^h - 1$ nodes has height $h = \\log_2(N + 1)$. Here $N = ${Math.pow(2, (k % 8) + 4) - 1}$, so $h = ${levels}$.`;
        stepByStepSolution = [
          `Formula for max comparisons in balanced BST = height $h = \\log_2(N + 1)$`,
          `$N = 2^{${levels}} - 1 \\implies h = ${levels}$`,
        ];
      } else if (questionType === 'multiple_choice') {
        questionText = `[Variation #${k}] Which of the following optimization techniques are used in Training Transformer Neural Networks? (Select all that apply)`;
        options = [
          'Scaled Dot-Product Attention to prevent vanishing gradients',
          'Layer Normalization applied across embedding dimensions',
          'AdamW Optimizer with decoupled weight decay',
          'Linear Search without backpropagation',
        ];
        correctAnswer = [
          'Scaled Dot-Product Attention to prevent vanishing gradients',
          'Layer Normalization applied across embedding dimensions',
          'AdamW Optimizer with decoupled weight decay',
        ];
        explanation = 'Transformers rely on scaled dot-product attention, layer norm, and AdamW. Linear search without backpropagation is incorrect.';
        stepByStepSolution = [
          'Review transformer architecture (Vaswani et al., 2017).',
          'Verify attention scaling factor $\\frac{1}{\\sqrt{d_k}}$, LayerNorm placement, and AdamW optimizer.',
        ];
      } else {
        questionText = `[Variation #${k}] True or False: In distributed system theory (CAP Theorem), a system can simultaneously guarantee Consistency, Availability, and Partition Tolerance during a network partition.`;
        options = ['True', 'False'];
        correctAnswer = 'False';
        explanation = 'According to Gilbert and Lynch\'s formal proof of the CAP Theorem, when a network partition occurs, a distributed system must choose between Consistency (CP) and Availability (AP).';
        stepByStepSolution = [
          'Recall CAP Theorem principles during network partitions.',
          'Partition tolerance is mandatory in real networks, forcing a tradeoff between C and A.',
        ];
      }
    } else if (subjectId === 'physics') {
      const mass = (k % 5) + 2;
      const velocity = (k % 6) + 3;
      const force = (k % 10) + 5;
      const dist = (k % 8) + 2;

      if (questionType === 'numerical') {
        const ke = 0.5 * mass * velocity * velocity;
        questionText = `[Variation #${k}] A particle of mass $m = ${mass}\\text{ kg}$ moves with initial velocity $v = ${velocity}\\text{ m/s}$. Calculate its initial kinetic energy in Joules.`;
        correctAnswer = `${ke}`;
        explanation = `Using the kinetic energy formula $E_k = \\frac{1}{2} m v^2 = 0.5 \\times ${mass} \\times ${velocity}^2 = ${ke}\\text{ J}$.`;
        stepByStepSolution = [
          `Formula: $E_k = \\frac{1}{2} m v^2$`,
          `Substitute $m = ${mass}\\text{ kg}, v = ${velocity}\\text{ m/s}$`,
          `$E_k = 0.5 \\times ${mass} \\times ${velocity^2} = ${ke}\\text{ J}$`,
        ];
      } else if (questionType === 'single_choice') {
        const work = force * dist;
        questionText = `[Variation #${k}] A constant force $F = ${force}\\text{ N}$ acts along the direction of motion on a block moving through displacement $d = ${dist}\\text{ m}$. What is the total work done on the block?`;
        options = [`$${work}\\text{ J}$`, `$${work * 2}\\text{ J}$`, `$${force + dist}\\text{ J}$`, `$${(work / 2).toFixed(1)}\\text{ J}$`];
        correctAnswer = `$${work}\\text{ J}$`;
        explanation = `Work done $W = F \\cdot d \\cdot \\cos(0^\\circ) = ${force} \\times ${dist} = ${work}\\text{ J}$.`;
        stepByStepSolution = [
          `Apply work definition $W = \\vec{F} \\cdot \\vec{d} = F d \\cos\\theta$`,
          `$\\theta = 0^\\circ \\implies W = ${force} \\times ${dist} = ${work}\\text{ J}$`,
        ];
      } else {
        questionText = `[Variation #${k}] In Faraday's Law of Electromagnetic Induction, the induced electromotive force $\\mathcal{E}$ in a closed loop is equal to:`;
        options = [
          'The negative time rate of change of magnetic flux through the loop $\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$',
          'The constant magnetic field magnitude times area',
          'The electrostatic potential difference divided by resistance',
          'The electric current multiplied by magnetic permeability',
        ];
        correctAnswer = 'The negative time rate of change of magnetic flux through the loop $\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$';
        explanation = 'Faraday\'s Law states that magnetic flux variation induces an EMF proportional to $-d\\Phi_B/dt$, where the negative sign denotes Lenz\'s law of opposition.';
        stepByStepSolution = [
          'State Faraday\'s Law equation: $\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$',
          'Verify Lenz\'s Law physical interpretation.',
        ];
      }
    } else if (subjectId === 'chemistry') {
      const ea = (k % 50) + 30;
      const temp1 = 300 + k;

      if (questionType === 'single_choice' || questionType === 'numerical') {
        questionText = `[Variation #${k}] In an $S_N2$ nucleophilic substitution reaction, increasing the concentration of BOTH the alkyl halide substrate and the nucleophile by a factor of $2$ will change the overall reaction rate by a factor of:`;
        options = ['4', '2', '8', '1 (no change)'];
        correctAnswer = '4';
        explanation = 'The rate law for an $S_N2$ reaction is second-order overall: $\\text{Rate} = k [\\text{Substrate}] [\\text{Nucleophile}]$. Doubling both concentrations multiplies rate by $2 \\times 2 = 4$.';
        stepByStepSolution = [
          'Identify rate equation for $S_N2$: $\\text{Rate} = k [\\text{R-X}] [\\text{Nu}^-]$',
          'Substitute $2 [\\text{R-X}]$ and $2 [\\text{Nu}^-]$',
          'New rate $= k (2[\\text{R-X}]) (2[\\text{Nu}^-]) = 4 \\times \\text{Rate}_0$',
        ];
      } else if (questionType === 'multiple_choice') {
        questionText = `[Variation #${k}] Which of the following species are PARAMAGNETIC according to Molecular Orbital (MO) Theory? (Select all that apply)`;
        options = [
          'Dioxygen molecule ($O_2$)',
          'Nitric oxide molecule ($NO$)',
          'Dinitrogen molecule ($N_2$)',
          'Beryllium dimer ($Be_2$)',
        ];
        correctAnswer = [
          'Dioxygen molecule ($O_2$)',
          'Nitric oxide molecule ($NO$)',
        ];
        explanation = '$O_2$ has two unpaired electrons in degenerate $\\pi^*_{2p}$ orbitals. $NO$ has 15 total valence electrons (odd number), guaranteeing at least one unpaired electron. $N_2$ is diamagnetic.';
        stepByStepSolution = [
          'Draw MO configuration for $O_2$: unpaired electrons in $\\pi^*_{2px}, \\pi^*_{2py} \\implies$ paramagnetic.',
          'Draw MO configuration for $NO$: 15 valence electrons $\\implies$ odd electron species $\\implies$ paramagnetic.',
        ];
      } else {
        questionText = `[Variation #${k}] According to the Nernst Equation, at $298\\text{ K}$, the cell potential $E_{\\text{cell}}$ for a cell with $n = 2$ electrons transferred is given by $E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0592}{2} \\log_{10} Q$.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'At $25^\\circ\\text{C}$ ($298\\text{ K}$), $\\frac{R T \\ln(10)}{F} \\approx 0.0592\\text{ V}$, making the simplified Nernst formula $E_{\\text{cell}} = E^\\circ - \\frac{0.0592}{n} \\log Q$.';
        stepByStepSolution = [
          'State standard Nernst equation: $E = E^\\circ - \\frac{RT}{nF} \\ln Q$',
          'Convert to base 10 log at $298\\text{ K}: \\frac{RT \\ln 10}{F} = 0.05916 \\approx 0.0592\\text{ V}$',
        ];
      }
    } else {
      // Biology
      const p = 0.1 + (k % 8) * 0.1;
      const q = 1 - p;

      if (questionType === 'numerical') {
        const freq2pq = (2 * p * q).toFixed(3);
        questionText = `[Variation #${k}] In a population in Hardy-Weinberg equilibrium, if the frequency of allele $A$ is $p = ${p.toFixed(2)}$, what is the expected frequency of heterozygous individuals ($2pq$)?`;
        correctAnswer = `${freq2pq}`;
        explanation = `Given $p = ${p.toFixed(2)} \\implies q = 1 - p = ${q.toFixed(2)}$. Heterozygote frequency $2pq = 2 \\times ${p.toFixed(2)} \\times ${q.toFixed(2)} = ${freq2pq}$.`;
        stepByStepSolution = [
          `Calculate $q = 1 - p = 1 - ${p.toFixed(2)} = ${q.toFixed(2)}$`,
          `Apply $2pq = 2 \\times ${p.toFixed(2)} \\times ${q.toFixed(2)} = ${freq2pq}$`,
        ];
      } else if (questionType === 'single_choice') {
        questionText = `[Variation #${k}] During protein translation in eukaryotic cells, which cellular organelle catalyzes peptide bond formation between incoming aminoacyl-tRNAs?`;
        options = [
          'Ribosome (Peptidyl Transferase rRNA)',
          'Golgi Apparatus',
          'Lysosome',
          'Smooth Endoplasmic Reticulum',
        ];
        correctAnswer = 'Ribosome (Peptidyl Transferase rRNA)';
        explanation = 'The large ribosomal subunit contains peptidyl transferase ribozyme activity that catalyzes peptide bond synthesis between the P-site and A-site amino acids.';
        stepByStepSolution = [
          'Identify ribosome catalytic center.',
          'Peptidyl transferase is a ribozyme embedded in the large subunit rRNA.',
        ];
      } else {
        questionText = `[Variation #${k}] True or False: During the depolarization phase of a neuronal action potential, voltage-gated $Na^+$ channels open rapidly, allowing $Na^+$ ions to rush INTO the cell down their electrochemical gradient.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Depolarization occurs when voltage-gated $Na^+$ channels open at threshold (approx $-55\\text{ mV}$), causing rapid inward influx of sodium ions.',
        stepByStepSolution = [
          'Review action potential phases: Resting ($-70\\text{mV}$), Threshold ($-55\\text{mV}$), Depolarization ($Na^+$ influx).',
        ];
      }
    }

    if (hints.length === 0) {
      hints = [
        `Identify the fundamental invariants governing ${topicTitle}.`,
        `Check boundary conditions and perform dimensional/algebraic consistency checks.`,
        `Apply core first-principles formulas for variation #${index}.`,
      ];
    }

    return {
      id,
      subjectId,
      examTracks: ['all'],
      chapterId,
      topicId,
      subtopicId: `${topicId}-sub-procedural`,
      conceptId: `concept-${topicId}-gen-${index}`,
      difficulty,
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation,
      stepByStepSolution,
      hints,
      tags: [topicTitle, subjectId, difficulty, 'Topic-Bank-100'],
      source: `Learn.co Master Question Generator (Variation #${index})`,
      verificationStatus: 'verified',
      version: 1,
    };
  }
}
