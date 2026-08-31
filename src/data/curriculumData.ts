import { SubjectCurriculum, ExamTrack, ExamTrackId } from '../types/curriculum';

export const EXAM_TRACKS: ExamTrack[] = [
  {
    id: 'all',
    name: 'All Curricula & Tracks',
    shortName: 'All Tracks',
    description: 'Comprehensive universal STEM curriculum covering all concepts and levels.',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    subjects: ['math', 'cs', 'physics', 'chemistry', 'biology'],
  },
  {
    id: 'jee_advanced',
    name: 'JEE Advanced & Top-Tier Engineering',
    shortName: 'JEE Advanced',
    description: 'Extreme analytical rigor, multi-concept problems, calculus derivations, and deep physics invariants.',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    subjects: ['math', 'physics', 'chemistry'],
  },
  {
    id: 'jee_main',
    name: 'JEE Main & National Engineering Entrance',
    shortName: 'JEE Main',
    description: 'High-speed conceptual mastery, standard problem archetypes, and formula accuracy.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    subjects: ['math', 'physics', 'chemistry'],
  },
  {
    id: 'ai_ml_foundations',
    name: 'AI, Machine Learning & Computational STEM',
    shortName: 'AI & ML Track',
    description: 'Matrix calculus, gradient optimization, neural architectures, and algorithmic complexity.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    subjects: ['cs', 'math'],
  },
  {
    id: 'stem_olympiad',
    name: 'STEM Olympiad & Deep Theory',
    shortName: 'Olympiad Track',
    description: 'Proof-based mathematics, invariant dynamics, reaction kinematics, and genetics.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    subjects: ['math', 'physics', 'chemistry', 'biology'],
  },
  {
    id: 'ap_stem',
    name: 'Advanced Placement (AP Calculus / Physics / Chem)',
    shortName: 'AP STEM',
    description: 'College-level foundational calculus, mechanics, organic reactions, and cellular biology.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    subjects: ['math', 'physics', 'chemistry', 'biology'],
  },
];

export const CURRICULUM_DATA: SubjectCurriculum[] = [
  // ==========================================
  // MATHEMATICS
  // ==========================================
  {
    id: 'math',
    name: 'Mathematics',
    tagline: 'Differential calculus, linear algebra, multivariable optimization, and probability.',
    iconName: 'Calculator',
    color: '#4f46e5',
    chapters: [
      {
        id: 'math-ch-diff-calc',
        subjectId: 'math',
        examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'stem_olympiad', 'ai_ml_foundations'],
        title: 'Differential Calculus & Real Analysis',
        sequenceOrder: 1,
        description: 'Rigorous limits, continuity, first and second derivative tests, and extremal optimization.',
        topics: [
          {
            id: 'math-topic-monotonicity',
            chapterId: 'math-ch-diff-calc',
            title: 'Monotonicity & Extrema Optimization',
            description: 'Analyzing sign changes of derivatives, stationary points, and global extrema.',
            conceptCount: 3,
            estimatedHours: 4,
            subtopics: [
              {
                id: 'math-sub-first-deriv',
                title: 'First Derivative Invariants',
                description: 'Sign charts, increasing/decreasing criteria, and critical points.',
                concepts: [
                  {
                    id: 'concept-deriv-inc-dec',
                    subjectId: 'math',
                    examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'ai_ml_foundations'],
                    chapterId: 'math-ch-diff-calc',
                    topicId: 'math-topic-monotonicity',
                    subtopicId: 'math-sub-first-deriv',
                    title: 'Monotonicity & First Derivative Test',
                    summary: 'Determine where a function increases or decreases and classify critical points into local extrema.',
                    difficulty: 'medium',
                    estimatedMinutes: 12,
                    xpReward: 25,
                    formalDefinition: 'Let $f$ be continuous on $[a, b]$ and differentiable on $(a, b)$. If $f\'(x) > 0$ for all $x \\in (a, b)$, then $f$ is strictly increasing on $[a, b]$. If $f\'(x) < 0$ for all $x \\in (a, b)$, then $f$ is strictly decreasing on $[a, b]$.',
                    intuitiveExplanation: 'The derivative $f\'(x)$ represents the instantaneous slope of the tangent line. A positive slope means moving rightwards increases height; a negative slope means descending.',
                    keyFormulas: [
                      {
                        label: 'Mean Value Theorem Invariant',
                        latex: 'f(b) - f(a) = f\'(c)(b - a) \\quad \\text{for some } c \\in (a, b)',
                        explanation: 'Guarantees that positive instantaneous rate of change over an interval dictates a positive net difference.',
                      },
                      {
                        label: 'Critical Point Criterion',
                        latex: 'f\'(c) = 0 \\quad \\text{or} \\quad f\'(c) \\text{ is undefined}',
                        explanation: 'Local extrema can only occur at critical points in the interior of the domain.',
                      },
                    ],
                    keyObservations: [
                      'A function can be strictly increasing even if $f\'(x) = 0$ at isolated points (e.g. $f(x) = x^3$ at $x=0$).',
                      'Stationary points occur when $f\'(x) = 0$; critical points also include points of non-differentiability.',
                      'Sign change of $f\'(x)$ from $(+)$ to $(-)$ creates a local maximum; $(-)$ to $(+)$ creates a local minimum.',
                    ],
                    workedExamples: [
                      {
                        id: 'we-math-01',
                        title: 'Finding Intervals of Strict Decrease',
                        problemStatement: 'Determine all intervals where $f(x) = 2x^3 - 9x^2 + 12x + 5$ is strictly decreasing.',
                        difficulty: 'medium',
                        stepByStepSolution: [
                          'Differentiate $f(x)$: $f\'(x) = 6x^2 - 18x + 12$.',
                          'Factor out the constant: $f\'(x) = 6(x^2 - 3x + 2) = 6(x - 1)(x - 2)$.',
                          'Identify critical points where $f\'(x) = 0$: $x = 1$ and $x = 2$.',
                          'Set up sign intervals: $(-\\infty, 1)$, $(1, 2)$, $(2, \\infty)$.',
                          'Test a point in $(1, 2)$, e.g., $x = 1.5$: $f\'(1.5) = 6(0.5)(-0.5) = -1.5 < 0$.',
                          'Hence, $f\'(x) < 0$ on $(1, 2)$.',
                        ],
                        finalAnswer: '$(1, 2)$',
                        keyTakeaway: 'Always factor the derivative polynomial to find roots before performing sign chart testing.',
                      },
                    ],
                    commonPitfalls: [
                      {
                        id: 'cp-math-01',
                        trapTitle: 'Assuming $f\'(c) = 0$ guarantees a local extremum',
                        flawedReasoning: 'If $f\'(c) = 0$, then $c$ must be either a local maximum or a local minimum.',
                        correctConcept: 'If $f\'(x)$ does not change sign across $c$, $c$ is a stationary point of inflection (e.g. $y=x^3$ at $x=0$).',
                        counterExample: '$f(x) = x^3 \\implies f\'(0) = 0$, but $f\'(x) = 3x^2 \\ge 0$ for all $x$, so no extremum exists.',
                      },
                    ],
                    interactiveWidget: 'sign_chart',
                    prerequisites: [
                      { id: 'math-limits-deriv', title: 'Limit Definition of Derivative', subjectId: 'math' },
                    ],
                    relatedConcepts: [
                      { id: 'concept-concavity-second-deriv', title: 'Concavity & Second Derivative Test', subjectId: 'math' },
                    ],
                    miniCheckQuestion: {
                      prompt: 'If $f\'(x) = (x - 3)^2(x + 1)$, at which point does $f$ have a local extremum?',
                      options: [
                        'At $x = -1$ (local minimum)',
                        'At $x = 3$ (local minimum)',
                        'At both $x = 3$ and $x = -1$',
                        'No local extrema exist',
                      ],
                      correctIndex: 0,
                      explanation: '$(x-3)^2 \\ge 0$ always, so sign change only occurs across $(x+1)$ at $x = -1$ from negative to positive (local minimum).',
                    },
                  },
                  {
                    id: 'concept-concavity-second-deriv',
                    subjectId: 'math',
                    examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem'],
                    chapterId: 'math-ch-diff-calc',
                    topicId: 'math-topic-monotonicity',
                    subtopicId: 'math-sub-first-deriv',
                    title: 'Concavity, Inflection & Second Derivative Test',
                    summary: 'Characterize curvature of functions, point of inflection, and local extrema classification via $f\'\'(x)$.',
                    difficulty: 'medium',
                    estimatedMinutes: 10,
                    xpReward: 25,
                    formalDefinition: 'Let $f$ be twice differentiable on $(a, b)$. If $f\'\'(x) > 0$ for all $x \\in (a, b)$, the graph of $f$ is concave up. If $f\'\'(x) < 0$, it is concave down. A point where concavity changes is an inflection point.',
                    intuitiveExplanation: 'Concave up means the tangent line lies below the curve and slope is increasing (like a cup holding water).',
                    keyFormulas: [
                      {
                        label: 'Second Derivative Test',
                        latex: 'f\'(c) = 0 \\land f\'\'(c) > 0 \\implies \\text{Local Min at } c',
                        explanation: 'A zero slope with upward curvature confirms a local minimum.',
                      },
                    ],
                    keyObservations: [
                      'If $f\'\'(c) = 0$, the second derivative test is inconclusive; one must check first derivative sign changes.',
                    ],
                    workedExamples: [],
                    commonPitfalls: [],
                    prerequisites: [{ id: 'concept-deriv-inc-dec', title: 'Monotonicity & First Derivative', subjectId: 'math' }],
                    relatedConcepts: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'math-ch-linalg',
        subjectId: 'math',
        examTracks: ['all', 'ai_ml_foundations', 'stem_olympiad', 'jee_advanced'],
        title: 'Linear Algebra & Vector Spaces',
        sequenceOrder: 2,
        description: 'Vector spaces, linear transformations, eigenvalues, eigenvectors, and singular value decomposition.',
        topics: [
          {
            id: 'math-topic-eigen',
            chapterId: 'math-ch-linalg',
            title: 'Eigenvalues & Spectral Decomposition',
            description: 'Characteristic polynomials, invariant subspaces, and diagonalizability.',
            conceptCount: 2,
            estimatedHours: 5,
            subtopics: [
              {
                id: 'math-sub-eigenvalues',
                title: 'Eigenvalue Calculation',
                description: 'Solving $\\det(A - \\lambda I) = 0$.',
                concepts: [
                  {
                    id: 'concept-eigenvalues-vectors',
                    subjectId: 'math',
                    examTracks: ['all', 'ai_ml_foundations', 'jee_advanced'],
                    chapterId: 'math-ch-linalg',
                    topicId: 'math-topic-eigen',
                    subtopicId: 'math-sub-eigenvalues',
                    title: 'Eigenvalues, Eigenvectors & Geometric Invariants',
                    summary: 'Identify non-zero vectors whose direction remains unchanged under linear transformation $A$.',
                    difficulty: 'medium_hard',
                    estimatedMinutes: 15,
                    xpReward: 30,
                    formalDefinition: 'An eigenvector of an $n \\times n$ matrix $A$ is a non-zero vector $v$ such that $Av = \\lambda v$ for some scalar $\\lambda$ called the eigenvalue.',
                    intuitiveExplanation: 'When a matrix acts on an eigenvector, it only stretches or shrinks the vector without rotating it in space.',
                    keyFormulas: [
                      {
                        label: 'Characteristic Equation',
                        latex: '\\det(A - \\lambda I) = 0',
                        explanation: 'Eigenvalues are roots of the degree-$n$ characteristic polynomial.',
                      },
                    ],
                    keyObservations: [
                      'Symmetric real matrices always have real eigenvalues and orthogonal eigenvectors.',
                      'The sum of eigenvalues equals the trace $\\text{Tr}(A)$, and their product equals $\\det(A)$.',
                    ],
                    workedExamples: [],
                    commonPitfalls: [],
                    interactiveWidget: 'vector_projection',
                    prerequisites: [],
                    relatedConcepts: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // COMPUTER SCIENCE & AI
  // ==========================================
  {
    id: 'cs',
    name: 'Computer Science & AI',
    tagline: 'Gradient descent, neural architectures, data structures, and algorithmic complexity.',
    iconName: 'Terminal',
    color: '#f59e0b',
    chapters: [
      {
        id: 'cs-ch-ml-opt',
        subjectId: 'cs',
        examTracks: ['all', 'ai_ml_foundations'],
        title: 'Machine Learning Foundations & Optimization',
        sequenceOrder: 1,
        description: 'First-order optimization, loss functions, learning rate schedules, and backpropagation.',
        topics: [
          {
            id: 'cs-topic-grad-opt',
            chapterId: 'cs-ch-ml-opt',
            title: 'Gradient Descent & Convex Optimization',
            description: 'Iterative parameter updates along the steepest descent direction.',
            conceptCount: 2,
            estimatedHours: 4,
            subtopics: [
              {
                id: 'cs-sub-first-order',
                title: 'First-Order Methods',
                description: 'SGD, Momentum, and Adam optimizers.',
                concepts: [
                  {
                    id: 'concept-grad-descent',
                    subjectId: 'cs',
                    examTracks: ['all', 'ai_ml_foundations'],
                    chapterId: 'cs-ch-ml-opt',
                    topicId: 'cs-topic-grad-opt',
                    subtopicId: 'cs-sub-first-order',
                    title: 'Gradient Descent & Learning Rate Dynamics',
                    summary: 'Iteratively minimize objective loss functions by updating parameters against the gradient vector.',
                    difficulty: 'medium',
                    estimatedMinutes: 14,
                    xpReward: 30,
                    formalDefinition: 'Given a differentiable loss function $L(\\theta)$, the parameter update rule is $\\theta_{t+1} = \\theta_t - \\eta \\nabla L(\\theta_t)$, where $\\eta > 0$ is the learning rate.',
                    intuitiveExplanation: 'Imagine being blindfolded on a foggy mountain terrain. You feel the ground with your foot to find the steepest downhill tilt, and take a controlled step in that direction.',
                    keyFormulas: [
                      {
                        label: 'Vanilla Gradient Update',
                        latex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla L(\\theta_t)',
                        explanation: 'Direct first-order step in the direction of steepest descent.',
                      },
                      {
                        label: 'Lipschitz Smoothness Bound',
                        latex: 'L(\\theta_{t+1}) \\le L(\\theta_t) - \\eta \\left(1 - \\frac{L\\eta}{2}\\right) \\|\\nabla L(\\theta_t)\\|^2',
                        explanation: 'Guarantees monotonic decrease in loss if $\\eta < \\frac{2}{L}$.',
                      },
                    ],
                    keyObservations: [
                      'If the learning rate $\\eta$ is too large, updates will overshoot and oscillate or diverge.',
                      'If $\\eta$ is too small, convergence is agonizingly slow and may stall in plateau regions.',
                      'Momentum accelerates through shallow ravines by accumulating past velocity.',
                    ],
                    workedExamples: [
                      {
                        id: 'we-cs-01',
                        title: '1D Quadratic Optimization Step',
                        problemStatement: 'Given loss function $L(\\theta) = 3\\theta^2 - 12\\theta + 4$ with initial parameter $\\theta_0 = 1$ and learning rate $\\eta = 0.1$, compute $\\theta_1$.',
                        difficulty: 'medium',
                        stepByStepSolution: [
                          'Compute gradient: $\\nabla L(\\theta) = \\frac{d}{d\\theta}(3\\theta^2 - 12\\theta + 4) = 6\\theta - 12$.',
                          'Evaluate gradient at $\\theta_0 = 1$: $\\nabla L(1) = 6(1) - 12 = -6$.',
                          'Apply update rule: $\\theta_1 = \\theta_0 - \\eta \\nabla L(1) = 1 - 0.1(-6) = 1 + 0.6 = 1.6$.',
                        ],
                        finalAnswer: '1.6',
                        keyTakeaway: 'A negative gradient triggers an increase in parameter value, driving closer to the minimum at $\\theta^* = 2$.',
                      },
                    ],
                    commonPitfalls: [
                      {
                        id: 'cp-cs-01',
                        trapTitle: 'Adding the gradient instead of subtracting',
                        flawedReasoning: 'Updating $\\theta \\leftarrow \\theta + \\eta \\nabla L$ to find the optimal point.',
                        correctConcept: 'The gradient vector points in the direction of steepest ascent (maximum increase). To minimize loss, you must subtract the gradient.',
                      },
                    ],
                    interactiveWidget: 'gradient_descent',
                    prerequisites: [
                      { id: 'concept-deriv-inc-dec', title: 'Monotonicity & Derivatives', subjectId: 'math' },
                    ],
                    relatedConcepts: [],
                    miniCheckQuestion: {
                      prompt: 'What happens to gradient descent on a quadratic loss if the learning rate $\\eta > \\frac{2}{L_{max}}$?',
                      options: [
                        'The parameters diverge or oscillate with growing magnitude',
                        'It converges instantaneously in one step',
                        'It converts into Newton-Raphson optimization',
                        'It stops updating due to vanishing gradients',
                      ],
                      correctIndex: 0,
                      explanation: 'When step size exceeds $\\frac{2}{L}$, the update overshoots the minimum and energy increases at each iteration.',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'cs-ch-python-dsa',
        subjectId: 'cs',
        examTracks: ['all', 'ai_ml_foundations'],
        title: 'Python, Algorithms & Data Structures',
        sequenceOrder: 2,
        description: 'Time complexity analysis, recursive invariant trees, and dynamic programming.',
        topics: [
          {
            id: 'cs-topic-complexity',
            chapterId: 'cs-ch-python-dsa',
            title: 'Asymptotic Complexity & Big-O Notation',
            description: 'Worst-case, average-case, and amortized runtime scaling.',
            conceptCount: 1,
            estimatedHours: 3,
            subtopics: [
              {
                id: 'cs-sub-big-o',
                title: 'Asymptotic Invariants',
                description: 'Upper bounding algorithms with $O(g(n))$.',
                concepts: [
                  {
                    id: 'concept-asymptotic-big-o',
                    subjectId: 'cs',
                    examTracks: ['all', 'ai_ml_foundations'],
                    chapterId: 'cs-ch-python-dsa',
                    topicId: 'cs-topic-complexity',
                    subtopicId: 'cs-sub-big-o',
                    title: 'Asymptotic Big-O Complexity Analysis',
                    summary: 'Formally upper bound algorithm growth rate independent of hardware machine constants.',
                    difficulty: 'easy_medium',
                    estimatedMinutes: 10,
                    xpReward: 20,
                    formalDefinition: '$f(n) = O(g(n))$ iff $\\exists c > 0, n_0 > 0$ such that $|f(n)| \\le c|g(n)|$ for all $n \\ge n_0$.',
                    intuitiveExplanation: 'Measures how runtime scales as input size approaches infinity.',
                    keyFormulas: [],
                    keyObservations: ['Constant factors are dropped in asymptotic analysis.'],
                    workedExamples: [],
                    commonPitfalls: [],
                    prerequisites: [],
                    relatedConcepts: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // PHYSICS
  // ==========================================
  {
    id: 'physics',
    name: 'Physics',
    tagline: 'Classical mechanics, thermodynamics, electromagnetism, and wave dynamics.',
    iconName: 'Atom',
    color: '#0284c7',
    chapters: [
      {
        id: 'phys-ch-mechanics',
        subjectId: 'physics',
        examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'stem_olympiad'],
        title: 'Classical Mechanics & Invariants',
        sequenceOrder: 1,
        description: 'Work-energy theorem, momentum conservation, conservative force fields, and harmonic oscillation.',
        topics: [
          {
            id: 'phys-topic-work-energy',
            chapterId: 'phys-ch-mechanics',
            title: 'Work, Kinetic Energy & Conservative Fields',
            description: 'Scalar energy invariants in isolated mechanical systems.',
            conceptCount: 2,
            estimatedHours: 4,
            subtopics: [
              {
                id: 'phys-sub-conservation',
                title: 'Mechanical Conservation Laws',
                description: 'State functions and path independence.',
                concepts: [
                  {
                    id: 'concept-energy-cons',
                    subjectId: 'physics',
                    examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'stem_olympiad'],
                    chapterId: 'phys-ch-mechanics',
                    topicId: 'phys-topic-work-energy',
                    subtopicId: 'phys-sub-conservation',
                    title: 'Work-Energy Theorem & Conservation Laws',
                    summary: 'Understand mechanical energy conservation and path independence in conservative force fields.',
                    difficulty: 'medium',
                    estimatedMinutes: 12,
                    xpReward: 25,
                    formalDefinition: 'The net work done by all forces acting on a point particle equals the change in its kinetic energy: $W_{net} = \\Delta K = K_f - K_i$. When all forces are conservative, total mechanical energy $E = K + U$ is strictly constant.',
                    intuitiveExplanation: 'Energy acts as nature\'s universal accounting currency. Kinetic motion transforms into stored potential tension without loss in conservative systems.',
                    keyFormulas: [
                      {
                        label: 'Work-Energy Integral',
                        latex: 'W_{net} = \\int_{\\mathbf{r}_1}^{\\mathbf{r}_2} \\mathbf{F}_{net} \\cdot d\\mathbf{r} = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2',
                        explanation: 'Path integral of dot product of force vector and displacement.',
                      },
                      {
                        label: 'Spring Elastic Potential Energy',
                        latex: 'U_{spring} = \\frac{1}{2} k x^2',
                        explanation: 'Potential energy stored in an ideal spring compressed or stretched by distance $x$.',
                      },
                    ],
                    keyObservations: [
                      'Internal conservative forces do not change the total mechanical energy of a closed system.',
                      'Work done by friction or air resistance is non-conservative and converts mechanical energy into thermal dissipation.',
                    ],
                    workedExamples: [
                      {
                        id: 'we-phys-01',
                        title: 'Dropping a Mass onto a Vertical Spring',
                        problemStatement: 'A $2\\text{ kg}$ block is dropped from rest from a height of $5\\text{ m}$ above a vertical spring with spring constant $k = 400\\text{ N/m}$. Taking $g = 10\\text{ m/s}^2$, find maximum compression $x$.',
                        difficulty: 'medium_hard',
                        stepByStepSolution: [
                          'Set reference level ($U_g = 0$) at the point of maximum spring compression.',
                          'Initial energy at height $(h + x)$: $E_i = mg(h + x) = 2(10)(5 + x) = 20(5 + x) = 100 + 20x$.',
                          'Final energy at rest at max compression: $E_f = \\frac{1}{2}kx^2 = \\frac{1}{2}(400)x^2 = 200x^2$.',
                          'Equate $E_i = E_f$: $200x^2 - 20x - 100 = 0 \\implies 10x^2 - x - 5 = 0$.',
                          'Solve quadratic: $x = \\frac{1 + \\sqrt{1 - 4(10)(-5)}}{20} = \\frac{1 + \\sqrt{201}}{20} \\approx \\frac{1 + 14.18}{20} \\approx 0.76\\text{ m}$.',
                        ],
                        finalAnswer: '0.76 m',
                        keyTakeaway: 'Always include the spring compression distance $x$ in gravitational potential energy loss from release point.',
                      },
                    ],
                    commonPitfalls: [
                      {
                        id: 'cp-phys-01',
                        trapTitle: 'Forgetting spring compression $x$ in gravitational drop height',
                        flawedReasoning: 'Setting $mgh = \\frac{1}{2}kx^2$ directly.',
                        correctConcept: 'The mass continues to fall under gravity while compressing the spring by $x$, so total drop distance is $(h + x)$.',
                      },
                    ],
                    interactiveWidget: 'energy_conservation',
                    prerequisites: [],
                    relatedConcepts: [],
                    miniCheckQuestion: {
                      prompt: 'If the speed of a moving particle is tripled, by what factor does its kinetic energy increase?',
                      options: ['3x', '6x', '9x', '27x'],
                      correctIndex: 2,
                      explanation: '$K = \\frac{1}{2}mv^2$, so tripling velocity yields $3^2 = 9\\times$ kinetic energy.',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // CHEMISTRY
  // ==========================================
  {
    id: 'chemistry',
    name: 'Chemistry',
    tagline: 'Organic reaction mechanisms, kinetics, thermodynamics, and molecular orbitals.',
    iconName: 'FlaskConical',
    color: '#059669',
    chapters: [
      {
        id: 'chem-ch-organic',
        subjectId: 'chemistry',
        examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'stem_olympiad'],
        title: 'Organic Chemistry & Reaction Mechanisms',
        sequenceOrder: 1,
        description: 'Nucleophilic substitution, stereochemical inversions, elimination pathways, and resonance.',
        topics: [
          {
            id: 'chem-topic-substitution',
            chapterId: 'chem-ch-organic',
            title: 'Nucleophilic Substitution (SN1 vs SN2)',
            description: 'Concerted backside attack vs carbocation intermediate pathways.',
            conceptCount: 2,
            estimatedHours: 4,
            subtopics: [
              {
                id: 'chem-sub-sn2',
                title: 'SN2 Inversion & Kinetics',
                description: 'Bimolecular rate law and Walden inversion.',
                concepts: [
                  {
                    id: 'concept-sn1-sn2',
                    subjectId: 'chemistry',
                    examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem', 'stem_olympiad'],
                    chapterId: 'chem-ch-organic',
                    topicId: 'chem-topic-substitution',
                    subtopicId: 'chem-sub-sn2',
                    title: 'Stereochemistry of SN2 & Walden Inversion',
                    summary: 'Bimolecular nucleophilic substitution with concerted backside attack resulting in 100% stereochemical inversion.',
                    difficulty: 'hard',
                    estimatedMinutes: 14,
                    xpReward: 35,
                    formalDefinition: 'An SN2 reaction proceeds via a single concerted step with a pentacoordinate transition state. The rate law is second-order: $\\text{Rate} = k [\\text{Substrate}][\\text{Nucleophile}]$. The attacking nucleophile donates electrons into the $\\sigma^*$ antibonding orbital opposite to the leaving group, causing full configuration inversion.',
                    intuitiveExplanation: 'Like an umbrella flipping inside out during a strong gust of wind, the tetrahedral geometry around the chiral carbon inverts as the nucleophile pushes in from the back.',
                    keyFormulas: [
                      {
                        label: 'Bimolecular Rate Law',
                        latex: '\\text{Rate} = k [\\text{R-X}] [\\text{Nu}^-]',
                        explanation: 'Both substrate and nucleophile participate in the rate-determining transition state.',
                      },
                    ],
                    keyObservations: [
                      'Steric hindrance heavily governs reactivity: $\\text{Methyl} > 1^\\circ > 2^\\circ \\gg 3^\\circ$ (tertiary halides undergo zero SN2).',
                      'Polar aprotic solvents (e.g. Acetone, DMSO, DMF) accelerate SN2 by leaving nucleophiles unencumbered by hydrogen bonding.',
                    ],
                    workedExamples: [
                      {
                        id: 'we-chem-01',
                        title: 'Predicting Stereochemical Product of SN2',
                        problemStatement: 'When $(R)\\text{-2-bromobutane}$ reacts with $\\text{NaCN}$ in acetone, what is the stereochemical outcome?',
                        difficulty: 'hard',
                        stepByStepSolution: [
                          'Identify substrate: 2-bromobutane is secondary with a chiral stereocenter at C2 in the $(R)$ configuration.',
                          'Identify nucleophile and solvent: $\\text{CN}^-$ is a strong nucleophile, and acetone is a polar aprotic solvent.',
                          'Mechanism: Favors concerted SN2 substitution.',
                          'Stereochemical consequence: Backside attack inverts $(R)$ to $(S)$.',
                        ],
                        finalAnswer: '$(S)\\text{-2-methylbutanenitrile}$ with 100% Walden inversion',
                        keyTakeaway: 'SN2 on a chiral carbon always yields complete stereochemical inversion, never racemization.',
                      },
                    ],
                    commonPitfalls: [
                      {
                        id: 'cp-chem-01',
                        trapTitle: 'Confusing SN1 racemization with SN2 inversion',
                        flawedReasoning: 'Assuming SN2 produces a 50:50 racemic mixture of enantiomers.',
                        correctConcept: 'SN1 forms a planar carbocation intermediate attacked from either face (racemization). SN2 occurs in a single concerted step only from the backside (100% inversion).',
                      },
                    ],
                    interactiveWidget: 'sn2_inversion',
                    prerequisites: [],
                    relatedConcepts: [],
                    miniCheckQuestion: {
                      prompt: 'Which solvent is optimal for maximizing the rate of an SN2 reaction?',
                      options: [
                        'Dimethyl sulfoxide (DMSO) - polar aprotic',
                        'Water ($H_2O$) - polar protic',
                        'Methanol ($CH_3OH$) - polar protic',
                        'Hexane - non-polar',
                      ],
                      correctIndex: 0,
                      explanation: 'Polar aprotic solvents solvate cations well while leaving anionic nucleophiles bare and reactive for backside attack.',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // BIOLOGY
  // ==========================================
  {
    id: 'biology',
    name: 'Biology',
    tagline: 'Cellular pathways, genetics, molecular biology, and evolutionary dynamics.',
    iconName: 'Dna',
    color: '#e11d48',
    chapters: [
      {
        id: 'bio-ch-genetics',
        subjectId: 'biology',
        examTracks: ['all', 'ap_stem', 'stem_olympiad'],
        title: 'Molecular Genetics & Central Dogma',
        sequenceOrder: 1,
        description: 'DNA replication, transcription, translation, and genetic regulation.',
        topics: [
          {
            id: 'bio-topic-central-dogma',
            chapterId: 'bio-ch-genetics',
            title: 'Transcription & Translation Mechanics',
            description: 'Information transfer from nucleic acid sequences to functional polypeptides.',
            conceptCount: 1,
            estimatedHours: 3,
            subtopics: [
              {
                id: 'bio-sub-translation',
                title: 'Ribosomal Translation',
                description: 'Codon triplets, tRNA anticodons, and peptide elongation.',
                concepts: [
                  {
                    id: 'concept-central-dogma',
                    subjectId: 'biology',
                    examTracks: ['all', 'ap_stem', 'stem_olympiad'],
                    chapterId: 'bio-ch-genetics',
                    topicId: 'bio-topic-central-dogma',
                    subtopicId: 'bio-sub-translation',
                    title: 'Central Dogma: Transcription & Translation',
                    summary: 'Understand the directional flow of genetic information from DNA to mRNA to peptide chains.',
                    difficulty: 'medium',
                    estimatedMinutes: 10,
                    xpReward: 25,
                    formalDefinition: 'The Central Dogma describes two primary steps: Transcription (DNA template strand copied into mRNA by RNA polymerase in the $5\' \\to 3\'$ direction) and Translation (ribosomes read mRNA codons $5\' \\to 3\'$ to assemble amino acid sequences).',
                    intuitiveExplanation: 'DNA is the master blueprint stored in the secure vault; mRNA is the working photocopy carried to the factory floor (ribosome) to build functional proteins.',
                    keyFormulas: [
                      {
                        label: 'Directionality Invariant',
                        latex: '\\text{DNA } (3\' \\to 5\') \\xrightarrow{\\text{RNA Pol}} \\text{mRNA } (5\' \\to 3\') \\xrightarrow{\\text{Ribosome}} \\text{Protein } (N \\to C)',
                        explanation: 'Nucleic acid synthesis always proceeds from 5-prime to 3-prime phosphate.',
                      },
                    ],
                    keyObservations: [
                      'The genetic code is degenerate (multiple codons encode the same amino acid) but unambiguous.',
                      'AUG is the universal start codon encoding Methionine.',
                    ],
                    workedExamples: [],
                    commonPitfalls: [],
                    interactiveWidget: 'dna_transcription',
                    prerequisites: [],
                    relatedConcepts: [],
                    miniCheckQuestion: {
                      prompt: 'If the DNA template strand reads $3\'\\text{-TAC GGC TTA- }5\'$, what is the resulting mRNA sequence?',
                      options: [
                        '$5\'\\text{-AUG CCG AAU- }3\'$',
                        '$5\'\\text{-AUG CCG UUA- }3\'$',
                        '$3\'\\text{-AUG CCG AAU- }5\'$',
                        '$5\'\\text{-UAC GGC UUA- }3\'$',
                      ],
                      correctIndex: 0,
                      explanation: 'RNA polymerase pairs complementary bases ($T\\to A, A\\to U, C\\to G, G\\to C$) antiparallel $5\' \\to 3\'$.',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
