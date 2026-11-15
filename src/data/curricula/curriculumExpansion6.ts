import { ChapterAddition } from './curriculumExpansion';

/**
 * Curriculum Expansion 6 — Advanced AP Calculus (AB & BC) & Cross-Subject Depth.
 *
 * Adds:
 *  - Advanced AP Calculus AB/BC topics to `math-ch-diff-calc` and `math-ch-integral-calc`
 *  - Three new AP Calculus BC chapters (`math-ch-ap-calc-odes`, `math-ch-ap-calc-series`, `math-ch-ap-calc-param-polar`)
 *  - One new multi-topic chapter to each of the remaining 6 subjects (`cs`, `physics`, `chemistry`, `biology`, `english`, `data_science`)
 */

const AP_MATH_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'math',
    chapterId: 'math-ch-diff-calc',
    topics: [
      {
        id: 'math-topic-ap-implicit-related',
        title: 'AP Calculus: Implicit Differentiation, Inverse Trig & Related Rates',
        description:
          'Differentiating curves defined implicitly, inverse functions, and coupled time-varying geometric rates.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-ap-implicit-inverse',
            title: 'Implicit Curves & Inverse Function Derivatives',
            description: 'Applying the chain rule when y depends implicitly on x and differentiating inverse mappings.',
            concepts: [
              {
                id: 'concept-ap-implicit-diff',
                title: 'Implicit Differentiation & Second Derivatives Along Curves',
                summary:
                  'Compute dy/dx and d²y/dx² for equations F(x, y) = c without isolating y explicitly.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'When F(x, y) = 0 defines y locally as a differentiable function of x with ∂F/∂y ≠ 0, differentiating both sides with respect to x treats y as y(x) via the chain rule: (d/dx)[g(y)] = g\'(y)·(dy/dx).',
                intuitiveExplanation:
                  'Even when a curve loops back over itself like a circle or folium, any tiny piece away from vertical tangents still has a well-defined slope. Differentiating term-by-term while remembering that y moves whenever x moves lets you solve directly for dy/dx.',
                keyFormulas: [
                  {
                    label: 'Chain Rule on Dependent Terms',
                    latex: '\\frac{d}{dx}[y^n] = n y^{n-1} \\frac{dy}{dx}',
                    explanation: 'Always multiply y-derivatives by dy/dx; never omit the inner rate.',
                  },
                  {
                    label: 'Implicit Concavity Substitution',
                    latex: '\\frac{d^2y}{dx^2} = \\frac{d}{dx}\\!\\left(\\frac{dy}{dx}\\right) \\quad \\text{(substitute } \\frac{dy}{dx} \\text{ back in)}',
                    explanation: 'Second derivatives of implicit curves require substituting the first derivative back into the differentiated expression.',
                  },
                ],
                keyObservations: [
                  'Product rule applies to mixed terms such as xy: d/dx(xy) = y + x(dy/dx).',
                  'Vertical tangents occur where the denominator of dy/dx vanishes while the numerator stays nonzero.',
                  'Horizontal tangents occur where the numerator of dy/dx vanishes while the denominator stays nonzero.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-imp-01',
                    title: 'Slope and Concavity of a Tilted Ellipse',
                    problemStatement: 'For the curve x² + xy + y² = 7, find dy/dx at the point (2, 1).',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Differentiate each term with respect to x: 2x + (1·y + x·dy/dx) + 2y·(dy/dx) = 0.',
                      'Collect terms containing dy/dx: (x + 2y)(dy/dx) = -(2x + y).',
                      'Isolate the derivative: dy/dx = -(2x + y) / (x + 2y).',
                      'Evaluate at (x, y) = (2, 1): dy/dx = -(4 + 1) / (2 + 2) = -5/4.',
                    ],
                    finalAnswer: '-5/4',
                    keyTakeaway: 'Verify the point actually lies on the curve (4 + 2 + 1 = 7) before substituting.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-imp-01',
                    trapTitle: 'Dropping dy/dx or the derivative of the constant',
                    flawedReasoning: 'Differentiate x² + y² = 25 as 2x + 2y = 25.',
                    correctConcept:
                      'The right-hand side is constant so its derivative is 0, and y² differentiates to 2y·(dy/dx).',
                    counterExample: 'For x² + y² = 25 at (3, 4), the true slope is -3/4, not undefined.',
                  },
                ],
                prerequisites: [{ id: 'concept-differentiability-conditions', title: 'Where Derivatives Fail to Exist', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-related-rates', title: 'Multi-Variable Related Rates & Geometric Constraints', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'For x³ + y³ = 9, what is dy/dx at the point (1, 2)?',
                  options: ['-1/4', '-4', '1/4', '-3/4'],
                  correctIndex: 0,
                  explanation: '3x² + 3y²(dy/dx) = 0 gives dy/dx = -x²/y². At (1, 2), dy/dx = -1/4.',
                },
              },
              {
                id: 'concept-ap-inverse-trig-deriv',
                title: 'Derivatives of Inverse Functions & Inverse Trigonometric Functions',
                summary:
                  'Compute (f⁻¹)\'(b) from f\'(f⁻¹(b)) and apply exact derivatives of arcsin, arccos, and arctan.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'If f is differentiable and strictly monotonic with f(a) = b and f\'(a) ≠ 0, then (f⁻¹)\'(b) = 1 / f\'(a) = 1 / f\'(f⁻¹(b)). Special cases yield d/dx[arcsin x] = 1/√(1 - x²) and d/dx[arctan x] = 1/(1 + x²).',
                intuitiveExplanation:
                  'Reflecting a graph across the line y = x swaps rise and run. Therefore the slope of the inverse at (b, a) is the exact reciprocal of the original slope at (a, b).',
                keyFormulas: [
                  {
                    label: 'Inverse Derivative Reciprocal Law',
                    latex: '(f^{-1})\'(b) = \\frac{1}{f\'(f^{-1}(b))}',
                    explanation: 'Evaluate f\' at x = a where f(a) = b, NOT at x = b.',
                  },
                  {
                    label: 'Arctangent Derivative',
                    latex: '\\frac{d}{dx}[\\arctan(u)] = \\frac{u\'}{1 + u^2}',
                    explanation: 'Crucial both for differentiation and recognizing inverse-trig integrals.',
                  },
                ],
                keyObservations: [
                  'Never plug the output y-value b into f\' — first invert f(a) = b to find the matching x-value a.',
                  'When f\'(a) = 0, the inverse function has a vertical tangent at b and is not differentiable there.',
                  'The derivatives of arccos x and arcsin x differ only by a minus sign.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-inv-01',
                    title: 'Derivative of an Inverse Polynomial at a Target Value',
                    problemStatement: 'Let f(x) = x³ + 2x + 1 and let g = f⁻¹. Find g\'(4).',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Solve f(a) = 4: a³ + 2a + 1 = 4 simplifies to a³ + 2a - 3 = 0.',
                      'Inspect rational roots: a = 1 gives 1 + 2 - 3 = 0. Since f\'(x) = 3x² + 2 > 0 everywhere, a = 1 is unique.',
                      'Compute f\'(1) = 3(1)² + 2 = 5.',
                      'By the reciprocal formula, g\'(4) = 1 / f\'(1) = 1/5.',
                    ],
                    finalAnswer: '1/5',
                    keyTakeaway: 'Solve f(a) = b first, then take 1 / f\'(a).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-inv-01',
                    trapTitle: 'Evaluating f\' at b instead of a = f⁻¹(b)',
                    flawedReasoning: 'Compute g\'(4) = 1 / f\'(4) = 1 / 50.',
                    correctConcept: 'The tangent slope corresponds to the point (a, b) on f, so you must evaluate f\' at a = g(b).',
                    counterExample: 'For f(x) = x³ + 2x + 1, f(1) = 4, so g\'(4) = 1/f\'(1) = 1/5, not 1/f\'(4) = 1/50.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-implicit-diff', title: 'Implicit Differentiation & Second Derivatives Along Curves', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-trig-substitution', title: 'Trigonometric Identities & Inverse-Trig Antiderivatives', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If f(x) = eˣ + 3x and g = f⁻¹, what is g\'(1)?',
                  options: ['1/4', '1/(e + 3)', '4', '1/3'],
                  correctIndex: 0,
                  explanation: 'Notice f(0) = e⁰ + 0 = 1, so a = 0. Since f\'(x) = eˣ + 3, f\'(0) = 4, giving g\'(1) = 1/4.',
                },
              },
              {
                id: 'concept-ap-related-rates',
                title: 'Multi-Variable Related Rates & Geometric Constraints',
                summary:
                  'Link time derivatives dx/dt, dy/dt, dr/dt, and dθ/dt by differentiating a geometric invariant equation with respect to t.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'Given a geometric relation G(x₁(t), ..., xₙ(t)) = 0 holding at all times t in an interval, differentiating with respect to t yields Σ (∂G/∂xᵢ)(dxᵢ/dt) = 0, allowing an unknown instantaneous rate to be solved at a snapshot.',
                intuitiveExplanation:
                  'Picture a conical tank draining water or a ladder sliding down a wall: variables stay locked together by geometry at every instant, so their speeds cannot change independently.',
                keyFormulas: [
                  {
                    label: 'Cone Volume with Constant Aspect Ratio',
                    latex: 'V = \\frac{1}{3}\\pi r^2 h, \\quad \\frac{r}{h} = \\frac{R}{H} \\implies V = \\frac{\\pi R^2}{3H^2} h^3',
                    explanation: 'Eliminate one variable using similar triangles BEFORE differentiating if only one rate is given.',
                  },
                ],
                keyObservations: [
                  'Never plug in snapshot numerical values (like r = 3 or x = 4) until AFTER differentiating with respect to t.',
                  'Identify signs carefully: decreasing quantities have negative rates of change.',
                  'Use Pythagorean, similar-triangle, or trigonometric relations to reduce excess variables.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-rr-01',
                    title: 'Draining Conical Reservoir',
                    problemStatement:
                      'Water leaks from an inverted cone of radius R = 4 m and height H = 8 m at 2 m³/min. Find dh/dt when the water depth is h = 4 m.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'By similar triangles, r/h = 4/8 = 1/2, so r = h/2.',
                      'Substitute into volume: V = (1/3)π(h/2)²h = (π/12)h³.',
                      'Differentiate with respect to t: dV/dt = (π/4)h²(dh/dt).',
                      'Plug in dV/dt = -2 and h = 4: -2 = (π/4)(16)(dh/dt) = 4π(dh/dt), so dh/dt = -1/(2π) m/min.',
                    ],
                    finalAnswer: '-1/(2π) m/min',
                    keyTakeaway: 'Reduce V(r, h) to V(h) via similar triangles before differentiating to avoid an unknown dr/dt.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-rr-01',
                    trapTitle: 'Substituting snapshot dimensions too early',
                    flawedReasoning: 'Plug in h = 4 m into V = (π/12)h³ before differentiating to get dV/dt = 0.',
                    correctConcept: 'Snapshot values hold at only one instant; differentiate general variables first, then substitute.',
                    counterExample: 'A moving ladder at x = 3 m still has dx/dt ≠ 0 even though x equals 3 at that moment.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-implicit-diff', title: 'Implicit Differentiation & Second Derivatives Along Curves', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-applied-optimization', title: 'Closed-Interval & Unbounded Applied Optimization', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'A spherical balloon inflates at dV/dt = 8π cm³/s. What is dr/dt when r = 2 cm?',
                  options: ['0.5 cm/s', '1.0 cm/s', '2.0 cm/s', '0.25 cm/s'],
                  correctIndex: 0,
                  explanation: 'V = (4/3)πr³ gives dV/dt = 4πr²(dr/dt). At r = 2, 8π = 16π(dr/dt), so dr/dt = 0.5 cm/s.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-ap-mvt-optimization',
        title: 'AP Calculus: Analytic Existence Theorems & Applied Optimization',
        description:
          'Bridging hypothesis-driven justification (IVT, EVT, Rolle, MVT) with global optimization.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-ap-theorems-opt',
            title: 'IVT, EVT, MVT & Global Extrema',
            description: 'Checking continuity/differentiability hypotheses and proving global maxima and minima.',
            concepts: [
              {
                id: 'concept-ap-ivt-evt-mvt',
                title: 'Intermediate, Extreme & Mean Value Theorems in AP Calculus',
                summary:
                  'Verify continuity and differentiability hypotheses to guarantee roots, attained bounds, and average-to-instantaneous rate matches.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem', 'jee_advanced'],
                formalDefinition:
                  'IVT: If f is continuous on [a, b] and k lies between f(a) and f(b), some c ∈ (a, b) satisfies f(c) = k. EVT: Continuous f on compact [a, b] attains both an absolute maximum and minimum. MVT: If f is continuous on [a, b] and differentiable on (a, b), some c ∈ (a, b) satisfies f\'(c) = [f(b) - f(a)] / (b - a).',
                intuitiveExplanation:
                  'IVT says an unbroken path cannot cross a river without hitting the water; EVT says a closed mountain trail has a highest peak and lowest valley; MVT says if your trip averaged 60 mph, your speedometer hit 60 mph at least once.',
                keyFormulas: [
                  {
                    label: 'Mean Value Theorem Equation',
                    latex: "f'(c) = \\frac{f(b) - f(a)}{b - a} \\quad \\text{for some } c \\in (a, b)",
                    explanation: 'Requires continuity on [a, b] AND differentiability on (a, b).',
                  },
                ],
                keyObservations: [
                  'On AP Calculus free-response questions, stating "f is differentiable, hence continuous" earns the hypothesis justification point.',
                  'MVT fails if a sharp corner or vertical asymptote sits inside (a, b).',
                  'Applying IVT to f\' requires continuity of f\', known as Darboux\'s property even without continuity of f\' in general, though AP problems explicitly establish continuity of the target function.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-mvt-01',
                    title: 'Validating and Solving MVT on an Interval',
                    problemStatement:
                      'Verify MVT hypotheses and find c ∈ (1, 4) for f(x) = x + 4/x on [1, 4].',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'On [1, 4], x ≠ 0, so f is continuous on [1, 4] and differentiable on (1, 4).',
                      'Compute average slope: [f(4) - f(1)] / (4 - 1) = [(4 + 1) - (1 + 4)] / 3 = (5 - 5) / 3 = 0.',
                      'Differentiate: f\'(x) = 1 - 4/x².',
                      'Solve 1 - 4/c² = 0: c² = 4, and choosing c ∈ (1, 4) gives c = 2.',
                    ],
                    finalAnswer: 'c = 2',
                    keyTakeaway: 'Always discard candidate solutions lying outside the open interval (a, b).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-mvt-01',
                    trapTitle: 'Applying MVT across a vertical asymptote or corner',
                    flawedReasoning: 'Conclude f(x) = 1/x on [-1, 1] must have some point where f\'(c) = 1.',
                    correctConcept: 'MVT fails because f(x) = 1/x is discontinuous at x = 0 ∈ [-1, 1]. Indeed f\'(x) = -1/x² < 0 everywhere.',
                    counterExample: 'f(x) = |x| on [-1, 1] has average slope 0, yet f\'(x) = ±1 everywhere x ≠ 0.',
                  },
                ],
                prerequisites: [{ id: 'concept-continuity-types', title: 'Continuity & Classification of Discontinuities', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-deriv-inc-dec', title: 'Monotonicity & First Derivative Test', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'Which hypothesis is strictly required for MVT on [a, b] but NOT for IVT on [a, b]?',
                  options: [
                    'Differentiability on (a, b)',
                    'Continuity on [a, b]',
                    'Monotonicity on [a, b]',
                    'f(a) = f(b)',
                  ],
                  correctIndex: 0,
                  explanation: 'IVT requires only continuity on [a, b], whereas MVT requires continuity on [a, b] and differentiability on (a, b).',
                },
              },
              {
                id: 'concept-ap-applied-optimization',
                title: 'Closed-Interval & Unbounded Applied Optimization',
                summary:
                  'Model an objective function with a constraint, eliminate extra variables, and prove global optimality using endpoints or sign analysis.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'To find the absolute maximum or minimum of a continuous objective Q(x) on [a, b], compare Q at all interior critical points (where Q\'(x) = 0 or undefined) and at endpoints a, b. On an open or unbounded domain, show Q\' has a single sign change across the unique critical point.',
                intuitiveExplanation:
                  'Finding Q\'(c) = 0 only tells you the ground is flat there—it could be a peak, a valley, or a terrace, and a boundary wall could still be taller. Candidates testing on closed intervals or global sign analysis finishes the proof.',
                keyFormulas: [
                  {
                    label: 'Closed-Interval Candidates Test',
                    latex: '\\max_{[a, b]} Q(x) = \\max\\{Q(a),\\ Q(b),\\ Q(c_1), \\dots, Q(c_k)\\}',
                    explanation: 'Guaranteed valid whenever Q is continuous on the closed bounded interval [a, b].',
                  },
                ],
                keyObservations: [
                  'Setting the derivative to zero is necessary (interior), not sufficient, for an extremum.',
                  'On AP Calculus free-response, justify a global extremum over an open interval by proving Q\'(x) > 0 for all x < c and Q\'(x) < 0 for all x > c (not merely local behavior near c).',
                  'Squaring distance functions (minimizing D² instead of D) preserves the argmin while avoiding square-root algebra.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-opt-01',
                    title: 'Open-Top Box Maximum Volume',
                    problemStatement:
                      'Equal squares of side x are cut from the corners of a 12 in × 12 in sheet of cardboard and folded up. Find x maximizing the box volume.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Dimensions after folding are base (12 - 2x) by (12 - 2x) and height x, so V(x) = x(12 - 2x)² on [0, 6].',
                      'Expand V(x) = 4x³ - 48x² + 144x.',
                      'Differentiate: V\'(x) = 12x² - 96x + 144 = 12(x - 2)(x - 6).',
                      'Candidates in [0, 6]: x = 0 (V = 0), x = 2 (V = 2·8² = 128), x = 6 (V = 0). Maximum is V(2) = 128 in³.',
                    ],
                    finalAnswer: 'x = 2 inches (maximum volume 128 in³)',
                    keyTakeaway: 'Restrict x to physically valid bounds before applying the Candidates Test.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-opt-01',
                    trapTitle: 'Omitting endpoints or choosing an unphysical root',
                    flawedReasoning: 'Choose x = 6 because V\'(6) = 0 without testing endpoints or volume.',
                    correctConcept: 'At x = 6, the entire sheet is cut away leaving V(6) = 0 (a minimum, not a maximum).',
                    counterExample: 'Every boundary point where a dimension hits zero must be checked or rejected by sign analysis.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-ivt-evt-mvt', title: 'Intermediate, Extreme & Mean Value Theorems in AP Calculus', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-deriv-concavity', title: 'Concavity, Inflection & Second Derivative Test', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'Two positive numbers have sum 20. What is the maximum possible value of their product?',
                  options: ['100', '96', '84', '400'],
                  correctIndex: 0,
                  explanation: 'P(x) = x(20 - x) has P\'(x) = 20 - 2x = 0 at x = 10, yielding P(10) = 10·10 = 100.',
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
        id: 'math-topic-ap-adv-integration',
        title: 'AP Calculus BC: Partial Fractions, Trig Substitutions & Average Value',
        description:
          'Algebraic decompositions, inverse-trig antiderivatives, and integral mean values for rates of change.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-ap-partial-trig',
            title: 'Partial Fractions & Inverse-Trig Integrals',
            description: 'Breaking rational functions into simple logarithms and completing squares.',
            concepts: [
              {
                id: 'concept-ap-partial-fractions',
                title: 'Integration by Non-Repeated Linear Partial Fractions',
                summary:
                  'Decompose proper rational functions with factorable denominators into A/(x - r₁) + B/(x - r₂) before integrating to logarithms.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'If deg(P) < deg(Q) and Q(x) factors into distinct linear terms (x - r₁)···(x - rₖ), then P(x)/Q(x) = Σ Aᵢ/(x - rᵢ), whose antiderivative is Σ Aᵢ ln|x - rᵢ| + C. If deg(P) ≥ deg(Q), perform polynomial long division first.',
                intuitiveExplanation:
                  'Just as adding fractions creates a common denominator, partial fractions runs that arithmetic in reverse so ugly rational fractions turn into elementary 1/(x - r) pieces.',
                keyFormulas: [
                  {
                    label: 'Two-Root Decomposition',
                    latex: '\\frac{P(x)}{(x - a)(x - b)} = \\frac{A}{x - a} + \\frac{B}{x - b}',
                    explanation: 'Always check degree(numerator) < degree(denominator) first.',
                  },
                ],
                keyObservations: [
                  'Heaviside cover-up gives A immediately by multiplying by (x - a) and evaluating at x = a.',
                  'Absolute values inside ln|x - r| are essential when x - r can be negative.',
                  'This exact decomposition unlocks closed-form solutions to logistic differential equations.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-pf-01',
                    title: 'Evaluating a Definite Rational Integral',
                    problemStatement: 'Evaluate ∫₀¹ 3 / [(x + 1)(x + 2)] dx.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Set 3 / [(x + 1)(x + 2)] = A/(x + 1) + B/(x + 2), so 3 = A(x + 2) + B(x + 1).',
                      'Plug in x = -1: 3 = A(1) gives A = 3. Plug in x = -2: 3 = B(-1) gives B = -3.',
                      'Integrate: [3 ln|x + 1| - 3 ln|x + 2|]₀¹ = 3 ln|(x + 1)/(x + 2)|₀¹.',
                      'Evaluate bounds: 3 ln(2/3) - 3 ln(1/2) = 3 ln(4/3).',
                    ],
                    finalAnswer: '3 ln(4/3)',
                    keyTakeaway: 'Combine logarithms before evaluating bounds to simplify arithmetic.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-pf-01',
                    trapTitle: 'Skipping long division on improper rational functions',
                    flawedReasoning: 'Decompose (x² + 1) / (x² - 1) directly as A/(x - 1) + B/(x + 1).',
                    correctConcept: 'Because numerator and denominator both have degree 2, you must divide first: (x² + 1)/(x² - 1) = 1 + 2/(x² - 1).',
                    counterExample: 'A/(x - 1) + B/(x + 1) approaches 0 as x → ∞, whereas (x² + 1)/(x² - 1) approaches 1.',
                  },
                ],
                prerequisites: [{ id: 'concept-u-substitution', title: 'Integration by Substitution (Chain Rule Reversed)', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-logistic-growth', title: 'Logistic Differential Equation, Carrying Capacity & Inflection Point', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'When decomposing 5 / [(x - 1)(x + 4)] = A/(x - 1) + B/(x + 4), what is the value of A?',
                  options: ['1', '-1', '5', '4'],
                  correctIndex: 0,
                  explanation: '5 = A(x + 4) + B(x - 1). Setting x = 1 gives 5 = 5A, so A = 1.',
                },
              },
              {
                id: 'concept-trig-substitution',
                title: 'Trigonometric Identities & Inverse-Trig Antiderivatives',
                summary:
                  'Recognize 1/(a² + x²) and 1/√(a² - x²) patterns immediately and complete the square when needed.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'Using d/dx[arctan(x/a)] = a/(a² + x²) and d/dx[arcsin(x/a)] = 1/√(a² - x²), we obtain ∫ dx/(a² + x²) = (1/a)arctan(x/a) + C and ∫ dx/√(a² - x²) = arcsin(x/a) + C for a > 0.',
                intuitiveExplanation:
                  'Not every rational or radical integrand needs substitution into logs: when the denominator sums two squares like 9 + x² without an x in the numerator, it integrates cleanly into arctangent scaled by 1/a.',
                keyFormulas: [
                  {
                    label: 'Scaled Inverse-Trig Integrals',
                    latex: '\\int \\frac{dx}{a^2 + x^2} = \\frac{1}{a}\\arctan\\!\\left(\\frac{x}{a}\\right) + C, \\quad \\int \\frac{dx}{\\sqrt{a^2 - x^2}} = \\arcsin\\!\\left(\\frac{x}{a}\\right) + C',
                    explanation: 'Always check whether the numerator contains x dx (simple u-sub) vs. a constant dx (inverse trig).',
                  },
                ],
                keyObservations: [
                  'Notice the 1/a factor outside arctan(x/a), whereas arcsin(x/a) has NO outer 1/a coefficient.',
                  'Complete the square x² + 4x + 13 = (x + 2)² + 3² before applying the arctangent template.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-invtrig-01',
                    title: 'Completing the Square to Arctangent',
                    problemStatement: 'Evaluate ∫ 1 / (x² + 4x + 13) dx.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Complete the square in the denominator: x² + 4x + 13 = (x + 2)² + 9 = (x + 2)² + 3².',
                      'Substitute u = x + 2, du = dx with a = 3.',
                      'Apply template: (1/3) arctan((x + 2)/3) + C.',
                    ],
                    finalAnswer: '(1/3) arctan((x + 2)/3) + C',
                    keyTakeaway: 'Compare ∫ x/(x² + 9) dx (u-sub → ½ ln(x² + 9)) against ∫ 1/(x² + 9) dx (⅓ arctan(x/3)).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-invtrig-01',
                    trapTitle: 'Omitting the 1/a coefficient on arctan(x/a) or adding one to arcsin(x/a)',
                    flawedReasoning: 'Integrate ∫ dx/(4 + x²) as arctan(x/2) + C.',
                    correctConcept: 'By chain rule, d/dx[arctan(x/2)] = ½ / (1 + x²/4) = 2 / (4 + x²), so you must multiply by 1/a = 1/2.',
                    counterExample: '∫₀² dx/(4 + x²) = (1/2)arctan(1) = π/8, whereas omitting 1/2 doubles the answer to π/4.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-inverse-trig-deriv', title: 'Derivatives of Inverse Functions & Inverse Trigonometric Functions', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-partial-fractions', title: 'Integration by Non-Repeated Linear Partial Fractions', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'What is ∫₀³ 1 / (9 + x²) dx?',
                  options: ['π/12', 'π/4', 'ln(2)/3', 'π/6'],
                  correctIndex: 0,
                  explanation: 'With a = 3, [(1/3)arctan(x/3)]₀³ = (1/3)arctan(1) = (1/3)(π/4) = π/12.',
                },
              },
              {
                id: 'concept-ap-avg-value-accumulation',
                title: 'Average Value of a Function & Rate-of-Change Accumulation',
                summary:
                  'Compute the mean height of a continuous function on [a, b] and interpret integrals of rates as net change.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'The average value of integrable f on [a, b] is f_avg = (1 / (b - a)) ∫_a^b f(x) dx. By the Mean Value Theorem for Integrals, continuous f attains f(c) = f_avg at some c ∈ (a, b). Furthermore, F(t) = F(t₀) + ∫_{t₀}^t R_in(s) - R_out(s) ds models net accumulation.',
                intuitiveExplanation:
                  'Flatten all the hills and valleys of a graph between a and b into a single level rectangle with the exact same area — the height of that level rectangle is the average value.',
                keyFormulas: [
                  {
                    label: 'Average Value Theorem',
                    latex: 'f_{\\text{avg}} = \\frac{1}{b - a} \\int_a^b f(x)\\,dx',
                    explanation: 'Dividing total accumulated area by interval width gives average height.',
                  },
                ],
                keyObservations: [
                  'Do not confuse the average value of f with the average rate of change [f(b) - f(a)]/(b - a) = (f\')_avg.',
                  'In AP rate-in/rate-out problems, extrema of the accumulated amount A(t) occur where R_in(t) - R_out(t) = 0 or at endpoints.',
                  'The unit of ∫_a^b R(t) dt is (unit of R) × (unit of t).',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-avg-01',
                    title: 'Average Velocity vs. Average Position',
                    problemStatement: 'Find the average value of f(x) = 3x² + 2 on the interval [1, 3].',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute the integral: ∫₁³ (3x² + 2) dx = [x³ + 2x]₁³.',
                      'Evaluate bounds: (27 + 6) - (1 + 2) = 33 - 3 = 30.',
                      'Divide by the interval width (3 - 1) = 2: f_avg = 30 / 2 = 15.',
                    ],
                    finalAnswer: '15',
                    keyTakeaway: 'Never forget the leading 1/(b - a) factor outside the definite integral.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-avg-01',
                    trapTitle: 'Averaging endpoint values instead of integrating',
                    flawedReasoning: 'Compute [f(1) + f(3)] / 2 = (5 + 29) / 2 = 17.',
                    correctConcept: 'Arithmetic average of endpoints only equals integral average for linear functions, not curves.',
                    counterExample: 'For f(x) = x² on [0, 2], endpoint average is 2, whereas ∫₀² x² dx / 2 = 4/3.',
                  },
                ],
                prerequisites: [{ id: 'concept-ftc-leibniz', title: 'Fundamental Theorem of Calculus & Leibniz Rule', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-area-between-curves', title: 'Area Between Curves', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'What is the average value of f(x) = cos x on [0, π/2]?',
                  options: ['2/π', '1/2', 'π/2', '1'],
                  correctIndex: 0,
                  explanation: '(1 / (π/2 - 0)) ∫₀^{π/2} cos x dx = (2/π)[sin(π/2) - sin(0)] = 2/π.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-ap-volumes-arc',
        title: 'AP Calculus: Volumes of Revolution, Cross-Sections & Arc Length',
        description:
          'Integrating geometric slice areas for discs, washers, cross-sections, cylindrical shells, and curve length.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-ap-volumes-arc',
            title: '3D Slice Volumes & Planar Arc Length',
            description: 'Setting up π(R² - r²), known cross-sectional A(x), and √(1 + (f\'(x))²) integrands.',
            concepts: [
              {
                id: 'concept-ap-volumes-disc-washer',
                title: 'Volumes of Revolution: Disc & Washer Methods',
                summary:
                  'Revolve a planar region about an arbitrary horizontal or vertical axis y = k or x = h by integrating circular ring area π(R² - r²).',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'Revolving the region between outer radius R(x) and inner radius r(x) perpendicular to the axis of rotation over [a, b] yields volume V = π ∫_a^b ([R(x)]² - [r(x)]²) dx, where R(x) and r(x) measure distances to the axis line.',
                intuitiveExplanation:
                  'Each thin slice perpendicular to the axle spins into a flat coin (disc) or hollow washer. Adding the volumes of infinitely thin washers gives the exact 3D solid.',
                keyFormulas: [
                  {
                    label: 'Shifted-Axis Washer Volume',
                    latex: 'V = \\pi \\int_a^b \\big(R(x)^2 - r(x)^2\\big)\\,dx',
                    explanation: 'Square R(x) and r(x) individually BEFORE subtracting; never compute (R - r)².',
                  },
                ],
                keyObservations: [
                  'When revolving around y = k (not y = 0), radius is |curve - k|, with outer radius farthest from y = k.',
                  'Revolving around a vertical axis x = h using washers requires expressing curves as x = g(y) and integrating dy.',
                  'Always sketch a sample slice perpendicular to the axis of revolution to verify variable of integration.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-vol-01',
                    title: 'Washer Volume Around Shifted Line y = -1',
                    problemStatement:
                      'Set up and evaluate the volume formed by revolving the region between y = √x and y = x on [0, 1] around the line y = 0.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'On [0, 1], √x ≥ x, so outer radius R(x) = √x and inner radius r(x) = x.',
                      'Integrate: V = π ∫₀¹ [(√x)² - x²] dx = π ∫₀¹ (x - x²) dx.',
                      'Antiderivative: π [x²/2 - x³/3]₀¹ = π (1/2 - 1/3) = π/6.',
                    ],
                    finalAnswer: 'π / 6',
                    keyTakeaway: 'Compare R(x)² - r(x)², NOT (R(x) - r(x))².',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-vol-01',
                    trapTitle: 'Squaring the difference instead of subtracting the squares',
                    flawedReasoning: 'Write V = π ∫ (R(x) - r(x))² dx because thickness is R - r.',
                    correctConcept: 'The area of an annulus is πR² - πr² = π(R² - r²), not π(R - r)².',
                    counterExample: 'For R = 3, r = 1, true area is 8π whereas π(3 - 1)² = 4π.',
                  },
                ],
                prerequisites: [{ id: 'concept-area-between-curves', title: 'Area Between Curves', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-volumes-shells-cross', title: 'Known Cross-Section Volumes & Cylindrical Shells', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'When revolving the region between y = x² and y = 0 on [0, 2] about y = 0, what is the volume?',
                  options: ['32π/5', '16π/5', '8π/3', '64π/5'],
                  correctIndex: 0,
                  explanation: 'V = π ∫₀² (x²)² dx = π ∫₀² x⁴ dx = π[x⁵/5]₀² = 32π/5.',
                },
              },
              {
                id: 'concept-ap-volumes-shells-cross',
                title: 'Known Cross-Section Volumes & Cylindrical Shells',
                summary:
                  'Compute volumes of solids with square, semicircular, or equilateral-triangle slices, plus cylindrical shells 2πr·h.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_advanced'],
                formalDefinition:
                  'For a solid whose cross-sections perpendicular to the x-axis have known area A(x) over [a, b], V = ∫_a^b A(x) dx (NO factor of π unless circular). For revolution parallel to slices at distance r(x) and height h(x), cylindrical shells give V = 2π ∫_a^b r(x)h(x) dx.',
                intuitiveExplanation:
                  'Cross-section slicing works even when nothing spins: stack slices of bread whose faces are squares or triangles. Shells peel a solid like concentric onion rings whose circumference 2πr times height h unrolls into thin rectangles.',
                keyFormulas: [
                  {
                    label: 'Common Cross-Section Slice Areas (side s = top - bottom)',
                    latex: 'A_{\\text{square}} = s^2,\\quad A_{\\text{equilateral }\\triangle} = \\frac{\\sqrt{3}}{4}s^2,\\quad A_{\\text{semicircle (diam }s)} = \\frac{\\pi}{8}s^2',
                    explanation: 'Watch the 1/8 factor on semicircles when base chord s is the diameter (r = s/2, area = πr²/2 = πs²/8).',
                  },
                ],
                keyObservations: [
                  'Do NOT multiply non-circular cross-section integrals by π.',
                  'When s is the diameter of a semicircular slice, r = s/2 so ½πr² = (π/8)s².',
                  'Shells shine when revolving y = f(x) around a vertical axis x = c without solving for x(y).',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-cross-01',
                    title: 'Square Cross-Sections Over a Parabolic Base',
                    problemStatement:
                      'The base of a solid is bounded by y = √x, y = 0, and x = 4. Cross-sections perpendicular to the x-axis are squares. Find the volume.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'At each x ∈ [0, 4], the side length lying in the base is s(x) = √x - 0 = √x.',
                      'Area of the square cross-section is A(x) = s(x)² = (√x)² = x.',
                      'Integrate without π: V = ∫₀⁴ x dx = [x²/2]₀⁴ = 16/2 = 8.',
                    ],
                    finalAnswer: '8',
                    keyTakeaway: 'Match the base segment length s directly to the slice area formula A(x).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-cross-01',
                    trapTitle: 'Using radius s instead of s/2 for semicircular slices',
                    flawedReasoning: 'Set A(x) = ½πs² because a semicircle is half a circle.',
                    correctConcept: 'The segment between top and bottom curves spans the full DIAMETER of the semicircle, so radius is s/2 and A = (π/8)s².',
                    counterExample: 'A semicircle of diameter 4 has radius 2 and area 2π, NOT 8π.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-volumes-disc-washer', title: 'Volumes of Revolution: Disc & Washer Methods', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-arc-length-cartesian', title: 'Rectifiable Arc Length of Smooth Planar Curves', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If a semicircular cross-section perpendicular to the x-axis has diameter s(x) = 4, what is its area?',
                  options: ['2π', '8π', '4π', '16π'],
                  correctIndex: 0,
                  explanation: 'Radius is s/2 = 2, so area is ½π(2)² = 2π (matching πs²/8 = 16π/8 = 2π).',
                },
              },
              {
                id: 'concept-ap-arc-length-cartesian',
                title: 'Rectifiable Arc Length of Smooth Planar Curves',
                summary:
                  'Compute the exact length along a differentiable graph y = f(x) over [a, b] via ∫ √(1 + [f\'(x)]²) dx.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'If f\' is continuous on [a, b], the arc length of y = f(x) from x = a to x = b is L = ∫_a^b √(1 + [f\'(x)]²) dx, obtained as the limit of polygonal secant lengths √(Δx² + Δy²).',
                intuitiveExplanation:
                  'Zoom in closely on any smooth curve and a tiny piece looks like a straight right-triangle hypotenuse of run dx and rise dy = f\'(x)dx. Pythagoras gives length √(1 + f\'(x)²) dx.',
                keyFormulas: [
                  {
                    label: 'Cartesian Arc Length',
                    latex: 'L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx',
                    explanation: 'Note the 1 + (derivative)², NOT 1 + f(x)².',
                  },
                ],
                keyObservations: [
                  'Exact closed-form examples frequently turn 1 + [f\'(x)]² into a perfect square under the radical.',
                  'For x = g(y) on [c, d], integrate √(1 + [g\'(y)]²) dy.',
                  'On AP Calculator-active questions, verify endpoints and integrate numerically.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-arc-01',
                    title: 'Exact Arc Length of a Power Curve',
                    problemStatement: 'Find the arc length of y = (2/3)x^(3/2) from x = 0 to x = 3.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Differentiate: y\' = x^(1/2).',
                      'Square the derivative: [y\']² = x.',
                      'Set up integral: L = ∫₀³ √(1 + x) dx.',
                      'Integrate: [(2/3)(1 + x)^(3/2)]₀³ = (2/3)(4^(3/2) - 1) = (2/3)(8 - 1) = 14/3.',
                    ],
                    finalAnswer: '14/3',
                    keyTakeaway: 'Compute f\'(x) carefully before squaring inside the square root.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-arc-01',
                    trapTitle: 'Integrating f(x) instead of f\'(x) inside √(1 + ...)',
                    flawedReasoning: 'Write L = ∫ √(1 + [f(x)]²) dx.',
                    correctConcept: 'By Pythagoras, ds² = dx² + dy² = (1 + [dy/dx]²) dx², which uses the slope f\'(x), never height f(x).',
                    counterExample: 'A horizontal line y = 5 has length b - a since f\'(x) = 0, not √26(b - a).',
                  },
                ],
                prerequisites: [{ id: 'concept-u-substitution', title: 'Integration by Substitution (Chain Rule Reversed)', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-parametric-derivatives', title: 'First & Second Parametric Derivatives and Parametric Arc Length', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'Which integral computes the arc length of y = sin x from x = 0 to x = π?',
                  options: [
                    '∫₀^π √(1 + cos²x) dx',
                    '∫₀^π √(1 + sin²x) dx',
                    '∫₀^π √(1 - cos²x) dx',
                    'π ∫₀^π (1 + cos²x) dx',
                  ],
                  correctIndex: 0,
                  explanation: 'Since y\' = cos x, the integrand is √(1 + [y\']²) = √(1 + cos²x).',
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
    chapterId: 'math-ch-ap-calc-odes',
    examTracks: ['all', 'ap_stem', 'jee_main'],
    newChapter: {
      id: 'math-ch-ap-calc-odes',
      title: 'AP Calculus BC: Differential Equations & Slope Fields',
      sequenceOrder: 9,
      description:
        'Geometric direction fields, Euler numerical stepping, separable initial-value problems, and logistic growth.',
    },
    topics: [
      {
        id: 'math-topic-ap-slope-euler',
        title: "Slope Fields, Equilibrium Solutions & Euler's Method",
        description:
          'Reading qualitative phase behavior from dy/dx = F(x, y) and stepping tangents numerically.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-ap-slope-euler',
            title: 'Direction Fields & Euler Stepping',
            description: 'Matching slope fields to ODEs and executing uniform-step Euler approximations.',
            concepts: [
              {
                id: 'concept-ap-slope-fields',
                title: 'Geometric Interpretation of Slope Fields & Particular Solutions',
                summary:
                  'Sketch and identify ODEs dy/dx = F(x, y) by inspecting zero-slope isoclines, symmetry in x vs. y, and equilibrium stability.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'A slope field assigns to each lattice point (x, y) a short tangent segment of slope m = F(x, y). Any solution curve y = φ(x) through (x₀, y₀) remains tangent to the field everywhere; constant solutions y = c with F(x, c) = 0 are equilibrium solutions.',
                intuitiveExplanation:
                  'Think of a river flow map showing arrow slopes at every coordinate. Dropping a leaf at an initial point (x₀, y₀) traces out one unique downstream trajectory that glides tangent to every marker.',
                keyFormulas: [
                  {
                    label: 'Horizontal Isocline Test',
                    latex: '\\frac{dy}{dx} = F(x, y) = 0',
                    explanation: 'Where F(x, y) = 0, segments lie completely horizontal.',
                  },
                ],
                keyObservations: [
                  'If slopes stay identical across every horizontal row (changing x does not change slope), the ODE depends only on y.',
                  'If slopes stay identical down every vertical column (changing y does not change slope), the ODE depends only on x.',
                  'For autonomous ODEs dy/dx = g(y), draw a 1D phase sign chart to classify equilibria as stable or unstable.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-sf-01',
                    title: 'Identifying Slope Field Dependencies',
                    problemStatement:
                      'A slope field has horizontal segments along y = 2, positive slopes for y > 2, and identical slopes across every x-coordinate at fixed y. Could dy/dx = x - y or dy/dx = y - 2 generate it?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Slopes are independent of x (invariant horizontally), eliminating dy/dx = x - y.',
                      'Slopes vanish along y = 2 and turn positive for y > 2.',
                      'At y = 3, dy/dx = 3 - 2 = 1 > 0; at y = 1, dy/dx = 1 - 2 = -1 < 0.',
                      'Thus dy/dx = y - 2 matches every feature.',
                    ],
                    finalAnswer: 'dy/dx = y - 2',
                    keyTakeaway: 'Check invariance along columns (pure x) and rows (pure y) before testing specific points.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-sf-01',
                    trapTitle: 'Confusing the slope field of y with the graph of y\'',
                    flawedReasoning: 'Look for a curve resembling the graph of F(x, y) itself.',
                    correctConcept: 'Solution curves have DERIVATIVE equal to F(x, y), so positive regions mean rising solution curves.',
                    counterExample: 'For dy/dx = x, the solution curves are parabolas y = ½x² + C, not the straight line y = x.',
                  },
                ],
                prerequisites: [{ id: 'concept-deriv-inc-dec', title: 'Monotonicity & First Derivative Test', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-eulers-method', title: "Numerical ODE Approximation via Euler's Method", subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'For dy/dx = x(y - 1), at which points are all slope-field segments horizontal?',
                  options: [
                    'Along x = 0 and along y = 1',
                    'Only at the single point (0, 1)',
                    'Along y = x',
                    'Nowhere in the plane',
                  ],
                  correctIndex: 0,
                  explanation: 'The product x(y - 1) vanishes whenever EITHER x = 0 OR y = 1.',
                },
              },
              {
                id: 'concept-ap-eulers-method',
                title: "Numerical ODE Approximation via Euler's Method",
                summary:
                  'Iterate tangent-line steps y_{n+1} = y_n + F(x_n, y_n)·Δx to approximate intractable initial-value problems.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'Starting from (x₀, y₀) for dy/dx = F(x, y) with step size h = Δx, Euler\'s method generates x_{n+1} = x_n + h and y_{n+1} = y_n + F(x_n, y_n)·h, producing a piecewise-linear approximation whose global error scales linearly with h.',
                intuitiveExplanation:
                  'Instead of knowing the exact curved path, take a small straight step along the current tangent direction, re-evaluate the new slope at your landing spot, and repeat.',
                keyFormulas: [
                  {
                    label: "Euler's Iterative Step",
                    latex: 'y_{n+1} = y_n + F(x_n, y_n)\\,\\Delta x, \\qquad x_{n+1} = x_n + \\Delta x',
                    explanation: 'Halving step size roughly halves the accumulated numerical error.',
                  },
                ],
                keyObservations: [
                  'If the true solution is concave up (d²y/dx² > 0) everywhere on the path, tangent steps stay below the curve, producing an underestimate.',
                  'If the true solution is concave down everywhere on the path, tangent steps overshoot above the curve, producing an overestimate.',
                  'Always build a clean (x_n, y_n, dy/dx, Δy) table to avoid arithmetic slips.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-euler-01',
                    title: 'Two-Step Euler Approximation',
                    problemStatement:
                      'Given dy/dx = 2x - y with y(1) = 3, use Euler\'s method with two equal steps to approximate y(2).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute step size: Δx = (2 - 1) / 2 = 0.5.',
                      'Step 1 at (1, 3): slope = 2(1) - 3 = -1. New y₁ = 3 + (-1)(0.5) = 2.5 at x₁ = 1.5.',
                      'Step 2 at (1.5, 2.5): slope = 2(1.5) - 2.5 = 0.5. New y₂ = 2.5 + (0.5)(0.5) = 2.75 at x₂ = 2.0.',
                    ],
                    finalAnswer: '2.75',
                    keyTakeaway: 'Re-evaluate F(x_n, y_n) at the updated coordinates on every single step.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-euler-01',
                    trapTitle: 'Reusing the initial slope m₀ across all steps',
                    flawedReasoning: 'Multiply the first slope by total span (b - a) directly.',
                    correctConcept: 'Using one slope across multiple steps collapses Euler\'s method into a single coarse tangent line.',
                    counterExample: 'For dy/dx = y with y(0) = 1, two steps of h = 0.5 give 2.25, whereas a single tangent step gives 2.0.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-slope-fields', title: 'Geometric Interpretation of Slope Fields & Particular Solutions', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-separable-odes', title: 'Separation of Variables & Initial-Value Constants', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'For dy/dx = x + y with y(0) = 1 and step size Δx = 0.5, what is the Euler approximation for y(1)?',
                  options: ['2.5', '2.0', '3.0', '1.5'],
                  correctIndex: 0,
                  explanation: 'Step 1: y(0.5) ≈ 1 + (0 + 1)(0.5) = 1.5. Step 2: y(1) ≈ 1.5 + (0.5 + 1.5)(0.5) = 1.5 + 1.0 = 2.5.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-ap-separable-logistic',
        title: 'Separable Differential Equations & Logistic Dynamics',
        description:
          'Solving exact initial-value problems and analyzing bounded population models.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-ap-sep-logistic',
            title: 'Separable IVPs & Logistic ODEs',
            description: 'Algebraic separation, domain intervals of validity, and logistic S-curves.',
            concepts: [
              {
                id: 'concept-ap-separable-odes',
                title: 'Separation of Variables & Initial-Value Constants',
                summary:
                  'Separate dy/dx = g(x)h(y) into dy/h(y) = g(x)dx, integrate both sides, apply the initial condition immediately, and respect the maximal connected domain.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_main'],
                formalDefinition:
                  'When dy/dx = g(x)h(y) with h(y₀) ≠ 0, rewrite (1/h(y)) dy = g(x) dx and integrate: H(y) = G(x) + C. Solve for C using (x₀, y₀), choose the sign branch matching y₀, and restrict x to the connected interval where the curve remains differentiable.',
                intuitiveExplanation:
                  'Variables often come tangled in dy/dx. Separation moves every y-factor onto the dy side and every x-factor onto the dx side so both sides integrate independently before solving for the constant.',
                keyFormulas: [
                  {
                    label: 'Exponential Growth / Decay Solution',
                    latex: '\\frac{dy}{dt} = k y \\implies y(t) = y_0 e^{kt}',
                    explanation: 'Direct consequence of ∫ (1/y) dy = ∫ k dt.',
                  },
                ],
                keyObservations: [
                  'Wait to isolate y until after verifying how +C enters: turning ln|y| = x + C into y = ±e^C e^x turns an additive constant into a multiplicative factor.',
                  'When taking a square root y = ±√(...), match the sign (+ or -) to the initial y₀ value.',
                  'Also check equilibrium values where h(y) = 0 — dividing by h(y) can hide constant equilibrium solutions.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-sep-01',
                    title: 'Separable IVP with Sign Selection',
                    problemStatement: 'Solve dy/dx = x / y with initial condition y(0) = -3.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Separate variables: y dy = x dx.',
                      'Integrate both sides: ½y² = ½x² + C₁, or y² = x² + C.',
                      'Apply initial condition (0, -3): (-3)² = 0² + C gives C = 9.',
                      'Take the negative square root since y(0) = -3 < 0: y = -√(x² + 9).',
                    ],
                    finalAnswer: 'y = -√(x² + 9)',
                    keyTakeaway: 'Always select the square-root sign branch that satisfies the initial y₀ value.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-sep-01',
                    trapTitle: 'Adding C AFTER exponentiating ln|y|',
                    flawedReasoning: 'Integrate dy/y = dx as ln|y| = x, then write y = eˣ + C.',
                    correctConcept: 'The integration constant must appear inside the exponent: ln|y| = x + C₁ gives |y| = e^{C₁} eˣ = C eˣ.',
                    counterExample: 'y = eˣ + C fails the ODE because y\' = eˣ ≠ eˣ + C = y unless C = 0.',
                  },
                ],
                prerequisites: [{ id: 'concept-u-substitution', title: 'Integration by Substitution (Chain Rule Reversed)', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-logistic-growth', title: 'Logistic Differential Equation, Carrying Capacity & Inflection Point', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'Which function solves dy/dx = 2y with y(0) = 5?',
                  options: ['y = 5e^{2x}', 'y = e^{2x} + 4', 'y = 2e^{5x}', 'y = 5x² + 5'],
                  correctIndex: 0,
                  explanation: 'Separating gives ln|y| = 2x + C, so y = Ae^{2x}. Setting y(0) = 5 gives A = 5.',
                },
              },
              {
                id: 'concept-ap-logistic-growth',
                title: 'Logistic Differential Equation, Carrying Capacity & Inflection Point',
                summary:
                  'Read carrying capacity L, equilibrium stability, and the fastest-growth inflection point P = L/2 directly from dP/dt = kP(1 - P/L).',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'A population P(t) obeying dP/dt = kP(1 - P/L) (with k, L > 0) satisfies P(t) = L / (1 + A e^{-kt}), where A = (L - P₀)/P₀. The growth rate dP/dt is a downward parabola in P maximized at P = L/2.',
                intuitiveExplanation:
                  'When a population is tiny, growth acts exponential. As crowding approaches the carrying capacity L, scarcity brakes growth until it levels off—hitting maximum speed right at half the carrying capacity.',
                keyFormulas: [
                  {
                    label: 'Standard Logistic ODE & Inflection',
                    latex: '\\frac{dP}{dt} = kP\\!\\left(1 - \\frac{P}{L}\\right), \\quad \\text{max growth rate at } P = \\frac{L}{2}',
                    explanation: 'Factor out kP so the parenthesis reads (1 - P/L) to read off L directly.',
                  },
                ],
                keyObservations: [
                  'If dP/dt = 0.4P(500 - P), rewrite as 200P(1 - P/500) so L = 500 and max growth occurs at P = 250.',
                  'Regardless of whether 0 < P₀ < L or P₀ > L, lim_{t→∞} P(t) = L.',
                  'If P₀ > L, dP/dt < 0 so the population decays monotonically down toward L without crossing below L.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-log-01',
                    title: 'Extracting Carrying Capacity and Inflection Level',
                    problemStatement:
                      'A wolf population satisfies dP/dt = 0.002 P (800 - P) with P(0) = 120. Find the population level at which growth is fastest and lim_{t→∞} P(t).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Factor 800 from the second factor: dP/dt = 1.6 P (1 - P/800).',
                      'Read carrying capacity directly: L = 800.',
                      'Because dP/dt = 0.002 P(800 - P) is symmetric in P with roots 0 and 800, maximum growth occurs at the midpoint P = 800/2 = 400.',
                      'Since 0 < P(0) = 120 < 800, P(t) rises asymptotically to lim_{t→∞} P(t) = 800.',
                    ],
                    finalAnswer: 'Fastest growth at P = 400; limit = 800',
                    keyTakeaway: 'Read carrying capacity L from the nonzero equilibrium root where dP/dt = 0.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-log-01',
                    trapTitle: 'Confusing the inflection time t with the population P = L/2',
                    flawedReasoning: 'Answer t = L/2 when asked at what population value the curve changes concavity.',
                    correctConcept: 'd²P/dt² vanishes when P = L/2 (the dependent variable), NOT when time t = L/2.',
                    counterExample: 'If L = 1000 wolves, inflection occurs when the herd reaches 500 wolves, not in year 500.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-separable-odes', title: 'Separation of Variables & Initial-Value Constants', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-partial-fractions', title: 'Integration by Non-Repeated Linear Partial Fractions', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If dP/dt = 3P(1 - P/600) and P(0) = 900, what happens as t → ∞?',
                  options: [
                    'P(t) decreases toward 600',
                    'P(t) increases toward ∞',
                    'P(t) oscillates around 600',
                    'P(t) decreases toward 0',
                  ],
                  correctIndex: 0,
                  explanation: 'When P > 600, 1 - P/600 < 0, so dP/dt < 0 and P decreases monotonically toward the stable equilibrium L = 600.',
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
    chapterId: 'math-ch-ap-calc-series',
    examTracks: ['all', 'ap_stem', 'jee_advanced', 'stem_olympiad'],
    newChapter: {
      id: 'math-ch-ap-calc-series',
      title: 'AP Calculus BC: Infinite Series, Convergence & Power Series',
      sequenceOrder: 10,
      description:
        'Convergence diagnostics (Integral, Comparison, Ratio, Alternating), intervals of convergence, Taylor algebra, and remainder bounds.',
    },
    topics: [
      {
        id: 'math-topic-ap-convergence-tests',
        title: 'Series Convergence Tests & Conditional vs. Absolute Convergence',
        description:
          'Diagnosing Σ aₙ rigorously using the nth-term divergence test, p-series, comparison, integral, ratio, and alternating tests.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'math-sub-ap-series-tests',
            title: 'Positive-Term & Alternating Series Convergence',
            description: 'Choosing the right convergence criterion and separating absolute from conditional convergence.',
            concepts: [
              {
                id: 'concept-ap-integral-p-series',
                title: 'Integral Test, p-Series & Limit Comparison Test',
                summary:
                  'Compare positive infinite sums against continuous improper integrals and known benchmarks Σ 1/nᵖ.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem', 'jee_advanced'],
                formalDefinition:
                  'If f(x) is continuous, positive, and decreasing on [N, ∞) with aₙ = f(n), then Σ aₙ converges iff ∫_N^∞ f(x) dx converges. Consequently Σ 1/nᵖ converges iff p > 1. For positive series Σ aₙ, Σ bₙ, if lim_{n→∞} aₙ/bₙ = c with 0 < c < ∞, both series share the exact same convergence behavior.',
                intuitiveExplanation:
                  'An infinite series of positive shrinking terms acts like a staircase of unit-width rectangles under a curve: if the area under the smooth curve is finite, the staircase sum is finite too. Limit Comparison ignores noisy low-order terms and matches only the dominant asymptotic power of n.',
                keyFormulas: [
                  {
                    label: 'p-Series Threshold',
                    latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^p} \\text{ converges} \\iff p > 1',
                    explanation: 'At p = 1 (harmonic series), partial sums grow like ln(n) → ∞ and diverge.',
                  },
                  {
                    label: 'Limit Comparison Ratio',
                    latex: '\\lim_{n \\to \\infty} \\frac{a_n}{b_n} = c \\in (0, \\infty) \\implies \\sum a_n \\text{ and } \\sum b_n \\text{ converge/diverge together}',
                    explanation: 'Pick benchmark bₙ by keeping only the highest power of n in numerator and denominator.',
                  },
                ],
                keyObservations: [
                  'The nth-term test ONLY proves divergence when lim aₙ ≠ 0; lim aₙ = 0 NEVER proves convergence!',
                  'Verify positive, continuous, and decreasing conditions before invoking the Integral Test.',
                  'The Integral Test value ∫ f(x) dx is NOT equal to the sum Σ aₙ (it bounds the sum, it does not equal it).',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-ser-01',
                    title: 'Limit Comparison on a Radical Series',
                    problemStatement: 'Determine whether Σ_{n=1}^∞ (3n + 1) / √(n⁵ + 4n) converges or diverges.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Extract dominant powers: numerator behaves like n¹, denominator behaves like √(n⁵) = n^(5/2).',
                      'Choose benchmark bₙ = n / n^(5/2) = 1 / n^(3/2), a convergent p-series with p = 3/2 > 1.',
                      'Compute limit: lim_{n→∞} [(3n + 1)/√(n⁵ + 4n)] / [1 / n^(3/2)] = lim (3n^(5/2) + n^(3/2)) / √(n⁵ + 4n) = 3.',
                      'Since 0 < 3 < ∞ and Σ bₙ converges, Σ aₙ converges by the Limit Comparison Test.',
                    ],
                    finalAnswer: 'Converges (Limit Comparison with Σ 1/n^(3/2))',
                    keyTakeaway: 'Compare rational/radical series against bₙ formed by leading powers alone.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-ser-01',
                    trapTitle: 'Concluding convergence because terms go to zero',
                    flawedReasoning: 'Since lim_{n→∞} 1/n = 0, the harmonic series Σ 1/n must converge.',
                    correctConcept: 'lim aₙ = 0 is necessary for convergence, NEVER sufficient. Harmonic series diverges.',
                    counterExample: 'Σ 1/√n and Σ 1/n both satisfy lim aₙ = 0 yet both diverge to +∞.',
                  },
                ],
                prerequisites: [{ id: 'concept-asymptotic-growth', title: 'Asymptotic Growth & Dominant Terms', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-ratio-root-alternating', title: 'Ratio Test, Alternating Series Test & Absolute Convergence', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'Which of the following positive series CONVERGES?',
                  options: [
                    'Σ 1 / (n² + 1)',
                    'Σ 1 / n',
                    'Σ n / (2n + 5)',
                    'Σ 1 / √n',
                  ],
                  correctIndex: 0,
                  explanation: '1/(n² + 1) < 1/n², a convergent p-series (p = 2 > 1). The others diverge by nth-term or p ≤ 1.',
                },
              },
              {
                id: 'concept-ap-ratio-root-alternating',
                title: 'Ratio Test, Alternating Series Test & Absolute Convergence',
                summary:
                  'Classify series containing factorials/exponentials via L = lim |a_{n+1}/aₙ| and separate absolute from conditional convergence.',
                difficulty: 'hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'ap_stem', 'jee_advanced'],
                formalDefinition:
                  'Ratio Test: Let L = lim_{n→∞} |a_{n+1}/aₙ|. The series Σ aₙ converges absolutely if L < 1, diverges if L > 1 (or ∞), and the test is inconclusive if L = 1. Alternating Series Test (Leibniz): Σ (-1)ⁿ bₙ (bₙ ≥ 0) converges if bₙ is non-increasing and lim bₙ = 0. If Σ |aₙ| diverges while Σ aₙ converges, Σ aₙ converges conditionally.',
                intuitiveExplanation:
                  'Eventually every step multiplies terms by roughly L. If L < 1, terms shrink geometrically like rⁿ and must sum finitely; if L = 1, the Ratio Test cannot tell a slowly decaying 1/n² apart from 1/n.',
                keyFormulas: [
                  {
                    label: 'Ratio Test Threshold',
                    latex: 'L = \\lim_{n\\to\\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| \\implies \\begin{cases} L < 1 & \\text{converges absolutely} \\\\ L > 1 & \\text{diverges} \\\\ L = 1 & \\text{inconclusive} \\end{cases}',
                    explanation: 'Essential for factorials n!, powers xⁿ, and nⁿ terms.',
                  },
                ],
                keyObservations: [
                  'When L = 1 (as happens for all pure p-series), switch to Comparison, Integral, or Alternating Series tests.',
                  'Absolute convergence implies ordinary convergence, and allows arbitrary term rearrangement.',
                  'Classic conditional example: Alternating Harmonic Series Σ (-1)^{n-1}/n converges to ln 2 while Σ 1/n diverges.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-rat-01',
                    title: 'Factorial vs. Exponential Series via Ratio Test',
                    problemStatement: 'Test convergence of Σ_{n=1}^∞ (3ⁿ · n!) / (2n)!.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Form the ratio |a_{n+1}/aₙ| = [3^{n+1}(n+1)! / (2n+2)!] · [(2n)! / (3ⁿ n!)].',
                      'Simplify powers and factorials: 3(n + 1) / [(2n + 2)(2n + 1)] = 3 / [2(2n + 1)].',
                      'Take the limit as n → ∞: L = lim 3 / (4n + 2) = 0.',
                      'Since L = 0 < 1, the series converges absolutely.',
                    ],
                    finalAnswer: 'Converges absolutely (L = 0 < 1)',
                    keyTakeaway: 'Expand (2(n+1))! as (2n+2)(2n+1)(2n)! — do NOT write (2n+1)(2n)!.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-rat-01',
                    trapTitle: 'Replacing (2(n+1))! with (2n+1)!',
                    flawedReasoning: 'Increment n in (2n)! to get (2n + 1)!.',
                    correctConcept: 'Substituting n + 1 for n gives (2(n + 1))! = (2n + 2)! = (2n + 2)(2n + 1)(2n)!.',
                    counterExample: 'For n = 2, (2·3)! = 6! = 720, whereas (2·2 + 1)! = 5! = 120.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-integral-p-series', title: 'Integral Test, p-Series & Limit Comparison Test', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-radius-interval-convergence', title: 'Radius and Interval of Convergence with Endpoint Testing', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'The series Σ_{n=1}^∞ (-1)ⁿ / √n is best classified as:',
                  options: [
                    'Conditionally convergent',
                    'Absolutely convergent',
                    'Divergent by Alternating Series Test',
                    'Divergent by Ratio Test',
                  ],
                  correctIndex: 0,
                  explanation: '1/√n ↓ 0 so Σ (-1)ⁿ/√n converges by AST, whereas Σ |(-1)ⁿ/√n| = Σ 1/n^(1/2) diverges (p = 1/2 ≤ 1).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-ap-power-taylor',
        title: 'Power Series, Radius of Convergence & Taylor Error Bounds',
        description:
          'Finding the exact interval of convergence (including endpoints) and bounding Taylor approximation error.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-ap-power-taylor',
            title: 'Power Series Intervals & Remainders',
            description: 'Endpoint tests, term-by-term differentiation/integration, and Alternating vs. Lagrange error bounds.',
            concepts: [
              {
                id: 'concept-ap-radius-interval-convergence',
                title: 'Radius and Interval of Convergence with Endpoint Testing',
                summary:
                  'Determine R via the Ratio Test on |x - c|, then test both boundary values x = c ± R individually.',
                difficulty: 'hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'Every power series Σ aₙ(x - c)ⁿ converges on an interval centered at c with radius R ∈ [0, ∞]: absolutely for |x - c| < R, diverging for |x - c| > R. Endpoints x = c - R and x = c + R must each be tested separately using non-Ratio tests.',
                intuitiveExplanation:
                  'The Ratio Test finds an open safety zone (c - R, c + R) where powers shrink fast enough, and an outer explosion zone. On the exact fence |x - c| = R, the Ratio Test returns L = 1, so you must inspect each fence post directly.',
                keyFormulas: [
                  {
                    label: 'Radius via Ratio Limit',
                    latex: '\\lim_{n\\to\\infty} \\left|\\frac{a_{n+1}(x - c)^{n+1}}{a_n(x - c)^n}\\right| = |x - c| \\cdot \\rho < 1 \\implies R = \\frac{1}{\\rho}',
                    explanation: 'Term-by-term differentiation or integration preserves the interior radius R, though endpoint inclusion may change.',
                  },
                ],
                keyObservations: [
                  'Never forget to test BOTH endpoints x = c - R and x = c + R separately when 0 < R < ∞.',
                  'If R = ∞, the series converges on (-∞, ∞); if R = 0, it converges only at x = c.',
                  'Differentiating a power series often loses convergence at endpoints; integrating often gains it.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-pow-01',
                    title: 'Finding Radius and Endpoints of a Shifted Power Series',
                    problemStatement: 'Find the exact interval of convergence of Σ_{n=1}^∞ (x - 3)ⁿ / (n · 2ⁿ).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Apply Ratio Test: L = lim |(x - 3)^{n+1} / ((n+1)2^{n+1}) · (n·2ⁿ) / (x - 3)ⁿ| = |x - 3| / 2.',
                      'Require L < 1: |x - 3| < 2, so radius R = 2 and open interval is (1, 5).',
                      'Test left endpoint x = 1: Σ (-2)ⁿ / (n·2ⁿ) = Σ (-1)ⁿ / n, which converges (Alternating Harmonic).',
                      'Test right endpoint x = 5: Σ 2ⁿ / (n·2ⁿ) = Σ 1 / n, which diverges (Harmonic).',
                    ],
                    finalAnswer: '[1, 5) with R = 2',
                    keyTakeaway: 'Always substitute both x = c - R and x = c + R back into the original series.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-pow-01',
                    trapTitle: 'Reporting open interval (c - R, c + R) without endpoint checks',
                    flawedReasoning: 'Ratio test says L < 1 strictly, so endpoints can never converge.',
                    correctConcept: 'L < 1 is only where Ratio Test guarantees convergence; L = 1 at endpoints is inconclusive and very frequently converges on one or both ends.',
                    counterExample: 'Σ (x - 3)ⁿ/(n·2ⁿ) converges at x = 1 even though Ratio Test gives L = 1 there.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-ratio-root-alternating', title: 'Ratio Test, Alternating Series Test & Absolute Convergence', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-alternating-lagrange-error', title: 'Alternating Series Remainder & Maclaurin/Taylor Series Algebra', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If a power series centered at x = 2 converges at x = 6 and diverges at x = -3, which radius R is guaranteed?',
                  options: [
                    '4 ≤ R ≤ 5',
                    'R = 4 exactly',
                    'R = 5 exactly',
                    'R ≥ 5',
                  ],
                  correctIndex: 0,
                  explanation: 'Center c = 2. Convergence at x = 6 (distance 4) implies R ≥ 4; divergence at x = -3 (distance 5) implies R ≤ 5.',
                },
              },
              {
                id: 'concept-ap-alternating-lagrange-error',
                title: 'Alternating Series Remainder & Maclaurin/Taylor Series Algebra',
                summary:
                  'Build new Taylor expansions by substitution, integration, and multiplication, and bound truncation errors tightly.',
                difficulty: 'hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'For a convergent alternating series S = Σ (-1)ⁿ bₙ (bₙ decreasing to 0), the truncation error |S - Sₙ| is at most the magnitude of the first omitted term b_{n+1}. More generally, Taylor remainder satisfies |Rₙ(x)| ≤ [M · |x - c|^{n+1}] / (n + 1)! where M = max |f^{(n+1)}(t)| between c and x.',
                intuitiveExplanation:
                  'An alternating sum bounces past its final limit by smaller and smaller steps, so stopping after step n leaves you closer to the target than the size of the very next step. For general Taylor polynomials, the Lagrange bound asks for the worst-case (n + 1)-st derivative along the interval.',
                keyFormulas: [
                  {
                    label: 'Canonical Maclaurin Series Quartet',
                    latex: 'e^x = \\sum_{n=0}^\\infty \\frac{x^n}{n!},\\ \\sin x = \\sum_{n=0}^\\infty (-1)^n\\frac{x^{2n+1}}{(2n+1)!},\\ \\cos x = \\sum_{n=0}^\\infty (-1)^n\\frac{x^{2n}}{(2n)!},\\ \\frac{1}{1-x} = \\sum_{n=0}^\\infty x^n\\ (|x|<1)',
                    explanation: 'Build complex series like x·sin(x²) or arctan(x) by substituting and integrating these four.',
                  },
                ],
                keyObservations: [
                  'Wait before computing the (n + 1)! derivative if the series alternates with decreasing terms — the Alternating Series Error Bound is usually tighter and faster.',
                  'To find f^{(5)}(0) from a Maclaurin series, match the coefficient of x⁵ to f^{(5)}(0) / 5!.',
                  'Multiplying two polynomials up to degree k only needs cross-terms whose exponents add to ≤ k.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-tay-01',
                    title: 'Extracting Higher Derivatives & Bounding Error',
                    problemStatement:
                      'Approximate ∫₀^{0.5} cos(x²) dx using the first two nonzero Maclaurin terms, and bound the error.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Start from cos u = 1 - u²/2! + u⁴/4! - ··· and substitute u = x²: cos(x²) = 1 - x⁴/2 + x⁸/24 - ···.',
                      'Integrate term-by-term from 0 to 0.5: [x - x⁵/10 + x⁹/216 - ···]₀^{0.5}.',
                      'First two nonzero terms give 0.5 - (0.5)⁵/10 = 0.5 - 0.003125 = 0.496875.',
                      'Because the series is alternating with strictly decreasing terms tending to 0, |Error| ≤ (0.5)⁹ / 216 ≈ 9.0 × 10⁻⁶.',
                    ],
                    finalAnswer: '0.496875 with |Error| ≤ 1 / (512 · 216)',
                    keyTakeaway: 'Never differentiate cos(x²) eight times by product rule — substitute into cos u and integrate.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-tay-01',
                    trapTitle: 'Forgetting n! when reading f^{(n)}(0) from a Maclaurin coefficient',
                    flawedReasoning: 'If the x⁴ term of a Maclaurin series is 7x⁴, claim f^{(4)}(0) = 7.',
                    correctConcept: 'The xⁿ coefficient equals f^{(n)}(c) / n!, so f^{(4)}(0) = 7 · 4! = 168.',
                    counterExample: 'For eˣ = 1 + x + x²/2 + x³/6 + x⁴/24, coefficient of x⁴ is 1/24, yet f^{(4)}(0) = 1 = 24 · (1/24).',
                  },
                ],
                prerequisites: [{ id: 'concept-taylor-series-approx', title: 'Taylor & Maclaurin Series & Error Bounds', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-radius-interval-convergence', title: 'Radius and Interval of Convergence with Endpoint Testing', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'If the Maclaurin series of f(x) is 1 - 3x² + 5x⁴ - ···, what is f^{(4)}(0)?',
                  options: ['120', '5', '20', '24'],
                  correctIndex: 0,
                  explanation: 'The x⁴ coefficient is f^{(4)}(0)/4! = 5, so f^{(4)}(0) = 5 · 24 = 120.',
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
    chapterId: 'math-ch-ap-calc-param-polar',
    examTracks: ['all', 'ap_stem', 'jee_main'],
    newChapter: {
      id: 'math-ch-ap-calc-param-polar',
      title: 'AP Calculus BC: Parametric, Planar Vector & Polar Calculus',
      sequenceOrder: 11,
      description:
        'Parametric curvature and second derivatives, 2D motion vectors, polar tangents, and polar region areas.',
    },
    topics: [
      {
        id: 'math-topic-ap-parametric-vectors',
        title: 'Parametric Derivatives, Planar Motion Vectors & Speed',
        description:
          'Differentiating x(t), y(t) cleanly including d²y/dx² and integrating vector speed √(x\'² + y\'²).',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-ap-param-vec',
            title: 'Parametric Calculus & 2D Particle Motion',
            description: 'First/second parametric slopes, speed, acceleration, and distance traveled.',
            concepts: [
              {
                id: 'concept-ap-parametric-derivatives',
                title: 'First & Second Parametric Derivatives and Parametric Arc Length',
                summary:
                  'Compute dy/dx = (dy/dt)/(dx/dt), d²y/dx² = d/dt(dy/dx) / (dx/dt), and smooth parametric arc length.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'For smooth x(t), y(t) with x\'(t) ≠ 0, dy/dx = y\'(t)/x\'(t), the second derivative with respect to x is d²y/dx² = [d/dt(dy/dx)] / (dx/dt), and arc length over [t₁, t₂] is ∫_{t₁}^{t₂} √([x\'(t)]² + [y\'(t)]²) dt.',
                intuitiveExplanation:
                  'Notice how the chain rule divides by x\'(t) AGAIN when finding concavity d²y/dx²: differentiating dy/dx with respect to time gives the rate slope changes per second, so dividing by dx/dt converts it into rate per horizontal unit.',
                keyFormulas: [
                  {
                    label: 'Parametric Second Derivative',
                    latex: '\\frac{d^2y}{dx^2} = \\frac{\\frac{d}{dt}\\!\\left(\\frac{dy}{dx}\\right)}{\\frac{dx}{dt}}',
                    explanation: 'Never simply write y\'\'(t) / x\'\'(t) — that omits the quotient and chain rules.',
                  },
                ],
                keyObservations: [
                  'Horizontal tangents occur where dy/dt = 0 and dx/dt ≠ 0.',
                  'Vertical tangents occur where dx/dt = 0 and dy/dt ≠ 0.',
                  'Parametric arc length assumes the curve is traversed only once over [t₁, t₂].',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-par-01',
                    title: 'Parametric Slope and Concavity',
                    problemStatement: 'Given x(t) = t² + 1 and y(t) = t³ - 3t, find dy/dx and d²y/dx² at t = 2.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Compute time derivatives: dx/dt = 2t and dy/dt = 3t² - 3.',
                      'First derivative: dy/dx = (3t² - 3)/(2t). At t = 2, dy/dx = 9/4.',
                      'Differentiate dy/dx with respect to t: d/dt[(3/2)t - (3/2)t⁻¹] = 3/2 + 3/(2t²).',
                      'Divide by dx/dt = 2t: d²y/dx² = (3/2 + 3/8) / 4 = (15/8) / 4 = 15/32.',
                    ],
                    finalAnswer: 'dy/dx = 9/4, d²y/dx² = 15/32',
                    keyTakeaway: 'Compute d/dt(dy/dx) first, then divide once more by dx/dt.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-par-01',
                    trapTitle: 'Computing d²y/dx² as y\'\'(t) / x\'\'(t)',
                    flawedReasoning: 'Take second derivatives of y and x separately and divide them.',
                    correctConcept: 'By chain rule, d/dx(dy/dx) = [d/dt(dy/dx)] / (dx/dt), NOT y\'\'(t)/x\'\'(t).',
                    counterExample: 'At t = 2 above, y\'\'(2)/x\'\'(2) = 12/2 = 6, whereas true concavity is 15/32.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-arc-length-cartesian', title: 'Rectifiable Arc Length of Smooth Planar Curves', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-planar-vector-motion', title: 'Position, Velocity, Acceleration Vectors & Total Distance Traveled', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'For x(t) = 3t and y(t) = t³, what is d²y/dx² at t = 2?',
                  options: ['4/3', '4', '12', '2/3'],
                  correctIndex: 0,
                  explanation: 'dy/dx = 3t²/3 = t². Then d/dt(t²)/(dx/dt) = 2t/3. At t = 2, d²y/dx² = 4/3.',
                },
              },
              {
                id: 'concept-ap-planar-vector-motion',
                title: 'Position, Velocity, Acceleration Vectors & Total Distance Traveled',
                summary:
                  'Track particle kinematics r(t) = ⟨x(t), y(t)⟩, separate displacement from speed-integrated distance, and recover position from velocity.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'For position r(t) = ⟨x(t), y(t)⟩, velocity is v(t) = ⟨x\'(t), y\'(t)⟩, acceleration is a(t) = ⟨x\'\'(t), y\'\'(t)⟩, speed is ||v(t)|| = √([x\'(t)]² + [y\'(t)]²), and total distance over [t₁, t₂] is ∫_{t₁}^{t₂} ||v(t)|| dt.',
                intuitiveExplanation:
                  'Displacement cares only about start and finish vectors: r(t₂) - r(t₁). Total distance reads the particle\'s odometer by summing its non-negative scalar speed at every instant.',
                keyFormulas: [
                  {
                    label: 'Speed & Distance vs. Net Displacement',
                    latex: '\\text{Distance} = \\int_{t_1}^{t_2} \\sqrt{x\'(t)^2 + y\'(t)^2}\\,dt, \\quad \\mathbf{r}(t_2) = \\mathbf{r}(t_1) + \\int_{t_1}^{t_2} \\mathbf{v}(t)\\,dt',
                    explanation: 'Integrate components separately to recover position; integrate Euclidean norm to find distance.',
                  },
                ],
                keyObservations: [
                  'Velocity and acceleration are VECTORS (written ⟨vx, vy⟩), whereas speed is a non-negative SCALAR.',
                  'Speeding up vs. slowing down depends on the dot product v(t) · a(t), or comparing d/dt(||v(t)||) > 0.',
                  'Never forget to add initial position r(t₁) when reconstructing r(t₂) from velocity.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-vec-01',
                    title: 'Speed & Position Reconstruction',
                    problemStatement:
                      'A particle starts at (2, -1) at t = 0 with v(t) = ⟨3t², 4t⟩. Find its speed at t = 1 and its position at t = 2.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Velocity at t = 1 is v(1) = ⟨3, 4⟩, so speed = √(3² + 4²) = 5.',
                      'Integrate velocity components from 0 to 2: Δx = ∫₀² 3t² dt = [t³]₀² = 8; Δy = ∫₀² 4t dt = [2t²]₀² = 8.',
                      'Add initial coordinates: r(2) = ⟨2 + 8, -1 + 8⟩ = ⟨10, 7⟩.',
                    ],
                    finalAnswer: 'Speed at t = 1 is 5; position at t = 2 is (10, 7)',
                    keyTakeaway: 'Separate scalar speed ||v(t)|| from vector displacement ∫ v(t) dt.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-vec-01',
                    trapTitle: 'Reporting speed as the vector ⟨x\'(t), y\'(t)⟩',
                    flawedReasoning: 'Call v(t) the particle speed.',
                    correctConcept: 'Velocity is a vector ⟨x\'(t), y\'(t)⟩; speed is its Euclidean magnitude √(x\'² + y\'²).',
                    counterExample: 'For v(1) = ⟨3, 4⟩, speed is the scalar 5, not ⟨3, 4⟩.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-parametric-derivatives', title: 'First & Second Parametric Derivatives and Parametric Arc Length', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-kinematic-equations', title: 'The Four Kinematic Equations', subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'Which expression gives total distance traveled by a particle with v(t) = ⟨cos t, sin t⟩ over 0 ≤ t ≤ π?',
                  options: ['π', '2', '0', '⟨0, 2⟩'],
                  correctIndex: 0,
                  explanation: 'Speed = √(cos²t + sin²t) = 1 everywhere, so distance = ∫₀^π 1 dt = π.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-ap-polar-calculus',
        title: 'Polar Tangents, Polar Area & Intersecting Curves',
        description:
          'Translating r = f(θ) into Cartesian slopes, radial sector integrals ½∫ r² dθ, and overlap bounds.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'math-sub-ap-polar',
            title: 'Polar Geometry & Integrals',
            description: 'Tangent slopes at θ and sectors between polar graphs.',
            concepts: [
              {
                id: 'concept-ap-polar-tangent-slopes',
                title: 'Horizontal and Vertical Tangents on Polar Curves r = f(θ)',
                summary:
                  'Compute dy/dx on r = f(θ) via x = f(θ)cos θ and y = f(θ)sin θ rather than confusing dy/dx with dr/dθ.',
                difficulty: 'hard',
                estimatedMinutes: 16,
                xpReward: 34,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'Writing x(θ) = r(θ)cos θ and y(θ) = r(θ)sin θ gives dy/dx = [r\'(θ)sin θ + r(θ)cos θ] / [r\'(θ)cos θ - r(θ)sin θ] whenever the denominator is nonzero.',
                intuitiveExplanation:
                  'The quantity dr/dθ measures how fast the point moves away from the origin as the angle sweeps—NOT the xy-slope of the graph. To get xy-slope, convert r(θ) into parametric coordinates x(θ), y(θ) first.',
                keyFormulas: [
                  {
                    label: 'Polar-to-Cartesian Slope Formula',
                    latex: '\\frac{dy}{dx} = \\frac{\\frac{dy}{d\\theta}}{\\frac{dx}{d\\theta}} = \\frac{r\'(\\theta)\\sin\\theta + r(\\theta)\\cos\\theta}{r\'(\\theta)\\cos\\theta - r(\\theta)\\sin\\theta}',
                    explanation: 'Always derive x = r cos θ, y = r sin θ and use the product rule rather than memorizing blindly.',
                  },
                ],
                keyObservations: [
                  'If dr/dθ > 0, the curve is moving farther from the origin as θ increases (positive dr/dθ does not mean positive y\'!).',
                  'Vertical tangents occur where dx/dθ = 0 and dy/dθ ≠ 0.',
                  'When both dx/dθ = 0 and dy/dθ = 0 at the pole (r = 0), use L\'Hopital or note the tangent line matches θ = θ₀.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-pol-01',
                    title: 'Slope of a Cardioid at θ = π/2',
                    problemStatement: 'Find the Cartesian slope dy/dx of the cardioid r = 1 + cos θ at θ = π/2.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Write y(θ) = (1 + cos θ)sin θ = sin θ + sin θ cos θ and x(θ) = (1 + cos θ)cos θ = cos θ + cos²θ.',
                      'Differentiate at θ = π/2: dy/dθ = cos θ + cos²θ - sin²θ = 0 + 0 - 1 = -1.',
                      'Differentiate x(θ): dx/dθ = -sin θ - 2 cos θ sin θ = -1 - 0 = -1.',
                      'Divide: dy/dx = (-1) / (-1) = 1.',
                    ],
                    finalAnswer: '1',
                    keyTakeaway: 'Compute x\'(θ) and y\'(θ) directly from x = r cos θ and y = r sin θ.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-pol-01',
                    trapTitle: 'Reporting dr/dθ as the Cartesian tangent slope',
                    flawedReasoning: 'Differentiate r = 1 + cos θ to get slope -sin(π/2) = -1.',
                    correctConcept: 'dr/dθ = -1 describes how fast radius shrinks with angle; true Cartesian tangent slope dy/dx at θ = π/2 is +1.',
                    counterExample: 'On the circle r = 3, dr/dθ = 0 everywhere, yet the tangent slopes vary from -∞ to +∞.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-parametric-derivatives', title: 'First & Second Parametric Derivatives and Parametric Arc Length', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-polar-area-between', title: 'Area Enclosed by Single and Shared Polar Regions', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'What does dr/dθ > 0 tell you about a point on a polar curve r = f(θ) (with r > 0)?',
                  options: [
                    'Distance from the origin is increasing as θ increases',
                    'The graph has a positive Cartesian slope dy/dx > 0',
                    'The y-coordinate is increasing',
                    'The curve lies in Quadrant I',
                  ],
                  correctIndex: 0,
                  explanation: 'When r > 0 and dr/dθ > 0, the radial distance from the pole increases with θ.',
                },
              },
              {
                id: 'concept-ap-polar-area-between',
                title: 'Area Enclosed by Single and Shared Polar Regions',
                summary:
                  'Accumulate triangular sectors A = ½∫ r(θ)² dθ and split shared regions by identifying which curve bounds each angular wedge.',
                difficulty: 'hard',
                estimatedMinutes: 17,
                xpReward: 34,
                examTracks: ['all', 'ap_stem'],
                formalDefinition:
                  'Sweeping a ray from θ = α to θ = β over a non-self-overlapping sector with r = f(θ) sweeps area A = ½ ∫_α^β [f(θ)]² dθ. When bounded between outer r_out(θ) and inner r_in(θ) over the same angular sector, A = ½ ∫_α^β (r_out² - r_in²) dθ.',
                intuitiveExplanation:
                  'Instead of slicing a region into vertical rectangles dx, polar area sweeps fan-shaped pizza wedges of area ½ r² dθ from the origin.',
                keyFormulas: [
                  {
                    label: 'Polar Sector & Ring Area',
                    latex: 'A = \\frac{1}{2} \\int_{\\alpha}^{\\beta} \\big(r_{\\text{out}}(\\theta)^2 - r_{\\text{in}}(\\theta)^2\\big)\\,d\\theta',
                    explanation: 'Always check whether the region is shared (add consecutive wedges) vs. outer-minus-inner (subtract squares).',
                  },
                ],
                keyObservations: [
                  'The circle r = 2a cos θ traces once over [0, π] (NOT [0, 2π] — integrating to 2π doubles the area!).',
                  'For shared intersections of two curves (lens regions), split at the intersection angle θ*: one curve traces to the pole on [0, θ*] and the other traces on [θ*, π/2].',
                  'Always use ½(1 + cos 2θ) or ½(1 - cos 2θ) to integrate cos²θ and sin²θ.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-polarea-01',
                    title: 'Area Inside One Petal of a Rose Curve',
                    problemStatement: 'Find the area inside one petal of the rose r = 2 sin(2θ).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Find consecutive pole zeros: 2 sin(2θ) = 0 gives 2θ = 0, π so one first-quadrant petal spans θ ∈ [0, π/2].',
                      'Set up sector integral: A = ½ ∫₀^{π/2} (2 sin(2θ))² dθ = 2 ∫₀^{π/2} sin²(2θ) dθ.',
                      'Apply double-angle identity: 2 ∫₀^{π/2} ½(1 - cos(4θ)) dθ = [θ - ¼ sin(4θ)]₀^{π/2}.',
                      'Evaluate bounds: π/2 - 0 = π/2.',
                    ],
                    finalAnswer: 'π / 2',
                    keyTakeaway: 'Solve r(θ) = 0 to locate the exact angular boundaries of a single petal or loop.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-polarea-01',
                    trapTitle: 'Using (r_out - r_in)² or over-integrating a period',
                    flawedReasoning: 'Integrate r = cos θ from 0 to 2π to cover a full circle.',
                    correctConcept: 'r = cos θ finishes its full circle on [0, π], so [0, 2π] sweeps the circle twice. Also annular area uses r_out² - r_in², not (r_out - r_in)².',
                    counterExample: '½ ∫₀^{2π} cos²θ dθ = π/2, whereas the circle of diameter 1 has area π(1/2)² = π/4.',
                  },
                ],
                prerequisites: [{ id: 'concept-ap-polar-tangent-slopes', title: 'Horizontal and Vertical Tangents on Polar Curves r = f(θ)', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ap-volumes-disc-washer', title: 'Volumes of Revolution: Disc & Washer Methods', subjectId: 'math' }],
                miniCheckQuestion: {
                  prompt: 'What is the area enclosed by one full traversal of the circle r = 4 sin θ?',
                  options: ['4π', '16π', '8π', '2π'],
                  correctIndex: 0,
                  explanation: 'r = 4 sin θ is a circle of radius 2 centered at (0, 2), so area = π(2)² = 4π (equivalently ½ ∫₀^π 16 sin²θ dθ = 4π).',
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
// EXPANDING THE OTHER 6 SUBJECTS WITH NEW MULTI-TOPIC CHAPTERS
// =====================================================================

const OTHER_SUBJECT_ADDITIONS: ChapterAddition[] = [
  {
    subjectId: 'cs',
    chapterId: 'cs-ch-compilers-security',
    examTracks: ['all', 'ict_hackathon', 'ap_stem'],
    newChapter: {
      id: 'cs-ch-compilers-security',
      title: 'Compilers, Formal Grammars & Applied Cryptography',
      sequenceOrder: 8,
      description: 'Deterministic automata, context-free parsing, key exchange, and integrity verification.',
    },
    topics: [
      {
        id: 'cs-topic-automata-parsing',
        title: 'Finite Automata, Context-Free Grammars & Parsing',
        description: 'Formal language recognition from regular expressions to recursive-descent parsers.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'cs-sub-automata-cfg',
            title: 'DFAs & Context-Free Derivations',
            description: 'State-transition modeling and grammar ambiguity elimination.',
            concepts: [
              {
                id: 'concept-cs-dfa-regex',
                title: 'Deterministic Finite Automata & Regular Language Closure',
                summary: 'Model O(n) lexical scanners using states and transition functions δ: Q × Σ → Q.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'A DFA is a 5-tuple (Q, Σ, δ, q₀, F) with finite states Q, alphabet Σ, total transition function δ: Q × Σ → Q, start state q₀, and accepting states F. Regular languages are closed under union, intersection, complement, concatenation, and Kleene star.',
                intuitiveExplanation:
                  'A DFA reads a string one character at a time using fixed finite memory—only remembering which state it stands in right now—never needing a stack to count nested symbols.',
                keyFormulas: [
                  {
                    label: 'Pumping Lemma Bound',
                    latex: '|w| \\ge p \\implies w = xyz,\\ |xy| \\le p,\\ |y| \\ge 1,\\ xy^i z \\in L',
                    explanation: 'Any string longer than the state count p must revisit a state, forcing a repeatable loop y.',
                  },
                ],
                keyObservations: [
                  'Regular languages cannot count arbitrarily nested brackets {aⁿbⁿ} because finite states cannot store unbounded counts n.',
                  'Lexers in real compilers convert regex tokens into minimized DFAs for single-pass O(n) scanning.',
                ],
                workedExamples: [
                  {
                    id: 'we-cs-dfa-01',
                    title: 'Designing a Divisibility-by-3 Binary DFA',
                    problemStatement: 'How many states are required in a minimal DFA accepting binary strings divisible by 3?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Track the current value modulo 3: remainders {0, 1, 2}.',
                      'Appending bit b maps remainder r to (2r + b) mod 3.',
                      'Make remainder 0 both the start state and unique accepting state.',
                    ],
                    finalAnswer: '3 states',
                    keyTakeaway: 'Choose DFA states to represent the minimal equivalence classes of past prefix information.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cs-dfa-01',
                    trapTitle: 'Attempting to recognize balanced parentheses with regex',
                    flawedReasoning: 'Use nested regex quantifiers to validate arbitrary bracket nesting.',
                    correctConcept: 'Balanced parentheses form a context-free language requiring a stack (pushdown automaton), outside regular languages.',
                    counterExample: 'No finite DFA with k states can distinguish k + 1 open parens from k + 2 open parens.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-cs-cfg-ll-parsing', title: 'Context-Free Grammars, Ambiguity & Recursive-Descent Parsing', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'Which language CANNOT be recognized by any DFA?',
                  options: [
                    '{aⁿbⁿ | n ≥ 0}',
                    'Binary strings ending in 01',
                    'Decimal integers divisible by 5',
                    'Strings over {a, b} containing an even number of a\'s',
                  ],
                  correctIndex: 0,
                  explanation: '{aⁿbⁿ} requires unbounded counting memory, violating finite-state constraints.',
                },
              },
              {
                id: 'concept-cs-cfg-ll-parsing',
                title: 'Context-Free Grammars, Ambiguity & Recursive-Descent Parsing',
                summary: 'Eliminate left recursion and operator ambiguity so predictive top-down parsers build deterministic ASTs.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 30,
                formalDefinition:
                  'A Context-Free Grammar G = (V, Σ, R, S) is ambiguous if some string admits two distinct parse trees. Left recursion A → Aα | β breaks top-down LL(k) descent and rewrites as A → βA\', A\' → αA\' | ε.',
                intuitiveExplanation:
                  'Ambiguous grammars make expressions like 2 + 3 * 4 have two contradictory trees. Encoding precedence in separate grammar layers and factoring out left recursion lets a simple recursive function parse deterministically.',
                keyFormulas: [
                  {
                    label: 'Left-Recursion Elimination',
                    latex: 'A \\to A\\alpha \\mid \\beta \\quad\\Longrightarrow\\quad A \\to \\beta A\',\\ \\ A\' \\to \\alpha A\' \\mid \\varepsilon',
                    explanation: 'Prevents infinite self-call loops in recursive-descent parsers.',
                  },
                ],
                keyObservations: [
                  'Lower precedence operators sit closer to the grammar start symbol so higher precedence binds tighter at leaves.',
                  'Left-recursive rules parse left-associatively; right-recursive rules parse right-associatively (e.g., exponentiation).',
                ],
                workedExamples: [
                  {
                    id: 'we-cs-cfg-01',
                    title: 'Eliminating Immediate Left Recursion',
                    problemStatement: 'Rewrite E → E + T | T into a right-recursive form usable by LL(1) descent.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Identify α = "+ T" and β = "T".',
                      'Introduce fresh nonterminal E\': E → T E\'.',
                      'Set E\' → + T E\' | ε.',
                    ],
                    finalAnswer: 'E → T E\', E\' → + T E\' | ε',
                    keyTakeaway: 'Eliminating left recursion preserves the exact generated language while preventing stack overflow.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cs-cfg-01',
                    trapTitle: 'Leaving dangling else or flat E → E + E | E * E rules unstratified',
                    flawedReasoning: 'Write one flat nonterminal for all binary operators and patch trees later.',
                    correctConcept: 'Unstratified E → E op E produces multiple parse trees for 1 + 2 * 3 unless precedence rules or stratified nonterminals enforce order.',
                    counterExample: 'E → E + E | E * E parses 1 + 2 * 3 as both (1 + 2) * 3 and 1 + (2 * 3).',
                  },
                ],
                prerequisites: [{ id: 'concept-cs-dfa-regex', title: 'Deterministic Finite Automata & Regular Language Closure', subjectId: 'cs' }],
                relatedConcepts: [{ id: 'concept-recursion-basics', title: 'Recursion & the Call Stack', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'Why does immediate left recursion A → Aα | β crash a naive recursive-descent parser?',
                  options: [
                    'Function parseA() immediately calls parseA() without consuming any input token',
                    'It requires two stacks instead of one',
                    'It changes context-free languages into regular languages',
                    'It makes the AST height logarithmic',
                  ],
                  correctIndex: 0,
                  explanation: 'Without advancing the lookahead token before recursing, parseA() enters infinite recursion.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'cs-topic-crypto-primitives',
        title: 'Public-Key Cryptography, Signatures & Hash Invariants',
        description: 'Trapdoor modular arithmetic, key exchange, and tamper-evident data structures.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'cs-sub-crypto-core',
            title: 'Asymmetric Keys & Integrity Proofs',
            description: 'Diffie-Hellman, RSA, HMAC, and Merkle verification paths.',
            concepts: [
              {
                id: 'concept-cs-rsa-diffie-hellman',
                title: 'Diffie-Hellman Key Exchange & RSA Modular Exponentiation',
                summary:
                  'Establish shared secrets over public channels and invert encryption exponents using Euler\'s totient φ(n).',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                formalDefinition:
                  'In RSA with n = pq and φ(n) = (p - 1)(q - 1), public e (gcd(e, φ(n)) = 1) and private d satisfy ed ≡ 1 (mod φ(n)), guaranteeing (mᵉ)^d ≡ m (mod n). In Diffie-Hellman, Alice and Bob compute g^{ab} mod p from gᵃ mod p and gᵇ mod p.',
                intuitiveExplanation:
                  'Multiplying two giant primes or raising g to a power mod p is fast, while reversing modular exponentiation (discrete log) or factoring n is computationally intractable.',
                keyFormulas: [
                  {
                    label: 'RSA Private Key Congruence',
                    latex: 'e \\cdot d \\equiv 1 \\pmod{(p - 1)(q - 1)}',
                    explanation: 'Compute d from e using the Extended Euclidean Algorithm modulo φ(n), NOT mod n.',
                  },
                ],
                keyObservations: [
                  'Textbook RSA without OAEP padding is deterministic and malleable — production TLS/RSA always uses randomized padding.',
                  'Diffie-Hellman alone does not authenticate identities; it requires digital signatures to defeat man-in-the-middle attacks.',
                ],
                workedExamples: [
                  {
                    id: 'we-cs-rsa-01',
                    title: 'Small-Prime RSA Key Derivation',
                    problemStatement: 'Given p = 5, q = 11, and public exponent e = 3, find the private decryption key d.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute modulus n = 5 · 11 = 55.',
                      'Compute totient φ(n) = (5 - 1)(11 - 1) = 4 · 10 = 40.',
                      'Solve 3d ≡ 1 (mod 40): 3 · 27 = 81 = 2(40) + 1 ≡ 1 (mod 40), so d = 27.',
                    ],
                    finalAnswer: 'd = 27',
                    keyTakeaway: 'Invert e modulo φ(n) = (p - 1)(q - 1), never modulo n.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cs-rsa-01',
                    trapTitle: 'Computing e⁻¹ modulo n instead of modulo φ(n)',
                    flawedReasoning: 'Solve ed ≡ 1 (mod 55) directly.',
                    correctConcept: 'Euler\'s Theorem works on exponents modulo φ(n) = (p - 1)(q - 1), not modulo n.',
                    counterExample: 'For p = 5, q = 11, e = 3: inverse mod 55 is 37, which fails to decrypt 2³ = 8 since 8³⁷ mod 55 = 28 ≠ 2.',
                  },
                ],
                prerequisites: [{ id: 'concept-gcd-euclidean', title: 'Euclidean Algorithm, Bézout\'s Identity & Modular Inverses', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-cs-hmac-merkle', title: 'Cryptographic Hash Properties, HMAC & Merkle Trees', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'For RSA primes p = 3, q = 11 and e = 7, what is φ(n)?',
                  options: ['20', '33', '32', '24'],
                  correctIndex: 0,
                  explanation: 'φ(n) = (3 - 1)(11 - 1) = 2 · 10 = 20.',
                },
              },
              {
                id: 'concept-cs-hmac-merkle',
                title: 'Cryptographic Hash Properties, HMAC & Merkle Trees',
                summary:
                  'Authenticate messages against tampering with keyed HMACs and prove set inclusion in O(log n) hashes via Merkle trees.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                formalDefinition:
                  'A cryptographic hash H requires preimage resistance, second-preimage resistance, and collision resistance. HMAC(K, m) = H((K\' ⊕ opad) || H((K\' ⊕ ipad) || m)) prevents length-extension attacks. A Merkle tree hashes pairs upward into a single root digest.',
                intuitiveExplanation:
                  'A naive hash H(secret || msg) lets attackers append extra bytes because Merkle-Damgård hashes leak internal state; wrapping the hash twice in HMAC seals that seam completely.',
                keyFormulas: [
                  {
                    label: 'Merkle Inclusion Proof Size',
                    latex: '\\text{Sibling hashes needed} = \\lceil \\log_2 N \\rceil',
                    explanation: 'Verifying one transaction among 1,048,576 items requires only 20 sibling hashes.',
                  },
                ],
                keyObservations: [
                  'Never verify HMAC tokens with non-constant-time string == equality; use timing-safe comparison.',
                  'Collision attacks take ~2^{b/2} operations by the Birthday Paradox (128 bits of security requires a 256-bit digest).',
                ],
                workedExamples: [
                  {
                    id: 'we-cs-merkle-01',
                    title: 'Birthday Bound for Hash Collisions',
                    problemStatement: 'Approximately how many hashes does a birthday collision attack need on a 256-bit digest?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Full brute-force preimage search requires ~2²⁵⁶ evaluations.',
                      'By the Birthday Paradox, collisions between two distinct inputs appear around √(2^{256}) = 2^{128} trials.',
                    ],
                    finalAnswer: '2^{128} operations',
                    keyTakeaway: 'Digest length must be double the target collision-security bit level.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-cs-merkle-01',
                    trapTitle: 'Authenticating with bare SHA256(secret + message)',
                    flawedReasoning: 'Since the attacker does not know secret, they cannot forge SHA256(secret + message + extra).',
                    correctConcept: 'Merkle-Damgård hashes (SHA-256, SHA-1) process blocks sequentially, letting attackers extend message without knowing secret.',
                    counterExample: 'Always use HMAC-SHA256 rather than concatenating secret || message.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-jwt-cache-invalidation', title: 'Stateless JWT Auth & Cache-Aside Strategy', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'How many sibling hashes are needed to prove membership of one leaf in a balanced Merkle tree of 1,024 leaves?',
                  options: ['10', '512', '1024', '32'],
                  correctIndex: 0,
                  explanation: 'A balanced binary tree of 1,024 = 2¹⁰ leaves has depth 10, requiring 10 sibling hashes.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'physics',
    chapterId: 'phys-ch-circuits-ac',
    examTracks: ['all', 'ap_stem', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'phys-ch-circuits-ac',
      title: 'DC/AC Circuits, RC Transients & Geometric Optics',
      sequenceOrder: 8,
      description: 'Kirchhoff conservation rules, capacitor charging dynamics, thin-lens imaging, and wave refraction.',
    },
    topics: [
      {
        id: 'phys-topic-kirchhoff-rc',
        title: "Kirchhoff's Laws, RC Transients & Time Constants",
        description: 'Solving multi-loop circuits and exponential transient charging/discharging curves.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-circuits-rc',
            title: 'Loop/Junction Conservation & RC Decay',
            description: 'Applying charge and energy conservation to resistive and capacitive networks.',
            concepts: [
              {
                id: 'concept-phys-kirchhoff-loops',
                title: 'Kirchhoff Junction & Loop Rules for Multi-Mesh Circuits',
                summary: 'Solve arbitrary DC resistor networks via charge conservation (Σ I = 0) and potential single-valuedness (Σ ΔV = 0).',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'Junction Rule: At any circuit node, net current inflow equals outflow (Σ I_in = Σ I_out), expressing charge conservation. Loop Rule: Around any closed loop, algebraic sum of potential drops and rises vanishes (Σ ΔV = 0), expressing conservative electrostatic potential.',
                intuitiveExplanation:
                  'Electric charge cannot pile up inside a wire junction, and climbing and descending voltage hills around any closed walk must return you to the exact starting elevation.',
                keyFormulas: [
                  {
                    label: 'Loop Potential Conservation',
                    latex: '\\sum_{\\text{closed loop}} \\Delta V_i = 0',
                    explanation: 'Crossing a resistor in the assumed current direction contributes ΔV = -I·R.',
                  },
                ],
                keyObservations: [
                  'If a solved branch current turns out negative, the true physical current simply flows opposite to your initial arrow.',
                  'Parallel branches share identical potential difference; series elements carry identical current.',
                ],
                workedExamples: [
                  {
                    id: 'we-phys-kir-01',
                    title: 'Current Split in a Parallel Pair',
                    problemStatement: 'A 12 V ideal battery feeds parallel resistors R₁ = 4 Ω and R₂ = 6 Ω in series with R₃ = 1.6 Ω. Find total battery current.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Combine parallel branch: R_p = (4 · 6)/(4 + 6) = 24/10 = 2.4 Ω.',
                      'Add series resistor: R_total = 2.4 + 1.6 = 4.0 Ω.',
                      'Apply Ohm\'s law / Loop rule: I = 12 V / 4.0 Ω = 3.0 A.',
                    ],
                    finalAnswer: '3.0 A',
                    keyTakeaway: 'Collapse pure series/parallel groups first before writing full mesh equations.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-phys-kir-01',
                    trapTitle: 'Adding parallel resistors directly instead of reciprocals',
                    flawedReasoning: 'Two 4 Ω resistors in parallel yield 8 Ω.',
                    correctConcept: 'Adding a parallel pathway lowers total resistance: 1/R_eq = 1/4 + 1/4 gives R_eq = 2 Ω.',
                    counterExample: 'Total resistance of parallel branches is always strictly less than the smallest individual branch.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-phys-rc-transients', title: 'Exponential Charging & Discharging in RC Circuits', subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'Two resistors of 6 Ω and 3 Ω are connected in parallel across 6 V. What current flows through the 3 Ω resistor?',
                  options: ['2.0 A', '1.0 A', '3.0 A', '0.67 A'],
                  correctIndex: 0,
                  explanation: 'Each parallel branch sees the full 6 V drop, so I = 6 V / 3 Ω = 2.0 A.',
                },
              },
              {
                id: 'concept-phys-rc-transients',
                title: 'Exponential Charging & Discharging in RC Circuits',
                summary: 'Predict capacitor voltage, current decay, and stored energy ½CV² across time constant τ = RC.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 30,
                formalDefinition:
                  'Charging an uncharged capacitor C through R from EMF ε obeys V_C(t) = ε(1 - e^{-t/τ}) and I(t) = (ε/R)e^{-t/τ} with time constant τ = R_eq C. Discharging obeys Q(t) = Q₀ e^{-t/τ}.',
                intuitiveExplanation:
                  'At t = 0 an empty capacitor acts like a short-circuit wire (0 V across plates); after many time constants t ≫ τ, it fills completely and blocks DC current like an open switch.',
                keyFormulas: [
                  {
                    label: 'RC Time Constant & Stored Energy',
                    latex: '\\tau = R_{\\text{eq}} C, \\qquad U_C = \\frac{1}{2} C V_C^2',
                    explanation: 'One time constant brings charging to 1 - 1/e ≈ 63.2% of steady-state voltage.',
                  },
                ],
                keyObservations: [
                  'Capacitor voltage cannot jump instantaneously unless infinite current flows.',
                  'Half of the energy supplied by the battery during constant-EMF charging is dissipated as heat in the resistor.',
                ],
                workedExamples: [
                  {
                    id: 'we-phys-rc-01',
                    title: 'Steady-State Energy in a Two-Resistor RC Branch',
                    problemStatement: 'A 10 V battery connects to R₁ = 2 Ω in series with a parallel pair (R₂ = 3 Ω and C = 4 μF). Find steady-state charge on C.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'At steady state (t → ∞), capacitor branch draws zero current, so all current flows through R₁ and R₂ in series.',
                      'Current I = 10 V / (2 Ω + 3 Ω) = 2.0 A.',
                      'Voltage across R₂ (and thus across C) is V_C = I · R₂ = 2.0 · 3 = 6.0 V.',
                      'Charge Q = C V_C = 4 μF · 6.0 V = 24 μC.',
                    ],
                    finalAnswer: '24 μC',
                    keyTakeaway: 'At steady state, replace capacitors by open circuits and evaluate node voltage.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-phys-rc-01',
                    trapTitle: 'Assuming capacitor reaches full battery EMF when a parallel resistor draws current',
                    flawedReasoning: 'At steady state, V_C always equals battery EMF ε.',
                    correctConcept: 'V_C equals the potential across its own parallel branch nodes, acting as a voltage divider if another resistor carries current.',
                    counterExample: 'Above, V_C = 6 V, not 10 V, because 4 V drops across R₁.',
                  },
                ],
                prerequisites: [{ id: 'concept-phys-kirchhoff-loops', title: 'Kirchhoff Junction & Loop Rules for Multi-Mesh Circuits', subjectId: 'physics' }],
                relatedConcepts: [{ id: 'concept-faraday-induction', title: "Faraday's Law of Induction & Lenz's Rule", subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'Immediately after closing the switch on an uncharged RC charging circuit with EMF 12 V and R = 4 Ω, what is the initial current?',
                  options: ['3.0 A', '0 A', '1.5 A', 'Depends on C'],
                  correctIndex: 0,
                  explanation: 'At t = 0⁺, uncharged C has V_C = 0 V, so full 12 V drops across R: I(0⁺) = 12/4 = 3.0 A.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-mirrors-lenses',
        title: 'Thin Lenses, Spherical Mirrors & Optical Magnification',
        description: 'Ray geometry, sign conventions, refraction index laws, and critical internal reflection.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-optics',
            title: 'Geometric Imaging & Snell Refraction',
            description: 'Gaussian imaging formula and critical angles at optical boundaries.',
            concepts: [
              {
                id: 'concept-phys-thin-lens-equation',
                title: 'Thin-Lens Equation, Sign Conventions & Real/Virtual Images',
                summary: 'Predict image position dᵢ and magnification m = -dᵢ/dₒ using consistent Cartesian or RHR sign conventions.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'In the paraxial thin-lens approximation, 1/f = 1/dₒ + 1/dᵢ with transverse magnification m = hᵢ/hₒ = -dᵢ/dₒ. Converging elements carry f > 0; diverging elements carry f < 0; positive dᵢ denotes a real inverted image on the transmitted side.',
                intuitiveExplanation:
                  'A converging lens bends parallel light inward toward a real focal point; placing an object inside the focal length prevents rays from crossing in front, producing a magnified upright virtual image.',
                keyFormulas: [
                  {
                    label: 'Thin-Lens & Magnification Pair',
                    latex: '\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}, \\qquad m = -\\frac{d_i}{d_o}',
                    explanation: 'Always add fractions cleanly — never invert individual terms prematurely.',
                  },
                ],
                keyObservations: [
                  'Single-lens real images (dᵢ > 0) are always inverted (m < 0); upright single-lens images (m > 0) are always virtual (dᵢ < 0).',
                  'Magnification |m| > 1 enlarges the image; |m| < 1 diminishes it.',
                ],
                workedExamples: [
                  {
                    id: 'we-phys-lens-01',
                    title: 'Converging Lens Image Placement',
                    problemStatement: 'An object sits 30 cm from a converging lens of focal length f = +10 cm. Find dᵢ and magnification m.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Use 1/dᵢ = 1/f - 1/dₒ = 1/10 - 1/30 = 2/30 = 1/15.',
                      'Invert cleanly: dᵢ = +15 cm (real image).',
                      'Compute magnification: m = -dᵢ/dₒ = -15/30 = -0.5 (inverted, half-size).',
                    ],
                    finalAnswer: 'dᵢ = +15 cm, m = -0.5',
                    keyTakeaway: 'Compute 1/dᵢ as a single fraction before taking its reciprocal.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-phys-lens-01',
                    trapTitle: 'Using f > 0 for diverging lenses or forgetting to invert 1/dᵢ',
                    flawedReasoning: 'Solve 1/10 - 1/30 directly as dᵢ = 10 - 30 = -20 cm.',
                    correctConcept: '1/(A - B) ≠ 1/A - 1/B; combine fractions over a common denominator first.',
                    counterExample: 'Above, 1/10 - 1/30 = 1/15 gives dᵢ = +15 cm, not -20 cm.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-phys-snell-total-internal', title: "Snell's Law Refraction & Total Internal Reflection", subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'A diverging lens (f = -20 cm) forms what type of image for any real object in front of it?',
                  options: [
                    'Virtual, upright, and diminished',
                    'Real, inverted, and enlarged',
                    'Real, upright, and diminished',
                    'Virtual, inverted, and enlarged',
                  ],
                  correctIndex: 0,
                  explanation: 'With f < 0 and dₒ > 0, 1/dᵢ = 1/f - 1/dₒ < 0 with |dᵢ| < dₒ, yielding 0 < m < 1 (virtual, upright, smaller).',
                },
              },
              {
                id: 'concept-phys-snell-total-internal',
                title: "Snell's Law Refraction & Total Internal Reflection",
                summary: 'Determine refracted ray angles via n₁ sin θ₁ = n₂ sin θ₂ and locate the critical angle sin θ_c = n₂/n₁.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 24,
                formalDefinition:
                  'Wavefronts crossing an interface satisfy n₁ sin θ₁ = n₂ sin θ₂ where angles are measured from the surface NORMAL. When n₁ > n₂ and sin θ₁ ≥ n₂/n₁, no real refracted angle exists and 100% of incident intensity undergoes Total Internal Reflection.',
                intuitiveExplanation:
                  'As light speeds up entering a lower-index medium, it bends away from the normal. Beyond the critical incidence angle, the refracted beam tries to skim past 90° and gets trapped entirely inside the denser medium.',
                keyFormulas: [
                  {
                    label: "Snell's Law & Critical Angle",
                    latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2, \\qquad \\sin\\theta_c = \\frac{n_2}{n_1} \\ (n_1 > n_2)',
                    explanation: 'Total internal reflection is impossible when entering a higher-index medium (n₁ < n₂).',
                  },
                ],
                keyObservations: [
                  'Measure θ₁ and θ₂ from the surface perpendicular (normal), NOT from the glass surface.',
                  'Frequency remains unchanged across boundaries; wavelength scales as λ₂ = λ₁(n₁/n₂).',
                ],
                workedExamples: [
                  {
                    id: 'we-phys-snell-01',
                    title: 'Critical Angle of Crown Glass to Air',
                    problemStatement: 'Find the critical angle for light leaving glass (n₁ = 1.50) into air (n₂ = 1.00).',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Verify dense-to-rare condition: n₁ = 1.50 > n₂ = 1.00.',
                      'Apply sin θ_c = n₂ / n₁ = 1.00 / 1.50 = 2/3 ≈ 0.6667.',
                      'Invert: θ_c = arcsin(2/3) ≈ 41.8°.',
                    ],
                    finalAnswer: '≈ 41.8°',
                    keyTakeaway: 'Always put the smaller refractive index in the numerator so sin θ_c ≤ 1.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-phys-snell-01',
                    trapTitle: 'Measuring angles from the interface tangent instead of the normal',
                    flawedReasoning: 'Plug a 30° grazing angle to the glass surface straight into n₁ sin 30°.',
                    correctConcept: 'If the ray makes 30° with the surface, the incidence angle from the normal is 90° - 30° = 60°.',
                    counterExample: 'Normal incidence means θ = 0° (straight through), not θ = 90°.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-phys-thin-lens-equation', title: 'Thin-Lens Equation, Sign Conventions & Real/Virtual Images', subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'When light passes from air (n = 1.0) into water (n = 1.33) at 40° from the normal, how does it bend?',
                  options: [
                    'Toward the normal (θ₂ < 40°)',
                    'Away from the normal (θ₂ > 40°)',
                    'Undergoes total internal reflection',
                    'Continues straight at 40°',
                  ],
                  correctIndex: 0,
                  explanation: 'Higher refractive index lowers speed and sin θ₂ = (1.0/1.33)sin 40° < sin 40°, bending closer to the normal.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'chemistry',
    chapterId: 'chem-ch-spectroscopy-quantum',
    examTracks: ['all', 'ap_stem', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'chem-ch-spectroscopy-quantum',
      title: 'Spectroscopy & Carbonyl Organic Synthesis',
      sequenceOrder: 8,
      description: 'IR & NMR structure determination alongside Grignard and enolate carbonyl reactions.',
    },
    topics: [
      {
        id: 'chem-topic-ir-nmr-spec',
        title: 'Infrared (IR) & ¹H-NMR Structural Elucidation',
        description: 'Identifying functional groups via vibrational wavenumbers and proton splitting trees.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-spec',
            title: 'Vibrational IR & Spin-Spin NMR',
            description: 'Hooke-model IR absorption and (n + 1) NMR multiplicity.',
            concepts: [
              {
                id: 'concept-chem-ir-wavenumbers',
                title: 'Characteristic IR Stretching Frequencies & Bond Force Constants',
                summary: 'Diagnose O–H, C=O, C≡N, and N–H bonds from wavenumber ν̄ ∝ √(k/μ) and band broadness.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'A chemical bond absorbs infrared radiation matching its harmonic stretching wavenumber ν̄ = (1 / 2πc)√(k / μ), increasing with bond force constant k (triple > double > single) and decreasing with reduced mass μ = m₁m₂/(m₁ + m₂).',
                intuitiveExplanation:
                  'Stiff springs (triple bonds) and featherweight weights (hydrogen atoms) vibrate fastest—that is why C–H, O–H, and N–H appear near 3000–3500 cm⁻¹ while heavier C=O carbonyls sit sharply near 1715 cm⁻¹.',
                keyFormulas: [
                  {
                    label: 'Harmonic Stretching Wavenumber',
                    latex: '\\tilde{\\nu} = \\frac{1}{2\\pi c}\\sqrt{\\frac{k}{\\mu}}',
                    explanation: 'Higher bond order raises k; deuterium (²H) raises μ and lowers ν̄.',
                  },
                ],
                keyObservations: [
                  'Alcohol O–H shows a broad, rounded absorption near 3200–3550 cm⁻¹ due to hydrogen bonding.',
                  'Carbonyl C=O produces a sharp, intense peak around 1680–1750 cm⁻¹; conjugation lowers this value.',
                ],
                workedExamples: [
                  {
                    id: 'we-chem-ir-01',
                    title: 'Isotope Shift on Replacing C–H with C–D',
                    problemStatement: 'Predict whether a C–D stretch appears at higher or lower wavenumber than C–H (3000 cm⁻¹).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Deuterium has mass ~2 amu vs. ~1 amu for protium, doubling reduced mass μ roughly from 12/13 to 24/14.',
                      'Since ν̄ ∝ 1/√μ, the C–D wavenumber drops by a factor near √2 to ~2100–2200 cm⁻¹.',
                    ],
                    finalAnswer: 'Lower wavenumber (~2200 cm⁻¹)',
                    keyTakeaway: 'Heavier isotopes vibrate slower because k stays identical while μ increases.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-chem-ir-01',
                    trapTitle: 'Confusing sp C–H stretches with O–H alcohol bands',
                    flawedReasoning: 'Every peak around 3300 cm⁻¹ must be an alcohol O–H group.',
                    correctConcept: 'A terminal alkyne ≡C–H stretch is sharp and narrow near 3300 cm⁻¹, whereas hydrogen-bonded O–H is wide and U-shaped.',
                    counterExample: '1-hexyne has a sharp 3300 cm⁻¹ spike without any oxygen atom.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-chem-nmr-splitting', title: 'Proton NMR Chemical Shifts, Integration & (n + 1) Splitting', subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'Which bond stretches at the highest wavenumber (cm⁻¹) among C–C, C=C, and C≡C?',
                  options: ['C≡C (~2150 cm⁻¹)', 'C=C (~1650 cm⁻¹)', 'C–C (~1100 cm⁻¹)', 'All absorb at 1715 cm⁻¹'],
                  correctIndex: 0,
                  explanation: 'Triple bonds have the highest force constant k among carbon-carbon bonds, raising ν̄.',
                },
              },
              {
                id: 'concept-chem-nmr-splitting',
                title: 'Proton NMR Chemical Shifts, Integration & (n + 1) Splitting',
                summary: 'Reconstruct carbon skeletons from ¹H chemical shifts δ, peak integration ratios, and Pascal (n + 1) multiplets.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                formalDefinition:
                  'Chemically non-equivalent protons resonate at δ (ppm) shifted downfield by electronegative withdrawal or aromatic ring currents. Coupling to n equivalent neighboring protons (within 3 bonds) splits the signal into (n + 1) lines with Pascal-triangle intensities.',
                intuitiveExplanation:
                  'Each proton feels the tiny magnetic flips of neighbors across 3 bonds: n neighbors give n + 1 combined spin states, letting you count adjacent hydrogens directly from the multiplet shape.',
                keyFormulas: [
                  {
                    label: 'First-Order Splitting Multiplicity',
                    latex: '\\text{Multiplicity} = n + 1',
                    explanation: 'n counts chemically equivalent vicinal protons (3 bonds away), NOT protons on the same carbon.',
                  },
                ],
                keyObservations: [
                  'An ethyl group (–CH₂CH₃) gives the unmistakable quartet (2H) + triplet (3H) pair.',
                  'An isopropyl group (–CH(CH₃)₂) gives a septet (1H) + doublet (6H).',
                  'O–H protons frequently appear as broad singlets due to rapid exchange.',
                ],
                workedExamples: [
                  {
                    id: 'we-chem-nmr-01',
                    title: 'Diagnosing Ethyl Acetate Signals',
                    problemStatement: 'Predict the ¹H-NMR splitting pattern of ethyl ethanoate (CH₃COOCH₂CH₃).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Acetyl CH₃ (3H) has zero vicinal protons across the carbonyl: singlet (~2.0 ppm).',
                      'Oxymethylene –OCH₂– (2H) neighbors 3 methyl protons: quartet (~4.1 ppm).',
                      'Terminal –CH₃ (3H) neighbors 2 methylene protons: triplet (~1.25 ppm).',
                    ],
                    finalAnswer: '3H singlet (~2.0 ppm), 2H quartet (~4.1 ppm), 3H triplet (~1.25 ppm)',
                    keyTakeaway: 'Identify electronegative oxygen attachment from the ~4 ppm downfield shift of –OCH₂–.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-chem-nmr-01',
                    trapTitle: 'Counting the proton\'s OWN group hydrogens inside n',
                    flawedReasoning: 'A –CH₃ group has 3 hydrogens so it appears as a quartet (3 + 1).',
                    correctConcept: 'Equivalent protons never split one another; n counts only non-equivalent NEIGHBORING protons.',
                    counterExample: 'The 3 protons of CH₃–O–CH₃ appear as a single sharp singlet (0 neighbors).',
                  },
                ],
                prerequisites: [{ id: 'concept-chem-ir-wavenumbers', title: 'Characteristic IR Stretching Frequencies & Bond Force Constants', subjectId: 'chemistry' }],
                relatedConcepts: [{ id: 'concept-chem-carbonyl-nucleophiles', title: 'Nucleophilic Addition to Aldehydes, Ketones & Grignard Reagents', subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'In CH₃CH₂Br, how many lines does the –CH₂– signal split into?',
                  options: ['4 (quartet)', '3 (triplet)', '2 (doublet)', '1 (singlet)'],
                  correctIndex: 0,
                  explanation: 'The –CH₂– protons have n = 3 neighboring methyl protons, splitting into 3 + 1 = 4 lines (quartet).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-carbonyl-aldol',
        title: 'Carbonyl Addition, Grignard Synthesis & Aldol Condensation',
        description: 'Building C–C bonds cleanly using organometallic and enolate nucleophiles.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-carbonyl-cc',
            title: 'Grignard & Enolate Chemistry',
            description: 'Nucleophilic carbonyl addition and alpha-carbon condensation.',
            concepts: [
              {
                id: 'concept-chem-carbonyl-nucleophiles',
                title: 'Nucleophilic Addition to Aldehydes, Ketones & Grignard Reagents',
                summary: 'Form secondary or tertiary alcohols via RMgBr attack on electrophilic C=O carbons in strictly anhydrous ether.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 28,
                formalDefinition:
                  'Carbonyl carbons carry δ+ polarity and undergo nucleophilic addition with organomagnesium reagents (RMgX), followed by acidic workup to yield alcohols: aldehydes yield 2° alcohols (1° from formaldehyde), while ketones and esters (2 equiv) yield 3° alcohols.',
                intuitiveExplanation:
                  'Because magnesium pushes electron density onto carbon, the R group acts like a fierce carbanion eager to attack δ+ carbonyl carbon—and just as eager to steal acidic protons from stray water if the flask is wet.',
                keyFormulas: [
                  {
                    label: 'Grignard Carbonyl Addition',
                    latex: 'R\'\text{–CHO} + R\text{–MgBr} \\xrightarrow{1.\\text{Et}_2\\text{O},\\ 2.\\text{H}_3\\text{O}^+} R\'\text{–CH(OH)–}R',
                    explanation: 'Strict anhydrous conditions are mandatory until step 2 protonation.',
                  },
                ],
                keyObservations: [
                  'Aldehydes are more reactive electrophiles than ketones due to lower steric hindrance and less electron donation.',
                  'Protic functional groups (–OH, –NH, –SH, –COOH) destroy Grignard reagents via acid-base quenching.',
                ],
                workedExamples: [
                  {
                    id: 'we-chem-grig-01',
                    title: 'Synthesizing a Tertiary Alcohol from an Ester',
                    problemStatement: 'What product forms when methyl benzoate reacts with 2 equivalents of CH₃MgBr followed by H₃O⁺?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'First equivalent displaces –OCH₃ via tetrahedral intermediate to form acetophenone (Ph–COCH₃).',
                      'Ketones react faster than esters, so the second CH₃MgBr attacks immediately.',
                      'Acidic workup yields 2-phenylpropan-2-ol (a tertiary alcohol with two methyl groups).',
                    ],
                    finalAnswer: '2-phenylpropan-2-ol',
                    keyTakeaway: 'Esters consume TWO equivalents of Grignard reagent unless stopped with bulky hydrides.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-chem-grig-01',
                    trapTitle: 'Running a Grignard reaction in ethanol or wet THF',
                    flawedReasoning: 'Ethanol dissolves everything nicely so it makes a convenient solvent.',
                    correctConcept: 'RMgBr is a superbase (pKa ~50) and immediately deprotonates ethanol (pKa ~16) to form useless alkane gas.',
                    counterExample: 'CH₃MgBr + CH₃OH gives methane gas and magnesium methoxide, yielding zero C–C bond.',
                  },
                ],
                prerequisites: [{ id: 'concept-sn1-sn2', title: 'Stereochemistry of SN2 & Walden Inversion', subjectId: 'chemistry' }],
                relatedConcepts: [{ id: 'concept-chem-enolate-aldol', title: 'Enolate Alpha-Substitution & Aldol Condensation Equilibrium', subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'Reacting propanone (acetone) with excess CH₃MgBr followed by H₃O⁺ produces:',
                  options: ['2-methylpropan-2-ol (tert-butanol)', 'propan-2-ol', 'butan-2-ol', '2-methylpropanal'],
                  correctIndex: 0,
                  explanation: 'Adding a methyl group to the ketone carbon of acetone yields tert-butanol.',
                },
              },
              {
                id: 'concept-chem-enolate-aldol',
                title: 'Enolate Alpha-Substitution & Aldol Condensation Equilibrium',
                summary: 'Deprotonate α-hydrogens to generate resonance-stabilized enolates for β-hydroxy ketone and α,β-unsaturated synthesis.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                formalDefinition:
                  'Alpha-protons adjacent to a carbonyl (pKa ~19–20) can be deprotonated by base to form nucleophilic enolates. In an aldol addition, one enolate attacks another carbonyl to give a β-hydroxy carbonyl; heating drives E1cb dehydration to a conjugated α,β-unsaturated enone.',
                intuitiveExplanation:
                  'Normally the carbonyl carbon is electrophilic, but pulling off an adjacent α-proton turns the neighboring α-carbon into a nucleophile, letting two carbonyl molecules stitch head-to-tail into a longer conjugated chain.',
                keyFormulas: [
                  {
                    label: 'Aldol Dehydration Driving Force',
                    latex: '\\beta\\text{-hydroxy ketone} \\xrightarrow{\\Delta,\\ \\text{OH}^-} \\alpha,\\beta\\text{-unsaturated enone} + \\text{H}_2\\text{O}',
                    explanation: 'Extended π-conjugation makes dehydration thermodynamically favorable upon heating.',
                  },
                ],
                keyObservations: [
                  'LDA (bulky strong base at -78 °C) favors the less-substituted kinetic enolate; NaOEt/EtOH favors the thermodynamic enolate.',
                  'Crossed aldol reactions succeed cleanly when one partner lacks α-protons (e.g., benzaldehyde or formaldehyde).',
                ],
                workedExamples: [
                  {
                    id: 'we-chem-aldol-01',
                    title: 'Counting Carbons in Self-Aldol Condensation',
                    problemStatement: 'What α,β-unsaturated aldehyde forms when propanal (CH₃CH₂CHO) is heated with aqueous NaOH?',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Propanal forms its α-enolate at C2 (bearing the CH₃ side branch).',
                      'C2 attacks the carbonyl carbon of a second propanal molecule.',
                      'Dehydration removes the β-OH and remaining α-H to yield 2-methylpent-2-enal.',
                    ],
                    finalAnswer: '2-methylpent-2-enal',
                    keyTakeaway: 'Number the α-carbon nucleophile carefully — ethyl/methyl substituents remain attached to C2!',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-chem-aldol-01',
                    trapTitle: 'Bonding the γ-carbon instead of the α-carbon during aldol attack',
                    flawedReasoning: 'Deprotonate the terminal CH₃ of propanal because methyl groups sit on the outside.',
                    correctConcept: 'Only hydrogens attached to the α-carbon directly next to C=O enjoy enolate resonance stabilization.',
                    counterExample: 'C3 of propanal has pKa ~50 and cannot be deprotonated by hydroxide.',
                  },
                ],
                prerequisites: [{ id: 'concept-chem-carbonyl-nucleophiles', title: 'Nucleophilic Addition to Aldehydes, Ketones & Grignard Reagents', subjectId: 'chemistry' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which aldehyde CANNOT form an enolate nucleophile in an aldol reaction because it lacks α-hydrogens?',
                  options: ['Benzaldehyde (Ph–CHO)', 'Acetaldehyde (CH₃CHO)', 'Propanal (CH₃CH₂CHO)', 'Butanal'],
                  correctIndex: 0,
                  explanation: 'The ipso carbon of the benzene ring bonded to –CHO already has 4 bonds and zero hydrogens.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'biology',
    chapterId: 'bio-ch-immunology-neuro',
    examTracks: ['all', 'ap_stem', 'stem_olympiad'],
    newChapter: {
      id: 'bio-ch-immunology-neuro',
      title: 'Immunology, Endocrine Signaling & Metabolic Homeostasis',
      sequenceOrder: 8,
      description: 'MHC antigen presentation, clonal selection, GPCR signal cascades, and glycemic hormone control.',
    },
    topics: [
      {
        id: 'bio-topic-adaptive-immunity',
        title: 'Innate vs. Adaptive Immunity & Clonal Selection',
        description: 'Distinguishing MHC-I/II presentation, antibody specificity, and memory dynamics.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-immunity',
            title: 'Adaptive Immune Architecture',
            description: 'T-cell/B-cell collaboration and immunological memory.',
            concepts: [
              {
                id: 'concept-bio-mhc-t-b-cells',
                title: 'Antigen Presentation via MHC-I/II & Humoral vs. Cell-Mediated Immunity',
                summary: 'Contrast CD8⁺ cytotoxic T-cell killing (MHC-I) against CD4⁺ helper T-cell and B-cell antibody neutralization (MHC-II).',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'MHC Class I displays endogenous intracellular peptides on nearly all nucleated cells to CD8⁺ cytotoxic T cells. MHC Class II displays exogenous phagocytosed peptides exclusively on professional APCs (dendritic cells, macrophages, B cells) to CD4⁺ helper T cells.',
                intuitiveExplanation:
                  'MHC-I is every nucleated cell holding up an internal status window so cytotoxic T cells can eliminate hijacked viral factories; MHC-II is a scout APC displaying captured pathogen fragments to mobilize the general (CD4⁺ helper T cell).',
                keyFormulas: [
                  {
                    label: 'MHC-Co-Receptor Pairing',
                    latex: '\\text{MHC-I} \\leftrightarrow \\text{CD8}^+ \\ (1\\times 8 = 8), \\qquad \\text{MHC-II} \\leftrightarrow \\text{CD4}^+ \\ (2\\times 4 = 8)',
                    explanation: 'Rule of 8: Class I binds CD8; Class II binds CD4.',
                  },
                ],
                keyObservations: [
                  'Mature red blood cells lack nuclei and therefore express zero MHC-I molecules.',
                  'HIV destroys CD4⁺ helper T cells, crippling both humoral B-cell class switching and cell-mediated responses.',
                ],
                workedExamples: [
                  {
                    id: 'we-bio-mhc-01',
                    title: 'Diagnosing an MHC-II Deficiency',
                    problemStatement: 'A patient cannot express MHC-II proteins on dendritic cells or B cells. Which T-cell population fails to activate?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Recognize MHC-II presents exogenous antigens specifically to CD4⁺ helper T cells.',
                      'Without MHC-II, CD4⁺ T cells fail positive selection and peripheral activation, severely impairing antibody class switching.',
                    ],
                    finalAnswer: 'CD4⁺ helper T cells fail to activate',
                    keyTakeaway: 'Use the Rule of 8 (MHC-I → CD8; MHC-II → CD4) on every immunology scenario.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bio-mhc-01',
                    trapTitle: 'Claiming antibodies directly puncture virus-infected host cells internally',
                    flawedReasoning: 'Antibodies enter inside host cytoplasm to destroy replicating viral genomes.',
                    correctConcept: 'Antibodies bind extracellular antigens (neutralization, opsonization); CD8⁺ T cells induce apoptosis in intracellularly infected cells via perforin/granzymes.',
                    counterExample: 'Intracellular bacteria require cell-mediated Th1/CD8⁺ clearing rather than humoral antibodies alone.',
                  },
                ],
                prerequisites: [{ id: 'concept-central-dogma', title: 'Central Dogma: Transcription & Translation', subjectId: 'biology' }],
                relatedConcepts: [{ id: 'concept-bio-vaccine-memory', title: 'Primary vs. Secondary Immune Response & Affinity Maturation', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'Which cell types display endogenous peptides on MHC Class I molecules?',
                  options: [
                    'Nearly all nucleated somatic cells',
                    'Only mature erythrocytes (red blood cells)',
                    'Exclusively B lymphocytes',
                    'Only macrophages and dendritic cells',
                  ],
                  correctIndex: 0,
                  explanation: 'All nucleated cells express MHC-I so immune surveillance can detect intracellular viruses or tumors.',
                },
              },
              {
                id: 'concept-bio-vaccine-memory',
                title: 'Primary vs. Secondary Immune Response & Affinity Maturation',
                summary: 'Explain why memory B/T cells make secondary antibody responses faster, stronger, and higher-affinity (IgG vs. IgM).',
                difficulty: 'easy_medium',
                estimatedMinutes: 12,
                xpReward: 24,
                formalDefinition:
                  'Primary exposure takes ~7–14 days for naive lymphocyte clonal expansion and yields mainly lower-affinity IgM. Secondary exposure activates long-lived memory B cells within 1–3 days, rapidly secreting class-switched, somatic-hypermutated IgG.',
                intuitiveExplanation:
                  'During the first infection the immune system searches millions of naive locks to find one matching key; vaccines build an instant spare keyring of memory cells so a future invader is neutralized before symptoms start.',
                keyFormulas: [
                  {
                    label: 'Secondary Response Advantage',
                    latex: '\\text{Lag}_{2^\\circ} \\ll \\text{Lag}_{1^\\circ}, \\quad [\\text{IgG}]_{2^\\circ} \\gg [\\text{IgM}]_{1^\\circ}',
                    explanation: 'Faster kinetics, higher peak antibody titer, and tighter binding affinity.',
                  },
                ],
                keyObservations: [
                  'Passive immunity (e.g., maternal transplacental IgG or antivenom) acts immediately but builds zero memory cells.',
                  'Somatic hypermutation in germinal centers selects B-cell clones with progressively tighter antigen binding.',
                ],
                workedExamples: [
                  {
                    id: 'we-bio-vac-01',
                    title: 'Distinguishing Active Vaccination from Passive Antitoxin',
                    problemStatement: 'Why does tetanus toxoid vaccination last years whereas tetanus immune globulin protects only weeks?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Tetanus immune globulin supplies pre-formed antibodies (passive immunity), which degrade over weeks without activating B-cell memory.',
                      'Toxoid vaccination stimulates active clonal selection and memory B/T cell formation.',
                    ],
                    finalAnswer: 'Only active immunization generates long-lived memory B and T lymphocytes',
                    keyTakeaway: 'Separate passive pre-made antibodies (short-lived) from active immunological memory.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bio-vac-01',
                    trapTitle: 'Believing a single B cell mutates to invent an antigen receptor after infection',
                    flawedReasoning: 'The pathogen physically molds a blank B-cell receptor into the right shape.',
                    correctConcept: 'Clonal selection relies on pre-existing V(D)J random receptor diversity; antigen only selects matching clones for proliferation.',
                    counterExample: 'Antibody variable domains are rearranged stochastically in bone marrow prior to antigen encounter.',
                  },
                ],
                prerequisites: [{ id: 'concept-bio-mhc-t-b-cells', title: 'Antigen Presentation via MHC-I/II & Humoral vs. Cell-Mediated Immunity', subjectId: 'biology' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which antibody class dominates a rapid secondary immune response?',
                  options: ['IgG', 'IgM', 'IgE', 'IgD'],
                  correctIndex: 0,
                  explanation: 'Memory B cells undergo class-switch recombination to rapidly produce high-affinity IgG.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-endocrine-receptors',
        title: 'Endocrine Signal Transduction & Metabolic Homeostasis',
        description: 'Second-messenger amplification and antagonistic hormone loops.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-signal-glycemic',
            title: 'GPCR Signaling & Glycemic Control',
            description: 'Membrane vs. nuclear receptor logic and insulin/glucagon feedback.',
            concepts: [
              {
                id: 'concept-bio-gpcr-second-messengers',
                title: 'GPCR Signaling Cascades, cAMP & Tyrosine Kinase Receptors',
                summary: 'Trace how hydrophilic peptide hormones amplify extracellular signals millions-fold via G-proteins, adenylyl cyclase, and PKA.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'Ligand binding to a 7-transmembrane GPCR exchanges GDP for GTP on Gα, activating adenylyl cyclase (ATP → cAMP) to trigger Protein Kinase A phosphorylation cascades. In contrast, lipophilic steroid hormones cross the membrane directly to bind intracellular transcription-factor receptors.',
                intuitiveExplanation:
                  'A single hormone molecule docking outside a cell flips one G-protein switch, which makes thousands of cAMP messengers, activating thousands of kinases—explaining why nanomolar epinephrine floods muscles with glucose in seconds.',
                keyFormulas: [
                  {
                    label: 'cAMP Second-Messenger Axis',
                    latex: '\\text{Ligand} \\to \\text{GPCR} \\to G_\\alpha\\text{-GTP} \\to \\text{Adenylyl Cyclase} \\to \\text{cAMP} \\to \\text{PKA}',
                    explanation: 'Phosphodiesterase (PDE) degrades cAMP back to AMP to terminate the signal.',
                  },
                ],
                keyObservations: [
                  'Hydrophilic peptides act rapidly via pre-existing cytosolic enzymes; steroid hormones act slower via gene transcription.',
                  'Caffeine inhibits phosphodiesterase, prolonging intracellular cAMP signaling.',
                ],
                workedExamples: [
                  {
                    id: 'we-bio-gpcr-01',
                    title: 'Cholera Toxin Lock on Gαs',
                    problemStatement: 'Cholera toxin prevents Gαs from hydrolyzing GTP to GDP. What happens to intestinal cAMP levels?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Normally Gαs self-inactivates by cleaving GTP → GDP.',
                      'Locking Gαs in the GTP-bound active state drives continuous adenylyl cyclase catalysis.',
                      'Intracellular cAMP stays constitutively elevated, opening CFTR Cl⁻ channels and causing massive water loss.',
                    ],
                    finalAnswer: 'cAMP remains constitutively elevated',
                    keyTakeaway: 'G-proteins turn OFF via intrinsic GTPase hydrolysis.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bio-gpcr-01',
                    trapTitle: 'Assuming steroid hormones act exclusively through cAMP at the plasma membrane',
                    flawedReasoning: 'Every hormone binds an extracellular GPCR.',
                    correctConcept: 'Nonpolar steroid hormones (cortisol, estrogen) diffuse across the lipid bilayer to regulate intracellular nuclear receptors directly.',
                    counterExample: 'Estrogen requires nuclear receptor dimerization on DNA response elements.',
                  },
                ],
                prerequisites: [{ id: 'concept-membrane-transport', title: 'Passive vs Active Membrane Transport', subjectId: 'biology' }],
                relatedConcepts: [{ id: 'concept-bio-insulin-glucagon', title: 'Insulin-Glucagon Antagonism & Glycogen Regulation', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'Which enzyme directly converts ATP into the second messenger cAMP?',
                  options: ['Adenylyl cyclase', 'Phosphodiesterase', 'Protein Kinase A', 'Phospholipase C'],
                  correctIndex: 0,
                  explanation: 'Activated Gαs stimulates adenylyl cyclase to cyclize ATP into cAMP; PDE breaks cAMP down.',
                },
              },
              {
                id: 'concept-bio-insulin-glucagon',
                title: 'Insulin-Glucagon Antagonism & Glycogen Regulation',
                summary: 'Maintain blood glucose homeostasis via pancreatic β-cell insulin uptake vs. α-cell glucagon glycogenolysis.',
                difficulty: 'easy_medium',
                estimatedMinutes: 13,
                xpReward: 24,
                formalDefinition:
                  'Postprandial hyperglycemia stimulates pancreatic β-cells to secrete insulin, promoting GLUT4 translocation and glycogen synthase activation. Fasting hypoglycemia stimulates α-cells to secrete glucagon, activating hepatic glycogen phosphorylase and gluconeogenesis.',
                intuitiveExplanation:
                  'Insulin tells cells "food is abundant — open glucose doors and store glycogen," whereas glucagon signals the liver "blood sugar is dipping — break down reserves and export glucose."',
                keyFormulas: [
                  {
                    label: 'Glycemic Setpoint Negative Feedback',
                    latex: '\\uparrow \\text{Glucose} \\to \\text{Insulin} \\to \\text{GLUT4 Uptake}; \\qquad \\downarrow \\text{Glucose} \\to \\text{Glucagon} \\to \\text{Glycogenolysis}',
                    explanation: 'Skeletal muscle lacks glucose-6-phosphatase, so muscle glycogen serves only local ATP needs.',
                  },
                ],
                keyObservations: [
                  'Type 1 diabetes reflects autoimmune β-cell destruction (insulin deficiency); Type 2 reflects peripheral insulin resistance.',
                  'Brain neurons absorb glucose primarily via insulin-independent GLUT1/GLUT3 transporters.',
                ],
                workedExamples: [
                  {
                    id: 'we-bio-ins-01',
                    title: 'Predicting Fasting Enzyme States',
                    problemStatement: 'After an overnight 12-hour fast, which pancreatic hormone dominates and what happens to liver glycogen?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Low post-absorptive blood glucose suppresses β-cell insulin and stimulates α-cell glucagon.',
                      'Glucagon activates hepatic PKA, phosphorylating and activating glycogen phosphorylase.',
                      'Liver glycogen breaks down into glucose-1-phosphate and exports free glucose into blood.',
                    ],
                    finalAnswer: 'Glucagon dominates; liver glycogen undergoes breakdown (glycogenolysis)',
                    keyTakeaway: 'Phosphorylation activates glycogen breakdown (glucagon) and inhibits glycogen synthesis.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bio-ins-01',
                    trapTitle: 'Claiming skeletal muscle exports glucose into the bloodstream during fasting',
                    flawedReasoning: 'All glycogen stores release free glucose back to blood under glucagon.',
                    correctConcept: 'Only liver (and minimally kidney) expresses glucose-6-phosphatase; muscle lacks both glucagon receptors and G6Pase.',
                    counterExample: 'Muscle glycogen phosphorylase feeds glycolysis inside that muscle fiber only.',
                  },
                ],
                prerequisites: [{ id: 'concept-bio-gpcr-second-messengers', title: 'GPCR Signaling Cascades, cAMP & Tyrosine Kinase Receptors', subjectId: 'biology' }],
                relatedConcepts: [{ id: 'concept-homeostasis-feedback', title: 'Negative Feedback & Gas Exchange Surfaces', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'Which pancreatic cells secrete insulin when blood glucose rises?',
                  options: ['Islet β-cells', 'Islet α-cells', 'Acinar exocrine cells', 'Adrenal medulla cells'],
                  correctIndex: 0,
                  explanation: 'Pancreatic β-cells secrete insulin; α-cells secrete glucagon.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'english',
    chapterId: 'eng-ch-argumentation-research',
    examTracks: ['all'],
    newChapter: {
      id: 'eng-ch-argumentation-research',
      title: 'Comparative Rhetoric, Research Synthesis & Stylistic Nuance',
      sequenceOrder: 6,
      description: 'Steel-manning counterarguments, source corroboration, focalization, and periodic syntax.',
    },
    topics: [
      {
        id: 'eng-topic-synthesis-counterargument',
        title: 'Multi-Source Synthesis & Steel-Manning Counterarguments',
        description: 'Building resilient academic arguments that acknowledge nuance and cross-verify evidence.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'eng-sub-synthesis',
            title: 'Counterargument & Source Evaluation',
            description: 'Qualifying claims and auditing primary vs. secondary sources.',
            concepts: [
              {
                id: 'concept-eng-steelman-concession',
                title: 'Strategic Concession, Refutation & Qualification in Academic Debate',
                summary: 'Strengthen persuasive ethos by reconstructing the strongest version of an opponent\'s view before qualifying its scope.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 24,
                formalDefinition:
                  'A strategic concession validates a defensible premise within a counterargument, whereas refutation demonstrates why that premise fails to overturn the thesis (via boundary conditions, outweighing consequences, or alternative causation). Steel-manning addresses the strongest formulation rather than a caricature.',
                intuitiveExplanation:
                  'Knocking down a cartoonish "straw-man" convinces only people who already agree with you. Acknowledging what the other side gets right—then showing precisely where its logic hits a wall—earns the trust of skeptical readers.',
                keyFormulas: [
                  {
                    label: 'Concessive Synthesis Frame',
                    latex: '\\text{Although [strongest opposing claim], [thesis still holds] because [outweighing mechanism].}',
                    explanation: 'Avoid flat contradiction; pivot with "Yet" or "However, within [scope]..."',
                  },
                ],
                keyObservations: [
                  'Conceding an undeniable limitation strengthens ethos rather than weakening your thesis.',
                  'Qualifying absolute claims ("always", "every") into scoped propositions protects arguments against trivial counterexamples.',
                ],
                workedExamples: [
                  {
                    id: 'we-eng-steel-01',
                    title: 'Transforming a Straw-Man into a Qualified Thesis',
                    problemStatement: 'Revise "Critics hate congestion pricing just because they want to pollute cities" into a steel-manned concession.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Identify the strongest legitimate concern: regressive flat fees can burden outer-borough commuters lacking transit access.',
                      'Concede and pivot: "While flat congestion tolls risk burdening outer-ring commuters without rail alternatives, pairing dynamic fees with dedicated bus-rapid-transit funding nets lower commute times and cleaner air for those very neighborhoods."',
                    ],
                    finalAnswer: 'Acknowledges equity concern explicitly and resolves it with targeted policy design.',
                    keyTakeaway: 'Engage the opponent\'s best factual objection rather than inventing bad motives.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eng-steel-01',
                    trapTitle: 'Conceding a point without pivoting back to why your thesis prevails',
                    flawedReasoning: 'Include a counterargument paragraph simply to meet a rubric requirement.',
                    correctConcept: 'Every concession must conclude with an explicit rebuttal or qualification explaining why the main thesis remains intact.',
                    counterExample: 'Stopping after "Opponents rightly note high costs" leaves the reader believing the opposition won.',
                  },
                ],
                prerequisites: [{ id: 'concept-eng-toulmin-model', title: 'Toulmin Argument Model & Evidentiary Warrants', subjectId: 'english' }],
                relatedConcepts: [{ id: 'concept-eng-source-corroboration', title: 'Source Triangulation, Primary vs. Secondary Authority & Bias Audit', subjectId: 'english' }],
                miniCheckQuestion: {
                  prompt: 'What distinguishes "steel-manning" from "straw-manning" a counterargument?',
                  options: [
                    'Addressing the opponent\'s strongest plausible formulation rather than a distorted caricature',
                    'Ignoring all opposing evidence to keep prose concise',
                    'Repeating your opening thesis verbatim in the conclusion',
                    'Substituting emotional anecdotes for statistical data',
                  ],
                  correctIndex: 0,
                  explanation: 'Steel-manning reconstructs the strongest opposing case before offering a reasoned rebuttal or qualification.',
                },
              },
              {
                id: 'concept-eng-source-corroboration',
                title: 'Source Triangulation, Primary vs. Secondary Authority & Bias Audit',
                summary: 'Synthesize independent primary datasets, peer-reviewed studies, and conflicting perspectives into an original line of reasoning.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 24,
                formalDefinition:
                  'Source synthesis places multiple independent authorities in conversation—distinguishing primary empirical records from secondary commentary—to identify consensus, methodological divergence, and funding or selection bias.',
                intuitiveExplanation:
                  'A strong research essay is a roundtable discussion you moderate, not a sequence of isolated book reports. Let Source A test, complicate, or corroborate Source B.',
                keyFormulas: [
                  {
                    label: 'Triangulation Criteria',
                    latex: '\\text{Reliability} \\propto \\text{Independence of Sources} \\times \\text{Methodological Transparency}',
                    explanation: 'Three outlets quoting one unverified press release still count as one source.',
                  },
                ],
                keyObservations: [
                  'Never build a paragraph around one single source summary when synthesizing; combine at least two voices per claim.',
                  'Check publication date, sample scope, and potential conflicts of interest before elevating an opinion piece to authority.',
                ],
                workedExamples: [
                  {
                    id: 'we-eng-src-01',
                    title: 'Spotting Circular Citation',
                    problemStatement: 'Three news articles cite a 2024 market projection, all tracing back to a single vendor whitepaper. Do they provide independent corroboration?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Trace provenance: secondary summaries repeat one primary vendor claim.',
                      'Because zero independent datasets were collected, effective sample size of corroboration remains one potentially biased source.',
                    ],
                    finalAnswer: 'No — downstream echoes do not multiply primary evidentiary weight.',
                    keyTakeaway: 'Verify whether two citations share the exact same upstream primary source.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eng-src-01',
                    trapTitle: 'Writing a "source-by-source" summary instead of thematic synthesis',
                    flawedReasoning: 'Dedicate Paragraph 1 to Source A, Paragraph 2 to Source B, and Paragraph 3 to Source C.',
                    correctConcept: 'Organize body paragraphs by analytical CLAIMS, weaving multiple sources within each paragraph to compare or qualify evidence.',
                    counterExample: 'Grouping by claim reveals tension between two economists directly inside one paragraph.',
                  },
                ],
                prerequisites: [{ id: 'concept-evidence-integration', title: 'Integrating Evidence & Evaluating Sources', subjectId: 'english' }],
                relatedConcepts: [{ id: 'concept-eng-steelman-concession', title: 'Strategic Concession, Refutation & Qualification in Academic Debate', subjectId: 'english' }],
                miniCheckQuestion: {
                  prompt: 'Which example represents a PRIMARY source for studying a 1920 legislative debate?',
                  options: [
                    'Verbatim parliamentary transcripts and contemporaneous letters from 1920',
                    'A 2015 textbook chapter summarizing the decade',
                    'An encyclopedia entry written in 2002',
                    'A modern documentary film commentary',
                  ],
                  correctIndex: 0,
                  explanation: 'Firsthand records produced during the event itself are primary sources.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'eng-topic-prosody-narrative',
        title: 'Prosody, Narrative Focalization & Lexical Precision',
        description: 'Analyzing how point of view and periodic clause structure shape literary meaning.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'eng-sub-stylistics',
            title: 'Narrative Voice & Syntactic Pacing',
            description: 'Free indirect discourse and periodic vs. cumulative sentence cadence.',
            concepts: [
              {
                id: 'concept-eng-free-indirect-discourse',
                title: 'Narrative Focalization & Free Indirect Discourse',
                summary: 'Detect when a third-person narrator absorbs a character\'s diction, exclamations, and subjectivity without quotation marks.',
                difficulty: 'medium_hard',
                estimatedMinutes: 14,
                xpReward: 26,
                formalDefinition:
                  'Free indirect discourse retains third-person pronouns and past tense of third-person narration while adopting the lexical register, emotional idioms, and temporal/spatial deictics ("now", "here") of a focalized character.',
                intuitiveExplanation:
                  'Notice the magic trick in Austen or Woolf: the narrator speaks in "she thought" tense yet suddenly borrows the character\'s own biased, breathless slang—letting readers live inside a character\'s illusions while still seeing them from outside.',
                keyFormulas: [
                  {
                    label: 'Stylistic Signature',
                    latex: '\\text{3rd-person pronouns + past tense} + \\text{1st-person subjective idiom / exclamation}',
                    explanation: 'Example: "What a relief the dreadful dinner was finally over tomorrow!"',
                  },
                ],
                keyObservations: [
                  'Direct speech uses quotes ("Why must I wait?"); indirect speech uses reporting clauses (She wondered why she had to wait); free indirect speech drops the tag (Why must she wait so long?).',
                  'Creates simultaneous empathy and ironic distance when a character misjudges reality.',
                ],
                workedExamples: [
                  {
                    id: 'we-eng-fid-01',
                    title: 'Distinguishing Narration Modes',
                    problemStatement: 'Classify: "Surely the inheritance would settle everything by Friday—how could her brother possibly refuse?"',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Observe third-person "her" and past modal "would/could" (not first-person).',
                      'Observe speculative adverb "Surely" and anxious rhetorical question without "she asked".',
                      'This blend is classic free indirect discourse.',
                    ],
                    finalAnswer: 'Free indirect discourse',
                    keyTakeaway: 'Look for subjective questions, modal certainty ("surely"), or colloquial idioms inside third-person past narration.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eng-fid-01',
                    trapTitle: 'Equating every third-person narrator with objective omniscience',
                    flawedReasoning: 'Third-person narration has no bias because it never says "I".',
                    correctConcept: 'Close third-person focalization and free indirect discourse often filter judgments through a fallible character\'s prejudice.',
                    counterExample: 'Emma Woodhouse\'s misreadings appear as third-person prose statements that later plot twists expose.',
                  },
                ],
                prerequisites: [{ id: 'concept-eng-authorial-tone', title: 'Authorial Tone & Diction Modulation', subjectId: 'english' }],
                relatedConcepts: [{ id: 'concept-eng-dramatic-situational-irony', title: 'Dramatic, Situational & Verbal Irony Mechanisms', subjectId: 'english' }],
                miniCheckQuestion: {
                  prompt: 'Which sentence exemplifies free indirect discourse?',
                  options: [
                    'Why on earth had Marcus invited his rival tonight, she wondered with a shudder, though of course no gentleman could decline!',
                    'Maria said, "I cannot believe Marcus invited his rival tonight."',
                    'Maria asked herself why Marcus had invited his rival that evening.',
                    'I watched Marcus greet his rival at the doorway.',
                  ],
                  correctIndex: 0,
                  explanation: 'It fuses third-person "she" and past tense with direct exclamatory idioms ("Why on earth", "of course", "!").',
                },
              },
              {
                id: 'concept-eng-syntax-rhythm',
                title: 'Periodic vs. Cumulative Sentences & Anaphoric Emphasis',
                summary: 'Analyze how suspending or front-loading main clauses builds suspense, authority, or breathless accumulation.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 24,
                formalDefinition:
                  'A periodic sentence delays its independent main clause until the end of trailing modifiers or subordinate clauses, creating suspense and climactic weight. A cumulative (loose) sentence opens with its core independent clause and layers modifying phrases afterward.',
                intuitiveExplanation:
                  'Periodic sentences make readers hold their breath through "If... When... Despite..." until the main verb lands like a gavel; cumulative sentences state the punchline first and then zoom in with sensory detail.',
                keyFormulas: [
                  {
                    label: 'Clause Delay Contrast',
                    latex: '\\text{Periodic: [Subordinate clauses]} \\to \\text{[Main Clause].} \\quad \\text{Cumulative: [Main Clause]} \\to \\text{[Elaborations].}',
                    explanation: 'Anaphora reinforces rhythm by repeating opening words across parallel clauses.',
                  },
                ],
                keyObservations: [
                  'Periodic syntax elevates formal, ceremonial, or forensic arguments where every premise leads to one verdict.',
                  'Cumulative syntax excels at vivid narrative description and natural conversational flow.',
                ],
                workedExamples: [
                  {
                    id: 'we-eng-syn-01',
                    title: 'Diagnosing Syntactic Cadence',
                    problemStatement: 'Identify the structure of: "Out of the ash of four ruined harvests, beneath skies emptied of songbirds, the valley slowly rebuilt."',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Note two prepositional phrases delay the subject and verb until the very end.',
                      'Only in the final four words ("the valley slowly rebuilt") does the sentence become grammatically complete.',
                    ],
                    finalAnswer: 'Periodic sentence',
                    keyTakeaway: 'Test where you could drop a period and still have a complete grammatical sentence.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eng-syn-01',
                    trapTitle: 'Treating long periodic sentences as fragments or assuming length equals error',
                    flawedReasoning: 'Short sentences are always clearer and stronger than periodic ones.',
                    correctConcept: 'Strategic contrast between long periodic builds and terse short sentences creates powerful rhetorical pacing.',
                    counterExample: 'A long periodic crescendo followed by a three-word sentence amplifies contrast.',
                  },
                ],
                prerequisites: [{ id: 'concept-eng-faulty-parallelism', title: 'Parallel Structure & Correlative Balance', subjectId: 'english' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the primary rhetorical effect of a periodic sentence?',
                  options: [
                    'Building suspense and giving climactic emphasis to the delayed main clause',
                    'Eliminating all subordinate modifiers from a paragraph',
                    'Creating a casual stream-of-consciousness diary entry',
                    'Replacing active verbs with passive participles',
                  ],
                  correctIndex: 0,
                  explanation: 'Withholding the main clause until the end focuses tension onto the closing assertion.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'data_science',
    chapterId: 'ds-ch-bayesian-timeseries',
    examTracks: ['all', 'ai_ml_foundations'],
    newChapter: {
      id: 'ds-ch-bayesian-timeseries',
      title: 'Bayesian Inference, PCA & Time-Series Modeling',
      sequenceOrder: 4,
      description: 'Conjugate Bayesian updating, credible intervals, spectral dimensionality reduction, and stationarity.',
    },
    topics: [
      {
        id: 'ds-topic-bayesian-conjugate',
        title: "Bayesian Updating, Conjugate Priors & Credible Intervals",
        description: 'Moving cleanly from prior beliefs and likelihoods to closed-form posteriors.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'ds-sub-bayesian',
            title: 'Conjugate Posteriors & Interpretation',
            description: 'Beta-Binomial updating and Bayesian vs. Frequentist interval semantics.',
            concepts: [
              {
                id: 'concept-ds-conjugate-updating',
                title: 'Beta-Binomial Conjugate Updating & Maximum A Posteriori (MAP)',
                summary: 'Update Beta(α, β) priors directly to Beta(α + k, β + n - k) after k successes in n Bernoulli trials.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 30,
                formalDefinition:
                  'A prior family p(θ) is conjugate to likelihood p(D|θ) when the posterior p(θ|D) belongs to the same parametric family. For θ ~ Beta(α, β) and k ~ Binomial(n, θ), the posterior is Beta(α + k, β + n - k) with posterior mean (α + k)/(α + β + n).',
                intuitiveExplanation:
                  'Treat α and β as "pseudo-counts" of prior heads and tails observed before the experiment. Each real coin flip simply adds 1 to α (head) or 1 to β (tail).',
                keyFormulas: [
                  {
                    label: 'Beta-Binomial Posterior Mean',
                    latex: '\\theta \\mid k \\sim \\text{Beta}(\\alpha + k,\\ \\beta + n - k), \\quad \\mathbb{E}[\\theta \\mid k] = \\frac{\\alpha + k}{\\alpha + \\beta + n}',
                    explanation: 'As sample size n → ∞, data overwhelms prior pseudo-counts α, β and converges to the MLE k/n.',
                  },
                ],
                keyObservations: [
                  'Gaussian prior corresponds mathematically to L2 (Ridge) weight decay regularization in MAP estimation.',
                  'Laplace prior corresponds mathematically to L1 (Lasso) regularization in MAP estimation.',
                ],
                workedExamples: [
                  {
                    id: 'we-ds-bayes-01',
                    title: 'Click-Through Rate Updating',
                    problemStatement: 'Starting with a uniform prior Beta(1, 1), you observe 7 clicks out of 10 impressions. Compute the posterior distribution and posterior mean.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Update successes α\' = α + k = 1 + 7 = 8.',
                      'Update failures β\' = β + (n - k) = 1 + 3 = 4.',
                      'Posterior mean = 8 / (8 + 4) = 8/12 = 2/3 ≈ 0.667.',
                    ],
                    finalAnswer: 'Beta(8, 4) with posterior mean 2/3',
                    keyTakeaway: 'Uniform prior Beta(1, 1) yields Laplace\'s rule of succession (k + 1)/(n + 2).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ds-bayes-01',
                    trapTitle: 'Multiplying probabilities directly without updating hyperparameters cleanly',
                    flawedReasoning: 'Leave the denominator n unchanged when taking the posterior mean.',
                    correctConcept: 'Prior strength α + β acts as additional total trials, so the denominator becomes α + β + n.',
                    counterExample: 'With 0/0 data, Beta(2, 2) starts at mean 0.5, not undefined 0/0.',
                  },
                ],
                prerequisites: [{ id: 'concept-bayes-theorem', title: 'Bayes Theorem & Posterior Estimation', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ds-credible-vs-confidence', title: 'Bayesian Credible Intervals vs. Frequentist Confidence Intervals', subjectId: 'data_science' }],
                miniCheckQuestion: {
                  prompt: 'If a Beta(2, 3) prior observes 4 successes and 1 failure, what is the updated posterior distribution?',
                  options: ['Beta(6, 4)', 'Beta(4, 1)', 'Beta(6, 3)', 'Beta(5, 4)'],
                  correctIndex: 0,
                  explanation: 'α\' = 2 + 4 = 6 and β\' = 3 + 1 = 4, yielding Beta(6, 4).',
                },
              },
              {
                id: 'concept-ds-credible-vs-confidence',
                title: 'Bayesian Credible Intervals vs. Frequentist Confidence Intervals',
                summary: 'Distinguish posterior probability statements about a parameter θ from long-run coverage rates of random sample intervals.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 26,
                formalDefinition:
                  'A 95% Bayesian credible interval [L, U] satisfies P(L ≤ θ ≤ U | Data) = 0.95 under the posterior distribution of θ. A 95% frequentist confidence interval treats θ as fixed and guarantees that 95% of intervals constructed across repeated samples contain θ.',
                intuitiveExplanation:
                  'Bayesian intervals answer the question stakeholders naturally think intervals answer ("given my data, there is a 95% chance the parameter sits inside here"), whereas frequentist intervals guarantee the long-run calibration of the ruler itself.',
                keyFormulas: [
                  {
                    label: 'Posterior Interval Definition',
                    latex: '\\int_L^U p(\\theta \\mid D)\\,d\\theta = 1 - \\alpha',
                    explanation: 'Equal-tailed or Highest Posterior Density (HPD) intervals integrate the posterior directly.',
                  },
                ],
                keyObservations: [
                  'Do not say "there is a 95% probability the true parameter lies in this calculated frequentist CI" — in frequentist math, θ is non-random.',
                  'With weak priors and large samples, numeric endpoints of credible and confidence intervals often coincide numerically even though their meanings differ.',
                ],
                workedExamples: [
                  {
                    id: 'we-ds-ci-01',
                    title: 'Interpreting an A/B Test Interval Correctly',
                    problemStatement: 'An experiment yields a 95% frequentist confidence interval of [+1.2%, +4.8%] lift. Is "95% chance true lift is in [+1.2%, +4.8%]" technically frequentist?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'In frequentist theory, the true lift θ is a deterministic unknown constant — either inside [+1.2%, +4.8%] or outside (probability 0 or 1).',
                      'The 95% refers to the procedure generating intervals that trap θ 95% of the time across repeated experiments.',
                    ],
                    finalAnswer: 'No — probability statements on θ belong to Bayesian credible intervals',
                    keyTakeaway: 'Separate procedure coverage (frequentist) from parameter probability (Bayesian).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ds-ci-01',
                    trapTitle: 'Optional stopping ("peeking") inside frequentist p-value tests',
                    flawedReasoning: 'Stop an A/B test the moment p < 0.05 appears on a daily dashboard.',
                    correctConcept: 'Repeatedly peeking inflates Type I false-positive rates far above 5% unless sequential alpha-spending or Bayesian testing is used.',
                    counterExample: 'Checking daily for 20 days under a true null pushes false alarm probability over 25%.',
                  },
                ],
                prerequisites: [{ id: 'concept-ds-hypothesis-testing', title: 'Null Hypothesis Significance Testing (NHST) & p-Values', subjectId: 'data_science' }],
                relatedConcepts: [{ id: 'concept-ds-conjugate-updating', title: 'Beta-Binomial Conjugate Updating & Maximum A Posteriori (MAP)', subjectId: 'data_science' }],
                miniCheckQuestion: {
                  prompt: 'Which interval allows the direct statement "Given observed data and prior, P(θ ∈ [L, U] | D) = 0.95"?',
                  options: [
                    '95% Bayesian credible interval',
                    '95% frequentist Wald confidence interval',
                    'Bonferroni family-wise error bound',
                    'Chebyshev sample range',
                  ],
                  correctIndex: 0,
                  explanation: 'Credible intervals directly integrate the posterior density p(θ | D).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'ds-topic-pca-timeseries',
        title: 'PCA Dimensionality Reduction & Time-Series Stationarity',
        description: 'Variance-maximizing orthogonal projections and temporal forecasting invariants.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'ds-sub-pca-ts',
            title: 'Principal Components & Temporal Modeling',
            description: 'Standardizing features for PCA and enforcing stationarity before ARIMA.',
            concepts: [
              {
                id: 'concept-ds-pca-variance',
                title: 'Principal Component Analysis via Covariance Eigenvectors & Explained Variance',
                summary: 'Project standardized data onto orthogonal eigenvectors of Σ to capture maximum variance in k ≪ d dimensions.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 32,
                formalDefinition:
                  'For centered matrix X ∈ ℝ^{n × d} with sample covariance Σ = (1/(n - 1))XᵀX, the principal axes are unit eigenvectors v₁, ..., v_d ordered by eigenvalues λ₁ ≥ ··· ≥ λ_d ≥ 0. The fraction of variance explained by the top k axes is (Σ_{i=1}^k λᵢ) / Tr(Σ).',
                intuitiveExplanation:
                  'Imagine rotating a 3D cloud of points until its widest shadow falls flat onto a 2D camera sensor. PCA chooses perpendicular camera axes sorted from largest spread to smallest spread.',
                keyFormulas: [
                  {
                    label: 'Explained Variance Ratio',
                    latex: '\\text{EVR}_k = \\frac{\\sum_{i=1}^k \\lambda_i}{\\sum_{j=1}^d \\lambda_j}',
                    explanation: 'Always zero-mean center (and usually z-score standardize) columns before computing Σ.',
                  },
                ],
                keyObservations: [
                  'Without scaling features measured in different units (e.g., income in dollars vs. age in years), the largest-unit column hijacks PC1.',
                  'PCA is an unsupervised linear projection; top variance directions are not guaranteed to correlate with supervised labels.',
                ],
                workedExamples: [
                  {
                    id: 'we-ds-pca-01',
                    title: 'Computing Explained Variance Ratio',
                    problemStatement: 'A 4-feature covariance matrix has eigenvalues [6.0, 2.5, 1.0, 0.5]. How much variance do the first two principal components retain?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Sum total variance: 6.0 + 2.5 + 1.0 + 0.5 = 10.0.',
                      'Sum top-2 eigenvalues: 6.0 + 2.5 = 8.5.',
                      'Divide: 8.5 / 10.0 = 0.85 (85%).',
                    ],
                    finalAnswer: '85%',
                    keyTakeaway: 'Eigenvalue sum equals total trace variance across centered features.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ds-pca-01',
                    trapTitle: 'Fitting PCA scaler/eigenvectors on the entire dataset before train-test split',
                    flawedReasoning: 'PCA uses no labels so fitting it on all rows cannot leak anything.',
                    correctConcept: 'Computing means, variances, and PC axes on test rows leaks test-distribution covariance; fit PCA strictly on training folds.',
                    counterExample: 'Standardizing with global test mean artificially inflates validation performance.',
                  },
                ],
                prerequisites: [{ id: 'concept-eigenvalues-vectors', title: 'Eigenvalues & Eigenvectors', subjectId: 'math' }],
                relatedConcepts: [{ id: 'concept-ds-cross-validation-leakage', title: 'Stratified Cross-Validation & Data Leakage Prevention', subjectId: 'data_science' }],
                miniCheckQuestion: {
                  prompt: 'Why should features be standardized (z-scored) before running PCA on columns with vastly different scales?',
                  options: [
                    'So large-magnitude units do not artificially dominate variance and PC1',
                    'To force all eigenvalues to equal 1',
                    'To convert unsupervised features into supervised labels',
                    'To make all principal components non-orthogonal',
                  ],
                  correctIndex: 0,
                  explanation: 'Covariance scales quadratically with unit size (meters vs. millimeters multiplies variance by 10⁶), distorting unscaled PCA.',
                },
              },
              {
                id: 'concept-ds-stationarity-arima',
                title: 'Time-Series Stationarity, Autocorrelation (ACF) & Differencing',
                summary: 'Diagnose trends and seasonality, induce weak stationarity via differencing, and preserve temporal split order.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 30,
                formalDefinition:
                  'A time series {y_t} is weakly stationary if its mean E[y_t], variance Var(y_t), and autocovariance Cov(y_t, y_{t-h}) remain finite and invariant under time shifts t. First differencing Δy_t = y_t - y_{t-1} removes linear trends.',
                intuitiveExplanation:
                  'Forecasting assumes tomorrow obeys the same statistical weather rules as yesterday. If a series drifts steadily upward over time, model the step-to-step changes (differences) instead of raw altitude.',
                keyFormulas: [
                  {
                    label: 'First-Order Difference Operator',
                    latex: '\\Delta y_t = y_t - y_{t-1}',
                    explanation: 'Corresponds to the d = 1 integration order in ARIMA(p, d, q).',
                  },
                ],
                keyObservations: [
                  'NEVER use random k-fold cross-validation on time series — future observations leak backward into training.',
                  'Use expanding-window or rolling-origin walk-forward validation instead.',
                ],
                workedExamples: [
                  {
                    id: 'we-ds-ts-01',
                    title: 'Removing a Deterministic Linear Trend',
                    problemStatement: 'If y_t = 3t + ε_t where ε_t is white noise, compute the first difference Δy_t and check its mean.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Write Δy_t = y_t - y_{t-1} = (3t + ε_t) - (3(t - 1) + ε_{t-1}).',
                      'Simplify: Δy_t = 3 + (ε_t - ε_{t-1}).',
                      'Since E[ε_t] = 0, E[Δy_t] = 3 is constant for all t.',
                    ],
                    finalAnswer: 'Δy_t = 3 + ε_t - ε_{t-1} (constant mean 3)',
                    keyTakeaway: 'First differencing converts a linear trend into a stationary constant mean.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ds-ts-01',
                    trapTitle: 'Evaluating forecasting models with shuffled K-Fold CV',
                    flawedReasoning: 'Shuffled 5-fold CV maximizes training coverage across the timeline.',
                    correctConcept: 'Random shuffling lets Wednesday train a model tested on Tuesday, leaking future shocks and giving wildly optimistic accuracy.',
                    counterExample: 'Walk-forward validation trains only on t ≤ T to score t > T.',
                  },
                ],
                prerequisites: [{ id: 'concept-ds-cross-validation-leakage', title: 'Stratified Cross-Validation & Data Leakage Prevention', subjectId: 'data_science' }],
                relatedConcepts: [{ id: 'concept-model-drift', title: 'Data Drift, Concept Drift & Monitoring', subjectId: 'data_science' }],
                miniCheckQuestion: {
                  prompt: 'Which cross-validation scheme is valid for temporal forecasting data?',
                  options: [
                    'Walk-forward / expanding-window time splits (train before test)',
                    'Randomly shuffled 10-fold CV',
                    'Stratified k-fold ignoring timestamps',
                    'Leave-one-out on sorted target values',
                  ],
                  correctIndex: 0,
                  explanation: 'Walk-forward splits respect causality so training uses strictly earlier timestamps than validation.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export const CURRICULUM_EXPANSION_6: ChapterAddition[] = [
  ...AP_MATH_ADDITIONS,
  ...OTHER_SUBJECT_ADDITIONS,
];
