import { ChapterAddition } from './curriculumExpansion';

/**
 * Comprehensive Syllabus Expansion 8:
 * Ensures full chapter/topic/subtopic/concept coverage across:
 *  - JEE Main & JEE Advanced (Math, Physics, Chemistry)
 *  - AP Calculus AB/BC (L'Hopital, Riemann Sums, Improper Integrals)
 *  - ICT International Coding Test (Tries, KMP, DSU, Bitmask & Tree DP)
 *  - IPhO (Relativistic 4-Momentum, Thermodynamic Potentials & Maxwell Relations)
 *  - IChO (Pericyclic Reactions, Particle-in-a-Box Pi Systems, Complexometry)
 *  - IBO / IBHO (Cladistics & Phylogenetics, Plant Hormones & Photoperiodism)
 *  - NSEJS (Integrated Math, Physics, Chemistry & Biology Olympiad Foundations)
 */
export const COMPREHENSIVE_EXAM_EXPANSION_8: ChapterAddition[] = [
  // =========================================================================
  // MATHEMATICS — JEE Main / JEE Advanced / AP Calculus / NSEJS
  // =========================================================================
  {
    subjectId: 'math',
    chapterId: 'math-ch-jee-algebra',
    examTracks: ['all', 'jee_main', 'jee_advanced', 'stem_olympiad'],
    newChapter: {
      id: 'math-ch-jee-algebra',
      title: 'JEE Algebra: Complex Numbers, Quadratics & Binomial Series',
      sequenceOrder: 13,
      description:
        'Argand plane geometry, De Moivre theorem, roots of unity, quadratic root location, AM-GM-HM inequalities, and binomial coefficients.',
    },
    topics: [
      {
        id: 'math-topic-jee-complex-numbers',
        title: 'Complex Numbers, Argand Geometry & Roots of Unity',
        description: 'Modulus-argument form, rotation theorem, and nth roots of unity identities.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'math-sub-argand-de-moivre',
            title: 'De Moivre Rotation & Roots of Unity',
            description: 'Complex rotations, geometric loci in the Argand plane, and cyclotomic sums.',
            concepts: [
              {
                id: 'concept-jee-de-moivre-roots',
                title: 'De Moivre Theorem & nth Roots of Unity',
                summary: 'Represent powers and roots of complex numbers via Euler form r·e^(iθ) and exploit symmetric cyclotomic identities.',
                difficulty: 'hard',
                estimatedMinutes: 20,
                xpReward: 40,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'stem_olympiad'],
                formalDefinition:
                  'For z = r(cosθ + i sinθ), De Moivre’s Theorem gives z^n = r^n(cos(nθ) + i sin(nθ)). The n distinct roots of z^n = 1 are ω_k = e^(2πik/n) for k = 0, 1, …, n − 1, satisfying Σ ω_k = 0 for n ≥ 2.',
                intuitiveExplanation:
                  'Multiplying two complex numbers stretches lengths and adds angles, so the nth roots of 1 sit at the vertices of a regular n-gon inscribed on the unit circle whose vector sum cancels to zero.',
                keyFormulas: [
                  {
                    label: 'Euler / De Moivre Identity',
                    latex: '(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)',
                    explanation: 'Converts integer powers into angle multiplication.',
                  },
                  {
                    label: 'Cube Roots of Unity',
                    latex: '1 + \\omega + \\omega^2 = 0, \\quad \\omega^3 = 1',
                    explanation: 'Core identity used in JEE determinant and polynomial simplifications.',
                  },
                ],
                keyObservations: [
                  'Multiplying a vector (z₂ − z₁) by e^(iα) rotates it counterclockwise by α around z₁.',
                  'If a polynomial with real coefficients has a non-real root a + ib, its conjugate a − ib is also a root.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-complex-01',
                    title: 'Evaluating High Powers via Cube Roots of Unity',
                    problemStatement: 'If ω is a non-real cube root of unity, compute the value of (1 + ω − ω²)⁶.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Use 1 + ω + ω² = 0 to replace 1 + ω = −ω².',
                      'Inside parentheses: (−ω² − ω²)⁶ = (−2ω²)⁶ = 64 ω¹².',
                      'Since ω³ = 1, ω¹² = (ω³)⁴ = 1, giving 64.',
                    ],
                    finalAnswer: '64',
                    keyTakeaway: 'Always collapse 1 + ω or 1 + ω² before raising to a power.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-complex-01',
                    trapTitle: 'Ordering complex numbers with inequalities',
                    flawedReasoning: 'Writing z₁ > z₂ for non-real complex numbers.',
                    correctConcept: 'Only moduli |z| and real/imaginary parts are ordered on ℝ; ℂ is not an ordered field.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If ω is a non-real cube root of unity, what is the value of (1 − ω + ω²)(1 + ω − ω²)?',
                  options: ['4', '0', '−2', '1'],
                  correctIndex: 0,
                  explanation: '1 − ω + ω² = −2ω and 1 + ω − ω² = −2ω², so their product is 4ω³ = 4.',
                },
              },
            ],
          },
          {
            id: 'math-sub-complex-loci',
            title: 'Argand Plane Loci & Triangle Inequality',
            description: 'Circles, perpendicular bisectors, and extremal modulus problems.',
            concepts: [
              {
                id: 'concept-jee-argand-loci',
                title: 'Complex Loci & Modulus Triangle Inequality',
                summary: 'Translate algebraic equations in |z − a| into Euclidean circles, bisectors, and ellipses.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 35,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'In the Argand plane, |z − z₁| = |z − z₂| defines the perpendicular bisector of segment z₁z₂, while |z − z₀| = R defines a circle centered at z₀ of radius R. Extreme values follow from ||z₁| − |z₂|| ≤ |z₁ + z₂| ≤ |z₁| + |z₂|.',
                intuitiveExplanation:
                  'Modulus |z − z₀| is simply Euclidean distance between point z and anchor z₀, turning complex equations directly into coordinate geometry without expanding x + iy.',
                keyFormulas: [
                  {
                    label: 'Triangle Inequality Bounds',
                    latex: '\\big||z_1| - |z_2|\\big| \\le |z_1 + z_2| \\le |z_1| + |z_2|',
                    explanation: 'Determines minimum and maximum distance from the origin.',
                  },
                ],
                keyObservations: [
                  'Re((z − z₁)/(z − z₂)) = 0 corresponds to a circle with diameter endpoints z₁ and z₂ (excluding z₂).',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-loci-01',
                    title: 'Minimum Modulus on a Shifted Circle',
                    problemStatement: 'If |z − 4| ≤ 3, find the minimum value of |z|.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      '|z − 4| ≤ 3 represents the closed disk centered at (4, 0) with radius 3.',
                      'By reverse triangle inequality, |z| ≥ |4| − |z − 4| ≥ 4 − 3 = 1.',
                    ],
                    finalAnswer: '1',
                    keyTakeaway: 'Draw the circle around (4, 0) with radius 3; the closest point to the origin is at distance 4 − 3 = 1.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-loci-01',
                    trapTitle: 'Forgetting |z − a| = k is always a distance',
                    flawedReasoning: 'Expanding z = x + iy unnecessarily into high-degree algebra.',
                    correctConcept: 'Interpret |z − a| geometrically as distance to point a first.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What curve is represented by |z − 2| + |z + 2| = 6 in the Argand plane?',
                  options: ['An ellipse with foci at ±2', 'A circle of radius 6', 'A hyperbola', 'A straight line'],
                  correctIndex: 0,
                  explanation: 'Sum of distances to two fixed foci (−2, 0) and (2, 0) equaling constant 6 > 4 defines an ellipse.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-jee-quadratics-sequences',
        title: 'Quadratic Equations, Location of Roots & Sequences',
        description: 'Vieta relations, discriminant bounds, arithmetic-geometric progressions, and binomial sums.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-quadratics-binomial',
            title: 'Quadratic Location of Roots & Binomial Sums',
            description: 'Sign conditions on a·f(k) and binomial coefficient identities.',
            concepts: [
              {
                id: 'concept-jee-quadratic-roots',
                title: 'Location of Quadratic Roots & Vieta Identities',
                summary: 'Constrain parameters so both roots of ax² + bx + c = 0 exceed, straddle, or lie between target thresholds.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 35,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'For f(x) = ax² + bx + c with a ≠ 0, real number k lies strictly between the two distinct roots iff a·f(k) < 0. Both roots exceed k iff Δ ≥ 0, −b/(2a) > k, and a·f(k) > 0.',
                intuitiveExplanation:
                  'Multiplying by leading coefficient a normalizes parabolas to open upward, so checking the sign of a·f(k), vertex position −b/(2a), and discriminant Δ pins roots cleanly onto intervals.',
                keyFormulas: [
                  {
                    label: 'Between Roots Condition',
                    latex: 'a\\,f(k) < 0 \\iff k \\in (\\alpha, \\beta)',
                    explanation: 'Automatically implies Δ > 0 because the parabola crosses zero on both sides of k.',
                  },
                ],
                keyObservations: [
                  'When checking k between α and β, Δ > 0 is redundant once a·f(k) < 0.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-quad-01',
                    title: 'Symmetrical Sum of Squares of Roots',
                    problemStatement: 'If α, β are roots of x² − 5x + 6 = 0, compute α² + β².',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Vieta formulas: α + β = 5 and αβ = 6.',
                      'α² + β² = (α + β)² − 2αβ = 25 − 12 = 13.',
                    ],
                    finalAnswer: '13',
                    keyTakeaway: 'Express symmetric root polynomials in terms of elementary sums (α + β) and products (αβ).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-quad-01',
                    trapTitle: 'Omitting vertex check −b/(2a) > k',
                    flawedReasoning: 'Only requiring Δ ≥ 0 and a·f(k) > 0 for both roots > k.',
                    correctConcept: 'Both roots could still be strictly less than k without checking vertex −b/(2a) > k.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which single inequality guarantees that x = 1 lies strictly between the roots of x² − mx + 2 = 0?',
                  options: ['f(1) < 0 (so m > 3)', 'Δ > 0 only', 'f(1) > 0', 'm/2 > 1'],
                  correctIndex: 0,
                  explanation: 'Since a = 1 > 0, x = 1 lies strictly between the roots iff 1·f(1) = 3 − m < 0, i.e., m > 3.',
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
    chapterId: 'math-ch-jee-vectors-3d-ode',
    examTracks: ['all', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'math-ch-jee-vectors-3d-ode',
      title: 'JEE 3D Geometry, Determinants & Differential Equations',
      sequenceOrder: 14,
      description:
        'Scalar and vector triple products, skew lines shortest distance, plane intersections, Cramer’s rule, and first-order linear ODEs.',
    },
    topics: [
      {
        id: 'math-topic-jee-vectors-3d',
        title: '3D Vectors, Skew Lines & Plane Geometry',
        description: 'Cross/triple products, shortest distance between skew lines, and line-plane angles.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'math-sub-3d-skew-planes',
            title: 'Skew Lines & Triple Products',
            description: 'Box product [a b c], vector triple product, and perpendicular distances in ℝ³.',
            concepts: [
              {
                id: 'concept-jee-skew-lines-distance',
                title: 'Shortest Distance Between Skew Lines in 3D',
                summary: 'Compute the perpendicular distance between non-intersecting, non-parallel lines via scalar projection onto b₁ × b₂.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 38,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'For skew lines r = a₁ + λb₁ and r = a₂ + μb₂ with b₁ × b₂ ≠ 0, the shortest distance is d = |(a₂ − a₁) · (b₁ × b₂)| / |b₁ × b₂|.',
                intuitiveExplanation:
                  'The cross product b₁ × b₂ points along the unique common perpendicular to both lines, so projecting the connector (a₂ − a₁) onto that unit normal isolates the minimum gap.',
                keyFormulas: [
                  {
                    label: 'Skew Line Shortest Distance',
                    latex: 'd = \\frac{|(\\mathbf{a}_2 - \\mathbf{a}_1) \\cdot (\\mathbf{b}_1 \\times \\mathbf{b}_2)|}{|\\mathbf{b}_1 \\times \\mathbf{b}_2|}',
                    explanation: 'Zero numerator signals coplanar (intersecting) lines when b₁ × b₂ ≠ 0.',
                  },
                ],
                keyObservations: [
                  'If b₁ × b₂ = 0 (parallel lines), use |(a₂ − a₁) × b₁| / |b₁| instead.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-3d-01',
                    title: 'Skew Line Perpendicular Distance',
                    problemStatement: 'Find the shortest distance between r = i + λj and r = k + μi.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Here a₂ − a₁ = k − i, b₁ = j, b₂ = i.',
                      'b₁ × b₂ = j × i = −k with magnitude 1.',
                      'd = |(k − i) · (−k)| / 1 = 1.',
                    ],
                    finalAnswer: '1',
                    keyTakeaway: 'When lines lie on perpendicular axes shifted by 1 along z, the gap equals 1 directly.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-3d-01',
                    trapTitle: 'Dividing by zero on parallel lines',
                    flawedReasoning: 'Applying the skew-line formula when b₁ and b₂ are collinear.',
                    correctConcept: 'Check b₁ × b₂ = 0 first; parallel lines require |(a₂ − a₁) × b₁| / |b₁|.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When two non-parallel 3D lines r = a₁ + λb₁ and r = a₂ + μb₂ intersect, what equals zero?',
                  options: ['Scalar triple product [a₂ − a₁, b₁, b₂]', 'b₁ · b₂', 'b₁ × b₂', '|a₂ − a₁|'],
                  correctIndex: 0,
                  explanation: 'Coplanar non-parallel lines intersect iff shortest distance numerator (a₂ − a₁)·(b₁ × b₂) = 0.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-jee-determinants-ode',
        title: 'Determinants, Linear Systems & Linear First-Order ODEs',
        description: 'Cramer consistency conditions and integrating factors for dy/dx + P(x)y = Q(x).',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-cramer-integrating-factor',
            title: 'Cramer Consistency & Integrating Factor ODEs',
            description: 'Row-column invariants and exact integrating factor multiplication.',
            concepts: [
              {
                id: 'concept-jee-integrating-factor',
                title: 'First-Order Linear ODEs & Integrating Factors',
                summary: 'Solve dy/dx + P(x)y = Q(x) by multiplying through by e^(∫P(x)dx) to collapse the left side into a product rule derivative.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 34,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'ap_stem'],
                formalDefinition:
                  'Given dy/dx + P(x)y = Q(x), multiplying by IF = exp(∫P(x)dx) transforms the equation into d/dx [y · IF] = Q(x) · IF, giving general solution y · IF = ∫ Q(x) · IF dx + C.',
                intuitiveExplanation:
                  'Adding P(x)y looks almost like the product rule for d/dx(y·μ); choosing μ\' = P·μ turns μ\' into e^(∫P dx) so both terms fold into a single derivative.',
                keyFormulas: [
                  {
                    label: 'Integrating Factor',
                    latex: '\\text{IF}(x) = e^{\\int P(x)\\,dx}, \\quad y\\cdot\\text{IF} = \\int Q(x)\\cdot\\text{IF}\\,dx + C',
                    explanation: 'Always normalize the coefficient of dy/dx to 1 before reading P(x).',
                  },
                ],
                keyObservations: [
                  'Bernoulli equations dy/dx + Py = Q y^n reduce to linear form via substitution v = y^(1−n).',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-ode-01',
                    title: 'Linear ODE with Power Integrating Factor',
                    problemStatement: 'Find the integrating factor of x dy/dx + 2y = x² (for x > 0).',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Divide by x to normalize: dy/dx + (2/x)y = x.',
                      'Here P(x) = 2/x, so ∫(2/x)dx = 2 ln x = ln(x²).',
                      'IF = e^(ln(x²)) = x².',
                    ],
                    finalAnswer: 'x^2',
                    keyTakeaway: 'Never read P(x) before dividing out any coefficient multiplying dy/dx.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-ode-01',
                    trapTitle: 'Skipping leading coefficient normalization',
                    flawedReasoning: 'Setting P(x) = 2 instead of 2/x in x y\' + 2y = x².',
                    correctConcept: 'Rewrite strictly in standard form y\' + P(x)y = Q(x) first.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the integrating factor for dy/dx − y = e^x?',
                  options: ['e^(-x)', 'e^x', 'x', '−1'],
                  correctIndex: 0,
                  explanation: 'P(x) = −1 gives ∫P(x)dx = −x, so IF = e^(−x).',
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
    chapterId: 'math-ch-nsejs-ap-trig-prep',
    examTracks: ['all', 'jee_main', 'jee_advanced', 'ap_stem', 'nsejs'],
    newChapter: {
      id: 'math-ch-nsejs-ap-trig-prep',
      title: 'Trigonometry, AP L’Hôpital & NSEJS Olympiad Geometry',
      sequenceOrder: 15,
      description:
        'Trigonometric equations and compound-angle identities, AP Calculus L’Hôpital/improper integrals, and NSEJS Euclidean circle theorems.',
    },
    topics: [
      {
        id: 'math-topic-ap-lhopital-improper',
        title: 'AP Calculus: L’Hôpital’s Rule, Riemann Sums & Improper Integrals',
        description: 'Indeterminate ratio limits (0/0, ∞/∞), midpoint/trapezoidal approximations, and p-integral convergence.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-ap-lhopital-p-integral',
            title: 'L’Hôpital Indeterminate Forms & Improper Convergence',
            description: 'Differentiating numerator and denominator separately and testing unbounded integral tails.',
            concepts: [
              {
                id: 'concept-ap-lhopital-improper',
                title: 'L’Hôpital’s Rule & Improper p-Integrals',
                summary: 'Evaluate 0/0 and ∞/∞ limits by ratio of derivatives and determine convergence of ∫₁^∞ x^(−p) dx.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'ap_stem', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'If f, g are differentiable near c with g\'(x) ≠ 0 and lim f(x)/g(x) yields 0/0 or ±∞/∞, then lim f(x)/g(x) = lim f\'(x)/g\'(x) when the latter limit exists. Improper integral ∫₁^∞ x^(−p) dx converges iff p > 1.',
                intuitiveExplanation:
                  'Near a tie where both top and bottom vanish or blow up, the ratio of instantaneous speeds f\'/g\' governs who wins; for infinite areas under x^(−p), powers steeper than 1/x shrink fast enough to stay finite.',
                keyFormulas: [
                  {
                    label: 'Improper p-Integral Criterion',
                    latex: '\\int_1^{\\infty} \\frac{1}{x^p}\\,dx \\text{ converges } \\iff p > 1',
                    explanation: 'Value equals 1/(p − 1) whenever p > 1.',
                  },
                ],
                keyObservations: [
                  'Never differentiate f(x)/g(x) with the quotient rule when applying L’Hôpital’s Rule.',
                ],
                workedExamples: [
                  {
                    id: 'we-ap-lhopital-01',
                    title: 'Convergent Improper Tail Integral',
                    problemStatement: 'Evaluate ∫₁^∞ 4 / x³ dx.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Set up limit: lim_{b→∞} ∫₁^b 4x^(−3) dx = lim_{b→∞} [−2x^(−2)]₁^b.',
                      'Evaluate: lim_{b→∞} (−2/b² + 2) = 2.',
                    ],
                    finalAnswer: '2',
                    keyTakeaway: 'Since p = 3 > 1, the tail decays rapidly and converges to 2.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ap-lhopital-01',
                    trapTitle: 'Applying L’Hôpital to non-indeterminate limits',
                    flawedReasoning: 'Differentiating top and bottom when denominator limit is non-zero.',
                    correctConcept: 'Verify 0/0 or ∞/∞ explicitly before every L’Hôpital step.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For which exponent p does ∫₁^∞ x^(−p) dx converge?',
                  options: ['p = 1.5', 'p = 1', 'p = 0.5', 'p = 0'],
                  correctIndex: 0,
                  explanation: 'p = 1 gives diverging ln(b); convergence on [1, ∞) requires strictly p > 1.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-jee-trig-nsejs-geo',
        title: 'Trigonometric Equations & NSEJS Circle Geometry',
        description: 'General solutions of trig equations, R sin(θ+α) bounds, power of a point, and cyclic quadrilaterals.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'math-sub-trig-cyclic-quad',
            title: 'Trigonometric Bounds & Power of a Point',
            description: 'Maximum amplitude √(a² + b²) and chord/secant power invariants.',
            concepts: [
              {
                id: 'concept-nsejs-power-of-point',
                title: 'Power of a Point, Cyclic Quadrilaterals & Trig Bounds',
                summary: 'Relate intersecting chord/secant segments via PA·PB = PT² and bound a cosθ + b sinθ within ±√(a² + b²).',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'nsejs', 'jee_main', 'stem_olympiad'],
                formalDefinition:
                  'For any secant through point P cutting circle ω at A and B and tangent touching at T, the signed product PA·PB = PT² depends only on OP² − R². For real a, b, |a cosθ + b sinθ| ≤ √(a² + b²).',
                intuitiveExplanation:
                  'Similar triangles formed by inscribed angles force chord product invariance regardless of which secant direction you draw through P.',
                keyFormulas: [
                  {
                    label: 'Intersecting Chord / Tangent-Secant Theorem',
                    latex: 'PA \\cdot PB = PC \\cdot PD = PT^2',
                    explanation: 'Cornerstone circle-similarity identity for NSEJS and JEE geometry.',
                  },
                ],
                keyObservations: [
                  'Opposite angles of a cyclic quadrilateral always sum to 180°.',
                ],
                workedExamples: [
                  {
                    id: 'we-nsejs-geo-01',
                    title: 'Tangent Segment Length via Secant Product',
                    problemStatement: 'From external point P, a secant intersects a circle at A and B with PA = 4 and AB = 5. Find tangent length PT.',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Compute total secant length PB = PA + AB = 4 + 5 = 9.',
                      'Apply Tangent-Secant Theorem: PT² = PA · PB = 4 × 9 = 36, so PT = 6.',
                    ],
                    finalAnswer: '6',
                    keyTakeaway: 'Always multiply PA by full segment PB (not AB).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nsejs-geo-01',
                    trapTitle: 'Multiplying PA by AB instead of PB',
                    flawedReasoning: 'Writing PT² = PA · AB for an external point.',
                    correctConcept: 'Power of a point measures both segments starting from P: PA and PB = PA + AB.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the maximum possible value of 3 sinθ + 4 cosθ for real θ?',
                  options: ['5', '7', '1', '25'],
                  correctIndex: 0,
                  explanation: 'Amplitude equals √(3² + 4²) = 5.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // COMPUTER SCIENCE — ICT International Coding Test (Tries, KMP, DSU, Bitmask DP)
  // =========================================================================
  {
    subjectId: 'cs',
    chapterId: 'cs-ch-ict-strings-trees',
    examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
    newChapter: {
      id: 'cs-ch-ict-strings-trees',
      title: 'ICT Olympiad: Tries, String Matching, DSU & Bitmask DP',
      sequenceOrder: 10,
      description:
        'Competitive programming mastery for the ICT International Coding Test: prefix tries, KMP failure arrays, Disjoint Set Union, Kruskal MST, and bitmask subset DP.',
    },
    topics: [
      {
        id: 'cs-topic-ict-strings-tries',
        title: 'Tries, KMP Prefix Function & Rolling Hash',
        description: 'Linear-time O(N + M) pattern matching, deterministic prefix trees, and Rabin-Karp hashing.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'cs-sub-tries-kmp',
            title: 'Prefix Tries & KMP Automaton',
            description: 'Longest proper border π[i] transitions and bit-trie XOR maximization.',
            concepts: [
              {
                id: 'concept-ict-kmp-prefix',
                title: 'KMP Prefix Function & Trie Matching',
                summary: 'Skip redundant character comparisons in O(N + M) using the longest proper prefix-suffix table π[i].',
                difficulty: 'hard',
                estimatedMinutes: 20,
                xpReward: 42,
                examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
                formalDefinition:
                  'For pattern P[0..M−1], π[i] stores the length of the longest proper prefix of P[0..i] that is also a suffix of P[0..i]. Computing π and scanning text T[0..N−1] both take amortized O(N + M) time.',
                intuitiveExplanation:
                  'When a mismatch occurs at index j, π[j − 1] tells you the farthest checkpoint already matched inside the text so the text cursor never walks backward.',
                keyFormulas: [
                  {
                    label: 'KMP Recurrence & Time Complexity',
                    latex: 'T(N, M) = O(N + M), \\quad S(M) = O(M)',
                    explanation: 'Each mismatch strictly reduces potential j at most as many times as it incremented.',
                  },
                ],
                keyObservations: [
                  'Binary Tries answer maximum pairwise XOR queries against a set in O(31) bit steps per query.',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-kmp-01',
                    title: 'Prefix Array for Repeating Pattern',
                    problemStatement: 'Compute the KMP prefix array π for pattern "ababa".',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'i=0 ("a"): π[0] = 0.',
                      'i=1 ("ab"): π[1] = 0.',
                      'i=2 ("aba"): proper border "a" has length 1 -> π[2] = 1.',
                      'i=3 ("abab"): proper border "ab" -> π[3] = 2; i=4 ("ababa"): "aba" -> π[4] = 3.',
                    ],
                    finalAnswer: '[0, 0, 1, 2, 3]',
                    keyTakeaway: 'π[i] tracks proper borders only—never the entire prefix i + 1.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-kmp-01',
                    trapTitle: 'Setting π[0] = 1 or allowing non-proper prefix match',
                    flawedReasoning: 'Counting the whole string as its own border causes an infinite fallback loop.',
                    correctConcept: 'A KMP border must be strictly shorter than i + 1, so π[0] is always 0.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the worst-case time complexity of Knuth-Morris-Pratt (KMP) to find all occurrences of length-M pattern in length-N text?',
                  options: ['O(N + M)', 'O(N · M)', 'O(N log M)', 'O(M²)'],
                  correctIndex: 0,
                  explanation: 'Amortized potential on fallback transitions keeps both preprocessing and search strictly O(N + M).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'cs-topic-ict-dsu-bitmask-dp',
        title: 'Disjoint Set Union, Kruskal MST & Bitmask DP',
        description: 'Path compression with union-by-rank (α(n)), minimum spanning trees, and subset state compression.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'cs-sub-dsu-bitmask',
            title: 'DSU Near-Constant Union-Find & Subset Bitmasks',
            description: 'Inverse Ackermann amortized queries and O(n² · 2ⁿ) Hamiltonian/assignment DP.',
            concepts: [
              {
                id: 'concept-ict-dsu-bitmask',
                title: 'Disjoint Set Union (DSU) & Bitmask Subset DP',
                summary: 'Merge connected components in O(α(n)) amortized time and encode small visited sets as integer bitmasks 0..(2ⁿ − 1).',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 44,
                examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
                formalDefinition:
                  'Combining path compression in find(x) with union by rank/size achieves O(α(n)) amortized time per operation. Bitmask DP encodes subset S ⊆ {0,…,n−1} as mask ∈ [0, 2ⁿ) with membership test (mask >> i) & 1.',
                intuitiveExplanation:
                  'Path compression flattens every queried node straight under the root leader, while bitmasks pack boolean arrays of size n ≤ 20 into single CPU integers for instant transitions.',
                keyFormulas: [
                  {
                    label: 'Bitmask Transition',
                    latex: '\\text{nextMask} = \\text{mask} \\mid (1 \\ll v)',
                    explanation: 'Marks vertex v as visited in O(1) bitwise time.',
                  },
                ],
                keyObservations: [
                  'Kruskal’s MST sorts edges by weight and uses DSU to accept an edge iff find(u) ≠ find(v).',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-dsu-01',
                    title: 'Bitmask Subset Count',
                    problemStatement: 'How many distinct subsets (states) exist in a Bitmask DP over n = 10 vertices?',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Each of the 10 vertices can be absent (0) or present (1).',
                      'Total masks = 2¹⁰ = 1024.',
                    ],
                    finalAnswer: '1024',
                    keyTakeaway: 'Bitmask DP is tractable up to roughly n ≤ 20 (2²⁰ ≈ 10⁶ states).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-dsu-01',
                    trapTitle: 'Operator precedence bugs with bitwise masks',
                    flawedReasoning: 'Writing mask & 1 << i == 0 without parentheses in C++/Java/JS.',
                    correctConcept: 'Bitwise shifts and comparisons bind unpredictably across languages; always write ((mask >> i) & 1) === 0.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the amortized time complexity per operation of DSU with BOTH path compression and union by rank?',
                  options: ['O(α(n)) inverse Ackermann', 'O(log² n)', 'O(n)', 'O(√n)'],
                  correctIndex: 0,
                  explanation: 'Tarjan proved that pairing path compression with union by rank/size achieves O(α(n)), practically ≤ 5 for any realistic n.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // PHYSICS — JEE Main / Advanced + IPhO Relativity/Maxwells + NSEJS Optics/Circuits
  // =========================================================================
  {
    subjectId: 'physics',
    chapterId: 'phys-ch-jee-magnetism-ac',
    examTracks: ['all', 'jee_main', 'jee_advanced', 'iapt_exams'],
    newChapter: {
      id: 'phys-ch-jee-magnetism-ac',
      title: 'JEE Magnetism, Moving Charges & Alternating Current',
      sequenceOrder: 10,
      description:
        'Biot-Savart law, Ampere circuital law, cyclotron radius, LCR series resonance, power factor, and Maxwell displacement current.',
    },
    topics: [
      {
        id: 'phys-topic-jee-magnetostatics',
        title: 'Biot-Savart Law, Ampere Law & Cyclotron Motion',
        description: 'Magnetic fields from loops/wires and circular trajectories qvB = mv²/r.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'phys-sub-biot-savart-lorentz',
            title: 'Lorentz Force & Circuital Magnetic Fields',
            description: 'Radius, time period independence of speed, and coaxial solenoid fields.',
            concepts: [
              {
                id: 'concept-jee-lorentz-cyclotron',
                title: 'Lorentz Force & Uniform-Field Cyclotron Motion',
                summary: 'Charges entering perpendicular to uniform B execute circular orbits with speed-independent frequency ω = qB/m.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 34,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'ap_stem'],
                formalDefinition:
                  'Lorentz force F = q(E + v × B) does zero work from the magnetic component because F_B ⊥ v. When v ⊥ B and E = 0, radius r = mv/(qB) and angular cyclotron frequency ω = qB/m.',
                intuitiveExplanation:
                  'Magnetic force always pushes sideways to velocity—just like a tetherball rope—curving the path into a circle without ever changing speed or kinetic energy.',
                keyFormulas: [
                  {
                    label: 'Cyclotron Radius & Frequency',
                    latex: 'r = \\frac{mv}{qB}, \\quad T = \\frac{2\\pi m}{qB}',
                    explanation: 'Period T depends only on charge-to-mass ratio and B, independent of speed v.',
                  },
                ],
                keyObservations: [
                  'If v has a parallel component v_∥ along B, the trajectory becomes a constant-pitch helix.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-mag-01',
                    title: 'Magnetic Force Work Invariant',
                    problemStatement: 'A proton with kinetic energy 5 MeV enters a uniform perpendicular magnetic field B = 2 T. What is its kinetic energy after completing half a circle?',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Magnetic force F_B = q(v × B) is strictly perpendicular to instantaneous velocity v.',
                      'Hence instantaneous power P = F_B · v = 0, conserving kinetic energy at 5 MeV.',
                    ],
                    finalAnswer: '5 MeV',
                    keyTakeaway: 'Pure static magnetic fields never alter a particle’s speed or kinetic energy.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-mag-01',
                    trapTitle: 'Assuming faster protons take longer to orbit',
                    flawedReasoning: 'Believing larger speed means longer period in a cyclotron.',
                    correctConcept: 'Radius scales linearly with speed (r ∝ v), keeping orbital time T = 2πr/v = 2πm/(qB) constant.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a charged particle doubles its perpendicular speed inside a uniform magnetic field, what happens to its orbital radius r?',
                  options: ['Doubles', 'Halves', 'Stays constant', 'Quadruples'],
                  correctIndex: 0,
                  explanation: 'From r = mv/(qB), radius is directly proportional to perpendicular speed v.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-jee-ac-resonance',
        title: 'Alternating Current, LCR Resonance & Quality Factor',
        description: 'Phasor impedance Z, resonant frequency ω₀ = 1/√(LC), power factor cosφ, and bandwidth.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'phys-sub-lcr-phasors',
            title: 'Series LCR Impedance & Resonance',
            description: 'Cancelation of inductive X_L and capacitive X_C reactances at ω₀.',
            concepts: [
              {
                id: 'concept-jee-lcr-resonance',
                title: 'Series LCR Impedance & Resonant Tuning',
                summary: 'Minimize total AC impedance Z = √(R² + (X_L − X_C)²) when inductive and capacitive reactances balance.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'In a series LCR circuit driven at angular frequency ω, impedance Z = √(R² + (ωL − 1/(ωC))²). Resonance occurs at ω₀ = 1/√(LC) where Z = R, power factor cosφ = 1, and quality factor Q = (1/R)√(L/C).',
                intuitiveExplanation:
                  'Inductor voltage leads current by 90° while capacitor voltage lags by 90°; at resonance their opposing pushes cancel completely, leaving only resistor R to limit current.',
                keyFormulas: [
                  {
                    label: 'Resonant Frequency & Average Power',
                    latex: '\\omega_0 = \\frac{1}{\\sqrt{LC}}, \\quad P_{\\text{avg}} = V_{\\text{rms}} I_{\\text{rms}} \\cos\\phi',
                    explanation: 'Purely reactive elements (L, C) dissipate zero average power over a full cycle.',
                  },
                ],
                keyObservations: [
                  'At resonance, individual voltages across L or C can exceed the source voltage by a factor of Q.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-ac-01',
                    title: 'LCR Resonant Frequency',
                    problemStatement: 'Find resonant angular frequency ω₀ for L = 4 mH and C = 10 μF.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'LC = (4 × 10⁻³)(10 × 10⁻⁶) = 4 × 10⁻⁸ s².',
                      'ω₀ = 1 / √(4 × 10⁻⁸) = 1 / (2 × 10⁻⁴) = 5000 rad/s.',
                    ],
                    finalAnswer: '5000 rad/s',
                    keyTakeaway: 'Convert millihenries and microfarads carefully into base SI units before taking the square root.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-ac-01',
                    trapTitle: 'Adding scalar peak voltages V_R + V_L + V_C',
                    flawedReasoning: 'Computing source amplitude directly as V_R + V_L + V_C.',
                    correctConcept: 'Voltages differ in phase by 90°, so V_rms = √(V_R² + (V_L − V_C)²).',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the power factor cosφ of a series LCR circuit at resonance?',
                  options: ['1', '0', '0.5', '1/√2'],
                  correctIndex: 0,
                  explanation: 'At resonance X_L = X_C, impedance Z = R, so phase angle φ = 0 and cosφ = R/Z = 1.',
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
    chapterId: 'phys-ch-jee-ray-nuclear-semi',
    examTracks: ['all', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'phys-ch-jee-ray-nuclear-semi',
      title: 'JEE Ray Optics, Nuclear Physics & Semiconductors',
      sequenceOrder: 11,
      description:
        'Total internal reflection, prism minimum deviation, radioactive binding energy, and p-n junction/logic gates.',
    },
    topics: [
      {
        id: 'phys-topic-jee-prisms-tir',
        title: 'Total Internal Reflection & Prism Minimum Deviation',
        description: 'Critical angle sinθ_c = n₂/n₁ and symmetric minimum deviation formula.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'phys-sub-prism-tir',
            title: 'Critical Angle & Minimum Deviation',
            description: 'Symmetric ray refraction inside triangular prisms.',
            concepts: [
              {
                id: 'concept-jee-prism-deviation',
                title: 'Prism Minimum Deviation & Total Internal Reflection',
                summary: 'Evaluate minimum prism bending δ_m when ray traverses symmetrically (i = e) and find critical TIR angles.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'nsejs'],
                formalDefinition:
                  'At minimum deviation δ_m in a prism of apex angle A and index n, r₁ = r₂ = A/2 and n = sin((A + δ_m)/2) / sin(A/2). Total internal reflection requires n₁ > n₂ and incidence θ > arcsin(n₂/n₁).',
                intuitiveExplanation:
                  'Reversibility of light means the extremum of bending happens when entrance and exit geometry mirror each other across the prism’s central bisector.',
                keyFormulas: [
                  {
                    label: 'Prism Refractive Index',
                    latex: 'n = \\frac{\\sin\\left(\\frac{A + \\delta_m}{2}\\right)}{\\sin(A/2)}',
                    explanation: 'Valid strictly at minimum deviation where r₁ = r₂ = A/2.',
                  },
                ],
                keyObservations: [
                  'No light emerges from the second face if apex angle A exceeds 2θ_c.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-prism-01',
                    title: 'Prism Index from Minimum Deviation',
                    problemStatement: 'An equilateral prism (A = 60°) produces minimum deviation δ_m = 30°. Find refractive index n.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Compute numerator: sin((60° + 30°)/2) = sin(45°) = 1/√2.',
                      'Compute denominator: sin(30°) = 1/2 -> n = (1/√2)/(1/2) = √2 ≈ 1.414.',
                    ],
                    finalAnswer: '1.414',
                    keyTakeaway: 'At A = 60° and δ_m = 30°, refractive index equals √2.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-prism-01',
                    trapTitle: 'Expecting TIR when entering optically denser medium',
                    flawedReasoning: 'Testing critical angle from air into glass.',
                    correctConcept: 'TIR only occurs when attempting to cross from higher index n₁ into lower index n₂.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For total internal reflection at an interface between glass (n = 1.5) and air (n = 1.0), light must travel from:',
                  options: ['Glass into air at θ > arcsin(2/3)', 'Air into glass at θ > arcsin(2/3)', 'Glass into air at any angle', 'Air into glass at grazing incidence'],
                  correctIndex: 0,
                  explanation: 'TIR demands traveling from denser glass toward air beyond θ_c = arcsin(1.0/1.5) = arcsin(2/3).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-jee-nuclear-semiconductors',
        title: 'Nuclear Binding Energy, Half-Life & Semiconductor Diodes',
        description: 'Mass defect Δm·c², exponential decay N = N₀e^(−λt), Zener diodes, and Boolean gates.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'phys-sub-nuclear-diodes',
            title: 'Radioactive Decay & p-n Junction Rectifiers',
            description: 'Activity kinetics A = λN and forward/reverse diode biasing.',
            concepts: [
              {
                id: 'concept-jee-nuclear-decay',
                title: 'Nuclear Binding Energy & Exponential Decay Kinetics',
                summary: 'Compute energy released via binding energy changes ΔBE and track remaining undecayed nuclei over half-lives.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 30,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'Radioactive decay obeys N(t) = N₀ e^(−λt) = N₀ (1/2)^(t / T_{1/2}) with mean lifetime τ = 1/λ = T_{1/2}/ln(2). Energy released Q in a reaction equals Σ BE_products − Σ BE_reactants.',
                intuitiveExplanation:
                  'Tighter-bound daughter nuclei sit in deeper energy wells than their parent, so the drop in mass defect escapes directly as kinetic energy Q.',
                keyFormulas: [
                  {
                    label: 'Half-Life Relation',
                    latex: 'T_{1/2} = \\frac{\\ln 2}{\\lambda} \\approx \\frac{0.693}{\\lambda}',
                    explanation: 'Activity A = λN decays with the exact same half-life.',
                  },
                ],
                keyObservations: [
                  'When two decay channels compete with λ₁ and λ₂, effective decay constant adds: λ_eff = λ₁ + λ₂.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-nuc-01',
                    title: 'Remaining Fraction After Three Half-Lives',
                    problemStatement: 'A sample has half-life 4 days. What fraction remains after 12 days?',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Number of half-lives n = 12 / 4 = 3.',
                      'Remaining fraction = (1/2)³ = 1/8 = 0.125.',
                    ],
                    finalAnswer: '0.125',
                    keyTakeaway: 'Count integer half-lives before reaching for exponentials.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-nuc-01',
                    trapTitle: 'Subtracting binding energy in the wrong order for Q-value',
                    flawedReasoning: 'Computing Q = BE_reactants − BE_products by analogy with rest mass.',
                    correctConcept: 'Since higher binding energy means LOWER rest mass, Q = BE_products − BE_reactants.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a nucleus can decay simultaneously via α (λ₁) and β (λ₂) channels, what is its effective decay constant λ_eff?',
                  options: ['λ₁ + λ₂', 'λ₁λ₂/(λ₁ + λ₂)', '|λ₁ − λ₂|', '√(λ₁λ₂)'],
                  correctIndex: 0,
                  explanation: 'Independent parallel decay probabilities sum directly: λ_eff = λ₁ + λ₂.',
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
    chapterId: 'phys-ch-ipho-relativity-nsejs',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'nsejs'],
    newChapter: {
      id: 'phys-ch-ipho-relativity-nsejs',
      title: 'IPhO Relativity, Maxwell Relations & NSEJS Circuits/Optics',
      sequenceOrder: 12,
      description:
        'Relativistic invariant 4-momentum for IPhO, thermodynamic Maxwell relations, and NSEJS DC circuits & refractive optics.',
    },
    topics: [
      {
        id: 'phys-topic-ipho-relativity-maxwell',
        title: 'IPhO Relativistic 4-Momentum & Thermodynamic Maxwell Relations',
        description: 'Energy-momentum invariant E² − (pc)² = (mc²)² and thermodynamic partial derivative cross-identities.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'phys-sub-ipho-4mom-maxwell',
            title: 'Lorentz Energy-Momentum & Thermodynamic Potentials',
            description: 'Threshold collision invariants and Helmholtz/Gibbs differential symmetries.',
            concepts: [
              {
                id: 'concept-ipho-4momentum-relativity',
                title: 'Relativistic 4-Momentum & Threshold Energy Invariants',
                summary: 'Bypass frame-by-frame Lorentz algebra using the scalar invariant (ΣE)² − |Σp⃗c|² across lab and center-of-momentum frames.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 50,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Every isolated relativistic system preserves total 4-momentum P^μ = (E/c, p⃗) with Lorentz scalar invariant P^μ P_μ = (E/c)² − p² = (M_inv c)². At particle-production threshold, all final products sit mutually at rest in the center-of-momentum frame.',
                intuitiveExplanation:
                  'Just as Pythagorean distance stays unchanged when you rotate axes, (E/c)² − |p⃗|² stays identical in every inertial frame—letting you equate the lab initial state straight to the CM threshold state.',
                keyFormulas: [
                  {
                    label: 'Energy-Momentum Lorentz Invariant',
                    latex: 'E^2 - (pc)^2 = (mc^2)^2',
                    explanation: 'Photons satisfy m = 0, hence E = pc.',
                  },
                ],
                keyObservations: [
                  'A single free photon cannot pair-produce an electron-positron pair in vacuum because momentum cannot be simultaneously conserved.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-rel-01',
                    title: 'Invariant Mass of Symmetric Photon Pair',
                    problemStatement: 'Two photons of energy E each collide head-on (180°). What is the invariant mass Mc² of the system?',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Total energy E_tot = E + E = 2E; total momentum p_tot = E/c − E/c = 0.',
                      'M c² = √(E_tot² − (p_tot c)²) = 2E.',
                    ],
                    finalAnswer: '2E',
                    keyTakeaway: 'Oppositely directed massless photons still possess non-zero system invariant mass!',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-rel-01',
                    trapTitle: 'Assuming massless photons yield zero invariant mass for a multi-photon system',
                    flawedReasoning: 'Summing individual rest masses 0 + 0 = 0.',
                    correctConcept: 'Invariant mass is NOT additive: M = √((ΣE)² − |Σpc|²)/c².',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For a particle of rest mass m moving with momentum p, what is its relativistic total energy E?',
                  options: ['√((pc)² + (mc²)²)', 'pc + mc²', 'mc² + p²/(2m)', '√((mc²)² − (pc)²)'],
                  correctIndex: 0,
                  explanation: 'Rearranging the Minkowski invariant gives E = √((pc)² + (mc²)²).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-nsejs-optics-circuits',
        title: 'NSEJS Current Electricity, Ohm Circuits & Snell Optics',
        description: 'Series/parallel resistor networks, Joule heating P = I²R, and Snell’s refraction law.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-nsejs-circuits-snell',
            title: 'NSEJS Resistor Networks & Snell Refraction',
            description: 'Equivalent resistance, internal cell resistance, and optical refraction invariants.',
            concepts: [
              {
                id: 'concept-nsejs-circuits-snell',
                title: 'NSEJS DC Resistor Power & Snell’s Law Invariants',
                summary: 'Solve multi-bulb DC power distributions and track bent light rays via n₁ sinθ₁ = n₂ sinθ₂.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                examTracks: ['all', 'nsejs', 'iapt_exams'],
                formalDefinition:
                  'In DC networks, series currents share I (so P = I²R ∝ R) while parallel branches share V (so P = V²/R ∝ 1/R). Across optical interfaces, n₁ sinθ₁ = n₂ sinθ₂ while wave frequency f stays invariant.',
                intuitiveExplanation:
                  'In series, the higher-resistance bottleneck traps more voltage drop; in parallel, the lower-resistance lane carries more current—and across glass interfaces, light slows down so its wavelength shrinks while frequency stays constant.',
                keyFormulas: [
                  {
                    label: 'Snell’s Law & Wavelength Ratio',
                    latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2, \\quad n_1 \\lambda_1 = n_2 \\lambda_2',
                    explanation: 'Angles are always measured from the surface normal.',
                  },
                ],
                keyObservations: [
                  'Maximum power transfers from a cell of internal resistance r to load R when R = r.',
                ],
                workedExamples: [
                  {
                    id: 'we-nsejs-circ-01',
                    title: 'Series vs Parallel Power Brightness',
                    problemStatement: 'A 100 W and a 25 W (220 V rated) bulb are connected in SERIES across 220 V. Which bulb glows brighter (receives more power)?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Resistance R = V_rated² / P_rated, so the 25 W bulb has 4× higher resistance than the 100 W bulb.',
                      'In series both carry identical current I, so P = I²R gives 4× more power to the 25 W bulb.',
                    ],
                    finalAnswer: '25 W bulb',
                    keyTakeaway: 'Lower-wattage bulbs have higher resistance and therefore dominate power dissipation in series.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nsejs-circ-01',
                    trapTitle: 'Measuring Snell angles from the glass surface instead of the normal',
                    flawedReasoning: 'Using sin(grazing angle) in n₁ sinθ₁ = n₂ sinθ₂.',
                    correctConcept: 'Always measure θ from the perpendicular normal line to the interface.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When monochromatic light enters water (n = 1.33) from air (n = 1.00), which property of the light stays UNCHANGED?',
                  options: ['Frequency', 'Speed', 'Wavelength', 'Direction at oblique incidence'],
                  correctIndex: 0,
                  explanation: 'Optical boundary continuity forces wave frequency f to remain constant while speed and wavelength both shrink by factor 1/n.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // CHEMISTRY — JEE Organic GOC/Biomolecules + Inorganic/Ionic + IChO/NSEJS
  // =========================================================================
  {
    subjectId: 'chemistry',
    chapterId: 'chem-ch-jee-organic-goc-bio',
    examTracks: ['all', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'chem-ch-jee-organic-goc-bio',
      title: 'JEE General Organic Chemistry, Phenols & Biomolecules',
      sequenceOrder: 10,
      description:
        'Resonance, hyperconjugation, Hückel aromaticity, acidity/basicity ordering, phenols/ethers, and carbohydrate/amino-acid zwitterions.',
    },
    topics: [
      {
        id: 'chem-topic-jee-goc-aromaticity',
        title: 'GOC Electronic Effects & Hückel Aromaticity',
        description: 'Carbocation/carbanion stability via inductive, resonance, hyperconjugation, and (4n+2)π cycles.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'chem-sub-goc-huckel',
            title: 'Hyperconjugation, Resonance & Hückel (4n+2)π Rule',
            description: 'α-hydrogen counting and cyclic π-delocalization criteria.',
            concepts: [
              {
                id: 'concept-jee-goc-aromaticity',
                title: 'GOC Stability, Resonance & Hückel Aromaticity',
                summary: 'Rank carbocation, radical, and acid/base stability using resonance, hyperconjugation (α-H count), and 4n + 2 aromatic rings.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'ap_stem'],
                formalDefinition:
                  'A cyclic, planar, fully conjugated ring is aromatic if it contains (4n + 2) π electrons (n = 0, 1, 2, …) and antiaromatic if it is planar and conjugated with 4n π electrons. Carbocation stability scales with resonance delocalization and number of α-C–H hyperconjugating bonds.',
                intuitiveExplanation:
                  'Delocalizing charge across multiple p orbitals lowers kinetic energy sharply, whereas forcing 4n π electrons into a flat conjugated loop creates destabilizing antibonding half-filled levels.',
                keyFormulas: [
                  {
                    label: 'Hückel Aromatic Electron Count',
                    latex: 'N_\\pi = 4n + 2 \\quad (n \\in \\{0, 1, 2, \\dots\\})',
                    explanation: 'Counts p-orbital π bonds plus any conjugated lone pairs or empty p orbitals.',
                  },
                ],
                keyObservations: [
                  'Cyclopentadienyl anion (6π e⁻) and tropylium cation (6π e⁻) are both strongly aromatic.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-goc-01',
                    title: 'Counting Hyperconjugative α-Hydrogens',
                    problemStatement: 'How many hyperconjugable α-hydrogens stabilize the tert-butyl carbocation (CH₃)₃C⁺?',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'The sp² positively charged carbon is attached to three −CH₃ groups.',
                      'Each methyl group supplies 3 α-C–H bonds, totaling 3 × 3 = 9 α-hydrogens.',
                    ],
                    finalAnswer: '9',
                    keyTakeaway: 'Higher α-H count increases alkene and carbocation thermodynamic stability.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-goc-01',
                    trapTitle: 'Counting pyridine’s exocyclic nitrogen lone pair into the 6π ring',
                    flawedReasoning: 'Assuming pyridine has 8π electrons because N has a lone pair.',
                    correctConcept: 'Pyridine’s N lone pair sits in an orthogonal sp² orbital, leaving 6π aromatic electrons in the ring.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which species is aromatic according to Hückel’s (4n + 2)π rule?',
                  options: ['Cyclopentadienyl anion (C₅H₅⁻)', 'Cyclobutadiene (C₄H₄)', 'Cyclooctatetraene planar (C₈H₈)', 'Cyclopropenyl anion (C₃H₃⁻)'],
                  correctIndex: 0,
                  explanation: 'C₅H₅⁻ is planar, fully conjugated, and has 2 double bonds (4π) + 1 lone pair (2π) = 6π electrons (n = 1).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-jee-phenols-biomolecules',
        title: 'Alcohols, Phenols, Ethers & Biomolecule Zwitterions',
        description: 'Phenol acidity, Reimer-Tiemann/Kolbe reactions, anomeric mutarotation, and isoelectric pI.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'chem-sub-phenols-biochem',
            title: 'Phenol Acidity & Amino Acid Isoelectric Point',
            description: 'Substituent pKa shifts and zwitterion pI = (pK₁ + pK₂)/2.',
            concepts: [
              {
                id: 'concept-jee-phenols-zwitterions',
                title: 'Phenol Acidity & Amino Acid Isoelectric Point (pI)',
                summary: 'Predict acidity of substituted phenols from −M/−I effects and compute neutral amino-acid isoelectric pH.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 32,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'Electron-withdrawing groups (−NO₂, −CN) at ortho/para positions stabilize phenoxide anions via resonance, lowering pKa. For a neutral amino acid with carboxyl pKa₁ and ammonium pKa₂, the isoelectric point is pI = (pKa₁ + pKa₂)/2.',
                intuitiveExplanation:
                  'Any group that pulls negative charge away from oxygen makes a phenoxide conjugate base happier and strengthens the acid; amino acids reach zero net charge halfway between losing their acid proton and ammonium proton.',
                keyFormulas: [
                  {
                    label: 'Neutral Amino Acid Isoelectric Point',
                    latex: '\\text{pI} = \\frac{\\text{p}K_{a1} + \\text{p}K_{a2}}{2}',
                    explanation: 'For acidic or basic side chains, average the two pKa values bracketing the neutral zwitterion.',
                  },
                ],
                keyObservations: [
                  'Glucose and fructose both react positively with Tollens reagent because fructose isomerizes under basic conditions via enediol tautomerism.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-bio-01',
                    title: 'Glycine Isoelectric Point Calculation',
                    problemStatement: 'Glycine has pKa₁ = 2.34 (COOH) and pKa₂ = 9.60 (NH₃⁺). Calculate its isoelectric point pI.',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Glycine has a non-ionizable H side chain.',
                      'pI = (2.34 + 9.60) / 2 = 11.94 / 2 = 5.97.',
                    ],
                    finalAnswer: '5.97',
                    keyTakeaway: 'At pH = pI, electrophoresis migration velocity equals zero.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-bio-01',
                    trapTitle: 'Averaging all three pKa values for acidic/basic amino acids',
                    flawedReasoning: 'Using (pK₁ + pK₂ + pK₃)/3 for glutamic acid or lysine.',
                    correctConcept: 'Average only the two pKa values immediately surrounding the zero-charge zwitterion species.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which phenol derivative is the STRONGEST acid in aqueous solution?',
                  options: ['p-Nitrophenol', 'Phenol', 'p-Methoxyphenol', 'p-Cresol (p-methylphenol)'],
                  correctIndex: 0,
                  explanation: 'The para-NO₂ group strongly withdraws electron density via both −M resonance and −I induction, stabilizing the phenoxide ion.',
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
    chapterId: 'chem-ch-jee-inorganic-ionic',
    examTracks: ['all', 'jee_main', 'jee_advanced'],
    newChapter: {
      id: 'chem-ch-jee-inorganic-ionic',
      title: 'JEE Ionic Equilibrium, Solid State & p/d-Block Trends',
      sequenceOrder: 11,
      description:
        'Henderson-Hasselbalch buffers, solubility product Ksp precipitation, BCC/FCC unit cells, and p/d-block inert-pair & lanthanoid contraction.',
    },
    topics: [
      {
        id: 'chem-topic-jee-ionic-solid',
        title: 'Buffer Solutions, Solubility Product (Ksp) & Crystal Lattices',
        description: 'Common-ion suppression, precipitation Q vs Ksp, and FCC/BCC packing fractions.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'chem-sub-ksp-lattice',
            title: 'Ksp Common-Ion & Cubic Packing',
            description: 'Molar solubility s in shared-ion media and atomic radius/edge relations.',
            concepts: [
              {
                id: 'concept-jee-ksp-buffers',
                title: 'Solubility Product (Ksp), Buffers & Cubic Unit Cells',
                summary: 'Predict salt precipitation using ionic product Q vs Ksp, calculate buffer pH, and relate cubic edge length a to radius r.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'jee_main', 'jee_advanced', 'ap_stem'],
                formalDefinition:
                  'For salt A_x B_y(s) ⇌ x A^(y+) + y B^(x−), precipitation occurs when ionic product Q > Ksp. In face-centered cubic (FCC) lattices, Z = 4 atoms with face diagonal √2 a = 4r (74% packing efficiency); in BCC, Z = 2 with body diagonal √3 a = 4r (68%).',
                intuitiveExplanation:
                  'Adding a common ion pushes the dissolution equilibrium backward like Le Chatelier’s traffic jam, sharply reducing how much salt can stay dissolved.',
                keyFormulas: [
                  {
                    label: 'AB₂ Salt Solubility & Henderson-Hasselbalch',
                    latex: 'K_{sp} = 4s^3, \\quad \\text{pH} = \\text{p}K_a + \\log_{10}\\frac{[\\text{A}^-]}{[\\text{HA}]}',
                    explanation: 'Use Ksp = 4s³ for 1:2 electrolytes like CaF₂ or PbCl₂ in pure water.',
                  },
                ],
                keyObservations: [
                  'BCC packing efficiency is 68% while FCC / HCP close-packed lattices reach 74%.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-ksp-01',
                    title: 'Buffer pH at Equal Conjugate Concentrations',
                    problemStatement: 'An acetic acid buffer (pKa = 4.76) contains 0.20 M CH₃COOH and 0.20 M CH₃COONa. Find its pH.',
                    difficulty: 'easy',
                    stepByStepSolution: [
                      'Ratio [A⁻]/[HA] = 0.20 / 0.20 = 1.',
                      'pH = 4.76 + log₁₀(1) = 4.76.',
                    ],
                    finalAnswer: '4.76',
                    keyTakeaway: 'Buffer capacity is maximized when [acid] = [conjugate base], where pH = pKa.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-ksp-01',
                    trapTitle: 'Applying Ksp = s² to 1:2 salts',
                    flawedReasoning: 'Forgetting the squared stoichiometric coefficient in [B⁻]² = (2s)².',
                    correctConcept: 'For CaF₂, Ksp = [Ca²⁺][F⁻]² = (s)(2s)² = 4s³.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'How many total atoms (Z) belong to one Face-Centered Cubic (FCC) unit cell?',
                  options: ['4', '2', '1', '6'],
                  correctIndex: 0,
                  explanation: '8 corners × (1/8) + 6 faces × (1/2) = 1 + 3 = 4 atoms per FCC unit cell.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-jee-p-d-block',
        title: 's/p/d/f-Block Trends, Inert Pair & Qualitative Salt Analysis',
        description: 'Lanthanoid contraction, inert-pair oxidation states, and chromyl chloride / brown-ring confirmatory tests.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'chem-sub-inorganic-trends',
            title: 'Inert Pair Effect & Group Cation Tests',
            description: 'Heavy p-block +1/+3 stability and transition-metal magnetic moments √(n(n+2)) BM.',
            concepts: [
              {
                id: 'concept-jee-inert-pair-spin',
                title: 'Inert-Pair Effect, Lanthanoid Contraction & Spin Magnetic Moment',
                summary: 'Explain why Tl⁺ and Pb²⁺ outcompete higher states down Groups 13–14 and compute spin-only μ = √(n(n+2)) BM.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 32,
                examTracks: ['all', 'jee_main', 'jee_advanced'],
                formalDefinition:
                  'Relativistic contraction and poor d/f shielding pull outer ns² electrons closer to heavy p-block nuclei (inert-pair effect), stabilizing the (Group − 2) oxidation state. Spin-only magnetic moment is μ_eff = √(n(n + 2)) Bohr Magnetons for n unpaired electrons.',
                intuitiveExplanation:
                  'Because 4f electrons shield nuclear pull poorly, 4d and 5d metals shrink onto nearly identical atomic radii (lanthanoid contraction), while 6s² pairs in Pb and Bi hold tight like an unshared core.',
                keyFormulas: [
                  {
                    label: 'Spin-Only Magnetic Moment',
                    latex: '\\mu = \\sqrt{n(n+2)}\\text{ BM}',
                    explanation: 'For n = 5 unpaired electrons (e.g., Mn²⁺, Fe³⁺), μ = √35 ≈ 5.92 BM.',
                  },
                ],
                keyObservations: [
                  'Zr (4d) and Hf (5d) exhibit almost identical covalent radii due to intervening 4f lanthanoid contraction.',
                ],
                workedExamples: [
                  {
                    id: 'we-jee-spin-01',
                    title: 'Magnetic Moment of Aqueous Mn²⁺',
                    problemStatement: 'Calculate the spin-only magnetic moment (in BM, to 2 decimals) of high-spin [Mn(H₂O)₆]²⁺ (Z = 25).',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Mn²⁺ has electronic configuration [Ar] 3d⁵.',
                      'Weak-field H₂O leaves n = 5 unpaired electrons, so μ = √(5 × 7) = √35 ≈ 5.92 BM.',
                    ],
                    finalAnswer: '5.92',
                    keyTakeaway: 'Integer part of μ in BM directly reveals unpaired electron count n!',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-jee-spin-01',
                    trapTitle: 'Removing 3d electrons before 4s when forming transition-metal cations',
                    flawedReasoning: 'Writing Fe²⁺ as [Ar] 3d⁴ 4s².',
                    correctConcept: 'Ionization ALWAYS removes outer 4s electrons before 3d, giving Fe²⁺ = [Ar] 3d⁶.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which cation exhibits a more stable +1 oxidation state than +3 due to the inert-pair effect?',
                  options: ['Thallium (Tl⁺)', 'Boron (B⁺)', 'Aluminium (Al⁺)', 'Gallium (Ga⁺)'],
                  correctIndex: 0,
                  explanation: 'Down Group 13, 6s² orbital penetration makes Tl⁺ markedly more stable than Tl³⁺.',
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
    chapterId: 'chem-ch-icho-pericyclic-nsejs',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'nsejs'],
    newChapter: {
      id: 'chem-ch-icho-pericyclic-nsejs',
      title: 'IChO Pericyclic / Pi-Box Quantum & NSEJS Periodic/Redox',
      sequenceOrder: 12,
      description:
        'Woodward-Hoffmann electrocyclic stereochemistry and conjugated polyene particle-in-a-box for IChO, plus NSEJS periodicity and redox stoichiometry.',
    },
    topics: [
      {
        id: 'chem-topic-icho-pericyclic-pi',
        title: 'IChO Pericyclic Selection Rules & Conjugated Pi-Systems',
        description: 'Thermal vs photochemical conrotatory/disrotatory ring closure and 1D quantum polyene HOMO-LUMO gaps.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'chem-sub-icho-woodward-pi',
            title: 'Woodward-Hoffmann Rules & Polyene Pi-Box',
            description: '4n vs 4n+2 orbital symmetry conservation and λ_max from ΔE = (2N + 1)h²/(8mL²).',
            concepts: [
              {
                id: 'concept-icho-woodward-hoffmann',
                title: 'Woodward-Hoffmann Pericyclic Rules & Conjugated Pi-Box',
                summary: 'Predict conrotatory vs disrotatory stereochemistry from 4n/(4n+2)π counts and estimate polyene UV absorption with 1D box levels.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 46,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'In concert electrocyclic reactions, thermal 4n π systems proceed conrotatorily while thermal (4n + 2) π systems proceed disrotatorily; photochemical excitation reverses both selection rules. Modeling N π electrons in a conjugated box of length L places the HOMO-LUMO gap at ΔE = ((N + 1)h²)/(8 m_e L²).',
                intuitiveExplanation:
                  'Two p-orbital ends must rotate so same-phase lobes touch constructively to forge the new σ bond—opposite-phase HOMO ends require twisting the same direction (conrotatory) while same-phase ends twist inward together (disrotatory).',
                keyFormulas: [
                  {
                    label: 'Conjugated Polyene 1D Particle-in-a-Box Transition',
                    latex: '\\Delta E_{\\text{HOMO}\\to\\text{LUMO}} = \\frac{(N + 1)h^2}{8 m_e L^2}',
                    explanation: 'For N even π electrons, HOMO = N/2 and LUMO = N/2 + 1, so (N/2 + 1)² − (N/2)² = N + 1.',
                  },
                ],
                keyObservations: [
                  'Adding conjugation lengthens L faster than N grows, shifting absorption toward longer wavelengths (red shift).',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-pericyclic-01',
                    title: 'Thermal Hexatriene Cyclization Mode',
                    problemStatement: 'Under purely thermal heating (Δ), does 1,3,5-hexatriene undergo conrotatory or disrotatory electrocyclization?',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Count conjugated π electrons: 3 double bonds = 6 π electrons (4n + 2 with n = 1).',
                      'Thermal (4n + 2)π electrocyclization follows the disrotatory pathway.',
                    ],
                    finalAnswer: 'Disrotatory',
                    keyTakeaway: 'Remember: 4n Thermal Conrotatory, 4n+2 Thermal Disrotatory; photoexcitation flips them.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-pericyclic-01',
                    trapTitle: 'Confusing thermal and photochemical Woodward-Hoffmann tables',
                    flawedReasoning: 'Assuming 6π thermal closure is conrotatory like 4π thermal.',
                    correctConcept: '4π thermal (butadiene) is conrotatory; 6π thermal (hexatriene) is disrotatory.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'According to the Woodward-Hoffmann rules, photochemical (hν) electrocyclic ring opening of cyclobutene (4π electrons) is:',
                  options: ['Disrotatory', 'Conrotatory', 'Symmetry-forbidden', 'Stepwise ionic only'],
                  correctIndex: 0,
                  explanation: 'A 4n (4π) system is conrotatory thermally and reverses to disrotatory upon photochemical excitation.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-nsejs-periodic-redox',
        title: 'NSEJS Periodic Trends, Redox Balancing & Carbon Bonding',
        description: 'Ionization energy anomalies, oxidation-number half-reaction balancing, and homologous carbon series.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-nsejs-redox-periodicity',
            title: 'Periodicity Anomalies & Redox Stoichiometry',
            description: 'Half-filled subshell spikes (N > O, Be > B) and equivalent weight n-factors.',
            concepts: [
              {
                id: 'concept-nsejs-periodic-redox',
                title: 'NSEJS Ionization Trends & Redox n-Factor Stoichiometry',
                summary: 'Explain Group 2/13 and 15/16 ionization anomalies via subshell stability and balance redox titrations using electron-transfer n-factors.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 28,
                examTracks: ['all', 'nsejs', 'iapt_exams'],
                formalDefinition:
                  'First ionization energy generally increases across a period, except at Group 13 (s² → s²p¹) and Group 16 (p³ half-filled repulsion drop). In redox titrations, equivalents of oxidant equal equivalents of reductant: M₁V₁·n₁ = M₂V₂·n₂.',
                intuitiveExplanation:
                  'Half-filled p³ orbitals spread electrons across separate orbitals with parallel spins; adding a fourth paired electron in oxygen triggers extra repulsion, making oxygen slightly easier to ionize than nitrogen.',
                keyFormulas: [
                  {
                    label: 'Redox Equivalence Invariant',
                    latex: 'n_{\\text{ox}} M_{\\text{ox}} V_{\\text{ox}} = n_{\\text{red}} M_{\\text{red}} V_{\\text{red}}',
                    explanation: 'Acidic permanganate (MnO₄⁻ → Mn²⁺) carries n-factor 5; dichromate (Cr₂O₇²⁻ → 2Cr³⁺) carries n-factor 6.',
                  },
                ],
                keyObservations: [
                  'Chlorine possesses a more negative electron gain enthalpy than fluorine because 2p electron density in tiny F causes inter-electronic repulsion.',
                ],
                workedExamples: [
                  {
                    id: 'we-nsejs-redox-01',
                    title: 'Acidic Permanganate vs Oxalate Equivalence',
                    problemStatement: 'How many moles of KMnO₄ oxidize 5 moles of oxalate (C₂O₄²⁻ → 2CO₂) in acidic medium?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Permanganate Mn(+7) → Mn(+2) absorbs n_ox = 5 electrons per mole.',
                      'Oxalate C(+3)₂ → 2 C(+4) releases n_red = 2 electrons per mole, so 5 moles supply 10 e⁻, requiring 10 / 5 = 2 moles of KMnO₄.',
                    ],
                    finalAnswer: '2',
                    keyTakeaway: 'Match total electrons gained by oxidant with total electrons lost by reductant.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nsejs-redox-01',
                    trapTitle: 'Using C(+3) n-factor = 1 instead of 2 for C₂O₄²⁻',
                    flawedReasoning: 'Counting only one carbon atom in the oxalate formula unit.',
                    correctConcept: 'Each C₂O₄²⁻ ion contains TWO carbons oxidizing from +3 to +4, giving n-factor = 2.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which element has the HIGHER first ionization enthalpy due to half-filled 2p³ stability?',
                  options: ['Nitrogen (N)', 'Oxygen (O)', 'Carbon (C)', 'Boron (B)'],
                  correctIndex: 0,
                  explanation: 'Nitrogen’s half-filled 2p³ configuration resists electron removal more strongly than Oxygen’s 2p⁴.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // BIOLOGY — IBO / IBHO (Phylogenetics, Plant Physiology) + NSEJS Systems
  // =========================================================================
  {
    subjectId: 'biology',
    chapterId: 'bio-ch-ibo-phylogenetics-plant',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    newChapter: {
      id: 'bio-ch-ibo-phylogenetics-plant',
      title: 'IBO Olympiad: Phylogenetics, Cladistics & Plant Physiology',
      sequenceOrder: 10,
      description:
        'Maximum parsimony cladograms, monophyletic vs paraphyletic taxa, auxin/gibberellin phytohormones, and phytochrome photoperiodism for IBO/IBHO.',
    },
    topics: [
      {
        id: 'bio-topic-ibo-phylogenetics',
        title: 'IBO Cladistics, Parsimony Trees & Molecular Clocks',
        description: 'Synapomorphies, outgroup rooting, monophyly vs polyphyly, and neutral substitution clocks.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'bio-sub-ibo-cladistics',
            title: 'Cladograms & Synapomorphies',
            description: 'Distinguishing shared derived characters from homoplasy (convergent traits).',
            concepts: [
              {
                id: 'concept-ibo-phylogenetics',
                title: 'Cladistic Parsimony & Monophyletic Taxa',
                summary: 'Root phylogenetic trees with an outgroup, minimize evolutionary step count (parsimony), and identify true monophyletic clades.',
                difficulty: 'hard',
                estimatedMinutes: 18,
                xpReward: 38,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'A monophyletic group (clade) contains a common ancestor and ALL of its descendants, defined by shared derived traits (synapomorphies). Maximum parsimony selects the tree topology requiring the fewest total character-state transitions.',
                intuitiveExplanation:
                  'If you snip a single branch off the tree of life, everything falling in your hand forms a clade; leaving any branch behind creates a paraphyletic slice.',
                keyFormulas: [
                  {
                    label: 'Molecular Clock Divergence Time',
                    latex: 't = \\frac{D}{2 r}',
                    explanation: 'D is sequence divergence between two lineages evolving independently at neutral rate r.',
                  },
                ],
                keyObservations: [
                  'Symplesiomorphies (shared ancestral traits like having a backbone among mammals) cannot resolve branching order inside a clade.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibo-phylo-01',
                    title: 'Molecular Clock Divergence Dating',
                    problemStatement: 'Two species differ at 12 neutral nucleotides per 1000 bp and evolve at rate 1.5 substitutions per 1000 bp per million years per lineage. Estimate divergence time (Myr).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Combined accumulation rate across both independent branches is 2r = 3.0 per 1000 bp per Myr.',
                      'Divergence time t = 12 / 3.0 = 4 Myr.',
                    ],
                    finalAnswer: '4',
                    keyTakeaway: 'Divide observed pairwise differences by 2r because mutations accumulate along both branches simultaneously.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibo-phylo-01',
                    trapTitle: 'Treating traditional "Reptilia" excluding birds as a clade',
                    flawedReasoning: 'Grouping lizards, crocodiles, and turtles without birds as monophyletic.',
                    correctConcept: 'Because birds descend from archosaur ancestors shared with crocodilians, Reptiles without birds is paraphyletic.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which character type provides valid evidence for uniting a monophyletic clade in cladistics?',
                  options: ['Synapomorphy (shared derived character)', 'Symplesiomorphy (shared ancestral character)', 'Homoplasy (convergent analog)', 'Autapomorphy (single-taxon trait)'],
                  correctIndex: 0,
                  explanation: 'Only synapomorphies arose in the clade’s immediate common ancestor and mark nested branching relationships.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-ibo-plant-hormones',
        title: 'IBO Plant Hormones, Photoperiodism & ABC Floral Model',
        description: 'Pr/Pfr phytochrome switching, short-day vs long-day flowering, and ABC floral organ specification.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'bio-sub-ibo-plant-signaling',
            title: 'Phytochrome Photoperiodism & Plant Hormones',
            description: 'Red (660 nm) vs far-red (730 nm) photoreversibility and hormone tropisms.',
            concepts: [
              {
                id: 'concept-ibo-phytochrome-hormones',
                title: 'Phytochrome Photoperiodism & ABC Floral Model',
                summary: 'Predict flowering from uninterrupted night length (red/far-red flashes) and identify floral whorls from A, B, and C homeotic genes.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 36,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Phytochrome switches between inactive red-absorbing Pr (660 nm) and biologically active far-red-absorbing Pfr (730 nm). Flowering responds to uninterrupted dark duration: high Pfr promotes long-day (short-night) flowering and inhibits short-day (long-night) plants. In the ABC model, A alone = sepals, A+B = petals, B+C = stamens, C alone = carpels.',
                intuitiveExplanation:
                  'Plants use a night-break detector rather than a sunrise clock—whatever color flash hits last before darkness determines whether Pfr triggers or blocks blooming.',
                keyFormulas: [
                  {
                    label: 'ABC Floral Whorl Mapping',
                    latex: '\\text{A}\\to\\text{Sepal},\\quad \\text{A+B}\\to\\text{Petal},\\quad \\text{B+C}\\to\\text{Stamen},\\quad \\text{C}\\to\\text{Carpel}',
                    explanation: 'A and C mutually repress each other so knocking out A expands C across all four whorls.',
                  },
                ],
                keyObservations: [
                  'Abscisic acid (ABA) drives stomatal closure during drought via K⁺ efflux from guard cells.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibo-plant-01',
                    title: 'Final-Flash Night-Break Rule',
                    problemStatement: 'A short-day (long-night) plant experiences a long night interrupted by Red (R), then Far-Red (FR), then Red (R) light. Does it flower?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Only the FINAL flash dictates phytochrome state: final Red converts Pr → Pfr.',
                      'High Pfr during the night inhibits short-day plants, so it does NOT flower.',
                    ],
                    finalAnswer: 'No',
                    keyTakeaway: 'Always evaluate the very last light pulse in alternating R/FR experiments.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibo-plant-01',
                    trapTitle: 'Thinking photoperiodic plants measure light day-length',
                    flawedReasoning: 'Ignoring uninterrupted night interruptions in greenhouse experiments.',
                    correctConcept: 'Plants measure continuous darkness (critical night length); breaking a long night blocks short-day flowering.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'In the ABC model of flower development, loss of Class B gene function produces which whorl sequence from outside to inside?',
                  options: ['Sepals, Sepals, Carpels, Carpels', 'Petals, Petals, Stamens, Stamens', 'Carpels, Stamens, Stamens, Carpels', 'Sepals, Petals, Petals, Sepals'],
                  correctIndex: 0,
                  explanation: 'Removing B turns A+B (petals) into A (sepals) and B+C (stamens) into C (carpels), yielding Sepal-Sepal-Carpel-Carpel.',
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
    chapterId: 'bio-ch-nsejs-human-microbes',
    examTracks: ['all', 'nsejs', 'iapt_exams'],
    newChapter: {
      id: 'bio-ch-nsejs-human-microbes',
      title: 'NSEJS Human Organ Systems, Nutrition & Microbiology',
      sequenceOrder: 11,
      description:
        'Digestive enzymes, Bohr O₂-hemoglobin dissociation curve, nephron countercurrent filtration, and microbial pathogens/vaccines for NSEJS.',
    },
    topics: [
      {
        id: 'bio-topic-nsejs-digestion-respiration',
        title: 'NSEJS Digestion, Bohr Shift & Cardiac Cycle',
        description: 'pH-specific enzymatic cleavage, CO₂/H⁺ hemoglobin unloading, and double circulation.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'bio-sub-nsejs-physio-bohr',
            title: 'Hemoglobin Bohr Shift & Enzymatic Compartments',
            description: 'Active-tissue O₂ delivery shifts and zymogen activation.',
            concepts: [
              {
                id: 'concept-nsejs-bohr-enzymes',
                title: 'Bohr O₂ Dissociation Shift & Digestive Zymogen Cascade',
                summary: 'Predict hemoglobin O₂ unloading under low pH/high CO₂ (Bohr effect) and trace salivary, gastric, and pancreatic enzymes.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                examTracks: ['all', 'nsejs', 'iapt_exams', 'ap_stem'],
                formalDefinition:
                  'Increased CO₂ and H⁺ (lower pH) or elevated temperature in metabolically active tissues shifts the sigmoidal hemoglobin O₂-dissociation curve RIGHTWARD, decreasing O₂ affinity to enhance tissue unloading (Bohr effect).',
                intuitiveExplanation:
                  'Hard-working muscles exhale CO₂ and lactic acid—acting as a chemical SOS flag that loosens hemoglobin’s grip on oxygen right where it is needed most.',
                keyFormulas: [
                  {
                    label: 'Bicarbonate Blood Buffering',
                    latex: '\\text{CO}_2 + \\text{H}_2\\text{O} \\xrightleftharpoons{\\text{CA}} \\text{H}_2\\text{CO}_3 \\rightleftharpoons \\text{H}^+ + \\text{HCO}_3^-',
                    explanation: 'Carbonic anhydrase (CA) in erythrocytes converts most plasma CO₂ into bicarbonate.',
                  },
                ],
                keyObservations: [
                  'Fetal hemoglobin (HbF) binds BPG weakly, shifting LEFT of maternal HbA so fetuses extract O₂ across the placenta.',
                ],
                workedExamples: [
                  {
                    id: 'we-nsejs-bio-01',
                    title: 'Right-Shift Tissue Unloading Factors',
                    problemStatement: 'When blood pH drops from 7.4 to 7.2 inside exercising skeletal muscle, does hemoglobin P₅₀ increase or decrease?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Higher [H⁺] shifts the dissociation curve to the right (Bohr effect).',
                      'A higher PO₂ is needed for 50% saturation, meaning P₅₀ increases (lower affinity, greater O₂ release).',
                    ],
                    finalAnswer: 'Increase',
                    keyTakeaway: 'CADET face RIGHT: CO₂, Acid, 2,3-DPG, Exercise, Temperature all increase P₅₀.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nsejs-bio-01',
                    trapTitle: 'Confusing rightward shift with higher O₂ affinity',
                    flawedReasoning: 'Thinking moving right means hemoglobin holds onto oxygen tighter.',
                    correctConcept: 'Rightward shift raises P₅₀, meaning LOWER affinity and FASTER O₂ delivery to tissues.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which enzyme converts inactive trypsinogen into active trypsin inside the small intestine lumen?',
                  options: ['Enterokinase (enteropeptidase)', 'Pepsin', 'Salivary amylase', 'Chymotrypsinogen'],
                  correctIndex: 0,
                  explanation: 'Brush-border enterokinase cleaves trypsinogen into trypsin, which then activates all other pancreatic zymogens.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-nsejs-nephron-microbes',
        title: 'NSEJS Nephron Osmoregulation & Microbial Immunity',
        description: 'Loop of Henle countercurrent multiplier, ADH aquaporins, and bacterial vs viral immunity.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'bio-sub-nsejs-nephron-pathogens',
            title: 'Nephron Countercurrent & Pathogen Control',
            description: 'Aldosterone/ADH hormone balance and antibiotic targets vs viral replication.',
            concepts: [
              {
                id: 'concept-nsejs-nephron-microbes',
                title: 'Nephron Countercurrent Multiplier & Pathogen Targeting',
                summary: 'Trace medullary osmolarity gradients across the Loop of Henle and distinguish peptidoglycan/70S antibiotic targets from viruses.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 28,
                examTracks: ['all', 'nsejs', 'iapt_exams'],
                formalDefinition:
                  'In the renal nephron, the descending limb of the Loop of Henle is water-permeable while the thick ascending limb actively pumps out Na⁺/K⁺/2Cl⁻ without water, concentrating the renal medulla so ADH-regulated collecting-duct aquaporins reclaim water.',
                intuitiveExplanation:
                  'By separating salt pumping from water exit in adjacent U-tube limbs, the kidney builds a salty sponge in the medulla that draws water back out before urine leaves.',
                keyFormulas: [
                  {
                    label: 'Glomerular Filtration Rate Drivers',
                    latex: 'P_{\\text{net}} = P_{\\text{GC}} - (P_{\\text{BC}} + \\pi_{\\text{GC}})',
                    explanation: 'Net filtration balances capillary hydrostatic push against Bowman capsule pressure and plasma oncotic pull.',
                  },
                ],
                keyObservations: [
                  'Penicillin inhibits bacterial transpeptidase cross-linking of peptidoglycan cell walls and cannot stop viruses lacking cell walls.',
                ],
                workedExamples: [
                  {
                    id: 'we-nsejs-kidney-01',
                    title: 'Loop of Henle Permeability Contrast',
                    problemStatement: 'Which segment of the Loop of Henle produces hypotonic (dilute) tubular fluid by actively exporting salts while blocking water exit?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Descending limb loses water passively (filtrate becomes hypertonic at the hairpin).',
                      'Ascending limb pumps out NaCl while remaining water-impermeable, diluting tubular fluid back down.',
                    ],
                    finalAnswer: 'Ascending limb',
                    keyTakeaway: 'Water leaves descending; salt leaves ascending.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nsejs-kidney-01',
                    trapTitle: 'Treating viral infections with cell-wall antibiotics',
                    flawedReasoning: 'Assuming broad-spectrum antibiotics kill viral capsids.',
                    correctConcept: 'Antibiotics target prokaryotic 70S ribosomes or peptidoglycan synthesis absent in viruses.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which hormone inserts aquaporin-2 water channels into the kidney collecting duct during dehydration?',
                  options: ['Antidiuretic hormone (ADH / vasopressin)', 'Insulin', 'Glucagon', 'Thyroxine'],
                  correctIndex: 0,
                  explanation: 'Posterior pituitary ADH triggers aquaporin-2 translocation, concentrating urine and conserving body water.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
