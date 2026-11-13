import { ChapterItem, ConceptDetail, SubjectId, TopicItem } from '../../types/curriculum';

/**
 * Curriculum depth expansion (Track C).
 *
 * The shipped curriculum had 44 chapters but only **one topic per chapter** and
 * 63 concepts in total, so a chapter such as "Differential Calculus" contained a
 * single narrow topic on monotonicity and nothing else — no limits, continuity,
 * differentiation rules or applications. A learner could not actually study a
 * chapter end to end.
 *
 * Everything below is *additive*: existing chapter ids, topic ids, concept ids
 * and copy are untouched. New topics are appended to existing chapters, and a
 * small number of genuinely missing foundational chapters are added.
 *
 * Authoring rules applied throughout:
 *  - sequenceOrder follows a prerequisite chain (definitions -> techniques ->
 *    applications -> synthesis), never an arbitrary list.
 *  - prerequisites only reference concept ids declared here or already shipped,
 *    which `tests/curriculum.test.ts` enforces.
 *  - every concept carries a formal definition, an intuition, at least one
 *    worked example with a real final answer, and a genuine pitfall.
 */

type ConceptSeed = Omit<
  ConceptDetail,
  'subjectId' | 'chapterId' | 'topicId' | 'subtopicId' | 'examTracks'
> & {
  examTracks?: ConceptDetail['examTracks'];
};

interface SubtopicSeed {
  id: string;
  title: string;
  description: string;
  concepts: ConceptSeed[];
}

interface TopicSeed {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  subtopics: SubtopicSeed[];
}

export interface ChapterAddition {
  subjectId: SubjectId;
  chapterId: string;
  /** Omitted when adding a brand-new chapter. */
  examTracks?: ConceptDetail['examTracks'];
  topics?: TopicSeed[];
  newChapter?: {
    id: string;
    title: string;
    sequenceOrder: number;
    description: string;
  };
}

const ALL: ConceptDetail['examTracks'] = ['all'];

/** Build a fully-formed TopicItem from a compact seed. */
export function buildTopic(subjectId: SubjectId, chapterId: string, seed: TopicSeed): TopicItem {
  const subtopics = seed.subtopics.map((subtopic) => {
    const concepts: ConceptDetail[] = subtopic.concepts.map((concept) => ({
      ...concept,
      subjectId,
      chapterId,
      topicId: seed.id,
      subtopicId: subtopic.id,
      examTracks: concept.examTracks ?? ALL,
    }));

    return {
      id: subtopic.id,
      title: subtopic.title,
      description: subtopic.description,
      concepts,
    };
  });

  return {
    id: seed.id,
    chapterId,
    title: seed.title,
    description: seed.description,
    subtopics,
    conceptCount: subtopics.reduce((total, subtopic) => total + subtopic.concepts.length, 0),
    estimatedHours: seed.estimatedHours,
  };
}

// =====================================================================
// MATHEMATICS — foundations the calculus/linear-algebra chapters assume
// but never taught.
// =====================================================================

const MATH_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'math',
    chapterId: 'math-ch-diff-calc',
    topics: [
      {
        id: 'math-topic-limits-continuity',
        title: 'Limits, Continuity & Differentiability',
        description:
          'The analytical foundation every derivative rule depends on: existence of limits, continuity tests, and where differentiation breaks down.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-limit-techniques',
            title: 'Evaluating Limits',
            description: 'Algebraic, trigonometric and asymptotic limit techniques including indeterminate forms.',
            concepts: [
              {
                id: 'concept-limit-definition',
                title: 'Epsilon-Delta Definition of a Limit',
                summary:
                  'Make "f(x) approaches L" precise: for every tolerance on the output there is a tolerance on the input that guarantees it.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 30,
                formalDefinition:
                  'We say $\\lim_{x \\to a} f(x) = L$ if for every $\\varepsilon > 0$ there exists $\\delta > 0$ such that $0 < |x - a| < \\delta$ implies $|f(x) - L| < \\varepsilon$. The point $a$ itself need not be in the domain of $f$.',
                intuitiveExplanation:
                  'Think of a challenge game. An adversary names any output error $\\varepsilon$ they will accept. You must respond with an input window $\\delta$ small enough that staying inside it forces the output to stay within their error. If you can always answer, the limit exists at $L$.',
                keyFormulas: [
                  {
                    label: 'Formal Limit Statement',
                    latex: '\\forall \\varepsilon > 0,\\ \\exists \\delta > 0 : 0 < |x - a| < \\delta \\implies |f(x) - L| < \\varepsilon',
                    explanation: 'Quantifier order matters: $\\delta$ may depend on $\\varepsilon$, never the reverse.',
                  },
                ],
                keyObservations: [
                  'The value $f(a)$ is irrelevant to the limit — only behaviour near $a$ counts.',
                  'One-sided limits must agree: $\\lim_{x \\to a^-} = \\lim_{x \\to a^+}$ is required for the two-sided limit to exist.',
                  'Every calculus theorem (continuity, derivative, integral) is ultimately a limit statement.',
                ],
                workedExamples: [
                  {
                    id: 'we-limit-01',
                    title: 'Proving a Linear Limit from the Definition',
                    problemStatement: 'Prove from the epsilon-delta definition that $\\lim_{x \\to 3} (2x - 1) = 5$.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'We need $|(2x - 1) - 5| < \\varepsilon$, which simplifies to $|2x - 6| < \\varepsilon$.',
                      'Factor the constant: $2|x - 3| < \\varepsilon$, so $|x - 3| < \\varepsilon / 2$.',
                      'Choose $\\delta = \\varepsilon / 2$. This is a legal response because it is positive whenever $\\varepsilon > 0$.',
                      'Then $0 < |x - 3| < \\delta$ gives $|f(x) - 5| = 2|x - 3| < 2\\delta = \\varepsilon$, as required.',
                    ],
                    finalAnswer: '$\\delta = \\varepsilon / 2$ works for every $\\varepsilon > 0$.',
                    keyTakeaway:
                      'Work backwards from the target inequality to discover $\\delta$, then present the proof forwards.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-limit-01',
                    trapTitle: 'Choosing $\\delta$ before seeing $\\varepsilon$',
                    flawedReasoning: 'Pick a fixed $\\delta = 0.1$; that should be small enough for any tolerance.',
                    correctConcept:
                      '$\\delta$ must be produced *in response to* a given $\\varepsilon$. A fixed $\\delta$ fails for $\\varepsilon$ smaller than the output variation it permits.',
                    counterExample:
                      'For $f(x) = 10x$ near $0$ with $\\delta = 0.1$, outputs vary by $1$, so any $\\varepsilon < 1$ defeats it.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For $\\lim_{x \\to 2}(3x + 1) = 7$, which $\\delta$ works for a given $\\varepsilon$?',
                  options: ['$\\delta = \\varepsilon$', '$\\delta = \\varepsilon / 3$', '$\\delta = 3\\varepsilon$', '$\\delta = \\varepsilon^2$'],
                  correctIndex: 1,
                  explanation: '$|3x + 1 - 7| = 3|x - 2|$, so we need $3|x-2| < \\varepsilon$, i.e. $|x - 2| < \\varepsilon/3$.',
                },
              },
              {
                id: 'concept-indeterminate-forms',
                title: 'Indeterminate Forms & L\'Hopital\'s Rule',
                summary:
                  'Resolve limits that look like $0/0$ or $\\infty/\\infty$ by comparing rates of change instead of guessing.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 30,
                formalDefinition:
                  'If $\\lim_{x \\to a} f(x) = \\lim_{x \\to a} g(x) = 0$ (or both $\\pm\\infty$) and $g\'(x) \\neq 0$ near $a$, then $\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}$, provided the latter exists or is infinite.',
                intuitiveExplanation:
                  'If both numerator and denominator collapse to zero, the ratio is decided by which one shrinks faster. Derivatives measure exactly that speed, so the ratio of derivatives is the limit of the ratio.',
                keyFormulas: [
                  {
                    label: "L'Hopital's Rule",
                    latex: '\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}',
                    explanation: 'Applies only to $0/0$ or $\\infty/\\infty$; verifying the form first is mandatory.',
                  },
                ],
                keyObservations: [
                  'Seven indeterminate forms exist: $0/0$, $\\infty/\\infty$, $0 \\cdot \\infty$, $\\infty - \\infty$, $0^0$, $1^\\infty$, $\\infty^0$.',
                  'Forms like $0 \\cdot \\infty$ must be rewritten as a ratio before the rule applies.',
                  'The rule is invalid when the derivative limit oscillates, e.g. $x \\to \\infty$ for $(x + \\sin x)/x$.',
                ],
                workedExamples: [
                  {
                    id: 'we-limit-02',
                    title: 'Resolving a 0/0 Form',
                    problemStatement: 'Evaluate $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Substituting $x = 0$ gives $0/0$, an indeterminate form, so the rule applies.',
                      'Differentiate numerator and denominator separately: $\\cos x$ and $1$.',
                      'The new limit is $\\lim_{x \\to 0} \\cos x = \\cos 0$.',
                    ],
                    finalAnswer: '$1$',
                    keyTakeaway:
                      'Always substitute first. If the result is a real number, that is the limit and no rule is needed.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-limit-02',
                    trapTitle: 'Applying the rule to a determinate form',
                    flawedReasoning: 'Differentiate top and bottom whenever a fraction appears in a limit.',
                    correctConcept:
                      'The rule requires $0/0$ or $\\infty/\\infty$. For $\\lim_{x\\to 0} \\frac{x+1}{2}$, the limit is $1/2$ directly; differentiating gives $1/0$, which is wrong.',
                    counterExample: '$\\lim_{x \\to 0} \\frac{x + 1}{2} = \\frac{1}{2}$, but the derivative ratio is $\\frac{1}{0}$, undefined.',
                  },
                ],
                prerequisites: [{ id: 'concept-limit-definition', title: 'Epsilon-Delta Definition of a Limit', subjectId: 'math' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Evaluate $\\lim_{x \\to 0} \\frac{e^x - 1}{x}$.',
                  options: ['$0$', '$1$', '$e$', 'The limit does not exist'],
                  correctIndex: 1,
                  explanation: 'It is $0/0$, so the derivative ratio gives $\\lim_{x \\to 0} e^x = 1$.',
                },
              },
              {
                id: 'concept-asymptotic-growth',
                title: 'Asymptotic Growth & Dominant Terms',
                summary:
                  'Decide limits at infinity by comparing growth hierarchies rather than computing values.',
                difficulty: 'medium',
                estimatedMinutes: 12,
                xpReward: 20,
                formalDefinition:
                  'For $x \\to \\infty$, the hierarchy $\\ln x \\ll x^p \\ll a^x \\ll x! \\ll x^x$ holds for $p > 0$ and $a > 1$, meaning each is negligible compared with the next.',
                intuitiveExplanation:
                  'At infinity, the fastest-growing term in a ratio decides everything else. Polynomials are trumped by exponentials, and both are trumped by factorials.',
                keyFormulas: [
                  {
                    label: 'Growth Hierarchy',
                    latex: '\\ln x \\ll x^{p} \\ll a^{x} \\ll x! \\quad (p > 0,\\ a > 1)',
                    explanation: 'Divide numerator and denominator by the dominant term to evaluate the limit.',
                  },
                ],
                keyObservations: [
                  'For a rational function, the limit at infinity depends only on the highest-degree terms.',
                  'Equal degrees give the ratio of leading coefficients; a higher numerator degree diverges.',
                  'This same hierarchy governs which algorithms are considered efficient.',
                ],
                workedExamples: [
                  {
                    id: 'we-limit-03',
                    title: 'Rational Function at Infinity',
                    problemStatement: 'Evaluate $\\lim_{x \\to \\infty} \\frac{3x^2 + 5x}{2x^2 - 7}$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Both numerator and denominator are degree 2, so divide by $x^2$.',
                      'This gives $\\frac{3 + 5/x}{2 - 7/x^2}$.',
                      'As $x \\to \\infty$, the terms $5/x$ and $7/x^2$ vanish.',
                      'The limit is therefore $3/2$.',
                    ],
                    finalAnswer: '$\\frac{3}{2}$',
                    keyTakeaway: 'Dividing by the highest power is equivalent to comparing leading coefficients.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-limit-03',
                    trapTitle: 'Assuming every infinity-over-infinity limit is $1$',
                    flawedReasoning: 'Both sides grow without bound, so the ratio must settle at $1$.',
                    correctConcept:
                      'The ratio depends on relative growth. $x^2 / x$ diverges, while $x/x^2$ tends to $0$.',
                    counterExample: '$\\lim_{x\\to\\infty} \\frac{x^2}{x} = \\infty$, not $1$.',
                  },
                ],
                prerequisites: [{ id: 'concept-limit-definition', title: 'Epsilon-Delta Definition of a Limit', subjectId: 'math' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which grows fastest as $x \\to \\infty$?',
                  options: ['$x^{10}$', '$2^x$', '$\\ln x$', '$100x$'],
                  correctIndex: 1,
                  explanation: 'Exponentials dominate every polynomial, so $2^x$ eventually overtakes $x^{10}$.',
                },
              },
            ],
          },
          {
            id: 'math-sub-continuity-differentiability',
            title: 'Continuity & Differentiability',
            description: 'Classifying discontinuities and identifying where derivatives fail to exist.',
            concepts: [
              {
                id: 'concept-continuity-types',
                title: 'Continuity & Classification of Discontinuities',
                summary:
                  'Decide whether a function has a hole, a jump or an asymptote, and whether it can be repaired.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 25,
                formalDefinition:
                  '$f$ is continuous at $a$ if (i) $f(a)$ is defined, (ii) $\\lim_{x \\to a} f(x)$ exists, and (iii) the two are equal. Failing (ii) with finite one-sided limits gives a jump; failing (iii) with a finite limit gives a removable discontinuity; an infinite one-sided limit gives an infinite discontinuity.',
                intuitiveExplanation:
                  'Continuity means the graph has no breaks: you can draw it through $a$ without lifting your pen. The three failure types correspond exactly to the three ways that can break.',
                keyFormulas: [
                  {
                    label: 'Continuity Criterion',
                    latex: '\\lim_{x \\to a} f(x) = f(a)',
                    explanation: 'All three conditions collapse into this single equality.',
                  },
                ],
                keyObservations: [
                  'A removable discontinuity is repaired by redefining $f(a)$, not by changing the limit.',
                  'Differentiability implies continuity, but continuity does not imply differentiability.',
                  '$|x|$ is continuous everywhere yet not differentiable at $0$ — a sharp corner.',
                ],
                workedExamples: [
                  {
                    id: 'we-cont-01',
                    title: 'Repairing a Removable Discontinuity',
                    problemStatement:
                      'The function $f(x) = \\frac{x^2 - 9}{x - 3}$ is undefined at $x = 3$. Which value at $x = 3$ makes $f$ continuous there?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Factor the numerator: $x^2 - 9 = (x - 3)(x + 3)$.',
                      'Cancel the common factor for $x \\neq 3$, giving $f(x) = x + 3$.',
                      'Take the limit: $\\lim_{x \\to 3}(x + 3) = 6$.',
                      'Define $f(3) = 6$ to satisfy all three continuity conditions.',
                    ],
                    finalAnswer: '$f(3) = 6$',
                    keyTakeaway:
                      'A removable discontinuity has a limit that exists — the function value is simply missing or wrong.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cont-01',
                    trapTitle: 'Confusing continuity with differentiability',
                    flawedReasoning: 'If a function is continuous, it can be differentiated everywhere.',
                    correctConcept:
                      'Continuity is necessary but not sufficient. Corners, cusps and vertical tangents break differentiability while preserving continuity.',
                    counterExample: '$f(x) = |x|$ is continuous at $0$ but has no derivative there: left slope $-1$, right slope $+1$.',
                  },
                ],
                prerequisites: [{ id: 'concept-limit-definition', title: 'Epsilon-Delta Definition of a Limit', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-differentiability-conditions', title: 'Where Derivatives Fail to Exist', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'What type of discontinuity does $f(x) = \\frac{1}{x}$ have at $x = 0$?',
                  options: ['Removable', 'Jump', 'Infinite', 'None — it is continuous'],
                  correctIndex: 2,
                  explanation: 'The one-sided limits are $\\pm\\infty$, which is the definition of an infinite discontinuity.',
                },
              },
              {
                id: 'concept-differentiability-conditions',
                title: 'Where Derivatives Fail to Exist',
                summary:
                  'Recognise the three geometric situations in which a tangent line cannot be assigned a slope.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 25,
                formalDefinition:
                  '$f\'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}$ exists only when this two-sided limit exists and is finite. Corners, cusps and vertical tangents each violate this.',
                intuitiveExplanation:
                  'The derivative is the slope of the tangent. A corner has two competing slopes, a cusp has infinite slope in opposite directions, and a vertical tangent has infinite slope in the same direction. In all three cases no single number qualifies.',
                keyFormulas: [
                  {
                    label: 'Derivative as a Limit',
                    latex: 'f\'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}',
                    explanation: 'The limit must agree whether $h \\to 0^+$ or $h \\to 0^-$.',
                  },
                ],
                keyObservations: [
                  'A one-sided derivative may exist even when the two-sided derivative does not.',
                  'Differentiation rules (product, chain) assume differentiability, so apply them only on open intervals where it holds.',
                  'Physical models with instantaneous jumps imply the derivative is undefined at the jump.',
                ],
                workedExamples: [
                  {
                    id: 'we-diff-01',
                    title: 'Testing a Corner',
                    problemStatement: 'Show that $f(x) = |x|$ is not differentiable at $x = 0$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'For $h > 0$, $\\frac{|h| - 0}{h} = \\frac{h}{h} = 1$, so the right derivative is $1$.',
                      'For $h < 0$, $\\frac{|h| - 0}{h} = \\frac{-h}{h} = -1$, so the left derivative is $-1$.',
                      'The one-sided derivatives disagree, so the two-sided limit does not exist.',
                    ],
                    finalAnswer: 'The derivative does not exist at $x = 0$ because the left and right slopes are $-1$ and $1$.',
                    keyTakeaway:
                      'Test one-sided difference quotients whenever the formula changes form at a point.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-diff-01',
                    trapTitle: 'Differentiating piecewise functions without checking the seam',
                    flawedReasoning: 'Apply the formula on each piece and assume the pieces join smoothly.',
                    correctConcept:
                      'At the seam you must separately verify continuity and equality of one-sided derivatives; both can fail independently.',
                    counterExample:
                      '$f(x) = x^2$ for $x<0$ and $x$ for $x \\ge 0$ is continuous at $0$ but has slopes $0$ and $1$ there.',
                  },
                ],
                prerequisites: [{ id: 'concept-continuity-types', title: 'Continuity & Classification of Discontinuities', subjectId: 'math' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'At which point is $f(x) = x^{1/3}$ not differentiable?',
                  options: ['$x = 0$', '$x = 1$', '$x = -1$', 'It is differentiable everywhere'],
                  correctIndex: 0,
                  explanation: 'The derivative $\\tfrac{1}{3}x^{-2/3}$ blows up at $0$: a vertical tangent.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'math',
    chapterId: 'math-ch-integral-calc',
    topics: [
      {
        id: 'math-topic-integration-techniques',
        title: 'Integration Techniques & Applications of the Integral',
        description:
          'Beyond the Fundamental Theorem: substitution, integration by parts and the geometric applications that make integrals useful.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-substitution-parts',
            title: 'Substitution & Integration by Parts',
            description: 'The two workhorse techniques, each inverse to a differentiation rule.',
            concepts: [
              {
                id: 'concept-u-substitution',
                title: 'Integration by Substitution (Chain Rule Reversed)',
                summary: 'Undo a chain rule by renaming the inner function and matching the differential exactly.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'If $u = g(x)$ is differentiable with continuous derivative, then $\\int f(g(x))g\'(x)\\,dx = \\int f(u)\\,du$. For definite integrals, $\\int_a^b f(g(x))g\'(x)\\,dx = \\int_{g(a)}^{g(b)} f(u)\\,du$.',
                intuitiveExplanation:
                  'Every chain-rule derivative leaves a fingerprint: the inner function and its derivative appear together. Substitution finds that pattern, collapses it to a single variable, then integrates something simple.',
                keyFormulas: [
                  {
                    label: 'Substitution Rule',
                    latex: '\\int f(g(x))\\,g\'(x)\\,dx = \\int f(u)\\,du, \\quad u = g(x)',
                    explanation: 'The differential $du = g\'(x)\\,dx$ must appear completely, up to a constant factor.',
                  },
                ],
                keyObservations: [
                  'When you change variables in a definite integral, you must also change the limits.',
                  'A missing constant factor can be pulled out; a missing variable cannot.',
                  'Substitution is the single most common technique — check it before anything more elaborate.',
                ],
                workedExamples: [
                  {
                    id: 'we-int-01',
                    title: 'A Definite Integral via Substitution',
                    problemStatement: 'Evaluate $\\int_0^1 2x\\,(x^2 + 1)^3\\,dx$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Let $u = x^2 + 1$, so $du = 2x\\,dx$ — exactly the remaining factor.',
                      'Change the limits: when $x = 0$, $u = 1$; when $x = 1$, $u = 2$.',
                      'The integral becomes $\\int_1^2 u^3\\,du$.',
                      'Integrate: $\\left[\\frac{u^4}{4}\\right]_1^2 = \\frac{16}{4} - \\frac{1}{4}$.',
                    ],
                    finalAnswer: '$\\frac{15}{4}$',
                    keyTakeaway:
                      'Changing the limits is not optional — leaving $x$ limits while integrating in $u$ is the most common error.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-int-01',
                    trapTitle: 'Forgetting to convert the limits',
                    flawedReasoning: 'Substitute $u$ in the integrand but keep the original $x$ bounds.',
                    correctConcept:
                      'The bounds belong to the variable of integration. After substitution they must be expressed in $u$, or you must convert back to $x$ before evaluating.',
                    counterExample:
                      '$\\int_0^1 2x(x^2+1)^3 dx$ with bounds kept as $0,1$ in $u$ gives $\\frac{1}{4}$, but the true value is $\\frac{15}{4}$.',
                  },
                ],
                prerequisites: [{ id: 'concept-ftc-leibniz', title: 'Fundamental Theorem of Calculus & Leibniz Rule', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-integration-by-parts', title: 'Integration by Parts', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'For $\\int \\cos(3x)\\,dx$, what substitution is correct?',
                  options: ['$u = \\cos x$', '$u = 3x$', '$u = \\sin(3x)$', '$u = x^2$'],
                  correctIndex: 1,
                  explanation: 'With $u = 3x$, $du = 3\\,dx$, giving $\\frac{1}{3}\\int \\cos u\\,du = \\frac{\\sin(3x)}{3} + C$.',
                },
              },
              {
                id: 'concept-integration-by-parts',
                title: 'Integration by Parts (Product Rule Reversed)',
                summary: 'Trade an integral you cannot do for one you can, by redistributing the product.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 30,
                formalDefinition:
                  '$\\int u\\,dv = uv - \\int v\\,du$, derived from the product rule $d(uv) = u\\,dv + v\\,du$.',
                intuitiveExplanation:
                  'The product rule distributes a derivative across a product. Integration by parts runs it in reverse: you pick one factor to differentiate and one to integrate, then hope the new integral is easier.',
                keyFormulas: [
                  {
                    label: 'Integration by Parts',
                    latex: '\\int u\\,dv = uv - \\int v\\,du',
                    explanation: 'Choose $u$ to become simpler under differentiation (LIATE ordering is a good default).',
                  },
                ],
                keyObservations: [
                  'LIATE (logarithmic, inverse trig, algebraic, trig, exponential) suggests which factor to call $u$.',
                  'Applying the rule twice is normal for products of polynomials with exponentials or trig.',
                  '$\\int \\ln x\\,dx$ works only because $dv = dx$ is a legal choice.',
                ],
                workedExamples: [
                  {
                    id: 'we-int-02',
                    title: 'A Logarithmic Integral',
                    problemStatement: 'Evaluate $\\int x\\ln x\\,dx$ for $x > 0$.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Choose $u = \\ln x$ (logarithmic beats algebraic in LIATE) and $dv = x\\,dx$.',
                      'Then $du = \\frac{1}{x}dx$ and $v = \\frac{x^2}{2}$.',
                      'Apply the rule: $\\frac{x^2}{2}\\ln x - \\int \\frac{x^2}{2}\\cdot\\frac{1}{x}\\,dx$.',
                      'Simplify and integrate: $\\frac{x^2}{2}\\ln x - \\frac{1}{2}\\int x\\,dx = \\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$.',
                    ],
                    finalAnswer: '$\\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$',
                    keyTakeaway:
                      'Picking $u$ badly makes the new integral harder; verify the choice before committing.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-int-02',
                    trapTitle: 'Choosing $u$ so the integral gets worse',
                    flawedReasoning: 'Let $u = x$ so the derivative is $1$, always the simplest choice.',
                    correctConcept:
                      'For $\\int x\\ln x\\,dx$, choosing $u = x$ leaves $\\int \\frac{x^2}{2}\\ln x\\,dx$ — worse. The goal is a simpler total expression, not a simpler $u$.',
                    counterExample:
                      'With $u = x$, $dv = \\ln x\\,dx$ does not integrate in closed form, so the method stalls.',
                  },
                ],
                prerequisites: [{ id: 'concept-u-substitution', title: 'Integration by Substitution (Chain Rule Reversed)', subjectId: 'math' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For $\\int x\\cos x\\,dx$, which choice of $u$ is best?',
                  options: ['$u = \\cos x$', '$u = x$', '$u = x\\cos x$', '$u = 1$'],
                  correctIndex: 1,
                  explanation: 'With $u = x$, $du$ becomes $dx$; the remaining $\\int \\sin x\\,dx$ is elementary.',
                },
              },
            ],
          },
          {
            id: 'math-sub-integral-applications',
            title: 'Applications of the Definite Integral',
            description: 'Turning integrals into areas, volumes and accumulated change.',
            concepts: [
              {
                id: 'concept-area-between-curves',
                title: 'Area Between Curves',
                summary: 'Accumulate the vertical gap between two graphs, handling intersections by splitting.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 25,
                formalDefinition:
                  'If $f(x) \\ge g(x)$ on $[a, b]$, the area between the curves is $\\int_a^b \\big(f(x) - g(x)\\big)\\,dx$. Where the order swaps, the integral must be split at each intersection.',
                intuitiveExplanation:
                  'At each $x$, the slice has height (upper minus lower). Adding those heights infinitesimally gives the enclosed area. Splitting at intersections keeps the slice height positive.',
                keyFormulas: [
                  {
                    label: 'Area Between Curves',
                    latex: 'A = \\int_a^b \\big(f(x) - g(x)\\big)\\,dx',
                    explanation: 'Requires $f \\ge g$ throughout; otherwise split at crossing points.',
                  },
                ],
                keyObservations: [
                  'Sketching first reveals intersections that algebra alone can hide.',
                  'Integrating with respect to $y$ is often easier when curves are given as $x = g(y)$.',
                  'A signed integral can cancel area; the area formula must never do that.',
                ],
                workedExamples: [
                  {
                    id: 'we-int-03',
                    title: 'Enclosed Area Between a Line and a Parabola',
                    problemStatement: 'Find the area enclosed by $y = x$ and $y = x^2$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Find intersections: $x = x^2 \\implies x(1 - x) = 0 \\implies x = 0, 1$.',
                      'On $(0, 1)$, the line is above the parabola, so the height is $x - x^2$.',
                      'Integrate: $\\int_0^1 (x - x^2)\\,dx = \\left[\\frac{x^2}{2} - \\frac{x^3}{3}\\right]_0^1$.',
                      'Evaluate: $\\frac{1}{2} - \\frac{1}{3} = \\frac{1}{6}$.',
                    ],
                    finalAnswer: '$\\frac{1}{6}$',
                    keyTakeaway: 'Intersections define the bounds and decide which function is on top in each region.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-int-03',
                    trapTitle: 'Integrating across an intersection without splitting',
                    flawedReasoning: 'One integral from the leftmost to rightmost intersection covers the whole area.',
                    correctConcept:
                      'If the curves cross in between, the signed contribution of one region cancels the other.',
                    counterExample:
                      'Between $y = x^3$ and $y = x$ on $[-1,1]$, the single integral $\\int_{-1}^{1}(x^3 - x)dx = 0$, yet the enclosed area is $\\frac{1}{2}$.',
                  },
                ],
                prerequisites: [{ id: 'concept-ftc-leibniz', title: 'Fundamental Theorem of Calculus & Leibniz Rule', subjectId: 'math' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'To find where $y = x^2$ and $y = 4$ enclose area, what are the bounds?',
                  options: ['$x = 0$ to $2$', '$x = -2$ to $2$', '$x = 0$ to $4$', '$x = -4$ to $4$'],
                  correctIndex: 1,
                  explanation: 'Intersections satisfy $x^2 = 4$, giving $x = -2$ and $x = 2$.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'math',
    chapterId: 'math-ch-linalg',
    topics: [
      {
        id: 'math-topic-vector-spaces',
        title: 'Vector Spaces, Bases & Matrix Transformations',
        description:
          'The structural foundation that eigenvalues presuppose: subspaces, independence, rank and linear maps.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-independence-rank',
            title: 'Linear Independence & Rank',
            description: 'Detecting redundancy in a set of vectors and measuring the true dimension of a span.',
            concepts: [
              {
                id: 'concept-linear-independence',
                title: 'Span, Linear Independence & Basis',
                summary: 'Distinguish a set that generates a space from the minimal such set that defines coordinates.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 28,
                formalDefinition:
                  'Vectors $v_1, \\dots, v_k$ are linearly independent if $\\sum c_i v_i = 0$ forces every $c_i = 0$. A basis of a subspace is an independent spanning set; its size is the dimension.',
                intuitiveExplanation:
                  'Independence means no vector is a recipe made from the others. A basis is the smallest recipe book that can still build every element — adding a redundant vector adds no new reachable points.',
                keyFormulas: [
                  {
                    label: 'Independence Test',
                    latex: 'c_1 v_1 + \\cdots + c_k v_k = 0 \\implies c_1 = \\cdots = c_k = 0',
                    explanation: 'Equivalently: the only solution to $A\\mathbf{x} = \\mathbf{0}$ is trivial.',
                  },
                ],
                keyObservations: [
                  'Any independent set in $\\mathbb{R}^n$ has at most $n$ vectors.',
                  'Every basis of a given space has the same number of vectors — that number is the dimension.',
                  'A square matrix is invertible exactly when its columns are independent.',
                ],
                workedExamples: [
                  {
                    id: 'we-lin-01',
                    title: 'Testing Two Vectors in the Plane',
                    problemStatement: 'Are $(1, 2)$ and $(3, 4)$ linearly independent?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Set $c_1(1,2) + c_2(3,4) = (0,0)$.',
                      'This gives the system $c_1 + 3c_2 = 0$ and $2c_1 + 4c_2 = 0$.',
                      'Solve: from the first, $c_1 = -3c_2$; substituting gives $-6c_2 + 4c_2 = -2c_2 = 0$, so $c_2 = 0$ and then $c_1 = 0$.',
                      'Only the trivial solution exists, so the vectors are independent.',
                    ],
                    finalAnswer: 'Yes — they are linearly independent and form a basis of $\\mathbb{R}^2$.',
                    keyTakeaway:
                      'In $\\mathbb{R}^2$, two vectors are independent exactly when they are not scalar multiples.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-lin-01',
                    trapTitle: 'Treating "different vectors" as independent',
                    flawedReasoning: 'The two vectors are not equal, so they must be independent.',
                    correctConcept:
                      'Independence forbids any nontrivial linear combination summing to zero, which includes scalar multiples and more complex relations among three or more vectors.',
                    counterExample: '$(1,2)$ and $(2,4)$ are different but dependent, since $2(1,2) - (2,4) = 0$.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the dimension of the span of $(1,0,1)$ and $(0,1,1)$?',
                  options: ['1', '2', '3', 'It is not defined'],
                  correctIndex: 1,
                  explanation: 'The two vectors are not multiples of each other, so they span a plane of dimension 2.',
                },
              },
              {
                id: 'concept-rank-nullity',
                title: 'Rank, Null Space & the Rank-Nullity Theorem',
                summary: 'Quantify how much information a matrix preserves and how much it crushes to zero.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 30,
                formalDefinition:
                  'For $A \\in \\mathbb{R}^{m \\times n}$, $\\operatorname{rank}(A)$ is the dimension of the column space and $\\operatorname{nullity}(A)$ the dimension of the null space $\\{x : Ax = 0\\}$. Then $\\operatorname{rank}(A) + \\operatorname{nullity}(A) = n$.',
                intuitiveExplanation:
                  'A matrix squashes $n$-dimensional input into a smaller output space. Rank counts the surviving directions; nullity counts the directions destroyed. The two always add up to the input size.',
                keyFormulas: [
                  {
                    label: 'Rank-Nullity',
                    latex: '\\operatorname{rank}(A) + \\operatorname{nullity}(A) = n',
                    explanation: '$n$ is the number of columns, i.e. the input dimension.',
                  },
                ],
                keyObservations: [
                  'Full column rank means the null space is trivial and $A$ is injective.',
                  'Rank equals the number of pivot columns after row reduction.',
                  'Data compression works by deliberately accepting low rank.',
                ],
                workedExamples: [
                  {
                    id: 'we-lin-02',
                    title: 'Computing Rank and Nullity',
                    problemStatement:
                      'For $A = \\begin{pmatrix} 1 & 2 & 0 \\\\ 0 & 1 & 1 \\\\ 1 & 3 & 1\\end{pmatrix}$, find rank and nullity.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Subtract row 1 from row 3: the third row becomes $(0, 1, 1)$.',
                      'Now rows 2 and 3 are identical, so row 3 reduces to zero.',
                      'Two nonzero rows remain, so $\\operatorname{rank}(A) = 2$.',
                      'With $n = 3$ columns, nullity $= 3 - 2 = 1$.',
                    ],
                    finalAnswer: 'rank $= 2$, nullity $= 1$',
                    keyTakeaway:
                      'Row reduce first; counting nonzero rows is faster and safer than computing determinants of minors.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-lin-02',
                    trapTitle: 'Using the number of rows instead of columns',
                    flawedReasoning: 'Nullity is $m - \\text{rank}$ because there are $m$ equations.',
                    correctConcept:
                      'Nullity counts free variables, which come from columns. The correct relation is $n - \\text{rank}$.',
                    counterExample: 'A $3 \\times 2$ matrix of rank 2 has nullity $2 - 2 = 0$, not $3 - 2 = 1$.',
                  },
                ],
                prerequisites: [{ id: 'concept-linear-independence', title: 'Span, Linear Independence & Basis', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-eigenvalues-vectors', title: 'Eigenvalues & Eigenvectors', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If a $4 \\times 4$ matrix has rank 3, what is its nullity?',
                  options: ['0', '1', '3', '4'],
                  correctIndex: 1,
                  explanation: 'Nullity $= n - \\text{rank} = 4 - 3 = 1$.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// =====================================================================
// PHYSICS — kinematics and rotational mechanics were absent entirely,
// yet later chapters (orbital mechanics, energy) depend on them.
// =====================================================================

const PHYSICS_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'physics',
    chapterId: 'phys-ch-mechanics',
    topics: [
      {
        id: 'phys-topic-kinematics',
        title: 'Kinematics in One & Two Dimensions',
        description:
          'Describing motion before explaining it: displacement, velocity, acceleration, projectile paths and relative motion.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-uniform-acceleration',
            title: 'Uniform Acceleration & Projectile Motion',
            description: 'The kinematic equations and their two-dimensional decomposition.',
            concepts: [
              {
                id: 'concept-kinematic-equations',
                title: 'The Four Kinematic Equations',
                summary: 'Solve constant-acceleration problems by selecting the equation that omits the variable you neither know nor need.',
                difficulty: 'easy_medium',
                estimatedMinutes: 14,
                xpReward: 22,
                formalDefinition:
                  'For constant acceleration $a$: $v = u + at$; $s = ut + \\tfrac{1}{2}at^2$; $v^2 = u^2 + 2as$; $s = \\tfrac{(u+v)}{2}t$, where $u$ is initial velocity and $s$ displacement.',
                intuitiveExplanation:
                  'Each equation links four of the five quantities $(u, v, a, s, t)$. Pick the one that leaves out whatever you do not care about, and solve algebraically. The restriction to constant acceleration is what makes them simple.',
                keyFormulas: [
                  {
                    label: 'Velocity-Time Relation',
                    latex: 'v = u + at',
                    explanation: 'Acceleration is the slope of the velocity-time graph.',
                  },
                  {
                    label: 'Displacement-Time Relation',
                    latex: 's = ut + \\tfrac{1}{2}at^2',
                    explanation: 'Area under the velocity-time graph.',
                  },
                  {
                    label: 'Velocity-Displacement Relation',
                    latex: 'v^2 = u^2 + 2as',
                    explanation: 'Use when time is unknown and not required.',
                  },
                ],
                keyObservations: [
                  'These equations are valid only for constant acceleration; otherwise integrate.',
                  'Sign conventions must be fixed before substituting — downward is usually negative.',
                  'At the top of a projectile path the vertical velocity is zero, but acceleration is not.',
                ],
                workedExamples: [
                  {
                    id: 'we-kin-01',
                    title: 'Stopping Distance',
                    problemStatement:
                      'A car travelling at $20\\,\\text{m/s}$ brakes uniformly to rest in $50\\,\\text{m}$. Find the deceleration.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'List knowns: $u = 20$, $v = 0$, $s = 50$; time is unknown and unneeded.',
                      'Select $v^2 = u^2 + 2as$ because it omits $t$.',
                      'Substitute: $0 = 400 + 2a(50)$, so $100a = -400$.',
                      'Solve: $a = -4\\,\\text{m/s}^2$ — negative, confirming deceleration.',
                    ],
                    finalAnswer: '$4\\,\\text{m/s}^2$ deceleration',
                    keyTakeaway: 'Choosing the equation that omits the unwanted variable avoids solving quadratics unnecessarily.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-kin-01',
                    trapTitle: 'Applying kinematic equations to changing acceleration',
                    flawedReasoning: 'The formulas are general, so use them whenever motion is described.',
                    correctConcept:
                      'They assume $a$ is constant. With variable acceleration you must integrate $a = dv/dt$ or use energy methods.',
                    counterExample:
                      'For $a = -kv$ (drag), $v^2 = u^2 + 2as$ fails; the true solution is exponential decay of velocity.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-newton-second-law', title: "Newton's Second Law & Free-Body Diagrams", subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'A ball is dropped from rest and falls for $3\\,\\text{s}$ ($g = 10\\,\\text{m/s}^2$). How far does it fall?',
                  options: ['$30\\,\\text{m}$', '$45\\,\\text{m}$', '$90\\,\\text{m}$', '$15\\,\\text{m}$'],
                  correctIndex: 1,
                  explanation: '$s = \\tfrac{1}{2}gt^2 = \\tfrac{1}{2}(10)(9) = 45\\,\\text{m}$.',
                },
              },
              {
                id: 'concept-projectile-motion',
                title: 'Projectile Motion & Independence of Axes',
                summary: 'Split a projectile into independent horizontal and vertical problems joined only by time.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  'With launch speed $u$ at angle $\\theta$ and no air resistance: $v_x = u\\cos\\theta$ (constant), $v_y = u\\sin\\theta - gt$. Horizontal range for level ground is $R = \\frac{u^2\\sin 2\\theta}{g}$ and maximum height is $H = \\frac{u^2\\sin^2\\theta}{2g}$.',
                intuitiveExplanation:
                  'Gravity acts only vertically, so the horizontal motion never changes speed. The two axes are solvable separately; the shared clock $t$ is the only link between them.',
                keyFormulas: [
                  {
                    label: 'Range on Level Ground',
                    latex: 'R = \\frac{u^2 \\sin 2\\theta}{g}',
                    explanation: 'Maximised at $\\theta = 45^\\circ$, since $\\sin 2\\theta$ peaks at $1$.',
                  },
                  {
                    label: 'Time of Flight',
                    latex: 'T = \\frac{2u\\sin\\theta}{g}',
                    explanation: 'Twice the time to reach the apex.',
                  },
                ],
                keyObservations: [
                  'Complementary launch angles ($\\theta$ and $90^\\circ - \\theta$) give the same range.',
                  'At the apex $v_y = 0$ but $a_y = -g$ still applies.',
                  'Air resistance breaks the symmetry and shortens the range.',
                ],
                workedExamples: [
                  {
                    id: 'we-kin-02',
                    title: 'Range of a Launched Projectile',
                    problemStatement:
                      'A projectile is launched at $20\\,\\text{m/s}$ at $30^\\circ$ to the horizontal. Find its range ($g = 10\\,\\text{m/s}^2$).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Use $R = \\frac{u^2 \\sin 2\\theta}{g}$ with $u = 20$, $\\theta = 30^\\circ$.',
                      'Compute $\\sin 2\\theta = \\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$.',
                      'Substitute: $R = \\frac{400 \\cdot \\frac{\\sqrt{3}}{2}}{10}$.',
                      'Simplify: $R = 20\\sqrt{3} \\approx 34.6\\,\\text{m}$.',
                    ],
                    finalAnswer: '$20\\sqrt{3} \\approx 34.6\\,\\text{m}$',
                    keyTakeaway: 'Deriving from components is safer than memorising range formulas for non-level ground.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-kin-02',
                    trapTitle: 'Believing horizontal velocity changes during flight',
                    flawedReasoning: 'Since gravity pulls the object down, the horizontal speed must also decay.',
                    correctConcept:
                      'Gravity has no horizontal component, so $v_x$ stays constant in the absence of air resistance.',
                    counterExample:
                      'A projectile launched at $v_x = 10\\,\\text{m/s}$ still has $v_x = 10\\,\\text{m/s}$ at impact, though $v_y$ has reversed direction.',
                  },
                ],
                prerequisites: [{ id: 'concept-kinematic-equations', title: 'The Four Kinematic Equations', subjectId: 'physics' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'At which launch angle is range maximised on level ground?',
                  options: ['$30^\\circ$', '$45^\\circ$', '$60^\\circ$', '$90^\\circ$'],
                  correctIndex: 1,
                  explanation: '$R \\propto \\sin 2\\theta$, which is maximal when $2\\theta = 90^\\circ$.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-newton-laws',
        title: "Newton's Laws, Friction & Free-Body Analysis",
        description:
          'The causal layer above kinematics: forces, equilibrium, friction and connected systems.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-force-analysis',
            title: 'Force Analysis & Friction',
            description: 'Drawing and solving free-body diagrams for single bodies and connected systems.',
            concepts: [
              {
                id: 'concept-newton-second-law',
                title: "Newton's Second Law & Free-Body Diagrams",
                summary: 'Convert a physical situation into $\\sum F = ma$ per axis, with every force accounted for.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  "$\\sum \\vec{F} = m\\vec{a}$. In equilibrium ($a = 0$) the net force is zero, so the force vectors close into a polygon.",
                intuitiveExplanation:
                  'Forces are pushes and pulls; only the *net* one causes acceleration. A free-body diagram isolates one object and draws every force acting on it, which prevents both missing forces and inventing them.',
                keyFormulas: [
                  {
                    label: "Newton's Second Law",
                    latex: '\\sum \\vec{F} = m\\vec{a}',
                    explanation: 'Resolve into independent $x$ and $y$ components.',
                  },
                  {
                    label: 'Static Friction Limit',
                    latex: 'f_s \\le \\mu_s N',
                    explanation: 'Static friction adjusts to whatever is needed, up to this ceiling.',
                  },
                ],
                keyObservations: [
                  'Weight $mg$ acts from the centre of mass; normal force acts perpendicular to the contact surface.',
                  'Action-reaction pairs act on *different* bodies and never cancel within one diagram.',
                  'On an incline, choose axes along and perpendicular to the slope.',
                ],
                workedExamples: [
                  {
                    id: 'we-force-01',
                    title: 'A Block on an Incline',
                    problemStatement:
                      'A $5\\,\\text{kg}$ block sits on a $30^\\circ$ frictionless incline. Find its acceleration ($g = 10\\,\\text{m/s}^2$).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Resolve weight along the slope: $mg\\sin\\theta$; perpendicular: $mg\\cos\\theta$.',
                      'Normal force balances the perpendicular component, leaving no acceleration that way.',
                      'Along the slope, only gravity acts (frictionless): $ma = mg\\sin\\theta$.',
                      'Cancel mass: $a = g\\sin 30^\\circ = 10 \\times 0.5$.',
                    ],
                    finalAnswer: '$5\\,\\text{m/s}^2$ down the slope',
                    keyTakeaway:
                      'Mass cancels in purely gravitational motion — every object accelerates identically on a frictionless incline.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-force-01',
                    trapTitle: 'Adding a "centrifugal force" to a free-body diagram',
                    flawedReasoning: 'A body moving in a circle feels an outward force, so draw one to balance it.',
                    correctConcept:
                      'In an inertial frame the only forces are real interactions. The net inward force *is* the centripetal force; the outward sensation is inertia, not a force.',
                    counterExample:
                      'For a car turning on level ground, the only horizontal force is friction pointing inward.',
                  },
                ],
                prerequisites: [{ id: 'concept-kinematic-equations', title: 'The Four Kinematic Equations', subjectId: 'physics' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'A $2\\,\\text{kg}$ body experiences a net force of $10\\,\\text{N}$. What is its acceleration?',
                  options: ['$2\\,\\text{m/s}^2$', '$5\\,\\text{m/s}^2$', '$20\\,\\text{m/s}^2$', '$0.2\\,\\text{m/s}^2$'],
                  correctIndex: 1,
                  explanation: '$a = F/m = 10/2 = 5\\,\\text{m/s}^2$.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// =====================================================================
// COMPUTER SCIENCE — programming fundamentals were missing entirely.
// The bank jumped straight to Big-O and transformers.
// =====================================================================

const CS_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'cs',
    chapterId: 'cs-ch-python-dsa',
    topics: [
      {
        id: 'cs-topic-python-core',
        title: 'Python Fundamentals & Core Data Structures',
        description:
          'The language mechanics that every algorithm chapter assumes: types, mutability, control flow and the four built-in containers.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'cs-sub-python-types',
            title: 'Types, Mutability & Control Flow',
            description: 'How Python models values and the consequences for copying and function arguments.',
            concepts: [
              {
                id: 'concept-python-mutability',
                title: 'Mutability & Object Identity in Python',
                summary: 'Understand why two names can share one list, and why that breaks naive copying.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'Every Python value is an object with an identity (`id()`), a type and a value. Lists, dicts and sets are mutable; ints, strings, tuples and frozensets are immutable. Assignment binds a name to an object and never copies it.',
                intuitiveExplanation:
                  'A variable is a label stuck to an object, not a box containing a value. Two labels can point at the same mutable object, so mutating through one is visible through the other.',
                keyFormulas: [
                  {
                    label: 'Shallow Copy',
                    latex: 'new_list = old_list[:] \\quad \\text{or} \\quad list(old_list)',
                    explanation: 'Copies the outer container; nested mutable objects are still shared.',
                  },
                ],
                keyObservations: [
                  '`a = b` never copies — it creates a second name for the same object.',
                  'Tuples are immutable but can still contain mutable objects.',
                  'Use `copy.deepcopy` when nesting must be independent.',
                ],
                workedExamples: [
                  {
                    id: 'we-py-01',
                    title: 'The Shared-Reference Trap',
                    problemStatement:
                      'Given `grid = [[0] * 3] * 3` followed by `grid[0][0] = 1`, what does `print(grid)` show?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      '`grid = [[0] * 3] * 3` creates **one** inner list and repeats the same reference three times.',
                      '`grid[0][0] = 1` mutates that single shared inner list.',
                      'Every row is that same object, so all three rows show `1` at index 0.',
                    ],
                    finalAnswer: '`[[1, 0, 0], [1, 0, 0], [1, 0, 0]]`',
                    keyTakeaway:
                      'Multiplication of a list repeats references, not values. Use a comprehension `[[0]*3 for _ in range(3)]`.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-py-01',
                    trapTitle: 'Mutable default arguments',
                    flawedReasoning: '`def add(item, bucket=[])` creates a fresh list on every call.',
                    correctConcept:
                      'Default arguments are evaluated once, when the function is defined, so the same list persists across calls.',
                    counterExample:
                      'Calling `add(1)` then `add(2)` yields `[1, 2]`, because both calls used one shared list.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-python-comprehensions', title: 'Comprehensions, Iteration & Generators', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'After `a = [1,2]; b = a; b.append(3)`, what is `len(a)`?',
                  options: ['2', '3', 'Error', 'Undefined'],
                  correctIndex: 1,
                  explanation: '`b = a` copies the reference, not the list, so the append is visible through `a`.',
                },
              },
              {
                id: 'concept-python-comprehensions',
                title: 'Comprehensions, Iteration & Generators',
                summary: 'Express transforms and filters declaratively, and stream large sequences lazily.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'A comprehension builds a collection from an iterable: `[f(x) for x in it if cond(x)]`. A generator expression `(f(x) for x in it)` yields items lazily, using $O(1)$ memory regardless of length.',
                intuitiveExplanation:
                  'A comprehension states *what* you want rather than *how* to accumulate it. A generator goes further: instead of building the whole list, it produces one item per request, like a conveyor belt rather than a warehouse.',
                keyFormulas: [
                  {
                    label: 'Comprehension Form',
                    latex: '[f(x)\\ \\text{for}\\ x \\in S\\ \\text{if}\\ p(x)]',
                    explanation: 'The filter runs before the transform is applied.',
                  },
                ],
                keyObservations: [
                  'Dict and set comprehensions use the same syntax with `{}`.',
                  'A generator can only be consumed once.',
                  'Comprehensions are usually faster than an equivalent append loop.',
                ],
                workedExamples: [
                  {
                    id: 'we-py-02',
                    title: 'Filtering and Transforming',
                    problemStatement: 'Produce the squares of even numbers from 1 to 10.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Choose the source iterable: `range(1, 11)`.',
                      'Filter to evens: `if n % 2 == 0`.',
                      'Apply the transform: `n * n`.',
                      'Combine: `[n*n for n in range(1, 11) if n % 2 == 0]`.',
                    ],
                    finalAnswer: '`[4, 16, 36, 64, 100]`',
                    keyTakeaway: 'Read left to right: output expression, loop, then filter.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-py-02',
                    trapTitle: 'Reusing an exhausted generator',
                    flawedReasoning: 'A generator behaves like a list, so iterate it twice.',
                    correctConcept:
                      'Generators are single-pass iterators. The second loop sees an already-consumed iterator and yields nothing.',
                    counterExample:
                      '`g = (x for x in range(3)); list(g)` gives `[0,1,2]`, but a second `list(g)` gives `[]`.',
                  },
                ],
                prerequisites: [{ id: 'concept-python-mutability', title: 'Mutability & Object Identity in Python', subjectId: 'cs' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What does `[x*2 for x in range(4) if x > 1]` evaluate to?',
                  options: ['`[0, 2, 4, 6]`', '`[4, 6]`', '`[2, 4, 6]`', '`[4]`'],
                  correctIndex: 1,
                  explanation: 'Only `x = 2` and `x = 3` pass the filter, giving `4` and `6`.',
                },
              },
            ],
          },
          {
            id: 'cs-sub-python-containers',
            title: 'Choosing the Right Container',
            description: 'Matching list, dict, set and tuple to the access pattern and complexity budget.',
            concepts: [
              {
                id: 'concept-container-complexity',
                title: 'Container Choice & Member Complexity',
                summary: 'Pick data structures from the complexity of the operations you actually perform.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'Average-case membership: list $O(n)$, dict $O(1)$, set $O(1)$, tuple $O(n)$. Append is $O(1)$ amortised for lists; dict and set keys must be hashable, which excludes lists.',
                intuitiveExplanation:
                  'A list is a shelf you scan item by item; a set or dict is an index that jumps straight to the answer. The price is memory and the requirement that keys be immutable.',
                keyFormulas: [
                  {
                    label: 'List vs Set Membership',
                    latex: 'x \\in \\text{list} : O(n) \\qquad x \\in \\text{set} : O(1)',
                    explanation: 'Converting to a set before repeated lookups turns $O(n^2)$ scans into $O(n)$ passes.',
                  },
                ],
                keyObservations: [
                  'Sets and dicts require hashable keys — no lists as keys.',
                  'Dicts preserve insertion order in Python 3.7+.',
                  'A `set` deduplicates automatically, which is often the point.',
                ],
                workedExamples: [
                  {
                    id: 'we-py-03',
                    title: 'Removing an Accidental Quadratic',
                    problemStatement: 'Find how many elements of list `A` appear in list `B` — the naive loop is $O(n^2)$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'The naive version tests `x in B` for each `x` in `A`: $n$ tests, each $O(n)$, hence $O(n^2)$.',
                      'Membership in a *set* is $O(1)$ on average.',
                      'Convert once: `B_set = set(B)` costs $O(n)$.',
                      'Then `sum(1 for x in A if x in B_set)` is $O(n)$ total.',
                    ],
                    finalAnswer: '$O(n)$ after a single set conversion.',
                    keyTakeaway: 'Pre-build an index when you notice repeated membership tests inside a loop.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-py-03',
                    trapTitle: 'Using a list as a dict key',
                    flawedReasoning: 'A dict key can be any object that holds data.',
                    correctConcept:
                      'Keys must be hashable and immutable. Use a tuple if you need a composite key.',
                    counterExample: '`d = {[1,2]: "a"}` raises `TypeError: unhashable type: list`.',
                  },
                ],
                prerequisites: [{ id: 'concept-python-mutability', title: 'Mutability & Object Identity in Python', subjectId: 'cs' }],
                relatedConcepts: [{ id: 'concept-big-o', title: 'Asymptotic Notation & Big-O Analysis', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'Which average-case membership test is fastest?',
                  options: ['`x in list`', '`x in tuple`', '`x in set`', 'All are equivalent'],
                  correctIndex: 2,
                  explanation: 'Set membership is $O(1)$ on average via hashing; the others are $O(n)$.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// =====================================================================
// CHEMISTRY — atomic structure / periodicity underpins every later
// chapter (bonding, coordination, electrochemistry) but was absent.
// =====================================================================

const CHEMISTRY_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'chemistry',
    chapterId: 'chem-ch-bonding-mo',
    topics: [
      {
        id: 'chem-topic-atomic-structure',
        title: 'Atomic Structure & Periodic Trends',
        description:
          'Quantum numbers, electronic configuration and the periodic trends that explain bonding before MO theory formalises it.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-orbital-filling',
            title: 'Quantum Numbers & Electronic Configuration',
            description: 'The rules that assign electrons to orbitals and the anomalies they produce.',
            concepts: [
              {
                id: 'concept-quantum-numbers',
                title: 'The Four Quantum Numbers',
                summary: 'Label any electron in an atom with an address of four numbers constrained by the rules.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  '$n$ (principal, $1,2,\\dots$) sets shell and energy; $l$ (azimuthal, $0 \\le l \\le n-1$) sets subshell and orbital shape; $m_l$ ($-l \\le m_l \\le l$) sets orientation; $m_s = \\pm\\tfrac12$ sets spin. Pauli exclusion forbids two electrons sharing all four.',
                intuitiveExplanation:
                  'The four numbers are a postal address: city ($n$), district ($l$), street ($m_l$), house side ($m_s$). No two electrons may share the same full address.',
                keyFormulas: [
                  {
                    label: 'Subshell Capacity',
                    latex: '\\text{capacity} = 2(2l + 1)',
                    explanation: '$l=0 \\to 2$, $l=1 \\to 6$, $l=2 \\to 10$, $l=3 \\to 14$.',
                  },
                  {
                    label: 'Shell Capacity',
                    latex: '\\text{capacity} = 2n^2',
                    explanation: '$n=1 \\to 2$, $n=2 \\to 8$, $n=3 \\to 18$.',
                  },
                ],
                keyObservations: [
                  'Aurufbau filling follows $n + l$: lower $(n+l)$ fills first; ties break on lower $n$.',
                  'Half-filled and fully-filled subshells gain stability, explaining Cr and Cu anomalies.',
                  'Hund\'s rule maximises unpaired spins within a degenerate subshell.',
                ],
                workedExamples: [
                  {
                    id: 'we-atom-01',
                    title: 'Configuration of Chromium',
                    problemStatement: 'Write the ground-state configuration of chromium ($Z = 24$).',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'A naive aufbau filling gives $3d^4 4s^2$ after filling through argon.',
                      'The $3d^5 4s^1$ arrangement leaves both subshells exactly half-filled.',
                      'Half-filled subshells have extra exchange-energy stability.',
                      'The observed configuration is therefore $[Ar]\\,3d^5 4s^1$.',
                    ],
                    finalAnswer: '$[Ar]\\,3d^5 4s^1$',
                    keyTakeaway:
                      'Expect anomalies at group 6 and group 11, where half-filled or full $d$ subshells are preferred.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-atom-01',
                    trapTitle: 'Filling 4s after 3d',
                    flawedReasoning: 'Since $4s$ fills before $3d$ in the aufbau order, it must also be removed first when ionising.',
                    correctConcept:
                      'Filling order and removal order differ. Once populated, $3d$ is lower in energy than $4s$, so $4s$ electrons are removed first.',
                    counterExample:
                      'Fe is $[Ar]3d^6 4s^2$, but Fe²⁺ is $[Ar]3d^6$, not $[Ar]3d^4 4s^2$.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-periodic-trends', title: 'Periodic Trends & Effective Nuclear Charge', subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'How many electrons can the $l = 2$ subshell hold?',
                  options: ['2', '6', '10', '14'],
                  correctIndex: 2,
                  explanation: '$2(2l+1) = 2(5) = 10$ electrons.',
                },
              },
              {
                id: 'concept-periodic-trends',
                title: 'Periodic Trends & Effective Nuclear Charge',
                summary: 'Explain atomic radius, ionisation energy and electronegativity from one cause: effective nuclear pull.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  '$Z_{eff} = Z - \\sigma$, where $\\sigma$ is the shielding constant. Across a period $Z_{eff}$ rises (same shell, more protons); down a group it barely changes while $n$ increases.',
                intuitiveExplanation:
                  'Two competing effects set every trend: a stronger nuclear pull shrinks the atom, while extra occupied shells push valence electrons outward. Periods vary the first; groups vary the second.',
                keyFormulas: [
                  {
                    label: 'Effective Nuclear Charge',
                    latex: 'Z_{eff} = Z - \\sigma',
                    explanation: 'Higher $Z_{eff}$ means electrons are held more tightly.',
                  },
                ],
                keyObservations: [
                  'Atomic radius decreases across a period and increases down a group.',
                  'Ionisation energy follows the inverse pattern: highest at the top-right.',
                  'Cations are always smaller than their parent atom; anions are larger.',
                ],
                workedExamples: [
                  {
                    id: 'we-atom-02',
                    title: 'Ranking Ionisation Energy',
                    problemStatement: 'Order Na, Mg and Al by first ionisation energy.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'All three are in period 3, so $n$ is constant and $Z_{eff}$ controls the trend.',
                      'Across the period $Z_{eff}$ increases from Na to Al, so electrons are held more tightly.',
                      'The expected order is therefore Na < Al < Mg.',
                      'The Mg > Al inversion occurs because removing Al\'s third $3p$ electron is easier than breaking Mg\'s filled $3s$ pair.',
                    ],
                    finalAnswer: 'Na < Al < Mg',
                    keyTakeaway:
                      'Subshell half-filling and pairing effects create exceptions to the plain left-to-right trend.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-atom-02',
                    trapTitle: 'Ignoring electron configuration when ranking energies',
                    flawedReasoning: 'Ionisation energy rises strictly left to right across any period.',
                    correctConcept:
                      'Group 13 elements ionise more easily than group 2 because a single unpaired $p$ electron is less tightly held than a paired $s$ pair.',
                    counterExample: 'Mg (738 kJ/mol) > Al (578 kJ/mol), against the naive left-to-right expectation.',
                  },
                ],
                prerequisites: [{ id: 'concept-quantum-numbers', title: 'The Four Quantum Numbers', subjectId: 'chemistry' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which has the largest atomic radius?',
                  options: ['Na', 'Mg', 'Cl', 'K'],
                  correctIndex: 3,
                  explanation: 'K is in period 4, so its valence shell is larger than any period-3 element.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

// =====================================================================
// BIOLOGY — cell structure precedes every chapter that assumes it.
// =====================================================================

const BIOLOGY_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'biology',
    chapterId: 'bio-ch-cell-bio',
    topics: [
      {
        id: 'bio-topic-cell-structure',
        title: 'Cell Structure, Membranes & Transport',
        description:
          'Organelle architecture and the membrane physics that respiration, neurobiology and osmosis all rely on.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'bio-sub-membrane-transport',
            title: 'Membrane Transport & Osmosis',
            description: 'Diffusion, facilitated transport, active transport and water potential.',
            concepts: [
              {
                id: 'concept-membrane-transport',
                title: 'Passive vs Active Membrane Transport',
                summary: 'Decide which mechanism moves a solute by asking whether it travels down its gradient, and whether it costs ATP.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'Simple diffusion and osmosis are passive (down a gradient, no ATP). Facilitated diffusion uses a channel or carrier but is still passive. Active transport moves solutes against a gradient using ATP-driven pumps, such as the $\\text{Na}^+/\\text{K}^+$ ATPase moving $3\\text{Na}^+$ out and $2\\text{K}^+$ in per ATP.',
                intuitiveExplanation:
                  'Passive transport is water flowing downhill; active transport is a pump lifting water back uphill, which only works because ATP pays the energy bill.',
                keyFormulas: [
                  {
                    label: 'Water Potential',
                    latex: '\\Psi = \\Psi_s + \\Psi_p',
                    explanation: 'Water moves from higher (less negative) to lower (more negative) $\\Psi$.',
                  },
                ],
                keyObservations: [
                  'Net flow always follows the electrochemical gradient unless energy is spent.',
                  'The $\\text{Na}^+/\\text{K}^+$ pump exports three positive charges for every two imported, contributing to membrane potential.',
                  'Osmosis moves water, never solute, across a semi-permeable membrane.',
                ],
                workedExamples: [
                  {
                    id: 'we-cell-01',
                    title: 'Predicting Osmotic Direction',
                    problemStatement:
                      'A plant cell with $\\Psi = -0.6\\,\\text{MPa}$ is placed in a solution with $\\Psi = -0.3\\,\\text{MPa}$. Which way does water move?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Compare water potentials: the cell is $-0.6$, the solution is $-0.3$.',
                      'Water moves from higher (less negative) to lower (more negative) potential.',
                      'The solution is therefore at the higher potential.',
                      'Water leaves the cell, causing plasmolysis if the gradient is large enough.',
                    ],
                    finalAnswer: 'Water moves out of the cell.',
                    keyTakeaway: 'Always compare values numerically: $-0.3$ is greater than $-0.6$.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cell-01',
                    trapTitle: 'Assuming "more solute" always wins',
                    flawedReasoning: 'The solution with more dissolved particles will always gain water.',
                    correctConcept:
                      'Flow depends on total water potential (solute plus pressure), not solute concentration alone. Turgor pressure inside a plant cell can raise its $\\Psi$ above that of a more concentrated external solution.',
                    counterExample:
                      'A turgid cell can resist further water entry even when the external solution is more dilute.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'bio-sub-osmosis-water-potential', title: 'Water Potential & Osmotic Equilibrium', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'Which process requires ATP?',
                  options: ['Simple diffusion', 'Osmosis', 'Facilitated diffusion', 'Na⁺/K⁺ pump'],
                  correctIndex: 3,
                  explanation: 'The Na⁺/K⁺ pump moves ions against their gradients and therefore needs ATP.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export const CURRICULUM_EXPANSION: ChapterAddition[] = [
  ...MATH_ADDITIONS,
  ...PHYSICS_ADDITIONS,
  ...CS_ADDITIONS,
  ...CHEMISTRY_ADDITIONS,
  ...BIOLOGY_ADDITIONS,
];

/**
 * Apply the expansion to a live curriculum array in place.
 * Existing chapters, topics and concepts are preserved; new topics are appended.
 */
export function applyCurriculumExpansion(
  curriculum: Array<{ id: SubjectId; chapters: ChapterItem[] }>,
  additions: ChapterAddition[] = CURRICULUM_EXPANSION
): { topicsAdded: number; chaptersAdded: number } {
  let topicsAdded = 0;
  let chaptersAdded = 0;

  for (const addition of additions) {
    const subject = curriculum.find((entry) => entry.id === addition.subjectId);
    if (!subject) continue;

    let chapter = subject.chapters.find((entry) => entry.id === addition.chapterId);

    if (!chapter && addition.newChapter) {
      chapter = {
        id: addition.newChapter.id,
        subjectId: addition.subjectId,
        examTracks: addition.examTracks ?? ALL,
        title: addition.newChapter.title,
        sequenceOrder: addition.newChapter.sequenceOrder,
        description: addition.newChapter.description,
        topics: [],
      } as ChapterItem;
      subject.chapters.push(chapter);
      subject.chapters.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      chaptersAdded += 1;
    }

    if (!chapter) continue;

    for (const topicSeed of addition.topics ?? []) {
      // Never duplicate a topic id; the expansion is idempotent.
      if (chapter.topics.some((existing) => existing.id === topicSeed.id)) continue;
      chapter.topics.push(buildTopic(addition.subjectId, chapter.id, topicSeed));
      topicsAdded += 1;
    }
  }

  return { topicsAdded, chaptersAdded };
}
