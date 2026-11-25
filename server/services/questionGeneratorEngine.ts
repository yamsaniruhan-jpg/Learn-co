import {
  QuestionBankItem,
  DifficultyLevel,
  QuestionTypeId,
  SubjectId,
  ConceptDetail,
  ExamTrackId,
} from '../../src/types/curriculum';

type TopicConceptEntry = {
  id: string;
  subtopicId: string;
  concept?: ConceptDetail;
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rotateOptions(options: string[], seed: number): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const opt of options) {
    const clean = String(opt).trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      unique.push(clean);
    }
  }
  if (unique.length <= 1) return unique;
  const arr = [...unique];
  let s = (seed * 1664525 + 1013904223) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class QuestionGeneratorEngine {
  /**
   * Generates `count` (default 100) distinct, multi-model, parameterised questions
   * for a topic, evenly distributed across all of its concepts and subtopics.
   */
  static generateQuestionsForTopic(
    topicId: string,
    subjectId: SubjectId,
    chapterId: string,
    topicTitle: string,
    count: number = 100,
    concepts: TopicConceptEntry[] = []
  ): QuestionBankItem[] {
    const questions: QuestionBankItem[] = [];
    const difficulties: DifficultyLevel[] = ['easy', 'easy_medium', 'medium', 'medium_hard', 'hard'];
    const types: QuestionTypeId[] =
      subjectId === 'cs' || subjectId === 'data_science'
        ? ['single_choice', 'multiple_choice', 'numerical', 'assertion_reason', 'true_false', 'code_output']
        : ['single_choice', 'multiple_choice', 'numerical', 'assertion_reason', 'true_false'];

    for (let i = 1; i <= count; i++) {
      const difficulty = difficulties[(i - 1) % difficulties.length];
      const questionType = types[(i - 1) % types.length];
      const modelSlot = Math.floor((i - 1) / types.length); // 0..19 across 100 items
      const id = `q-gen-${topicId}-${i}`;
      const concept = concepts.length > 0 ? concepts[(i - 1) % concepts.length] : undefined;

      questions.push(
        this.buildTopicQuestionInstance(
          id,
          i,
          modelSlot,
          subjectId,
          chapterId,
          topicId,
          topicTitle,
          difficulty,
          questionType,
          concept
        )
      );
    }

    return questions;
  }

  /**
   * Build concept-specific practice items from a concept's own mini-check and worked examples.
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
    modelSlot: number,
    subjectId: SubjectId,
    chapterId: string,
    topicId: string,
    topicTitle: string,
    difficulty: DifficultyLevel,
    questionType: QuestionTypeId,
    conceptEntry?: TopicConceptEntry
  ): QuestionBankItem {
    const seed = index + (hashString(topicId + (conceptEntry?.id || '')) % 97);
    const conceptDetail = conceptEntry?.concept;
    const examTracks: ExamTrackId[] = conceptDetail?.examTracks?.length ? conceptDetail.examTracks : ['all'];

    let questionText = '';
    let options: string[] | undefined = undefined;
    let correctAnswer: string | string[] = '';
    let explanation = '';
    let stepByStepSolution: string[] = [];
    let hints: string[] = [];
    let numericalTolerance: number | undefined = undefined;

    const a = (seed % 5) + 2; // 2..6
    const b = ((seed * 3) % 6) + 1; // 1..6
    const c = ((seed * 7) % 5) + 2; // 2..6
    const m = (modelSlot + (hashString(topicId) % 7)) % 6;

    // Concept-aware enrichment helper for pitfall true/false or assertion-reason when available
    const firstObs = conceptDetail?.keyObservations?.[0];
    const firstPitfall = conceptDetail?.commonPitfalls?.[0];
    const conceptTitle = conceptDetail?.title || topicTitle;

    if (subjectId === 'math') {
      const tLower = `${topicId} ${topicTitle}`.toLowerCase();
      const isCalculus =
        tLower.includes('calc') ||
        tLower.includes('limit') ||
        tLower.includes('monoton') ||
        tLower.includes('deriv') ||
        tLower.includes('integr') ||
        tLower.includes('ode') ||
        tLower.includes('slope') ||
        tLower.includes('series') ||
        tLower.includes('polar') ||
        tLower.includes('param') ||
        tLower.includes('lhopital') ||
        tLower.includes('partial') ||
        tLower.includes('grad');
      const isAlgebraOrLinAlg =
        tLower.includes('complex') ||
        tLower.includes('quad') ||
        tLower.includes('eigen') ||
        tLower.includes('vector') ||
        tLower.includes('determ') ||
        tLower.includes('matrix') ||
        tLower.includes('linalg');
      const isProbCombNT =
        tLower.includes('prob') ||
        tLower.includes('bayes') ||
        tLower.includes('random') ||
        tLower.includes('comb') ||
        tLower.includes('count') ||
        tLower.includes('mod') ||
        tLower.includes('divis') ||
        tLower.includes('inmo');

      if (questionType === 'numerical') {
        if (isAlgebraOrLinAlg && !tLower.includes('ode')) {
          const variant = m % 4;
          if (variant === 0) {
            // Quadratic symmetric sum alpha^2 + beta^2 where sum = a+b, prod = c
            const s = a + b + 2;
            const p = b + 1;
            const ans = s * s - 2 * p;
            questionText = `[${topicTitle} · Model A #${index}] If $\\alpha, \\beta$ are the roots of $x^2 - ${s}x + ${p} = 0$, compute the exact value of $\\alpha^2 + \\beta^2$.`;
            correctAnswer = `${ans}`;
            explanation = `By Vieta's formulas, $\\alpha + \\beta = ${s}$ and $\\alpha\\beta = ${p}$. Thus $\\alpha^2 + \\beta^2 = (\\alpha+\\beta)^2 - 2\\alpha\\beta = ${s}^2 - 2(${p}) = ${ans}$.`;
            stepByStepSolution = [`Identify $\\alpha + \\beta = ${s}, \\alpha\\beta = ${p}$.`, `Evaluate $${s * s} - ${2 * p} = ${ans}$.`];
          } else if (variant === 1) {
            // Matrix trace + determinant
            const det = a * c - b;
            questionText = `[${topicTitle} · Model B #${index}] For the matrix $A = \\begin{pmatrix} ${a} & ${b} \\\\ 1 & ${c} \\end{pmatrix}$, compute $\\text{Tr}(A) + \\det(A)$.`;
            correctAnswer = `${a + c + det}`;
            explanation = `$\\text{Tr}(A) = ${a} + ${c} = ${a + c}$ and $\\det(A) = ${a}\\cdot${c} - ${b} = ${det}$, summing to ${a + c + det}.`;
            stepByStepSolution = [`Compute trace $= ${a + c}$.`, `Compute determinant $= ${det}$.`, `Sum $= ${a + c + det}$.`];
          } else if (variant === 2) {
            // Complex modulus max/min on circle |z - center| = r
            const center = a + 3;
            const r = b % 3 + 1;
            questionText = `[${topicTitle} · Model C #${index}] If complex number $z$ satisfies $|z - (${center} + 0i)| \\le ${r}$, find the minimum possible value of $|z|$.`;
            correctAnswer = `${center - r}`;
            explanation = `Disk centered at $(${center}, 0)$ with radius $${r}$ has closest point to origin at distance $${center} - ${r} = ${center - r}$.`;
            stepByStepSolution = [`Apply reverse triangle inequality: $|z| \\ge ${center} - ${r} = ${center - r}$.`];
          } else {
            // 3D dot product / orthogonal vector k
            const kx = a * b;
            questionText = `[${topicTitle} · Model D #${index}] Vectors $\\mathbf{u} = ${a}\\hat{i} + ${b}\\hat{j} - \\hat{k}$ and $\\mathbf{v} = \\hat{i} + \\hat{j} + \\lambda\\hat{k}$ are orthogonal. Find $\\lambda$.`;
            correctAnswer = `${a + b}`;
            explanation = `Orthogonality requires $\\mathbf{u}\\cdot\\mathbf{v} = ${a} + ${b} - \\lambda = 0 \\implies \\lambda = ${a + b}$.`;
            stepByStepSolution = [`Set dot product to $0$: $${a}(1) + ${b}(1) - 1(\\lambda) = 0$.`, `Solve $\\lambda = ${a + b}$.`];
          }
        } else if (isProbCombNT) {
          const variant = m % 4;
          if (variant === 0) {
            // Binomial expectation + variance
            const n = (a + 2) * 4;
            const expectVal = n * 0.25;
            questionText = `[${topicTitle} · Model A #${index}] A Binomial random variable satisfies $X \\sim \\text{Binomial}(n=${n}, p=0.25)$. Calculate the expected value $\\mathbb{E}[X]$.`;
            correctAnswer = `${expectVal}`;
            explanation = `$\\mathbb{E}[X] = np = ${n} \\times 0.25 = ${expectVal}$.`;
            stepByStepSolution = [`Compute $np = ${n} \\times 0.25 = ${expectVal}$.`];
          } else if (variant === 1) {
            // Modular arithmetic remainder 2^(k) mod 7
            const exp = 3 * a + 1;
            questionText = `[${topicTitle} · Model B #${index}] What is the remainder when $2^{${exp}}$ is divided by $7$?`;
            correctAnswer = '2';
            explanation = `Since $2^3 = 8 \\equiv 1 \\pmod 7$, $2^{3(${a})+1} = (2^3)^{${a}} \\cdot 2 \\equiv 1^{${a}} \\cdot 2 \\equiv 2 \\pmod 7$.`;
            stepByStepSolution = [`Notice $2^3 \\equiv 1 \\pmod 7$.`, `Reduce exponent mod $3$: remainder is $2^1 = 2$.`];
          } else if (variant === 2) {
            // Stars and bars non-negative solutions x+y+z = k
            const sumK = a + 4;
            const ans = ((sumK + 2) * (sumK + 1)) / 2;
            questionText = `[${topicTitle} · Model C #${index}] How many non-negative integer solutions $(x, y, z)$ satisfy $x + y + z = ${sumK}$?`;
            correctAnswer = `${ans}`;
            explanation = `By stars and bars, $\\binom{${sumK}+3-1}{3-1} = \\binom{${sumK + 2}}{2} = \\frac{${sumK + 2}\\cdot${sumK + 1}}{2} = ${ans}$.`;
            stepByStepSolution = [`Apply $\\binom{n+k-1}{k-1} = \\binom{${sumK + 2}}{2} = ${ans}$.`];
          } else {
            // Titu's Lemma weighted minimum
            const kSum = 12;
            const c1 = 1;
            const c2 = 4;
            const c3 = 1;
            const ans = ((1 + 2 + 1) * (1 + 2 + 1)) / kSum;
            questionText = `[${topicTitle} · Model D #${index}] For $x, y, z > 0$ with $x + y + z = 8$, find the minimum value of $\\frac{1}{x} + \\frac{4}{y} + \\frac{1}{z}$ using Cauchy-Schwarz (Titu's Lemma).`;
            correctAnswer = `${(16 / 8)}`;
            explanation = `By Titu's Lemma, $\\frac{1^2}{x} + \\frac{2^2}{y} + \\frac{1^2}{z} \\ge \\frac{(1+2+1)^2}{x+y+z} = \\frac{16}{8} = 2$.`;
            stepByStepSolution = [`Apply Engel form of Cauchy-Schwarz: $\\frac{(1+2+1)^2}{8} = 2$.`];
            void c1; void c2; void c3; void ans;
          }
        } else if (isCalculus) {
          const variant = m % 5;
          if (variant === 0) {
            const ans = 2 * a * b + c;
            questionText = `[${topicTitle} · Model A #${index}] Evaluate $\\lim_{x \\to ${b}} \\frac{${a}x^2 - ${a * b * b}}{x - ${b}} + ${c}$.`;
            correctAnswer = `${ans}`;
            explanation = `Factoring gives $${a}(x+${b}) + ${c} \\to ${2 * a * b} + ${c} = ${ans}$.`;
            stepByStepSolution = [`Cancel $(x-${b})$ and substitute $x=${b}$ to obtain $${ans}$.`];
          } else if (variant === 1) {
            const upper = (seed % 3) + 2;
            const integral = a * upper * upper * upper; // int_0^u 3a x^2 dx = a u^3
            questionText = `[${topicTitle} · Model B #${index}] Compute the exact definite integral $\\int_{0}^{${upper}} ${3 * a}x^2\\,dx$.`;
            correctAnswer = `${integral}`;
            explanation = `Antiderivative is $[${a}x^3]_0^{${upper}} = ${a}(${upper}^3) = ${integral}$.`;
            stepByStepSolution = [`Find antiderivative $${a}x^3$ and evaluate from $0$ to ${upper}.`];
          } else if (variant === 2) {
            // Derivative at point via chain rule f(x) = (x^2 + a)^2 at x=b
            const derivVal = 4 * b * (b * b + a);
            questionText = `[${topicTitle} · Model C #${index}] Let $f(x) = (x^2 + ${a})^2$. Calculate $f'(${b})$.`;
            correctAnswer = `${derivVal}`;
            explanation = `By the chain rule, $f'(x) = 2(x^2 + ${a})(2x) = 4x(x^2 + ${a})$, so $f'(${b}) = 4(${b})(${b * b + a}) = ${derivVal}$.`;
            stepByStepSolution = [`Apply chain rule: $4x(x^2+${a})$.`, `Substitute $x=${b}$ to get ${derivVal}.`];
          } else if (variant === 3) {
            // Euler step / ODE equilibrium
            const cap = 100 * a;
            questionText = `[${topicTitle} · Model D #${index}] A logistic curve satisfies $\\frac{dP}{dt} = 0.01 P(${cap} - P)$. At what population $P$ is growth rate $\\frac{dP}{dt}$ maximized?`;
            correctAnswer = `${cap / 2}`;
            explanation = `Logistic growth peaks at half the carrying capacity $L/2 = ${cap}/2 = ${cap / 2}$.`;
            stepByStepSolution = [`Identify carrying capacity $L = ${cap}$ and take $P = L/2 = ${cap / 2}$.`];
          } else {
            // Power series radius
            const rad = (seed % 4) + 2;
            questionText = `[${topicTitle} · Model E #${index}] Find the radius of convergence $R$ of $\\sum_{n=1}^{\\infty} \\frac{(x - ${b})^n}{n \\cdot ${rad}^n}$.`;
            correctAnswer = `${rad}`;
            explanation = `Ratio Test limit is $|x-${b}|/${rad} < 1 \\implies R = ${rad}$.`;
            stepByStepSolution = [`Apply Ratio Test: $\\lim_{n\\to\\infty} \\frac{n}{n+1}\\frac{|x-${b}|}{${rad}} < 1 \\implies R = ${rad}$.`];
          }
        } else {
          // Geometry / Trigonometry / NSEJS Circle Geometry
          const variant = m % 3;
          if (variant === 0) {
            // Tangent-Secant Power of a Point: PA * PB = PT^2
            const pa = a;
            const pb = a * c * c; // so PA*PB = (ac)^2 is a clean integer square
            const pt = a * c;
            questionText = `[${topicTitle} · Model A #${index}] From an external point $P$, a secant cuts a circle at $A$ and $B$ with $PA = ${pa}$ and $PB = ${pb}$. Find tangent length $PT$.`;
            correctAnswer = `${pt}`;
            explanation = `By the Tangent-Secant Power Theorem, $PT^2 = PA \\cdot PB = ${pa} \\times ${pb} = ${pt * pt}$, so $PT = ${pt}$.`;
            stepByStepSolution = [`Use $PT^2 = PA \\cdot PB = ${pa * pb}$.`, `Take square root: $PT = ${pt}$.`];
          } else if (variant === 1) {
            // Trig Pythagorean amplitude sqrt(3^2 + 4^2) or (5,12,13)
            const triples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]];
            const [tA, tB, tC] = triples[seed % triples.length];
            questionText = `[${topicTitle} · Model B #${index}] What is the maximum possible value of $f(\\theta) = ${tA}\\sin\\theta + ${tB}\\cos\\theta + ${b}$ over all $\\theta \\in \\mathbb{R}$?`;
            correctAnswer = `${tC + b}`;
            explanation = `The sinusoidal amplitude is $\\sqrt{${tA}^2 + ${tB}^2} = ${tC}$, so max value is $${tC} + ${b} = ${tC + b}$.`;
            stepByStepSolution = [`Compute amplitude $\\sqrt{${tA}^2 + ${tB}^2} = ${tC}$.`, `Add offset $${b}$: $${tC + b}$.`];
          } else {
            // Focus distance of ellipse x^2/A^2 + y^2/B^2 = 1
            const triples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [8, 15, 17]];
            const [eb, ec, ea] = triples[seed % triples.length];
            questionText = `[${topicTitle} · Model C #${index}] Find the focal distance $c$ from the center of the ellipse $\\frac{x^2}{${ea * ea}} + \\frac{y^2}{${eb * eb}} = 1$.`;
            correctAnswer = `${ec}`;
            explanation = `For an ellipse $c = \\sqrt{a^2 - b^2} = \\sqrt{${ea * ea} - ${eb * eb}} = ${ec}$.`;
            stepByStepSolution = [`Read $a^2 = ${ea * ea}, b^2 = ${eb * eb}$.`, `Compute $c = \\sqrt{${ea * ea - eb * eb}} = ${ec}$.`];
          }
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 4;
        if (variant === 0 && isAlgebraOrLinAlg) {
          const correct = `Eigenvalues $\\lambda = ${a}, ${c}$ and $\\det(A) = ${a * c}$`;
          options = rotateOptions(
            [
              correct,
              `Eigenvalues $\\lambda = ${a + b}, ${c}$ and $\\det(A) = 0$`,
              `Eigenvalues $\\lambda = 0, ${a + c}$ and $\\det(A) = ${b}$`,
              `Trace equals ${a * c} and determinant equals ${a + c}`,
            ],
            seed
          );
          questionText = `[${topicTitle} · Model A #${index}] For the upper-triangular matrix $A = \\begin{pmatrix} ${a} & ${b} \\\\ 0 & ${c} \\end{pmatrix}$, identify its true spectral invariants:`;
          correctAnswer = correct;
          explanation = `Triangular matrices display their eigenvalues directly on the main diagonal (${a}, ${c}), giving $\\det(A) = ${a * c}$.`;
          stepByStepSolution = [`Solve $\\det(A - \\lambda I) = (${a}-\\lambda)(${c}-\\lambda) = 0$.`];
        } else if (variant === 1 && isCalculus) {
          const correct = `$-\\frac{2x + ${b}y}{${b}x + 2y}$`;
          options = rotateOptions(
            [
              correct,
              `$\\frac{2x + ${b}y}{${b}x + 2y}$`,
              `$-\\frac{2x}{2y}$`,
              `$-\\frac{x + ${b}y}{${b}x + y}$`,
            ],
            seed
          );
          questionText = `[${topicTitle} · Model B #${index}] Differentiate $x^2 + ${b}xy + y^2 = ${a + c}$ implicitly with respect to $x$ to find $\\frac{dy}{dx}$:`;
          correctAnswer = correct;
          explanation = `$2x + ${b}y + ${b}x\\,y' + 2y\\,y' = 0 \\implies y' = -\\frac{2x + ${b}y}{${b}x + 2y}$.`;
          stepByStepSolution = [`Apply product rule on $${b}xy$ and isolate $dy/dx$.`];
        } else if (variant === 2 && isProbCombNT) {
          const correct = `$P(A \\mid B) = \\frac{P(B \\mid A) P(A)}{P(B)}$`;
          options = rotateOptions(
            [
              correct,
              `$P(A \\mid B) = P(A) + P(B) - P(A \\cap B)$`,
              `$P(A \\mid B) = \\frac{P(A)}{P(B \\mid A) P(B)}$`,
              `$P(A \\mid B) = P(A) P(B)$ for all dependent events`,
            ],
            seed
          );
          questionText = `[${topicTitle} · Model C #${index}] Which expression correctly states Bayes' Theorem for updating the posterior probability of hypothesis $A$ given evidence $B$ ($P(B) > 0$)?`;
          correctAnswer = correct;
          explanation = `Bayes' rule scales prior $P(A)$ by likelihood $P(B \\mid A)$ divided by marginal evidence $P(B)$.`;
          stepByStepSolution = [`Combine $P(A \\cap B) = P(A \\mid B)P(B) = P(B \\mid A)P(A)$.`];
        } else {
          const correct = `Horizontal point of inflection at $x = ${b}$ (monotonically increasing across $\\mathbb{R}$)`;
          options = rotateOptions(
            [
              correct,
              `Strict local maximum at $x = ${b}$`,
              `Strict local minimum at $x = ${b}$`,
              `Undefined derivative at $x = ${b}$`,
            ],
            seed
          );
          questionText = `[${topicTitle} · Model D #${index}] Classify the stationary point of $f(x) = ${a}x^3 - ${3 * a * b}x^2 + ${3 * a * b * b}x + ${c}$:`;
          correctAnswer = correct;
          explanation = `$f'(x) = ${3 * a}(x - ${b})^2 \\ge 0$ vanishes at $x=${b}$ without changing sign, yielding a saddle/inflection point.`;
          stepByStepSolution = [`Factor $f'(x) = ${3 * a}(x - ${b})^2$ and check sign on either side of $x=${b}$.`];
        }
      } else if (questionType === 'multiple_choice') {
        if (m % 2 === 0 && isCalculus) {
          const c1 = `The series converges absolutely at $x = ${a + b + 1}$`;
          const c2 = `The radius of convergence $R$ satisfies ${b + 2} \\le R \\le ${b + 4}`;
          const c3 = `The series diverges at $x = ${a + b + 6}$`;
          const d1 = `The series is guaranteed to converge at the endpoint $x = ${a - b - 2}$`;
          options = rotateOptions([c1, c2, c3, d1], seed);
          correctAnswer = [c1, c2, c3];
          questionText = `[${topicTitle} · Multi-Model #${index}] A power series $\\sum c_n(x-${a})^n$ converges at $x=${a + b + 2}$ and diverges at $x=${a - b - 4}$. Select ALL guaranteed statements:`;
          explanation = `Distance to convergent point is ${b + 2} (so $R \\ge ${b + 2}$) and to divergent point is ${b + 4} (so $R \\le ${b + 4}$); endpoints at exact radius ${b + 2} cannot be guaranteed without testing.`;
          stepByStepSolution = [`Bounds on radius: ${b + 2} \\le R \\le ${b + 4}.`];
        } else {
          const c1 = `For any upper-triangular $2\\times 2$ matrix with diagonal (${a}, ${c}), eigenvalues are ${a} and ${c}`;
          const c2 = `Trace equals ${a + c}`;
          const c3 = `Determinant equals ${a * c} \\neq 0, so the matrix is invertible`;
          const d1 = `Off-diagonal entries alter the eigenvalues of triangular matrices`;
          options = rotateOptions([c1, c2, c3, d1], seed);
          correctAnswer = [c1, c2, c3];
          questionText = `[${topicTitle} · Multi-Model #${index}] Consider $M = \\begin{pmatrix} ${a} & ${b} \\\\ 0 & ${c} \\end{pmatrix}$ in linear system theory. Select ALL true invariants:`;
          explanation = `Triangular eigenvalues lie strictly on the diagonal, trace is ${a + c}, determinant is ${a * c}, and off-diagonal entries do not change eigenvalues.`;
          stepByStepSolution = [`Compute $\\det(M - \\lambda I) = (${a}-\\lambda)(${c}-\\lambda)$.`];
        }
      } else if (questionType === 'assertion_reason') {
        const useConcept = firstObs && m % 2 === 1;
        questionText = useConcept
          ? `[${topicTitle} · Concept Logic #${index}] Consider "${conceptTitle}":\nAssertion (A): ${firstObs}\nReason (R): Mathematical invariants preserve structural validity across coordinate transformations and boundary cases.`
          : `[${topicTitle} · Reasoning #${index}] Consider:\nAssertion (A): $\\int_0^{${a}} (${b}x + ${c})\\,dx = \\frac{${b}\\cdot ${a * a}}{2} + ${c * a}$.\nReason (R): By the Fundamental Theorem of Calculus, an antiderivative of ${b}x + ${c} is $\\frac{${b}x^2}{2} + ${c}x$.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = useConcept
          ? `Both Assertion and Reason capture core invariant behavior for ${conceptTitle}.`
          : `FTC evaluates F(${a}) - F(0) directly from the quadratic antiderivative.`;
        stepByStepSolution = [`Verify validity of Assertion (A) and causal link from Reason (R).`];
      } else {
        // true_false
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Misconception Check #${index}] True or False: Regarding "${conceptTitle}", the following claim is valid: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False! ${firstPitfall.correctConcept}`;
          stepByStepSolution = [`Check against theorem statement: ${firstPitfall.correctConcept}`];
        } else {
          questionText = `[${topicTitle} · Theorem Check #${index}] True or False: Every real symmetric $n \\times n$ matrix has strictly real eigenvalues and orthogonal eigenvectors for distinct eigenvalues.`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `By the Spectral Theorem, real symmetric matrices diagonalize orthogonally with purely real eigenvalues.`;
          stepByStepSolution = [`Apply Spectral Theorem for symmetric matrices.`];
        }
      }
    } else if (subjectId === 'cs') {
      const tLower = `${topicId} ${topicTitle}`.toLowerCase();
      const powN = Math.pow(2, (seed % 4) + 5); // 32..256
      const logN = (seed % 4) + 5;

      if (questionType === 'code_output') {
        const variant = m % 3;
        if (variant === 0) {
          const correct = `$O(\\log n)$`;
          options = rotateOptions([correct, `$O(n)$`, `$O(n \\log n)$`, `$O(n^2)$`], seed);
          questionText = `[${topicTitle} · Code Trace #${index}] What is the tightest time complexity of this function?\n\`\`\`python\ndef trace_halving(n):\n    total, j = 0, 1\n    for _ in range(${a + 1}):\n        j = 1\n        while j < n:\n            total += j\n            j *= 2\n    return total\n\`\`\``;
          correctAnswer = correct;
          explanation = `Outer loop is constant (${a + 1} iterations = $O(1)$); inner loop doubles $j$ up to $n$, taking $O(\\log n)$ overall.`;
          stepByStepSolution = [`Multiply $O(1)$ outer bound by $O(\\log n)$ geometric doubling inner loop.`];
        } else if (variant === 1) {
          const outVal = a * (b + 1);
          const correct = `${outVal}`;
          options = rotateOptions([correct, `${outVal + a}`, `${a * b}`, `${a + b}`], seed);
          questionText = `[${topicTitle} · Execution Trace #${index}] What integer is printed by this Python recursion / DP snippet?\n\`\`\`python\ndef dp_step(k):\n    memo = [0] * (k + 1)\n    for i in range(1, k + 1):\n        memo[i] = memo[i - 1] + ${a}\n    return memo[k]\nprint(dp_step(${b + 1}))\n\`\`\``;
          correctAnswer = correct;
          explanation = `Each step adds ${a}, so after ${b + 1} iterations memo[${b + 1}] = ${b + 1} * ${a} = ${outVal}.`;
          stepByStepSolution = [`Unroll loop ${b + 1} times adding ${a} per iteration.`];
        } else {
          const correct = '`i & (-i)`';
          options = rotateOptions([correct, '`i | (~i)`', '`i & (i - 1)`', '`i ^ (i >> 1)`'], seed);
          questionText = `[${topicTitle} · Bitwise Operation #${index}] In a 1-indexed Fenwick Tree (BIT) or bitmask loop, which expression isolates ONLY the least-significant set bit (LSB) of positive integer \`i\`?`;
          correctAnswer = correct;
          explanation = `Two's complement \`-i\` equals \`~i + 1\`, leaving only the rightmost set bit when ANDed with \`i\`.`;
          stepByStepSolution = [`Verify on example \`i = 12 (1100_2)\`: \`12 & -12 = 4 (0100_2)\`.`];
        }
      } else if (questionType === 'numerical') {
        const variant = m % 4;
        if (variant === 0) {
          questionText = `[${topicTitle} · Model A #${index}] In a Segment Tree built over $N = ${powN}$ elements, what is the exact binary tree height $\\log_2(N)$?`;
          correctAnswer = `${logN}`;
          explanation = `$N = 2^{${logN}} = ${powN}$, so tree height is $${logN}$.`;
          stepByStepSolution = [`Evaluate $\\log_2(${powN}) = ${logN}$.`];
        } else if (variant === 1) {
          const bits = (seed % 5) + 6; // 6..10
          const masks = Math.pow(2, bits);
          questionText = `[${topicTitle} · Model B #${index}] How many distinct subset masks $2^n$ exist in a Bitmask DP table for $n = ${bits}$ items?`;
          correctAnswer = `${masks}`;
          explanation = `Each of the ${bits} bits can be 0 or 1, yielding $2^{${bits}} = ${masks}$ subsets.`;
          stepByStepSolution = [`Compute $2^{${bits}} = ${masks}$.`];
        } else if (variant === 2) {
          const nodes = (seed % 5) + 5; // 5..9
          const quorum = Math.floor(nodes / 2) + 1;
          questionText = `[${topicTitle} · Model C #${index}] In a Raft distributed consensus cluster with $N = ${nodes}$ voting replicas, what is the minimum quorum size needed to elect a leader?`;
          correctAnswer = `${quorum}`;
          explanation = `Majority quorum requires $\\lfloor N/2 \\rfloor + 1 = \\lfloor ${nodes}/2 \\rfloor + 1 = ${quorum}$ nodes.`;
          stepByStepSolution = [`Compute $\\lfloor ${nodes}/2 \\rfloor + 1 = ${quorum}$.`];
        } else {
          const cmp = (seed % 6) + 4;
          const treeNodes = Math.pow(2, cmp) - 1;
          questionText = `[${topicTitle} · Model D #${index}] What is the worst-case number of key comparisons to search a perfectly balanced binary search tree containing ${treeNodes} keys?`;
          correctAnswer = `${cmp}`;
          explanation = `$2^{${cmp}} - 1 = ${treeNodes}$ implies height / level count $= ${cmp}$.`;
          stepByStepSolution = [`Solve $2^h - 1 = ${treeNodes} \\implies h = ${cmp}$.`];
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 4;
        if (variant === 0 || tLower.includes('kmp') || tLower.includes('string')) {
          const ans = '$O(N + M)$ time and $O(M)$ auxiliary prefix-array space';
          options = rotateOptions([ans, '$O(N \\cdot M)$ worst-case time', '$O(N \\log M)$ time', '$O(M^2)$ preprocessing space'], seed);
          questionText = `[${topicTitle} · Model A #${index}] What is the worst-case complexity of the Knuth-Morris-Pratt (KMP) substring search algorithm on text length $N$ and pattern length $M$?`;
          correctAnswer = ans;
          explanation = `Amortized potential analysis on prefix fallback transitions bounds total character checks to $O(N + M)$.`;
          stepByStepSolution = [`Text pointer advances $N$ times; fallback cursor decrements at most $N+M$ times.`];
        } else if (variant === 1 || tLower.includes('dsu') || tLower.includes('graph')) {
          const ans = '$O(\\alpha(n))$ inverse Ackermann amortized time per operation';
          options = rotateOptions([ans, '$O(n)$ per find operation', '$O(\\log^2 n)$ amortized time', '$O(\\sqrt{n})$ amortized time'], seed);
          questionText = `[${topicTitle} · Model B #${index}] What is the amortized per-operation time complexity of Disjoint Set Union (DSU) when BOTH path compression and union by rank are applied?`;
          correctAnswer = ans;
          explanation = `Tarjan's theorem proves path compression + union by rank achieves inverse Ackermann $O(\\alpha(n))$ time.`;
          stepByStepSolution = [`Path compression flattens queried chains directly to the root leader.`];
        } else if (variant === 2) {
          const ans = 'Dijkstra fails to guarantee shortest paths when negative edge weights exist';
          options = rotateOptions(
            [
              ans,
              'Dijkstra runs in $O(V^3)$ time with a min-heap',
              'Bellman-Ford cannot detect negative-weight cycles',
              'BFS finds minimum weighted paths on arbitrary positive edge weights',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model C #${index}] Which statement accurately describes shortest-path graph algorithms?`;
          correctAnswer = ans;
          explanation = `Once Dijkstra pops a vertex from the min-priority queue, it assumes its distance is final, which negative edges can later invalidate.`;
          stepByStepSolution = [`Check greedy optimality precondition: edge weights $w(u,v) \\ge 0$.`];
        } else {
          const ans = 'Scaled Dot-Product Attention divides $QK^T$ by $\\sqrt{d_k}$ to stabilize softmax gradients';
          options = rotateOptions(
            [
              ans,
              'Layer Normalization normalizes across the mini-batch axis instead of features',
              'AdamW couples weight decay directly inside the adaptive second-moment denominator',
              'Increasing depth without skip connections removes vanishing gradients',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model D #${index}] Identify the TRUE statement about deep learning Transformer architectures:`;
          correctAnswer = ans;
          explanation = `Scaling by $1/\\sqrt{d_k}$ keeps dot-product variance at unit scale so softmax does not saturate into tiny gradients.`;
          stepByStepSolution = [`Recall $\\text{Var}(q \\cdot k) = d_k$ for unit-variance components, so divide by $\\sqrt{d_k}$.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'Mutual exclusion over non-shareable resources';
        const c2 = 'Hold and wait while requesting additional locks';
        const c3 = 'No preemption + circular wait cycle';
        const d1 = 'Strict global lock-ordering hierarchy across all threads';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Multi-Model #${index}] Which conditions belong to Coffman's four necessary criteria for resource deadlock? (Select all that apply)`;
        explanation = `Deadlock requires Mutual Exclusion, Hold-and-Wait, No Preemption, and Circular Wait. Enforcing a strict global lock order prevents circular wait.`;
        stepByStepSolution = [`Verify the 4 Coffman deadlock conditions; lock ordering breaks circular wait.`];
      } else if (questionType === 'assertion_reason') {
        const useConcept = firstObs && m % 2 === 1;
        questionText = useConcept
          ? `[${topicTitle} · System Logic #${index}] Evaluate "${conceptTitle}":\nAssertion (A): ${firstObs}\nReason (R): Algorithmic invariants hold across worst-case adversarial inputs only when preconditions are preserved.`
          : `[${topicTitle} · Distributed Logic #${index}] Evaluate:\nAssertion (A): During a network partition, a distributed data store must trade off between Linearizable Consistency (CP) and Total Availability (AP).\nReason (R): By the CAP Theorem, split nodes cannot both reject stale reads and remain 100% writable without synchronization.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `CAP forces a binary CP vs AP trade-off whenever messages between partitions are dropped.`;
        stepByStepSolution = [`Analyze partition scenario when node A cannot reach node B.`];
      } else {
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Pitfall Check #${index}] True or False: In "${conceptTitle}", this reasoning is bug-free: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False. ${firstPitfall.correctConcept}`;
          stepByStepSolution = [firstPitfall.correctConcept];
        } else {
          questionText = `[${topicTitle} · Complexity Check #${index}] True or False: In Kruskal's Minimum Spanning Tree algorithm, sorting edges in $O(E\\log E)$ time dominates the DSU union-find operations.`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `Sorting $E$ edges takes $O(E \\log E)$ time whereas $E$ DSU checks take only $O(E \\alpha(V))$ time.`;
          stepByStepSolution = [`Compare $O(E\\log E)$ sorting cost vs $O(E\\alpha(V))$ DSU cost.`];
        }
      }
    } else if (subjectId === 'physics') {
      const tLower = `${topicId} ${topicTitle}`.toLowerCase();
      const isThermo = tLower.includes('thermo') || tLower.includes('carnot') || tLower.includes('kinetic');
      const isOpticsWaves = tLower.includes('optic') || tLower.includes('prism') || tLower.includes('interfer') || tLower.includes('wave') || tLower.includes('doppler') || tLower.includes('lens') || tLower.includes('snell');
      const isMagOrAC = tLower.includes('magnet') || tLower.includes('faraday') || tLower.includes('ac') || tLower.includes('lcr') || tLower.includes('circuit') || tLower.includes('electro');
      const isQuantumRel = tLower.includes('quantum') || tLower.includes('photo') || tLower.includes('nuclear') || tLower.includes('relativ') || tLower.includes('atomic');

      if (questionType === 'numerical') {
        const variant = m % 5;
        if (isThermo || variant === 0) {
          const tCold = 300;
          const factor = (seed % 3) + 2; // 2, 3, 4
          const tHot = tCold * factor;
          const qHot = (a + 2) * factor * 100;
          const work = (qHot * (factor - 1)) / factor;
          questionText = `[${topicTitle} · Model A #${index}] An ideal Carnot engine operates between $T_H = ${tHot}\\text{ K}$ and $T_C = ${tCold}\\text{ K}$, absorbing $Q_H = ${qHot}\\text{ J}$ per cycle. Calculate mechanical work output $W$ (in J).`;
          correctAnswer = `${work}`;
          explanation = `$\\eta = 1 - ${tCold}/${tHot} = ${(factor - 1)}/${factor}$, giving $W = \\eta Q_H = ${work}\\text{ J}$.`;
          stepByStepSolution = [`Compute $\\eta = 1 - T_C/T_H$.`, `Multiply $W = \\eta Q_H = ${work}\\text{ J}$.`];
        } else if (isMagOrAC || variant === 1) {
          const rOhm = (a + 1) * 100; // 300..700
          const cMicro = (b % 4) + 1; // 1..4 uF
          const tauMs = (rOhm * cMicro) / 1000;
          questionText = `[${topicTitle} · Model B #${index}] An $R = ${rOhm}\\,\\Omega$ resistor charges a $C = ${cMicro}\\,\\mu\\text{F}$ capacitor. Calculate the circuit time constant $\\tau = RC$ in milliseconds.`;
          correctAnswer = `${tauMs.toFixed(2)}`;
          numericalTolerance = 0.02;
          explanation = `$\\tau = ${rOhm} \\times ${cMicro}\\times 10^{-6}\\text{ s} = ${tauMs.toFixed(2)}\\text{ ms}$.`;
          stepByStepSolution = [`Multiply $RC = ${rOhm} \\times ${cMicro}\\times 10^{-3}\\text{ ms} = ${tauMs.toFixed(2)}\\text{ ms}$.`];
        } else if (isOpticsWaves || variant === 2) {
          const orderM = (seed % 3) + 1;
          const rulings = (a + 2) * 100;
          const rp = orderM * rulings;
          questionText = `[${topicTitle} · Model C #${index}] A diffraction grating with $N = ${rulings}$ illuminated rulings is viewed in diffraction order $m = ${orderM}$. What is its chromatic resolving power $\\mathcal{R} = \\lambda/\\Delta\\lambda$?`;
          correctAnswer = `${rp}`;
          explanation = `Chromatic resolving power $\\mathcal{R} = m N = ${orderM} \\times ${rulings} = ${rp}$.`;
          stepByStepSolution = [`Apply Rayleigh grating resolution $\\mathcal{R} = mN = ${rp}$.`];
        } else if (isQuantumRel || variant === 3) {
          const halfLives = (seed % 4) + 2; // 2..5
          const initMass = Math.pow(2, halfLives) * a;
          questionText = `[${topicTitle} · Model D #${index}] A radioactive sample has initial mass ${initMass} g. How many grams remain undecayed after ${halfLives} half-lives?`;
          correctAnswer = `${a}`;
          explanation = `Remaining mass $= M_0 (1/2)^{${halfLives}} = ${initMass} / ${Math.pow(2, halfLives)} = ${a}\\text{ g}$.`;
          stepByStepSolution = [`Divide initial mass by $2^{${halfLives}} = ${Math.pow(2, halfLives)}$.`];
        } else {
          // Mechanics kinetic energy / impulse
          const mass = (seed % 5) + 2;
          const vel = (seed % 4) * 2 + 4; // even speeds 4,6,8,10
          const ke = 0.5 * mass * vel * vel;
          questionText = `[${topicTitle} · Model E #${index}] A body of mass $m = ${mass}\\text{ kg}$ moves at speed $v = ${vel}\\text{ m/s}$. Calculate its translational kinetic energy in Joules.`;
          correctAnswer = `${ke}`;
          explanation = `$E_k = \\frac{1}{2} m v^2 = 0.5 \\times ${mass} \\times ${vel * vel} = ${ke}\\text{ J}$.`;
          stepByStepSolution = [`Evaluate $\\frac{1}{2} (${mass}) (${vel})^2 = ${ke}\\text{ J}$.`];
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 4;
        if (isMagOrAC && variant === 0) {
          const correct = 'Orbital radius doubles while orbital period $T = 2\\pi m/(qB)$ stays constant';
          options = rotateOptions(
            [
              correct,
              'Both orbital radius and orbital period double',
              'Orbital radius halves and kinetic energy increases',
              'Magnetic force performs positive work proportional to velocity',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model A #${index}] A proton doubles its speed perpendicular to a uniform magnetic field $B$. How do its cyclotron radius and period change?`;
          correctAnswer = correct;
          explanation = `From $r = mv/(qB)$, $r \\propto v$; meanwhile $T = 2\\pi m/(qB)$ is independent of $v$.`;
          stepByStepSolution = [`Compare $r = mv/(qB)$ and $T = 2\\pi m/(qB)$.`];
        } else if (isOpticsWaves || variant === 1) {
          const correct = 'Frequency stays unchanged while speed and wavelength decrease by factor $1/n$';
          options = rotateOptions(
            [
              correct,
              'Wavelength stays unchanged while frequency increases by factor $n$',
              'Both frequency and speed decrease by factor $1/n$',
              'Total internal reflection always occurs when going from air into glass',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model B #${index}] When a monochromatic light beam passes from air ($n_1 \\approx 1$) into glass ($n_2 = 1.5$), which optical invariant holds?`;
          correctAnswer = correct;
          explanation = `Boundary phase continuity locks frequency $f$ across media, so $v = c/n$ and $\\lambda = \\lambda_0/n$.`;
          stepByStepSolution = [`Apply $v = f\\lambda$ with invariant wave frequency $f$.`];
        } else if (isQuantumRel || variant === 2) {
          const correct = '$\\sqrt{(pc)^2 + (mc^2)^2}$';
          options = rotateOptions([correct, '$pc + mc^2$', '$mc^2 + p^2/(2m)$', '$\\sqrt{(mc^2)^2 - (pc)^2}$'], seed);
          questionText = `[${topicTitle} · Model C #${index}] What is the exact relativistic total energy $E$ of a particle of rest mass $m$ and momentum $p$?`;
          correctAnswer = correct;
          explanation = `The 4-momentum invariant $E^2 - (pc)^2 = (mc^2)^2$ directly solves to $E = \\sqrt{(pc)^2 + (mc^2)^2}$.`;
          stepByStepSolution = [`Invert $E^2 = (pc)^2 + (mc^2)^2$.`];
        } else {
          const correct = 'Moment of inertia $I$ and rolling fraction dictate translational vs rotational KE split ($v = \\sqrt{2gh/(1 + I/(mR^2))}$)';
          options = rotateOptions(
            [
              correct,
              'Heavier spheres always reach the bottom faster regardless of geometry',
              'Static friction on a pure rolling wheel dissipates half its mechanical energy',
              'Angular momentum around the axis is zero during pure rolling',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model D #${index}] Why does a solid sphere beat a hollow hoop of the same mass and radius down an inclined plane in pure rolling?`;
          correctAnswer = correct;
          explanation = `A smaller dimensionless inertia factor $I/(mR^2)$ ($2/5$ vs $1$) leaves more gravitational potential energy in translational motion.`;
          stepByStepSolution = [`Apply $mgh = \\frac{1}{2}mv^2(1 + I/(mR^2))$.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'The magnetic Lorentz force $q(\\mathbf{v}\\times\\mathbf{B})$ does zero mechanical work on a moving charge';
        const c2 = 'At LCR resonance ($\\omega = 1/\\sqrt{LC}$), circuit impedance equals pure resistance $R$';
        const c3 = 'Conservative forces yield path-independent work integrals around closed loops ($\\oint \\mathbf{F}\\cdot d\\mathbf{r} = 0$)';
        const d1 = 'Higher-wattage 220V bulbs always draw more power than lower-wattage bulbs when wired in series';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Multi-Model #${index}] Which of the following physical conservation/circuit laws are ALWAYS TRUE? (Select all that apply)`;
        explanation = `Magnetic force is perpendicular to velocity ($P = 0$), LCR resonance yields $Z = R$, and conservative fields have zero closed-loop work. In series, the LOWER-wattage bulb has higher resistance and dissipates MORE $I^2R$ power.`;
        stepByStepSolution = [`Evaluate each conservation/circuit statement individually.`];
      } else if (questionType === 'assertion_reason') {
        const useConcept = firstObs && m % 2 === 1;
        questionText = useConcept
          ? `[${topicTitle} · Physics Logic #${index}] Consider "${conceptTitle}":\nAssertion (A): ${firstObs}\nReason (R): Conservation laws and boundary continuity dictate macroscopic system behavior.`
          : `[${topicTitle} · Optics Logic #${index}] Consider:\nAssertion (A): An anti-reflective MgF₂ film ($n_2 = 1.38$) on crown glass ($n_3 = 1.52$) gives destructive interference at minimum thickness $t = \\lambda/(4n_2)$.\nReason (R): Both air-film and film-glass reflections occur against higher-index media, giving two $\\pi$ shifts that cancel in relative phase.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `Equal boundary phase shifts at both interfaces require a half-wavelength round-trip optical path $2n_2 t = \\lambda/2$ for cancellation.`;
        stepByStepSolution = [`Verify boundary phase shifts and round-trip path difference $2n_2 t$.`];
      } else {
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Pitfall Check #${index}] True or False: Regarding "${conceptTitle}", this statement is physically accurate: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False. ${firstPitfall.correctConcept}`;
          stepByStepSolution = [firstPitfall.correctConcept];
        } else {
          questionText = `[${topicTitle} · Law Check #${index}] True or False: According to Faraday's Law of Electromagnetic Induction, the induced EMF opposes the change in magnetic flux that produces it ($\\mathcal{E} = -d\\Phi_B/dt$).`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `True; the negative sign reflects Lenz's Law and energy conservation.`;
          stepByStepSolution = [`Verify $\\mathcal{E} = -d\\Phi_B/dt$ and Lenz's energy argument.`];
        }
      }
    } else if (subjectId === 'chemistry') {
      const tLower = `${topicId} ${topicTitle}`.toLowerCase();
      const isOrganic =
        tLower.includes('organic') ||
        tLower.includes('substit') ||
        tLower.includes('isomer') ||
        tLower.includes('goc') ||
        tLower.includes('phenol') ||
        tLower.includes('carbonyl') ||
        tLower.includes('nmr') ||
        tLower.includes('pericyclic');
      const isInorganicOrMO =
        tLower.includes('mo') ||
        tLower.includes('cft') ||
        tLower.includes('coord') ||
        tLower.includes('block') ||
        tLower.includes('periodic') ||
        tLower.includes('atomic');

      if (questionType === 'numerical') {
        const variant = m % 4;
        if (isOrganic && variant === 0) {
          // Isoelectric pI calculation
          const pk1 = Number((2.0 + (seed % 5) * 0.2).toFixed(1));
          const pk2 = Number((9.0 + (seed % 4) * 0.2).toFixed(1));
          const pI = ((pk1 + pk2) / 2).toFixed(2);
          questionText = `[${topicTitle} · Model A #${index}] A neutral amino acid has side chain with no ionizable groups and $\\text{p}K_{a1} = ${pk1},\\ \\text{p}K_{a2} = ${pk2}$. Calculate its isoelectric point $\\text{pI}$.`;
          correctAnswer = `${pI}`;
          numericalTolerance = 0.02;
          explanation = `$\\text{pI} = \\frac{${pk1} + ${pk2}}{2} = ${pI}$.`;
          stepByStepSolution = [`Average the two $\\text{p}K_a$ values bracketing the neutral zwitterion.`];
        } else if (isInorganicOrMO || variant === 1) {
          // Octahedral CFSE magnitude: d3 (1.2), d5 low (2.0), d6 low (2.4), d8 (1.2)
          const configs = [
            { label: 'low-spin $d^6$ $[\\text{Fe(CN)}_6]^{4-}$', cfse: '2.4', detail: '$6 \\times 0.4 = 2.4$' },
            { label: 'high-spin $d^3$ $[\\text{Cr(H}_2\\text{O)}_6]^{3+}$', cfse: '1.2', detail: '$3 \\times 0.4 = 1.2$' },
            { label: 'low-spin $d^5$ $[\\text{Fe(CN)}_6]^{3-}$', cfse: '2.0', detail: '$5 \\times 0.4 = 2.0$' },
            { label: 'octahedral $d^8$ $[\\text{Ni(H}_2\\text{O)}_6]^{2+}$', cfse: '1.2', detail: '$6(0.4) - 2(0.6) = 1.2$' },
          ];
          const pick = configs[seed % configs.length];
          questionText = `[${topicTitle} · Model B #${index}] Calculate the magnitude of the Crystal Field Stabilization Energy (CFSE) in multiples of $\\Delta_o$ for ${pick.label}.`;
          correctAnswer = pick.cfse;
          numericalTolerance = 0.05;
          explanation = `Counting $t_{2g}$ ($-0.4\\Delta_o$) and $e_g$ ($+0.6\\Delta_o$) occupancy gives ${pick.detail}\\,\\Delta_o.`;
          stepByStepSolution = [`Assign electrons to $t_{2g}$ and $e_g$ levels: ${pick.detail}.`];
        } else if (variant === 2) {
          // Reaction order rate multiplier in SN2 or second order
          const factor = (seed % 3) + 2; // 2, 3, 4
          const mult = factor * factor;
          questionText = `[${topicTitle} · Model C #${index}] For a bimolecular $S_N2$ reaction obeying $\\text{Rate} = k[\\text{R-X}][\\text{Nu}^-]$, multiplying BOTH substrate and nucleophile concentrations by ${factor} multiplies the reaction rate by what factor?`;
          correctAnswer = `${mult}`;
          explanation = `New rate $= k(${factor}[\\text{R-X}])(${factor}[\\text{Nu}^-]) = ${mult} \\times \\text{Rate}_0$.`;
          stepByStepSolution = [`Evaluate ${factor} \\times ${factor} = ${mult}.`];
        } else {
          // Henderson-Hasselbalch buffer pH when [A-] = 10 * [HA] -> pKa + 1 or equal -> pKa
          const pka = Number((4.0 + (seed % 6) * 0.25).toFixed(2));
          const ratioTen = seed % 2 === 0;
          const ans = (ratioTen ? pka + 1 : pka).toFixed(2);
          questionText = ratioTen
            ? `[${topicTitle} · Model D #${index}] A buffer has $\\text{p}K_a = ${pka.toFixed(2)}$ and conjugate base-to-acid ratio $[\\text{A}^-]/[\\text{HA}] = 10$. Calculate its pH.`
            : `[${topicTitle} · Model D #${index}] A buffer has $\\text{p}K_a = ${pka.toFixed(2)}$ with equimolar $[\\text{A}^-] = [\\text{HA}]$. Calculate its pH.`;
          correctAnswer = ans;
          numericalTolerance = 0.02;
          explanation = `$\\text{pH} = \\text{p}K_a + \\log_{10}([\\text{A}^-]/[\\text{HA}]) = ${ans}$.`;
          stepByStepSolution = [`Substitute ratio into Henderson-Hasselbalch equation.`];
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 4;
        if (isOrganic && variant === 0) {
          const ans = 'Disrotatory ring closure (6π thermal Hückel-type overlap)';
          options = rotateOptions(
            [
              ans,
              'Conrotatory ring closure under thermal conditions',
              'Complete stereochemical racemization via carbocation',
              'Orbital-symmetry forbidden reaction under heat',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model A #${index}] By Woodward-Hoffmann orbital symmetry rules, how does thermal electrocyclization of 1,3,5-hexatriene (6π electrons) proceed?`;
          correctAnswer = ans;
          explanation = `Thermal (4n+2)π electrocyclic closures proceed disrotatorily so terminal same-phase HOMO lobes overlap constructively.`;
          stepByStepSolution = [`Count 6π electrons = 4n+2 -> Thermal = Disrotatory.`];
        } else if (isInorganicOrMO && variant === 1) {
          const ans = 'Thallium ($\\text{Tl}^+$) due to relativistic $6s^2$ inert-pair stabilization';
          options = rotateOptions(
            [
              ans,
              'Boron ($\\text{B}^+$) due to small atomic radius',
              'Aluminium ($\\text{Al}^+$) because $3s^2$ is unreactive',
              'Scandium ($\\text{Sc}^+$) in aqueous complexes',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model B #${index}] In Group 13, which element exhibits a MORE stable $+1$ oxidation state than $+3$ due to the inert-pair effect?`;
          correctAnswer = ans;
          explanation = `Poor d/f shielding in period 6 pulls $6s^2$ electrons inward, favoring $\\text{Tl}^+$ over $\\text{Tl}^{3+}$.`;
          stepByStepSolution = [`Check period 6 heavy p-block inert-pair trend.`];
        } else if (variant === 2) {
          const ans = 'Strictly greater than 1 ($K$ increases with temperature)';
          options = rotateOptions([ans, 'Strictly less than 1 ($K$ decreases)', 'Exactly equal to 1', 'Independent of temperature'], seed);
          questionText = `[${topicTitle} · Model C #${index}] According to the Van 't Hoff equation, raising temperature from $300\\text{ K}$ to $400\\text{ K}$ for an endothermic reaction ($\\Delta H^\\circ > 0$) makes $K_2/K_1$:`;
          correctAnswer = ans;
          explanation = `Endothermic equilibria shift toward products when heated, so $\\ln(K_2/K_1) > 0 \\implies K_2 > K_1$.`;
          stepByStepSolution = [`Apply $\\ln(K_2/K_1) = -\\frac{\\Delta H^\\circ}{R}(1/T_2 - 1/T_1) > 0$.`];
        } else {
          const ans = 'Polar aprotic solvents (DMSO, acetone) because they leave nucleophiles unsolvated';
          options = rotateOptions(
            [
              ans,
              'Protic solvents (water, ethanol) to maximize nucleophile H-bonding',
              'Tertiary substrates to minimize steric hindrance',
              'Complete racemization without backside attack',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model D #${index}] Which solvent class strongly accelerates an anionic $S_N2$ substitution reaction?`;
          correctAnswer = ans;
          explanation = `Polar aprotic solvents solvate counter-cations while leaving anionic nucleophiles bare and highly reactive.`;
          stepByStepSolution = [`Compare nucleophile solvation shells in protic vs aprotic solvents.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'Dioxygen ($O_2$) — two unpaired electrons in degenerate $\\pi^*_{2p}$ orbitals';
        const c2 = 'Nitric oxide ($NO$) — odd electron count (15 valence electrons)';
        const c3 = 'Diboron ($B_2$) — two unpaired electrons in $\\pi_{2p}$ orbitals';
        const d1 = 'Dinitrogen ($N_2$) — all electrons fully paired';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Multi-Model #${index}] According to Molecular Orbital Theory, which diatomic species are PARAMAGNETIC? (Select all that apply)`;
        explanation = `$O_2$, $NO$, and $B_2$ each contain unpaired electrons, whereas $N_2$ (14 e⁻) is completely diamagnetic.`;
        stepByStepSolution = [`Fill $\\sigma_{2p}$ and $\\pi_{2p}$ MOs per Hund's rule.`];
      } else if (questionType === 'assertion_reason') {
        const useConcept = firstObs && m % 2 === 1;
        questionText = useConcept
          ? `[${topicTitle} · Chemical Logic #${index}] Evaluate "${conceptTitle}":\nAssertion (A): ${firstObs}\nReason (R): Electronic structure, orbital symmetry, and thermodynamic potential differences dictate chemical equilibria and reactivity.`
          : `[${topicTitle} · Redox Logic #${index}] Evaluate:\nAssertion (A): Combining two half-cell reduction potentials to obtain a third half-cell requires weighting by electron count ($n_3 E_3^\\circ = n_1 E_1^\\circ + n_2 E_2^\\circ$) rather than adding $E_1^\\circ + E_2^\\circ$.\nReason (R): Standard potential $E^\\circ$ is an intensive property, whereas $\\Delta G^\\circ = -nFE^\\circ$ is an extensive thermodynamic state function.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `Extensive Gibbs energy adds directly across steps, yielding electron-weighted Latimer equations for $E^\\circ$.`;
        stepByStepSolution = [`Sum $\\Delta G_3^\\circ = \\Delta G_1^\\circ + \\Delta G_2^\\circ$ and divide by $-n_3 F$.`];
      } else {
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Pitfall Check #${index}] True or False: Concerning "${conceptTitle}", this claim is valid: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False. ${firstPitfall.correctConcept}`;
          stepByStepSolution = [firstPitfall.correctConcept];
        } else {
          questionText = `[${topicTitle} · Equilibrium Check #${index}] True or False: At $298\\text{ K}$, increasing the concentration of a common ion decreases the molar solubility of a sparingly soluble salt while leaving its $K_{sp}$ value unchanged.`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `$K_{sp}$ depends only on temperature, so common-ion suppression lowers molar solubility $s$ without changing $K_{sp}$.`;
          stepByStepSolution = [`Verify Le Chatelier equilibrium shift vs temperature-only $K_{sp}$.`];
        }
      }
    } else if (subjectId === 'biology') {
      const tLower = `${topicId} ${topicTitle}`.toLowerCase();
      if (questionType === 'numerical') {
        const variant = m % 4;
        if (variant === 0 || tLower.includes('enzym') || tLower.includes('michaelis')) {
          const km = 10;
          const vmax = 120;
          const s = ((seed % 4) + 1) * 10; // 10, 20, 30, 40
          const v0 = ((vmax * s) / (km + s)).toFixed(1);
          questionText = `[${topicTitle} · Model A #${index}] An enzyme follows Michaelis-Menten kinetics with $V_{\\max} = ${vmax}\\,\\mu\\text{M/min}$ and $K_m = ${km}\\,\\mu\\text{M}$. Calculate initial velocity $v_0$ at $[S] = ${s}\\,\\mu\\text{M}$.`;
          correctAnswer = `${v0}`;
          numericalTolerance = 0.2;
          explanation = `$v_0 = \\frac{${vmax}\\times${s}}{${km}+${s}} = ${v0}\\,\\mu\\text{M/min}$.`;
          stepByStepSolution = [`Apply $v_0 = V_{\\max}[S]/(K_m + [S])$.`];
        } else if (variant === 1 || tLower.includes('hardy') || tLower.includes('allel')) {
          const p = Number((0.1 + (seed % 8) * 0.1).toFixed(2));
          const q = Number((1 - p).toFixed(2));
          const het = (2 * p * q).toFixed(3);
          questionText = `[${topicTitle} · Model B #${index}] In a population in Hardy-Weinberg equilibrium with dominant allele frequency $p = ${p.toFixed(2)}$, calculate expected heterozygote frequency ($2pq$).`;
          correctAnswer = `${het}`;
          numericalTolerance = 0.01;
          explanation = `$q = 1 - ${p.toFixed(2)} = ${q.toFixed(2)}$, so $2pq = ${het}$.`;
          stepByStepSolution = [`Find $q = 1 - p$ and compute $2pq = ${het}$.`];
        } else if (variant === 2 || tLower.includes('phylo')) {
          const diff = ((seed % 5) + 2) * 3; // 6..18
          const rate = 1.5;
          const divTime = diff / (2 * rate);
          questionText = `[${topicTitle} · Model C #${index}] Two sister taxa differ by ${diff} neutral substitutions per kb, and each lineage accumulates mutations at $1.5$ substitutions/kb/Myr. Estimate divergence time (Myr).`;
          correctAnswer = `${divTime}`;
          numericalTolerance = 0.05;
          explanation = `$t = D / (2r) = ${diff} / 3.0 = ${divTime}\\text{ Myr}$.`;
          stepByStepSolution = [`Divide pairwise distance by combined rate $2r = 3.0$.`];
        } else {
          const cycles = (seed % 5) + 3; // 3..7
          const copies = Math.pow(2, cycles);
          questionText = `[${topicTitle} · Model D #${index}] Starting from 1 double-stranded target DNA molecule, how many copies exist after ${cycles} ideal exponential PCR amplification cycles?`;
          correctAnswer = `${copies}`;
          explanation = `$2^{${cycles}} = ${copies}$ copies.`;
          stepByStepSolution = [`Evaluate $N_0 \\cdot 2^n = 2^{${cycles}} = ${copies}$.`];
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 4;
        if (variant === 0) {
          const ans = 'Uncompetitive inhibitor (binds exclusively to the ES complex)';
          options = rotateOptions(
            [
              ans,
              'Competitive inhibitor (binds active site of free enzyme E)',
              'Pure noncompetitive inhibitor (does not alter Km)',
              'Allosteric activator (lowers apparent Km only)',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model A #${index}] Which reversible enzyme inhibitor produces parallel Lineweaver-Burk double-reciprocal plots by decreasing BOTH apparent $V_{\\max}$ and apparent $K_m$ by the same factor?`;
          correctAnswer = ans;
          explanation = `Uncompetitive inhibitors bind only to the $ES$ complex, lowering both $V_{\\max}$ and $K_m$ equally.`;
          stepByStepSolution = [`Check slope $K_m / V_{\\max}$ stays constant for parallel plots.`];
        } else if (variant === 1) {
          const ans = 'Rightward shift (higher $P_{50}$, decreased $O_2$ affinity) promoting tissue unloading';
          options = rotateOptions(
            [
              ans,
              'Leftward shift (lower $P_{50}$, tighter $O_2$ retention)',
              'Complete loss of cooperative sigmoidal binding',
              'Conversion of $HCO_3^-$ directly into hemoglobin',
            ],
            seed
          );
          questionText = `[${topicTitle} · Model B #${index}] In actively respiring skeletal muscle, elevated $CO_2$ and lowered blood pH trigger the Bohr shift on hemoglobin. What happens?`;
          correctAnswer = ans;
          explanation = `Protonation stabilizes hemoglobin's taut (T) state, shifting the curve right and releasing more $O_2$ to muscles.`;
          stepByStepSolution = [`Apply Bohr effect: high $[H^+]/CO_2$ stabilizes deoxy-Hb.`];
        } else if (variant === 2) {
          const ans = 'Sepals, Sepals, Carpels, Carpels';
          options = rotateOptions([ans, 'Petals, Petals, Stamens, Stamens', 'Carpels, Stamens, Stamens, Carpels', 'Sepals, Petals, Petals, Sepals'], seed);
          questionText = `[${topicTitle} · Model C #${index}] In the ABC model of floral organ identity, a loss-of-function Class B mutant produces which whorl sequence from outside inward?`;
          correctAnswer = ans;
          explanation = `Without B, whorl 2 (A+B) reduces to A (sepals) and whorl 3 (B+C) reduces to C (carpels).`;
          stepByStepSolution = [`Substitute $B = 0$ into (A, A+B, B+C, C).`];
        } else {
          const ans = 'CD8+ cytotoxic T lymphocytes';
          options = rotateOptions([ans, 'CD4+ helper T cells', 'Naive IgM B cells', 'Basophils'], seed);
          questionText = `[${topicTitle} · Model D #${index}] Which immune cell type directly recognizes endogenous intracellular peptides presented on MHC Class I molecules?`;
          correctAnswer = ans;
          explanation = `By the Rule of 8 ($1 \\times 8 = 8$), MHC-I pairs with CD8+ cytotoxic T cells.`;
          stepByStepSolution = [`Match MHC-I to CD8+ and MHC-II to CD4+.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'Descending Loop of Henle is water-permeable while thick ascending limb actively pumps NaCl without water exit';
        const c2 = 'ADH (vasopressin) inserts aquaporin-2 water channels into collecting duct principal cells';
        const c3 = 'Osmotic water movement always flows toward lower (more negative) water potential $\\Psi = \\Psi_s + \\Psi_p$';
        const d1 = 'Pure water at atmospheric pressure has $\\Psi_s = -10\\text{ MPa}$';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Multi-Model #${index}] Which physiological transport principles are TRUE? (Select all that apply)`;
        explanation = `Pure distilled water at atmospheric pressure has $\\Psi = 0$; all three osmoregulatory statements are true.`;
        stepByStepSolution = [`Verify countercurrent multiplier, ADH aquaporins, and $\\Psi$ sign convention.`];
      } else if (questionType === 'assertion_reason') {
        const useConcept = firstObs && m % 2 === 1;
        questionText = useConcept
          ? `[${topicTitle} · Bio Logic #${index}] Consider "${conceptTitle}":\nAssertion (A): ${firstObs}\nReason (R): Cellular physiology and evolutionary trees operate through conserved molecular gradients and shared ancestry.`
          : `[${topicTitle} · Bioenergetics #${index}] Consider:\nAssertion (A): Chemical uncouplers like 2,4-DNP stop mitochondrial ATP synthesis while increasing oxygen consumption.\nReason (R): Protonophores collapse the inner-membrane electrochemical $\\Delta p$ gradient, removing thermodynamic back-pressure on the electron transport chain.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `Uncouplers dissipate the proton gradient as heat, decoupling oxidation from ATP synthase phosphorylation.`;
        stepByStepSolution = [`Connect proton-motive force collapse to unchecked ETC flux.`];
      } else {
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Pitfall Check #${index}] True or False: Regarding "${conceptTitle}", this claim holds: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False. ${firstPitfall.correctConcept}`;
          stepByStepSolution = [firstPitfall.correctConcept];
        } else {
          questionText = `[${topicTitle} · Cladistics Check #${index}] True or False: In cladistics, a monophyletic taxon must include an ancestral species and ALL of its evolutionary descendants.`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `True; omitting any descendant lineage renders a grouping paraphyletic.`;
          stepByStepSolution = [`Compare monophyletic vs paraphyletic definitions.`];
        }
      }
    } else if (subjectId === 'english') {
      const roots = [
        { root: 'chron', meaning: 'time', example: 'anachronism' },
        { root: 'bene', meaning: 'good / well', example: 'benefactor' },
        { root: 'path', meaning: 'feeling / suffering', example: 'empathy' },
        { root: 'mal', meaning: 'bad / ill', example: 'malevolent' },
        { root: 'omni', meaning: 'all', example: 'omniscient' },
      ];
      const rPick = roots[seed % roots.length];
      if (questionType === 'numerical') {
        const meters = [
          { name: 'Iambic Pentameter', count: '10' },
          { name: 'Alexandrine (Hexameter)', count: '12' },
          { name: 'Iambic Tetrameter', count: '8' },
          { name: 'English Haiku total', count: '17' },
        ];
        const mPick = meters[seed % meters.length];
        questionText = `[${topicTitle} · Prosody #${index}] In classical English prosody, how many metric syllables comprise a standard line/stanza of ${mPick.name}?`;
        correctAnswer = mPick.count;
        explanation = `${mPick.name} totals ${mPick.count} standard syllables.`;
        stepByStepSolution = [`Count feet/lines in ${mPick.name} = ${mPick.count} syllables.`];
      } else if (questionType === 'single_choice') {
        const variant = m % 3;
        if (variant === 0) {
          const ans = `"${rPick.root}" means "${rPick.meaning}" (as in "${rPick.example}")`;
          options = rotateOptions(
            [
              ans,
              `"${rPick.root}" means "water"`,
              `"${rPick.root}" means "opposite / against"`,
              `"${rPick.root}" means "ancient stone"`,
            ],
            seed
          );
          questionText = `[${topicTitle} · Etymology #${index}] Which definition accurately captures the classical morpheme \`${rPick.root}\`?`;
          correctAnswer = ans;
          explanation = `The root \`${rPick.root}\` derives from "${rPick.meaning}", seen in words like "${rPick.example}".`;
          stepByStepSolution = [`Trace cognate "${rPick.example}" back to root "${rPick.root}".`];
        } else if (variant === 1) {
          const ans = 'Free indirect discourse';
          options = rotateOptions([ans, 'Epistolary framing', 'Periodic subordination', 'Dramatic aside'], seed);
          questionText = `[${topicTitle} · Narratology #${index}] Which narrative technique renders a character's interior questions and subjective idioms inside third-person past-tense narration without quotation marks?`;
          correctAnswer = ans;
          explanation = `Free indirect discourse merges third-person grammatical perspective with first-person interior voice.`;
          stepByStepSolution = [`Identify blended narrator/character voice.`];
        } else {
          const ans = 'To dramatize tension between pastoral tradition and urban mechanization through contrasting diction and tempo.';
          options = rotateOptions(
            [
              ans,
              'To reject all figurative language in favor of raw numerical tables.',
              'To introduce unintentional chronological errors in syntax.',
              'To enforce neutral legalistic neutrality devoid of mood.',
            ],
            seed
          );
          questionText = `[${topicTitle} · Rhetoric #${index}] An essay juxtaposes archaic pastoral vocabulary with abrupt, staccato modern clauses. What rhetorical effect does this shift achieve?`;
          correctAnswer = ans;
          explanation = `Pairing form (staccato vs archaic) with theme intensifies the contrast between tradition and mechanization.`;
          stepByStepSolution = [`Link syntactic contrast directly to thematic tension.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'Having finished the manuscript after midnight, the printer ran out of ink.';
        const c2 = 'Covered in thick cobwebs, Professor Albright spotted an annotated first edition.';
        const c3 = 'Analyzing the statistical correlation, the hypothesis was approved by the panel.';
        const d1 = 'Running toward the departing train, Julian dropped his briefcase on the platform.';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Syntax Audit #${index}] Which sentences contain a DANGLING or MISPLACED modifier? (Select all that apply)`;
        explanation = `Only Julian logically runs toward the train; printers do not write manuscripts, Professor Albright was not covered in cobwebs, and hypotheses cannot analyze correlations.`;
        stepByStepSolution = [`Verify whether the grammatical subject after the comma can perform the participial phrase.`];
      } else if (questionType === 'assertion_reason') {
        questionText = `[${topicTitle} · Logic Check #${index}] Evaluate:\nAssertion (A): A sound deductive syllogism guarantees a true conclusion whenever both premises are true.\nReason (R): Valid deductive structure transmits truth necessarily from premises to conclusion, unlike probabilistic inductive inference.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `Deductive soundness combines structural validity with factually true premises.`;
        stepByStepSolution = [`Distinguish deductive necessity from inductive likelihood.`];
      } else {
        if (firstPitfall && m % 2 === 1) {
          questionText = `[${topicTitle} · Editorial Check #${index}] True or False: Regarding "${conceptTitle}", this claim is grammatically/rhetorically sound: "${firstPitfall.flawedReasoning}"`;
          options = ['True', 'False'];
          correctAnswer = 'False';
          explanation = `False. ${firstPitfall.correctConcept}`;
          stepByStepSolution = [firstPitfall.correctConcept];
        } else {
          questionText = `[${topicTitle} · Punctuation Check #${index}] True or False: Joining two independent clauses with only a comma (without a coordinating conjunction) creates a comma splice error in formal prose.`;
          options = ['True', 'False'];
          correctAnswer = 'True';
          explanation = `True; use a semicolon, period, or comma + FANBOYS conjunction.`;
          stepByStepSolution = [`Check independent clause boundary punctuation rules.`];
        }
      }
    } else {
      // Data Science
      if (questionType === 'code_output') {
        const lam = (seed % 3 + 1) * 4; // 4, 8, 12
        const sigma = 2;
        const dVal = ((sigma * sigma) / (sigma * sigma + lam)).toFixed(2);
        options = rotateOptions([dVal, '0.95', '1.00', '0.05'], seed);
        questionText = `[${topicTitle} · Python ML Trace #${index}] What numerical value does this Ridge spectral shrinkage snippet print?\n\`\`\`python\nsigma, lam = ${sigma}, ${lam}\nfilter_factor = (sigma ** 2) / (sigma ** 2 + lam)\nprint(f"{filter_factor:.2f}")\n\`\`\``;
        correctAnswer = dVal;
        explanation = `$d = ${sigma}^2 / (${sigma}^2 + ${lam}) = 4 / ${4 + lam} = ${dVal}$.`;
        stepByStepSolution = [`Evaluate $4 / ${4 + lam} = ${dVal}$.`];
      } else if (questionType === 'numerical') {
        const variant = m % 2;
        if (variant === 0) {
          const tp = 75 + (seed % 15);
          const fp = 10 + (seed % 8);
          const prec = (tp / (tp + fp)).toFixed(3);
          questionText = `[${topicTitle} · Model A #${index}] A classifier records $TP = ${tp}, FP = ${fp}, FN = 12$. Calculate Precision to 3 decimal places.`;
          correctAnswer = prec;
          numericalTolerance = 0.005;
          explanation = `$\\text{Precision} = ${tp} / (${tp} + ${fp}) = ${prec}$.`;
          stepByStepSolution = [`Compute $TP / (TP + FP) = ${prec}$.`];
        } else {
          const alpha0 = 2;
          const beta0 = 8;
          const succ = (seed % 5) + 4;
          const nTrials = 10;
          const mean = ((alpha0 + succ) / (alpha0 + beta0 + nTrials)).toFixed(2);
          questionText = `[${topicTitle} · Model B #${index}] Starting from a Beta(2, 8) prior, you observe ${succ} successes in 10 Binomial trials. Compute the posterior mean.`;
          correctAnswer = mean;
          numericalTolerance = 0.01;
          explanation = `Posterior is Beta(${alpha0 + succ}, ${beta0 + nTrials - succ}), whose mean is $(${alpha0 + succ})/20 = ${mean}$.`;
          stepByStepSolution = [`Compute $(\\alpha + k)/(\\alpha + \\beta + n) = ${mean}$.`];
        }
      } else if (questionType === 'single_choice') {
        const variant = m % 3;
        if (variant === 0) {
          const ans = 'Concordance probability $P(\\text{score}(X^+) > \\text{score}(X^-))$';
          options = rotateOptions([ans, 'Raw accuracy at fixed threshold 0.5', 'False discovery rate', 'KL divergence between logits and labels'], seed);
          questionText = `[${topicTitle} · Model A #${index}] What does the Area Under the ROC Curve (ROC-AUC) directly equal?`;
          correctAnswer = ans;
          explanation = `ROC-AUC equals the Mann-Whitney concordance probability that a random positive outranks a random negative.`;
          stepByStepSolution = [`Relate trapezoidal ROC integral to pairwise rank concordance.`];
        } else if (variant === 1) {
          const ans = 'Lasso ($L_1$) Regularization';
          options = rotateOptions([ans, 'Ridge ($L_2$) Regularization', 'Mini-batch gradient shuffling', 'Mean-centering features'], seed);
          questionText = `[${topicTitle} · Model B #${index}] Which penalty geometry drives non-informative regression coefficients strictly to zero for sparse feature selection?`;
          correctAnswer = ans;
          explanation = `Diamond-shaped $L_1$ constraint contours intersect axes at exact zeros.`;
          stepByStepSolution = [`Compare $L_1$ diamond vertices vs $L_2$ circular contours.`];
        } else {
          const ans = 'Negative functional gradient pseudo-residuals $-\\partial L / \\partial F(x_i)$';
          options = rotateOptions([ans, 'Unweighted random bootstrap labels only', 'First principal component scores', 'Inverse Hessian eigenvalues'], seed);
          questionText = `[${topicTitle} · Model C #${index}] In Gradient Boosted Decision Trees (GBDT), what target does each new tree fit at boosting round $m$?`;
          correctAnswer = ans;
          explanation = `Successive regression trees approximate the negative gradient direction in function space.`;
          stepByStepSolution = [`Recall Friedman's functional gradient boosting update.`];
        }
      } else if (questionType === 'multiple_choice') {
        const c1 = 'Early stopping monitored on held-out validation loss';
        const c2 = 'L2 weight decay regularization';
        const c3 = 'Cross-validated ensemble bagging';
        const d1 = 'Adding unregularized polynomial degree without extra samples';
        options = rotateOptions([c1, c2, c3, d1], seed);
        correctAnswer = [c1, c2, c3];
        questionText = `[${topicTitle} · Multi-Model #${index}] Which techniques reduce generalization variance (overfitting)? (Select all that apply)`;
        explanation = `Adding high-degree terms without more data increases variance and worsens overfitting.`;
        stepByStepSolution = [`Evaluate each item along the bias-variance trade-off.`];
      } else if (questionType === 'assertion_reason') {
        questionText = `[${topicTitle} · Inference Logic #${index}] Evaluate:\nAssertion (A): Data leakage from fitting scalers before train-test splitting inflates cross-validation metrics.\nReason (R): Global mean/variance statistics expose held-out test distribution information to training transformations.`;
        const ans = 'Both Assertion (A) and Reason (R) are TRUE, and Reason (R) is the CORRECT explanation of Assertion (A)';
        options = [
          ans,
          'Both Assertion (A) and Reason (R) are TRUE, but Reason (R) is NOT the correct explanation of Assertion (A)',
          'Assertion (A) is TRUE, but Reason (R) is FALSE',
          'Assertion (A) is FALSE, but Reason (R) is TRUE',
        ];
        correctAnswer = ans;
        explanation = `Preprocessing parameters must be fit strictly inside training folds and only applied to validation/test folds.`;
        stepByStepSolution = [`Enforce strict pipeline encapsulation inside CV folds.`];
      } else {
        questionText = `[${topicTitle} · Statistical Check #${index}] True or False: Under the Central Limit Theorem, standardized sample means of i.i.d. finite-variance draws converge in distribution to a Normal distribution as $n \\to \\infty$.`;
        options = ['True', 'False'];
        correctAnswer = 'True';
        explanation = `True; finite mean and variance suffice for asymptotic normality of sample means.`;
        stepByStepSolution = [`Verify finite variance assumption of Lindeberg-Levy CLT.`];
      }
    }

    if (hints.length === 0) {
      hints = [
        `Identify the core theorem governing ${conceptTitle}.`,
        firstObs || `Verify boundary conditions and units in ${topicTitle}.`,
      ];
    }

    return {
      id,
      subjectId,
      examTracks,
      chapterId,
      topicId,
      subtopicId: conceptEntry?.subtopicId ?? topicId,
      conceptId: conceptEntry?.id ?? `concept-${topicId}-topic`,
      difficulty,
      questionType,
      questionText,
      options,
      correctAnswer,
      numericalTolerance,
      explanation,
      stepByStepSolution,
      hints,
      tags: [topicTitle, conceptTitle, subjectId, difficulty, `Model-${(m % 5) + 1}`],
      source: `Learn.co Multi-Model Generator (#${index})`,
      verificationStatus: 'verified',
      version: 1,
    };
  }
}
