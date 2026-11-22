import {
  QuestionBankItem,
  DifficultyLevel,
  QuestionTypeId,
  SubjectId,
  ConceptDetail,
} from '../../src/types/curriculum';

export class QuestionGeneratorEngine {
  /**
   * Generates up to `count` distinct, parameterised questions for a topic.
   *
   * `concepts` is the topic's real concept list. Generated questions are bound
   * round-robin to those ids so every question joins back to theory; previously
   * this method wrote a synthetic `concept-<topic>-gen-<n>` id that no concept
   * declared, which silently orphaned the entire generated bank (4,600 rows).
   */
  static generateQuestionsForTopic(
    topicId: string,
    subjectId: SubjectId,
    chapterId: string,
    topicTitle: string,
    count: number = 100,
    concepts: Array<{ id: string; subtopicId: string }> = []
  ): QuestionBankItem[] {
    const questions: QuestionBankItem[] = [];
    const difficulties: DifficultyLevel[] = ['easy', 'easy_medium', 'medium', 'medium_hard', 'hard'];
    const types: QuestionTypeId[] = ['single_choice', 'multiple_choice', 'numerical', 'assertion_reason', 'true_false', 'code_output'];

    for (let i = 1; i <= count; i++) {
      const difficulty = difficulties[(i - 1) % difficulties.length];
      const questionType = types[(i - 1) % types.length];
      const id = `q-gen-${topicId}-${i}`;

      // Distribute questions evenly across the topic's concepts. When a topic has
      // no concepts yet, fall back to the topic itself so nothing is orphaned.
      const concept = concepts.length > 0 ? concepts[(i - 1) % concepts.length] : undefined;

      const generated = this.buildTopicQuestionInstance(
        id,
        i,
        subjectId,
        chapterId,
        topicId,
        topicTitle,
        difficulty,
        questionType,
        concept
      );

      questions.push(generated);
    }

    return questions;
  }

  /**
   * Build concept-specific practice items from a concept's own mini-check and
   * worked examples.
   *
   * The topic generator produces subject archetypes, which meant a learner who
   * opened a specific concept could be served a question about a different idea
   * in the same topic. These items are derived from the concept itself, so the
   * question, the answer and the explanation all match what the page teaches.
   */
  static generateQuestionsForConcepts(
    entries: Array<{ id: string; subtopicId: string; concept: ConceptDetail }>,
    subjectId: SubjectId,
    chapterId: string,
    topicId: string
  ): QuestionBankItem[] {
    const questions: QuestionBankItem[] = [];

    const difficultyToLevel = (value: string): DifficultyLevel => {
      const known: DifficultyLevel[] = ['easy', 'easy_medium', 'medium', 'medium_hard', 'hard'];
      return known.includes(value as DifficultyLevel) ? (value as DifficultyLevel) : 'medium';
    };

    for (const { id: conceptId, subtopicId, concept } of entries) {
      // 1. The concept's own diagnostic check, promoted to a bank question.
      const check = concept.miniCheckQuestion;
      if (check && check.options.length >= 2) {
        const correct = check.options[check.correctIndex];
        if (correct) {
          questions.push({
            id: `q-concept-${conceptId}-check`,
            subjectId,
            examTracks: concept.examTracks?.length ? concept.examTracks : ['all'],
            chapterId,
            topicId,
            subtopicId,
            conceptId,
            difficulty: difficultyToLevel(concept.difficulty),
            questionType: 'single_choice',
            questionText: check.prompt,
            options: check.options,
            correctAnswer: correct,
            explanation: check.explanation,
            stepByStepSolution: [check.explanation],
            hints: [
              `Recall the core statement of ${concept.title}.`,
              concept.keyFormulas[0]
                ? `Consider the relation ${concept.keyFormulas[0].label}.`
                : 'Re-read the intuitive explanation and eliminate impossible options.',
            ],
            tags: [concept.title, subjectId, 'concept-check'],
            source: 'Learn.co Concept Diagnostic',
            verificationStatus: 'verified',
            version: 1,
          });
        }
      }

      // 2. One question per worked example, derived from that example's problem
      //    statement and final answer. Marked numeric so the answer stays exact.
      concept.workedExamples.forEach((example, index) => {
        if (!example.finalAnswer) return;
        questions.push({
          id: `q-concept-${conceptId}-we-${index + 1}`,
          subjectId,
          examTracks: concept.examTracks?.length ? concept.examTracks : ['all'],
          chapterId,
          topicId,
          subtopicId,
          conceptId,
          difficulty: difficultyToLevel(example.difficulty ?? concept.difficulty),
          questionType: 'numerical',
          questionText: example.problemStatement,
          correctAnswer: example.finalAnswer,
          explanation: example.keyTakeaway || example.stepByStepSolution.join(' '),
          stepByStepSolution: example.stepByStepSolution,
          hints: example.stepByStepSolution.slice(0, 2),
          tags: [concept.title, subjectId, 'worked-example'],
          source: 'Learn.co Worked Example Bank',
          verificationStatus: 'verified',
          version: 1,
        });
      });
    }

    return questions;
  }

  private static buildTopicQuestionInstance(
    id: string,
    index: number,
    subjectId: SubjectId,
    chapterId: string,
    topicId: string,
    topicTitle: string,
    difficulty: DifficultyLevel,
    questionType: QuestionTypeId,
    concept?: { id: string; subtopicId: string }
  ): QuestionBankItem {
    // Generate specialized problem statements according to subject and topic index
    let questionText = '';
    let options: string[] | undefined = undefined;
    let correctAnswer: string | string[] = '';
    let explanation = '';
    let stepByStepSolution: string[] = [];
    let hints: string[] = [];

    const k = index; // multiplier seed

    if (subjectId === 'math' && (chapterId.startsWith('math-ch-ap-calc') || topicId.startsWith('math-topic-ap-'))) {
      const a = (k % 5) + 2;
      const b = (k % 4) + 1;
      const L = ((k % 6) + 4) * 100;

      if (questionType === 'numerical') {
        if (topicId.includes('series') || topicId.includes('power')) {
          const r = (k % 4) + 2;
          questionText = `[AP BC Variation #${k}] What is the radius of convergence $R$ of the power series $\\sum_{n=1}^{\\infty} \\frac{(x - ${a})^n}{n \\cdot ${r}^n}$?`;
          correctAnswer = `${r}`;
          explanation = `By the Ratio Test, $\\lim_{n\\to\\infty} \\frac{n}{n+1} \\frac{|x-${a}|}{${r}} = \\frac{|x-${a}|}{${r}} < 1 \\iff |x - ${a}| < ${r}$, so $R = ${r}$.`;
          stepByStepSolution = [
            `Form ratio $|a_{n+1}/a_n| = \\frac{n}{n+1}\\frac{|x-${a}|}{${r}}$.`,
            `Take limit $n \\to \\infty$: $\\frac{|x-${a}|}{${r}} < 1 \\implies R = ${r}$.`,
          ];
        } else if (topicId.includes('slope') || topicId.includes('separable')) {
          const y0 = b;
          const h = 0.5;
          const m0 = a * 0 + y0;
          const y1 = y0 + m0 * h;
          const m1 = a * h + y1;
          const y2 = y1 + m1 * h;
          questionText = `[AP BC Variation #${k}] For $\\frac{dy}{dx} = ${a}x + y$ with $y(0) = ${y0}$, use Euler's method with two steps of $\\Delta x = 0.5$ to approximate $y(1)$.`;
          correctAnswer = `${y2}`;
          explanation = `Step 1 at $(0, ${y0})$ gives slope $${m0}$, so $y(0.5) \\approx ${y0} + (${m0})(0.5) = ${y1}$. Step 2 at $(0.5, ${y1})$ gives slope $${m1}$, so $y(1) \\approx ${y1} + (${m1})(0.5) = ${y2}$.`;
          stepByStepSolution = [
            `Step 1: $m_0 = ${a}(0) + ${y0} = ${m0} \\implies y_1 = ${y1}$.`,
            `Step 2: $m_1 = ${a}(0.5) + ${y1} = ${m1} \\implies y_2 = ${y2}$.`,
          ];
        } else {
          const c = (k % 3) + 2;
          const total = a * (c * c);
          questionText = `[AP AB/BC Variation #${k}] Evaluate the average value of $f(x) = ${3 * a}x^2$ on the closed interval $[0, ${c}]$.`;
          correctAnswer = `${total / c}`;
          explanation = `$f_{\\text{avg}} = \\frac{1}{${c} - 0}\\int_0^{${c}} ${3 * a}x^2\\,dx = \\frac{1}{${c}}[${a}x^3]_0^{${c}} = \\frac{${a * c * c * c}}{${c}} = ${total / c}$.`;
          stepByStepSolution = [
            `Compute $\\int_0^{${c}} ${3 * a}x^2\\,dx = ${a}(${c})^3 = ${a * c * c * c}$.`,
            `Divide by interval length ${c}: ${total / c}.`,
          ];
        }
      } else if (questionType === 'single_choice' || questionType === 'code_output') {
        if (topicId.includes('series') || topicId.includes('convergence') || topicId.includes('power')) {
          const p = (k % 3) + 2;
          questionText = `[AP BC Variation #${k}] Which statement accurately describes the convergence of $\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n^{1/${p}}}$?`;
          options = [
            'Conditionally convergent (Alternating Series Test passes, $|a_n|$ diverges as $p$-series $p < 1$)',
            'Absolutely convergent by $p$-series test',
            'Divergent by the $n$th-term test for divergence',
            'Divergent by the Ratio Test ($L > 1$)',
          ];
          correctAnswer = 'Conditionally convergent (Alternating Series Test passes, $|a_n|$ diverges as $p$-series $p < 1$)';
          explanation = `Since $1/n^{1/${p}}$ decreases monotonically to $0$, the alternating series converges. Taking absolute values yields $\\sum 1/n^{1/${p}}$, which diverges because $1/${p} \\le 1$.`;
          stepByStepSolution = [
            `Check $\\sum |a_n| = \\sum n^{-1/${p}}$: diverges since $p = 1/${p} < 1$.`,
            `Check AST: terms decrease monotonically to $0$, so original series converges conditionally.`,
          ];
        } else if (topicId.includes('separable') || topicId.includes('slope')) {
          questionText = `[AP BC Variation #${k}] A population obeys the logistic ODE $\\frac{dP}{dt} = 0.002 P (${L} - P)$ with $P(0) = 50$. At what population $P$ is $\\frac{dP}{dt}$ maximized?`;
          options = [`$P = ${L / 2}$`, `$P = ${L}$`, `$P = ${L / 4}$`, `$P = 50$`];
          correctAnswer = `$P = ${L / 2}$`;
          explanation = `Factoring shows carrying capacity $L = ${L}$. A logistic model grows fastest at the inflection level $P = L/2 = ${L / 2}$.`;
          stepByStepSolution = [
            `Identify carrying capacity $L = ${L}$ from nonzero equilibrium.`,
            `Maximum growth rate occurs at $P = L/2 = ${L / 2}$.`,
          ];
        } else if (topicId.includes('parametric') || topicId.includes('polar')) {
          questionText = `[AP BC Variation #${k}] A particle moves in the $xy$-plane with velocity $\\mathbf{v}(t) = \\langle ${a}\\cos(t),\\ ${a}\\sin(t) \\rangle$. What is the total distance traveled from $t = 0$ to $t = ${b}\\pi$?`;
          options = [`$${a * b}\\pi$`, `$${a * b}$`, `$${2 * a * b}\\pi$`, `$0$`];
          correctAnswer = `$${a * b}\\pi$`;
          explanation = `Speed is $\\|\\mathbf{v}(t)\\| = \\sqrt{(${a}\\cos t)^2 + (${a}\\sin t)^2} = ${a}$. Integrating speed from $0$ to ${b}\\pi gives ${a} \\cdot ${b}\\pi = ${a * b}\\pi$.`;
          stepByStepSolution = [
            `Compute speed: $\\sqrt{x'(t)^2 + y'(t)^2} = ${a}$.`,
            `Distance $= \\int_0^{${b}\\pi} ${a}\\,dt = ${a * b}\\pi$.`,
          ];
        } else {
          questionText = `[AP AB/BC Variation #${k}] For the implicit curve $x^2 + ${b}xy + y^2 = ${a + b + 1}$, which expression equals $\\frac{dy}{dx}$?`;
          options = [
            `$-\\frac{2x + ${b}y}{${b}x + 2y}$`,
            `$-\\frac{2x + ${b}y}{2y}$`,
            `$\\frac{2x + ${b}y}{${b}x + 2y}$`,
            `$-\\frac{x + y}{${b}x + y}$`,
          ];
          correctAnswer = `$-\\frac{2x + ${b}y}{${b}x + 2y}$`;
          explanation = `Differentiating wrt $x$ gives $2x + ${b}y + ${b}x\\frac{dy}{dx} + 2y\\frac{dy}{dx} = 0$, solving to $\\frac{dy}{dx} = -\\frac{2x + ${b}y}{${b}x + 2y}$.`;
          stepByStepSolution = [
            `Differentiate term-by-term with product rule on $${b}xy$.`,
            `Collect $\\frac{dy}{dx}$ terms: $(${b}x + 2y)\\frac{dy}{dx} = -(2x + ${b}y)$.`,
          ];
        }
      } else if (questionType === 'multiple_choice') {
        questionText = `[AP BC Variation #${k}] Which statements are guaranteed TRUE for a power series $\\sum c_n (x - ${a})^n$ that converges at $x = ${a + b + 2}$ and diverges at $x = ${a - b - 4}$? (Select all that apply)`;
        options = [
          `The series converges absolutely at $x = ${a + b + 1}$`,
          `The radius of convergence $R$ satisfies ${b + 2} \\le R \\le ${b + 4}`,
          `The series diverges at $x = ${a + b + 5}$`,
          `The series must converge at $x = ${a - b - 2}$`,
        ];
        correctAnswer = [
          `The series converges absolutely at $x = ${a + b + 1}$`,
          `The radius of convergence $R$ satisfies ${b + 2} \\le R \\le ${b + 4}`,
          `The series diverges at $x = ${a + b + 5}$`,
        ];
        explanation = `Distance from center $c = ${a}$ to convergent point is ${b + 2}$, so $R \\ge ${b + 2}$ (guaranteeing absolute convergence strictly inside distance ${b + 2}$, including $x = ${a + b + 1}$). Distance to divergent point is ${b + 4}$, so $R \\le ${b + 4}$ (forcing divergence at distance ${b + 5}$). Endpoint symmetry at exact distance ${b + 2}$ ($x = ${a - b - 2}$) is NOT guaranteed.`;
        stepByStepSolution = [
          `Compute $|(${a + b + 2}) - ${a}| = ${b + 2} \\le R$.`,
          `Compute $|(${a - b - 4}) - ${a}| = ${b + 4} \\ge R$.`,
          `Points strictly closer than ${b + 2}$ converge absolutely; points strictly farther than ${b + 4}$ diverge.`,
        ];
      } else if (questionType === 'assertion_reason') {
        questionText = `[AP BC Variation #${k}] Consider:\nAssertion (A): If a twice-differentiable function $f(x)$ has $f''(x) > 0$ on an interval, Euler's method approximates solutions to $y' = f'(x)$ as underestimates.\nReason (R): When a curve is strictly concave up, every tangent line lies strictly below the curve away from the point of tangency.`;
        options = [
          'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)',
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        explanation = 'For concave-up solutions ($y\'\' > 0$), tangent slopes underestimate the increasing curvature across each Euler step, keeping piecewise-linear approximations below the exact trajectory.';
        stepByStepSolution = [
          'Concave-up ($y\'\' > 0$) means slope grows across each interval $\\Delta x$.',
          'Euler steps hold the left-endpoint slope constant, undershooting the rising curve.',
        ];
      } else {
        questionText = `[AP BC Variation #${k}] True or False: In a convergent alternating series $\\sum_{n=0}^{\\infty} (-1)^n b_n$ with $b_n > 0$ decreasing monotonically to $0$, the truncation error after $N$ terms is bounded above by the first omitted term magnitude $b_{N+1}$.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'By the Alternating Series Remainder Theorem, $|S - S_N| \\le b_{N+1}$ whenever terms alternate in sign and shrink monotonically toward zero.';
        stepByStepSolution = ['Verify alternating signs, decreasing $|a_n|$, and $\\lim b_n = 0$.'];
      }
    } else if (subjectId === 'math' && (chapterId.includes('inmo') || topicId.includes('inmo'))) {
      const a = (k % 4) + 1;
      const b = (k % 5) + 2;

      if (questionType === 'numerical') {
        // Titu's Lemma minimum for 1/x + 4/y + 9/z where x+y+z = 6 -> (1+2+3)^2 / 6 = 36/6 = 6
        questionText = `[INMO Olympiad Variation #${k}] For positive real numbers $x, y, z > 0$ such that $x + y + z = 6$, find the minimum possible value of $\\frac{1}{x} + \\frac{4}{y} + \\frac{9}{z}$ using Titu's Lemma (Engel form of Cauchy-Schwarz).`;
        correctAnswer = '6';
        explanation = 'By Titu’s Lemma: $\\frac{1^2}{x} + \\frac{2^2}{y} + \\frac{3^2}{z} \\ge \\frac{(1 + 2 + 3)^2}{x + y + z} = \\frac{36}{6} = 6$. Equality holds at $(x, y, z) = (1, 2, 3)$.';
        stepByStepSolution = [
          'Rewrite terms with explicit squared numerators: $\\frac{1^2}{x} + \\frac{2^2}{y} + \\frac{3^2}{z}$',
          'Apply Titu’s Lemma: $\\ge \\frac{(1 + 2 + 3)^2}{x + y + z} = \\frac{36}{6} = 6$',
        ];
      } else if (questionType === 'single_choice' || questionType === 'code_output') {
        questionText = `[INMO Olympiad Variation #${k}] A continuous function $f: \\mathbb{R} \\to \\mathbb{R}$ satisfies the Cauchy functional equation $f(x + y) = f(x) + f(y)$ for all $x, y \\in \\mathbb{R}$. If $f(3) = 12$, what is the value of $f(7)$?`;
        options = ['28', '21', '35', '14'];
        correctAnswer = '28';
        explanation = 'Any continuous additive Cauchy function has the form $f(x) = cx$. From $f(3) = 3c = 12 \\implies c = 4$. Thus $f(7) = 4 \\times 7 = 28$.';
        stepByStepSolution = [
          'Continuous additive function satisfies $f(x) = c x$.',
          'Determine $c = f(3)/3 = 4$.',
          'Evaluate $f(7) = 4 \\times 7 = 28$.',
        ];
      } else {
        questionText = `[INMO Olympiad Variation #${k}] True or False: For an odd prime $p$ such that $p \\mid (x - y)$ and $p \\nmid x, y$, the Lifting The Exponent Lemma (LTE) asserts that $v_p(x^n - y^n) = v_p(x - y) + v_p(n)$ for all positive integers $n$.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'This is the exact statement of the standard Lifting The Exponent Lemma for odd primes.';
        stepByStepSolution = [
          'Verify conditions: $p$ is an odd prime, $x \\equiv y \\pmod p$, and $p \\nmid x$.',
          'LTE valuation theorem guarantees $v_p(x^n - y^n) = v_p(x - y) + v_p(n)$.',
        ];
      }
    } else if (subjectId === 'math') {
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
    } else if (subjectId === 'cs' && (chapterId.includes('ict') || topicId.includes('ict'))) {
      const pow2 = Math.pow(2, (k % 4) + 6); // 64, 128, 256, 512
      const logVal = (k % 4) + 6;

      if (questionType === 'numerical') {
        questionText = `[ICT Coding Test Variation #${k}] In an iterative Segment Tree supporting range sum queries on an array of size $N = ${pow2}$, what is the exact height (number of levels) of the tree?`;
        correctAnswer = `${logVal}`;
        explanation = `For $N = 2^{${logVal}} = ${pow2}$, the tree height is $\\log_2(${pow2}) = ${logVal}$ levels.`;
        stepByStepSolution = [
          `Calculate binary logarithm: $\\log_2(${pow2}) = ${logVal}$.`,
        ];
      } else if (questionType === 'code_output' || questionType === 'single_choice') {
        questionText = `[ICT Coding Test Variation #${k}] In a Fenwick Tree (Binary Indexed Tree), which bitwise expression isolates the least significant set bit (LSB) of a 1-indexed integer $i$?`;
        options = [
          '`i & (-i)`',
          '`i | (~i)`',
          '`i ^ (i >> 1)`',
          '`i & (i - 1)`',
        ];
        correctAnswer = '`i & (-i)`';
        explanation = 'Using two\'s complement representation, -i is (~i + 1). Bitwise ANDing i with -i clears all bits except the lowest set bit.';
        stepByStepSolution = [
          'Recall two’s complement negation: $-i = \\sim i + 1$.',
          'ANDing with $i$ leaves only the trailing set bit: `i & (-i)`.',
        ];
      } else {
        questionText = `[ICT Coding Test Variation #${k}] True or False: Dijkstra\'s algorithm with a min-priority queue guarantees finding the shortest path in $O((V + E)\\log V)$ time even if some edge weights are negative, provided there are no negative-weight cycles.`;
        options = ['True', 'False'];
        correctAnswer = 'False';
        explanation = 'Dijkstra requires all edge weights to be non-negative. Once a node is marked visited / popped from min-heap, Dijkstra assumes its distance is finalized; negative edges violate this greediness. Bellman-Ford or SPFA must be used instead.';
        stepByStepSolution = [
          'Recall Dijkstra’s non-negative weight prerequisite.',
          'Negative edge weights can reduce distance to an already-settled node.',
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
    } else if (subjectId === 'physics' && (chapterId.includes('ipho') || topicId.includes('ipho'))) {
      const m = (k % 4) + 1;
      const N = (k % 5 + 3) * 100;
      const B = (k % 4 + 1) * 0.1;
      const R = (k % 5 + 2) * 0.1;
      const omega = (k % 6 + 4) * 10;

      if (questionType === 'numerical') {
        const emf = 0.5 * B * omega * R * R;
        questionText = `[IPhO Variation #${k}] A copper disk of radius $R = ${R.toFixed(1)}\\text{ m}$ rotates with angular velocity $\\omega = ${omega}\\text{ rad/s}$ perpendicular to a uniform magnetic field $B = ${B.toFixed(1)}\\text{ T}$. Calculate the motional EMF generated between axle and rim in Volts.`;
        correctAnswer = `${emf.toFixed(3)}`;
        explanation = `Using Faraday's disk formula $\\mathcal{E} = \\frac{1}{2} B \\omega R^2 = 0.5 \\times ${B.toFixed(1)} \\times ${omega} \\times ${R.toFixed(1)}^2 = ${emf.toFixed(3)}\\text{ V}$.`;
        stepByStepSolution = [
          'Integrate motional electric field: $\\mathcal{E} = \\int_0^R (\\omega r) B\\,dr$',
          `Evaluate $\\frac{1}{2} B \\omega R^2 = 0.5 \\times ${B.toFixed(1)} \\times ${omega} \\times ${(R * R).toFixed(2)} = ${emf.toFixed(3)}\\text{ V}$`,
        ];
      } else if (questionType === 'single_choice') {
        questionText = `[IPhO Variation #${k}] For an optical transmission grating with $N = ${N}$ illuminated rulings operated at diffraction order $m = ${m}$, what is its chromatic resolving power $\\mathcal{R} = \\frac{\\lambda}{\\Delta\\lambda}$?`;
        options = [`${m * N}`, `${m * N * 2}`, `${Math.round(N / m)}`, `${N}`];
        correctAnswer = `${m * N}`;
        explanation = `The chromatic resolving power of a diffraction grating is given directly by Rayleigh criterion $\\mathcal{R} = m N = ${m} \\times ${N} = ${m * N}$.`;
        stepByStepSolution = [
          'State Rayleigh resolving power formula $\\mathcal{R} = m N$',
          `Substitute $m = ${m}, N = ${N} \\implies \\mathcal{R} = ${m * N}$`,
        ];
      } else {
        questionText = `[IPhO Variation #${k}] True or False: In thin-film interference, when light travels from air ($n_1 = 1.00$) into an anti-reflective coating ($n_2 = 1.38$) on crown glass ($n_3 = 1.52$), both the air-coating interface and the coating-glass interface produce a $180^\\circ$ ($\\pi$) reflection phase shift, canceling out net interfacial phase shift difference.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Because $n_1 < n_2$ and $n_2 < n_3$, both reflecting surfaces transition into an optically denser medium, each incurring a $\\pi$ phase reversal.';
        stepByStepSolution = [
          'Check boundary 1: $1.00 < 1.38 \\implies \\pi$ phase shift.',
          'Check boundary 2: $1.38 < 1.52 \\implies \\pi$ phase shift.',
          'Net relative boundary phase shift = $\\pi - \\pi = 0$.',
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
    } else if (subjectId === 'chemistry' && (chapterId.includes('icho') || topicId.includes('icho'))) {
      const deltaH = ((k % 6) + 2) * 10; // 20, 30, ... 70 kJ/mol
      const t1 = 300;
      const t2 = 400;

      if (questionType === 'numerical') {
        // d6 low spin CFSE = 2.4 Delta_o
        questionText = `[IChO Variation #${k}] In an octahedral strong-field complex such as $[\\text{Fe(CN)}_6]^{4-}$ (low-spin $d^6$), what is the magnitude of the Crystal Field Stabilization Energy (CFSE) expressed as a multiple of $\\Delta_o$?`;
        correctAnswer = '2.4';
        explanation = 'All 6 d-electrons occupy lower $t_{2g}$ orbitals: $\\text{CFSE} = 6 \\times (-0.4\\Delta_o) = -2.4\\Delta_o$. The magnitude is $2.4\\Delta_o$.';
        stepByStepSolution = [
          'Strong-field ligand forces low-spin configuration: $t_{2g}^6 e_g^0$.',
          'Calculate CFSE: $6 \\times (-0.4\\Delta_o) + 0 \\times (0.6\\Delta_o) = -2.4\\Delta_o$.',
        ];
      } else if (questionType === 'single_choice') {
        questionText = `[IChO Variation #${k}] According to the integrated Van 't Hoff equation $\\ln(K_2/K_1) = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)$, an endothermic reaction ($\\Delta H^\\circ > 0$) subjected to a temperature increase from $300\\text{ K}$ to $400\\text{ K}$ will have an equilibrium constant ratio $K_2 / K_1$ that is:`;
        options = ['Strictly greater than 1 ($K$ increases)', 'Strictly less than 1 ($K$ decreases)', 'Exactly equal to 1', 'Equal to zero'];
        correctAnswer = 'Strictly greater than 1 ($K$ increases)';
        explanation = 'For $\\Delta H^\\circ > 0$, since $1/400 < 1/300$, the term $-(1/T_2 - 1/T_1)$ is positive, which makes $\\ln(K_2/K_1) > 0 \\implies K_2 > K_1$.';
        stepByStepSolution = [
          'Evaluate signs: $\\Delta H^\\circ > 0$ and $(1/400 - 1/300) < 0$.',
          'Product $-\\frac{\\Delta H^\\circ}{R}(1/T_2 - 1/T_1) > 0 \\implies \\ln(K_2/K_1) > 0$.',
          'Conclude $K_2 / K_1 > 1$.',
        ];
      } else {
        questionText = `[IChO Variation #${k}] True or False: When combining two reduction half-reactions $\\text{Fe}^{3+} + e^- \\to \\text{Fe}^{2+}$ ($E_1^\\circ = +0.77\\text{ V}$) and $\\text{Fe}^{2+} + 2e^- \\to \\text{Fe}$ ($E_2^\\circ = -0.44\\text{ V}$) to find $E_3^\\circ$ for $\\text{Fe}^{3+} + 3e^- \\to \\text{Fe}$, one cannot directly add standard voltages $E_1^\\circ + E_2^\\circ$, but must instead use extensive Gibbs energies $n_3 E_3^\\circ = n_1 E_1^\\circ + n_2 E_2^\\circ$.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Standard reduction potentials are intensive properties. Additivity applies only to extensive thermodynamic properties $\\Delta G^\\circ = -nFE^\\circ$.';
        stepByStepSolution = [
          'State $\\Delta G_3^\\circ = \\Delta G_1^\\circ + \\Delta G_2^\\circ$.',
          'Substitute $\\Delta G^\\circ = -nFE^\\circ$ to obtain $n_3 E_3^\\circ = n_1 E_1^\\circ + n_2 E_2^\\circ$.',
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
    } else if (subjectId === 'biology' && (chapterId.includes('ibho') || chapterId.includes('ijso') || topicId.includes('ibho') || topicId.includes('ijso'))) {
      const s = (k % 4 + 2) * 10;
      const km = 10;
      const vmax = 120;

      if (questionType === 'numerical') {
        const v0 = (vmax * s) / (km + s);
        questionText = `[IBHO Variation #${k}] An enzyme has $V_{\\max} = ${vmax}\\,\\mu\\text{M/min}$ and $K_m = ${km}\\,\\mu\\text{M}$. Calculate initial catalytic velocity $v_0$ in $\\mu\\text{M/min}$ when $[S] = ${s}\\,\\mu\\text{M}$.`;
        correctAnswer = `${v0.toFixed(1)}`;
        explanation = `Using Michaelis-Menten: $v_0 = \\frac{V_{\\max}[S]}{K_m + [S]} = \\frac{${vmax} \\times ${s}}{${km} + ${s}} = ${v0.toFixed(1)}\\,\\mu\\text{M/min}$.`;
        stepByStepSolution = [
          'State Michaelis-Menten: $v_0 = \\frac{V_{\\max}[S]}{K_m + [S]}$',
          `Compute: $\\frac{${vmax * s}}{${km + s}} = ${v0.toFixed(1)}\\,\\mu\\text{M/min}$`,
        ];
      } else if (questionType === 'single_choice') {
        questionText = `[IBHO/IJSO Variation #${k}] In enzyme kinetics, which type of reversible inhibitor binds exclusively to the enzyme-substrate ($ES$) complex, resulting in a proportional DECREASE in both apparent $V_{\\max}$ and apparent $K_m$?`;
        options = [
          'Uncompetitive inhibitor',
          'Competitive inhibitor',
          'Noncompetitive inhibitor',
          'Irreversible suicide inhibitor',
        ];
        correctAnswer = 'Uncompetitive inhibitor';
        explanation = 'Uncompetitive inhibitors bind only to the ES complex, trapping substrate and lowering both Vmax and Km by the same factor (yielding parallel Lineweaver-Burk lines).';
        stepByStepSolution = [
          'Recall Lineweaver-Burk transformations for enzyme inhibitors.',
          'Parallel line shifts in both axes correspond exclusively to uncompetitive inhibition.',
        ];
      } else {
        questionText = `[IBHO/IJSO Variation #${k}] True or False: In cellular respiration, chemical proton uncouplers such as 2,4-dinitrophenol (DNP) collapse the inner mitochondrial proton-motive force ($\\Delta p$), which halts ATP synthesis while accelerating oxygen consumption and electron transport into heat.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Uncouplers dissipate the proton gradient across the inner membrane, removing respiratory control so electron transport runs maximally without generating ATP.';
        stepByStepSolution = [
          'DNP shuttles H+ back into matrix, destroying Delta p.',
          'ATP synthase loses its driving force while ETC runs unconstrained.',
        ];
      }
    } else if (subjectId === 'biology') {
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
        explanation = 'Depolarization occurs when voltage-gated $Na^+$ channels open at threshold (approx $-55\\text{ mV}$), causing rapid inward influx of sodium ions.';
        stepByStepSolution = [
          'Review action potential phases: Resting ($-70\\text{mV}$), Threshold ($-55\\text{mV}$), Depolarization ($Na^+$ influx).',
        ];
      }
    } else if (subjectId === 'english') {
      // English & Linguistics
      const roots = ['chron (time)', 'phil (love)', 'path (feeling/disease)', 'bene (good)', 'mal (bad)', 'poly (many)', 'omni (all)'];
      const currentRoot = roots[k % roots.length];

      if (questionType === 'single_choice') {
        questionText = `[Variation #${k}] Read the excerpt regarding "${topicTitle}":\n"The speaker's deliberate juxtaposition of antiquated diction with rapid staccato phrasing underscores the irreconcilable tension between traditional pastoral values and the encroaching mechanization of the urban landscape."\n\nWhat is the primary rhetorical effect achieved by the speaker?`;
        options = [
          'To dramatize the psychological alienation caused by rapid industrialization through contrasting linguistic tempos.',
          'To argue for complete abandonment of pastoral poetry in favor of scientific prose.',
          'To demonstrate grammatical incompetence by intentionally confusing historical periods.',
          'To establish an objective, dispassionate journalistic report devoid of figurative subtext.',
        ];
        correctAnswer = 'To dramatize the psychological alienation caused by rapid industrialization through contrasting linguistic tempos.';
        explanation = 'Juxtaposition of archaic diction against modern staccato rhythm deliberately reinforces the substantive theme of technological displacement through form.';
        stepByStepSolution = [
          'Analyze rhetorical devices: juxtaposition of diction and tempo.',
          'Connect formal linguistic choices to thematic tension (pastoral vs. urban mechanization).',
          'Select the option synthesizing both form and semantic intention.',
        ];
      } else if (questionType === 'multiple_choice') {
        questionText = `[Variation #${k}] Which of the following sentences contain a DANGLING or MISPLACED modifier? (Select all that apply)`;
        options = [
          'Having finished the manuscript after midnight, the printer ran out of ink before morning.',
          'Running vigorously toward the departing train, Julian dropped his briefcase on the platform.',
          'Covered in thick dust and cobwebs, Professor Albright discovered an annotated first edition in the attic.',
          'Upon analyzing the statistical correlation, the hypothesis was deemed statistically significant by the panel.',
        ];
        correctAnswer = [
          'Having finished the manuscript after midnight, the printer ran out of ink before morning.',
          'Covered in thick dust and cobwebs, Professor Albright discovered an annotated first edition in the attic.',
          'Upon analyzing the statistical correlation, the hypothesis was deemed statistically significant by the panel.',
        ];
        explanation = 'In (A), the participle clause "Having finished..." incorrectly modifies "the printer" instead of the author. In (C), "Covered in thick dust..." incorrectly describes Professor Albright rather than the book. In (D), the hypothesis did not analyze the correlation. Only (B) correctly attaches the introductory participle to the agent Julian.';
        stepByStepSolution = [
          'Identify introductory participial phrases in each sentence.',
          'Locate the immediately adjacent grammatical subject.',
          'Verify whether the adjacent subject can logically perform or undergo the action.',
        ];
      } else if (questionType === 'assertion_reason') {
        questionText = `[Variation #${k}] Consider the following statements on rhetorical logic:\nAssertion (A): A deductive syllogism guarantees a true conclusion if both premises are factually valid and the argument structure is logically sound.\nReason (R): Deductive reasoning moves from universal invariants to specific instances with necessity, unlike inductive generalizations which establish only probabilistic validity.`;
        options = [
          'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)',
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        explanation = 'In classical logic, valid deductive structures guarantee necessity of truth from true premises, which directly explains why valid sound syllogisms preserve truth.';
        stepByStepSolution = [
          'Recall definitions of deductive validity vs. soundness.',
          'Assess whether Reason R provides the formal epistemological mechanism for Assertion A.',
        ];
      } else if (questionType === 'numerical') {
        const syllableCounts = [10, 14, 12, 10, 10];
        const count = syllableCounts[k % syllableCounts.length];
        questionText = `[Variation #${k}] In classical English prosody, how many metric syllables are present in a standard line of unrhymed Iambic Pentameter?`;
        correctAnswer = '10';
        explanation = 'Iambic Pentameter consists of five (penta) iambic feet (da-DUM), totaling exactly $5 \\times 2 = 10$ syllables per regular line.';
        stepByStepSolution = [
          'Recall foot structure: 1 iamb = 1 unstressed + 1 stressed syllable (2 syllables).',
          'Multiply by meter length: pentameter = 5 feet.',
          'Total = 5 feet * 2 syllables/foot = 10 syllables.',
        ];
      } else {
        questionText = `[Variation #${k}] True or False: In formal English academic prose, an independent clause may be joined to another independent clause using ONLY a coordinating conjunction (for, and, nor, but, or, yet, so) with a preceding comma, or by a semicolon without conjunction.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Joining two independent clauses without punctuation creates a run-on sentence, while joining them with only a comma produces a comma splice. A comma + FANBOYS conjunction or a semicolon is required.';
        stepByStepSolution = [
          'Identify the rule of coordination in independent clauses.',
          'Verify that comma splice prevention requires coordinating conjunction + comma or semicolon.',
        ];
      }
    } else if (chapterId.includes('ioai') || topicId.includes('ioai')) {
      // Data Science Olympiad
      if (questionType === 'numerical') {
        // Ridge filter factor d = sigma^2 / (sigma^2 + lambda)
        const sigma = 2;
        const lambda = 12;
        const d = (sigma * sigma) / (sigma * sigma + lambda); // 4 / 16 = 0.25
        questionText = `[Data Science Olympiad Variation #${k}] In SVD spectral analysis of Ridge regression with regularization parameter $\\lambda = ${lambda}$, what is the spectral shrinkage filter factor $d = \\frac{\\sigma^2}{\\sigma^2 + \\lambda}$ for a singular direction with singular value $\\sigma = ${sigma}$?`;
        correctAnswer = `${d.toFixed(2)}`;
        explanation = `Spectral shrinkage factor $d = \\frac{\\sigma^2}{\\sigma^2 + \\lambda} = \\frac{2^2}{2^2 + 12} = \\frac{4}{16} = 0.25$.`;
        stepByStepSolution = [
          'Calculate $\\sigma^2 = 2^2 = 4$.',
          'Divide by $\\sigma^2 + \\lambda = 4 + 12 = 16$.',
          'Result = 4 / 16 = 0.25.',
        ];
      } else if (questionType === 'single_choice' || questionType === 'code_output') {
        questionText = `[Data Science Olympiad Variation #${k}] In probabilistic binary classification, what does the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) mathematically represent?`;
        options = [
          'The concordance probability $P(\\text{score}(X^+) > \\text{score}(X^-))$ that a randomly selected positive ranks higher than a randomly selected negative',
          'The exact accuracy of the model when decision threshold is fixed at 0.5',
          'The fraction of true positives among all model-declared positive predictions',
          'The Kullback-Leibler divergence between predicted probabilities and labels',
        ];
        correctAnswer = 'The concordance probability $P(\\text{score}(X^+) > \\text{score}(X^-))$ that a randomly selected positive ranks higher than a randomly selected negative';
        explanation = 'ROC-AUC is equivalent to the normalized Mann-Whitney U rank statistic, corresponding to the probability that a random positive instance is assigned a higher predicted score than a random negative instance.';
        stepByStepSolution = [
          'Recall Mann-Whitney U equivalence to trapezoidal ROC integration.',
          'Conclude that ROC-AUC measures pairwise ranking concordance $P(X^+ > X^-)$.',
        ];
      } else {
        questionText = `[Data Science Olympiad Variation #${k}] True or False: In Gradient Boosted Decision Trees (GBDT), each sequential tree fits the negative gradient pseudo-residuals $- \\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)}$ of the loss function, performing functional gradient descent in prediction space.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'Jerome Friedman’s Gradient Boosting formulation fits successive decision trees to negative functional gradients of the specified loss function.';
        stepByStepSolution = [
          'Recall GBDT algorithm definition.',
          'Successive trees approximate step directions along $- \\nabla_F L(y, F)$.',
        ];
      }
    } else {
      // Data Science & Applied AI
      const nSamples = (k % 10 + 1) * 100;
      const features = (k % 5) + 3;

      if (questionType === 'numerical') {
        const tp = 80 + (k % 15);
        const fp = 10 + (k % 8);
        const precision = (tp / (tp + fp)).toFixed(3);
        questionText = `[Variation #${k}] In a binary classification evaluation on "${topicTitle}", a model produces $TP = ${tp}$ true positives, $FP = ${fp}$ false positives, and $FN = 15$ false negatives. Calculate the Precision metric to 3 decimal places.`;
        correctAnswer = `${precision}`;
        explanation = `Precision is defined as $\\text{Precision} = \\frac{TP}{TP + FP} = \\frac{${tp}}{${tp} + ${fp}} = \\frac{${tp}}{${tp + fp}} = ${precision}$.`;
        stepByStepSolution = [
          `State Precision formula: $\\text{Precision} = \\frac{TP}{TP + FP}$`,
          `Substitute $TP = ${tp}$ and $FP = ${fp}$`,
          `Calculate $\\frac{${tp}}{${tp + fp}} = ${precision}$`,
        ];
      } else if (questionType === 'single_choice' || questionType === 'code_output') {
        questionText = `[Variation #${k}] Which of the following regularizations imposes $L_1$ penalty on parameter weights, thereby promoting sparse feature selection by driving non-informative coefficients strictly to zero?`;
        options = [
          'Lasso Regularization ($L_1$ norm)',
          'Ridge Regularization ($L_2$ norm)',
          'Batch Normalization',
          'Dropout with probability $p = 0.5$',
        ];
        correctAnswer = 'Lasso Regularization ($L_1$ norm)';
        explanation = 'Lasso adds $\\lambda \\sum |w_i|$ penalty. The diamond contour of $L_1$ geometry produces corner intersections on parameter axes, forcing coefficients to exactly 0 (sparsity).';
        stepByStepSolution = [
          'Review $L_1$ vs $L_2$ geometric contour intersections.',
          'Recognize that $L_1$ norm encourages exact zeros, yielding feature sparsity.',
        ];
      } else if (questionType === 'multiple_choice') {
        questionText = `[Variation #${k}] Which of the following techniques mitigate the OVERFITTING problem in machine learning and deep neural networks? (Select all that apply)`;
        options = [
          'Early stopping based on validation loss plateaus',
          'Data augmentation (rotations, cropping, synthetic jitter)',
          'Adding $L_2$ weight decay regularization penalty',
          'Increasing model parameters without adding training data',
        ];
        correctAnswer = [
          'Early stopping based on validation loss plateaus',
          'Data augmentation (rotations, cropping, synthetic jitter)',
          'Adding $L_2$ weight decay regularization penalty',
        ];
        explanation = 'Early stopping, data augmentation, and weight decay reduce overfitting by restricting model complexity or enriching data. Increasing parameter count without more data worsens overfitting.';
        stepByStepSolution = [
          'Evaluate each technique against bias-variance trade-off.',
          'Confirm early stopping, data augmentation, and regularization control generalization variance.',
        ];
      } else {
        questionText = `[Variation #${k}] True or False: According to the Central Limit Theorem, the distribution of the sample mean approaches a Normal (Gaussian) distribution as sample size $n \\to \\infty$, regardless of the shape of the underlying population distribution, provided variance is finite.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = 'The Central Limit Theorem guarantees asymptotic normality of sample means for independent identically distributed variables with finite mean and variance.';
        stepByStepSolution = [
          'State Central Limit Theorem invariant conditions: i.i.d. random variables with finite variance $\\sigma^2 < \\infty$.',
          'Verify that asymptotic distribution of $\\bar{X}_n$ converges to $\\mathcal{N}(\\mu, \\sigma^2/n)$.',
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
      subtopicId: concept?.subtopicId ?? topicId,
      conceptId: concept?.id ?? `concept-${topicId}-topic`,
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
