import { ConceptDetail } from '../../types/curriculum';

/**
 * Amplified concepts to dramatically increase concept density across all subjects and topics.
 * Each concept features formal definitions, intuitive invariants, KaTeX equations, worked examples,
 * common pitfalls with counterexamples, and interactive diagnostics.
 */
export const AMPLIFIED_CONCEPTS: Record<string, ConceptDetail[]> = {
  // ==========================================
  // MATHEMATICS ADDITIONAL HIGH-DENSITY CONCEPTS
  // ==========================================
  'math-topic-monotonicity': [
    {
      id: 'concept-taylor-series-approx',
      subjectId: 'math',
      examTracks: ['all', 'jee_advanced', 'ap_stem', 'ai_ml_foundations'],
      chapterId: 'math-ch-diff-calc',
      topicId: 'math-topic-monotonicity',
      subtopicId: 'math-sub-first-deriv',
      title: 'Taylor Polynomial Approximations & Lagrange Remainder',
      summary: 'Approximate transcendental smooth functions near local points using polynomial derivatives with strict error bounds.',
      difficulty: 'hard',
      estimatedMinutes: 16,
      xpReward: 35,
      formalDefinition: 'Let $f \\in C^{n+1}(I)$. The $n$-th Taylor polynomial centered at $a$ is $P_n(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!} (x - a)^k$. By Lagrange Remainder Theorem, $R_n(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!} (x - a)^{n+1}$ for some $\\xi$ between $a$ and $x$.',
      intuitiveExplanation: 'Taylor series is like fitting a polynomial glove over any curved function. At degree 0, it matches height. At degree 1, it matches slope. At degree 2, it matches curvature. The more derivatives you match, the tighter the fit around the center point.',
      keyFormulas: [
        {
          label: 'Taylor Series with Lagrange Remainder',
          latex: 'f(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!} (x - a)^k + \\frac{f^{(n+1)}(\\xi)}{(n+1)!} (x - a)^{n+1}',
          explanation: 'Provides an exact error bound on the polynomial approximation over any interval.',
        },
      ],
      keyObservations: [
        'Taylor series for $e^x, \\sin x, \\cos x$ converge for all real $x$ (radius of convergence $R = \\infty$).',
        'Geometric series $\\frac{1}{1-x} = \\sum_{k=0}^\\infty x^k$ converges strictly on $(-1, 1)$.',
        'In machine learning, 2nd-order Taylor expansion forms the foundation of Newton-Raphson optimization.',
      ],
      workedExamples: [
        {
          id: 'we-math-amp-01',
          title: 'Bounding Error for $\\sin(0.1)$ using Degree 3 Taylor Expansion',
          problemStatement: 'Estimate $\\sin(0.1)$ using the 3rd-degree Maclaurin polynomial and determine the maximum error bound using Lagrange remainder.',
          difficulty: 'medium_hard',
          stepByStepSolution: [
            'Maclaurin series for $\\sin x$: $P_3(x) = x - \\frac{x^3}{6}$.',
            'Evaluate at $x = 0.1$: $P_3(0.1) = 0.1 - \\frac{0.001}{6} \\approx 0.1 - 0.0001667 = 0.0998333$.',
            'Compute remainder bound: $R_4(x) = \\frac{f^{(5)}(\\xi)}{5!} x^5 = \\frac{\\cos(\\xi)}{120} (0.1)^5$.',
            'Since $|\\cos(\\xi)| \\le 1$: $|R_4| \\le \\frac{10^{-5}}{120} \\approx 8.33 \\times 10^{-8}$.',
          ],
          finalAnswer: 'Estimate: 0.0998333 with error $|R_4| < 8.33 \\times 10^{-8}$.',
          keyTakeaway: 'Alternating series and Lagrange bounds provide rigorous error envelopes for numerical approximations.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-math-amp-01',
          trapTitle: 'Ignoring the Radius of Convergence',
          flawedReasoning: 'Using the Taylor series of $\\ln(1+x)$ to evaluate $\\ln(5)$ by setting $x = 4$.',
          correctConcept: 'The series $\\sum (-1)^{k+1} x^k / k$ diverges outside $(-1, 1]$. Must use identity transformations.',
          counterExample: 'Substituting $x=4$ yields a diverging sum that fails to represent $\\ln(5)$.',
        },
      ],
      prerequisites: [{ id: 'concept-deriv-inc-dec', title: 'Monotonicity & First Derivative', subjectId: 'math' }],
      relatedConcepts: [{ id: 'concept-concavity-second-deriv', title: 'Concavity & Second Derivative Test', subjectId: 'math' }],
      miniCheckQuestion: {
        prompt: 'What is the second-order Taylor polynomial approximation of $f(x) = e^{2x}$ centered at $x = 0$?',
        options: [
          '$1 + 2x + 2x^2$',
          '$1 + 2x + 4x^2$',
          '$1 + x + x^2$',
          '$1 + 2x + x^2$',
        ],
        correctIndex: 0,
        explanation: '$f(0)=1, f\'(0)=2, f\'\'(0)=4$. Polynomial $P_2(x) = 1 + 2x + \\frac{4}{2}x^2 = 1 + 2x + 2x^2$.',
      },
    },
  ],

  'math-topic-ftc': [
    {
      id: 'concept-improper-integrals-cauchy',
      subjectId: 'math',
      examTracks: ['all', 'jee_advanced', 'ap_stem'],
      chapterId: 'math-ch-integral-calc',
      topicId: 'math-topic-ftc',
      subtopicId: 'math-sub-ftc',
      title: 'Improper Integrals & Cauchy Principal Value',
      summary: 'Evaluate convergence criteria for unbounded integration limits and interior vertical asymptotes.',
      difficulty: 'hard',
      estimatedMinutes: 15,
      xpReward: 35,
      formalDefinition: 'An improper integral $\\int_a^\\infty f(x) dx$ is defined as $\\lim_{t \\to \\infty} \\int_a^t f(x) dx$. If the limit exists as a finite real number, the integral converges; otherwise it diverges.',
      intuitiveExplanation: 'Can an infinite shape have finite area? Yes! If a curve drops toward zero fast enough (like $1/x^2$), the tail is so thin that the total area adds up to a clean finite number.',
      keyFormulas: [
        {
          label: 'p-Integral Convergence Test',
          latex: '\\int_1^\\infty \\frac{1}{x^p} dx = \\begin{cases} \\frac{1}{p-1} & \\text{if } p > 1 \\\\ \\text{Diverges} & \\text{if } p \\le 1 \\end{cases}',
          explanation: 'A fundamental benchmark test against which other rational and transcendental functions are compared.',
        },
      ],
      keyObservations: [
        'The harmonic area $\\int_1^\\infty \\frac{1}{x} dx = \\infty$ diverges, even though $\\lim_{x \\to \\infty} 1/x = 0$.',
        'For interior asymptotes at $c \\in (a, b)$, you must split into two independent limits: $\\lim_{t \\to c^-} + \\lim_{s \\to c^+}$.',
      ],
      workedExamples: [
        {
          id: 'we-math-amp-02',
          title: 'Evaluating $\\int_0^1 \\frac{1}{\\sqrt{x}} dx$',
          problemStatement: 'Evaluate the improper integral with vertical asymptote at $x = 0$: $\\int_0^1 x^{-1/2} dx$.',
          difficulty: 'medium',
          stepByStepSolution: [
            'Recognize unbounded behavior at $x = 0$.',
            'Set up limit: $\\lim_{t \\to 0^+} \\int_t^1 x^{-1/2} dx$.',
            'Find antiderivative: $[2 x^{1/2}]_t^1 = 2(1) - 2\\sqrt{t}$.',
            'Evaluate limit: $\\lim_{t \\to 0^+} (2 - 2\\sqrt{t}) = 2 - 0 = 2$.',
          ],
          finalAnswer: '2 (converges)',
          keyTakeaway: 'Fractions with powers $p < 1$ converge at zero bounds but diverge at infinity bounds.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-math-amp-02',
          trapTitle: 'Integrating Across an Asymptote Without Splitting',
          flawedReasoning: 'Calculating $\\int_{-1}^1 \\frac{1}{x^2} dx = [-1/x]_{-1}^1 = -1 - (1) = -2$.',
          correctConcept: 'Area cannot be negative for positive integrand $1/x^2$. The vertical asymptote at $x=0$ causes the integral to diverge to $+\\infty$.',
          counterExample: 'Failure to split limits produces mathematically impossible negative areas.',
        },
      ],
      prerequisites: [{ id: 'concept-ftc-leibniz', title: 'Fundamental Theorem of Calculus', subjectId: 'math' }],
      relatedConcepts: [{ id: 'concept-deriv-inc-dec', title: 'Monotonicity & Derivatives', subjectId: 'math' }],
      miniCheckQuestion: {
        prompt: 'For which values of $p$ does the improper integral $\\int_1^\\infty \\frac{1}{x^{2p}} dx$ converge?',
        options: ['$p > 1/2$', '$p > 1$', '$p \\ge 1$', '$p < 1/2$'],
        correctIndex: 0,
        explanation: 'By the $p$-test, the exponent must exceed 1: $2p > 1 \\implies p > 1/2$.',
      },
    },
  ],

  // ==========================================
  // COMPUTER SCIENCE ADDITIONAL HIGH-DENSITY CONCEPTS
  // ==========================================
  'cs-topic-complexity': [
    {
      id: 'concept-amortized-analysis-potential',
      subjectId: 'cs',
      examTracks: ['all', 'ict_hackathon', 'ai_ml_foundations'],
      chapterId: 'cs-ch-python-dsa',
      topicId: 'cs-topic-complexity',
      subtopicId: 'cs-sub-big-o',
      title: 'Amortized Complexity & Potential Method',
      summary: 'Analyze the average cost per operation over a sequence of operations using aggregate, accounting, and potential function methods.',
      difficulty: 'hard',
      estimatedMinutes: 16,
      xpReward: 35,
      formalDefinition: 'Let $\\Phi(D_i)$ be a potential function mapping data structure states to non-negative real numbers with $\\Phi(D_0) = 0$. The amortized cost of the $i$-th operation is $\\hat{c}_i = c_i + \\Phi(D_i) - \\Phi(D_{i-1})$. Over $n$ operations, $\\sum \\hat{c}_i \\ge \\sum c_i$.',
      intuitiveExplanation: 'Think of dynamic array doubling (like Python list `.append()`). Most appends cost $O(1)$. Occasionally an append triggers an expensive $O(n)$ memory reallocation. By saving "prepaid energy tokens" during the cheap steps, the expensive step is fully paid for, maintaining an overall amortized average of $O(1)$ per operation.',
      keyFormulas: [
        {
          label: 'Potential Method Invariant',
          latex: '\\sum_{i=1}^n c_i \\le \\sum_{i=1}^n \\hat{c}_i + \\Phi(D_0) - \\Phi(D_n)',
          explanation: 'Guarantees that total amortized cost strictly upper bounds true aggregate execution cost.',
        },
      ],
      keyObservations: [
        'A single operation in an amortized $O(1)$ structure can take $O(n)$ in the worst case.',
        'Dynamic array doubling by factor 2 achieves amortized $O(1)$; adding a fixed constant $+k$ degrades to $O(n)$ amortized.',
        'Disjoint Set Union (DSU) with path compression and union by rank achieves $O(\\alpha(n))$ where $\\alpha$ is the inverse Ackermann function.',
      ],
      workedExamples: [
        {
          id: 'we-cs-amp-01',
          title: 'Proving $O(1)$ Amortized Append in Geometric Array Resizing',
          problemStatement: 'Show that doubling capacity from $N$ to $2N$ when full guarantees $O(1)$ amortized cost per insertion.',
          difficulty: 'medium',
          stepByStepSolution: [
            'Let potential $\\Phi = 2 \\times (\\text{number of elements}) - \\text{capacity}$.',
            'When array is just resized: $N$ elements, capacity $2N \\implies \\Phi = 2N - 2N = 0$.',
            'When array fills up before next resize: $2N$ elements, capacity $2N \\implies \\Phi = 4N - 2N = 2N$.',
            'During reallocation: Copying costs $2N$, but $\\Delta \\Phi = 0 - 2N = -2N$.',
            'Amortized cost: $\\hat{c} = c + \\Delta \\Phi = 2N + (-2N) = O(1)$.',
          ],
          finalAnswer: 'Amortized cost is $O(1)$ per insertion.',
          keyTakeaway: 'Geometric scaling guarantees that savings accumulate faster than resizing copy overhead.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-cs-amp-01',
          trapTitle: 'Confusing Amortized Cost with Average-Case Complexity',
          flawedReasoning: 'Believing that amortized cost relies on probabilistic random inputs like Quicksort average time.',
          correctConcept: 'Amortized analysis applies to deterministic worst-case operation sequences; no probabilities are assumed.',
          counterExample: 'Array doubling takes $O(1)$ amortized even under adversarial input ordering.',
        },
      ],
      prerequisites: [{ id: 'concept-asymptotic-big-o', title: 'Asymptotic Analysis & Big-O Notation', subjectId: 'cs' }],
      relatedConcepts: [{ id: 'concept-dijkstra-relaxation', title: 'Dijkstra Shortest Path & Priority Queues', subjectId: 'cs' }],
      miniCheckQuestion: {
        prompt: 'If a dynamic array grows by adding 100 slots each time it fills instead of doubling, what is the amortized cost per append over $N$ insertions?',
        options: ['$O(1)$', '$O(N)$', '$O(\\log N)$', '$O(N^2)$'],
        correctIndex: 1,
        explanation: 'Adding fixed capacity causes resizing copies to sum as $100 + 200 + \\dots + N = O(N^2)$ total work for $N$ appends, which is $O(N)$ amortized per operation.',
      },
    },
  ],

  // ==========================================
  // PHYSICS ADDITIONAL HIGH-DENSITY CONCEPTS
  // ==========================================
  'phys-topic-work-energy': [
    {
      id: 'concept-lagrangian-mechanics-euler',
      subjectId: 'physics',
      examTracks: ['all', 'jee_advanced', 'stem_olympiad'],
      chapterId: 'phys-ch-mechanics',
      topicId: 'phys-topic-work-energy',
      subtopicId: 'phys-sub-conservation',
      title: 'Euler-Lagrange Equations & Principle of Least Action',
      summary: 'Derive physical trajectories from kinetic and potential energy potentials using the principle of stationary action $\\delta S = 0$.',
      difficulty: 'hard',
      estimatedMinutes: 18,
      xpReward: 40,
      formalDefinition: 'The Lagrangian is defined as $L(q, \\dot{q}, t) = T - V$. The true physical path minimizes or extremizes the action functional $S = \\int_{t_1}^{t_2} L dt$, satisfying the Euler-Lagrange equations: $\\frac{d}{dt}\\left(\\frac{\\partial L}{\\partial \\dot{q}_i}\\right) - \\frac{\\partial L}{\\partial q_i} = 0$.',
      intuitiveExplanation: 'Instead of pushing and pulling with vector forces $\\vec{F} = m\\vec{a}$ in cumbersome coordinate systems, Lagrangian mechanics looks at scalar energies (Kinetic minus Potential). Nature takes the path that minimizes action, effortlessly bypassing constraint forces like normal forces and string tensions.',
      keyFormulas: [
        {
          label: 'Euler-Lagrange Differential Equation',
          latex: '\\frac{d}{dt}\\left( \\frac{\\partial L}{\\partial \\dot{q}} \\right) - \\frac{\\partial L}{\\partial q} = 0, \\quad \\text{where } L = T - V',
          explanation: 'Generalizes Newton second law to arbitrary generalized coordinates ($q = r, \\theta, \\phi$).',
        },
        {
          label: 'Noether Theorem Invariant',
          latex: '\\frac{\\partial L}{\\partial q_i} = 0 \\implies p_i = \\frac{\\partial L}{\\partial \\dot{q}_i} = \\text{Constant}',
          explanation: 'Spatial translation symmetry implies momentum conservation; rotational symmetry implies angular momentum conservation.',
        },
      ],
      keyObservations: [
        'Generalized coordinates eliminate constraint forces (like normal forces on a curved roller coaster rail) automatically.',
        'If the Lagrangian has no explicit time dependence ($\\partial L / \\partial t = 0$), the Hamiltonian (total energy $E = T + V$) is conserved.',
      ],
      workedExamples: [
        {
          id: 'we-phys-amp-01',
          title: 'Simple Pendulum Equation via Euler-Lagrange',
          problemStatement: 'Derive the equation of motion for a pendulum of length $l$ and mass $m$ with angular displacement $\\theta$.',
          difficulty: 'medium_hard',
          stepByStepSolution: [
            'Kinetic energy: $T = \\frac{1}{2} m v^2 = \\frac{1}{2} m (l \\dot{\\theta})^2 = \\frac{1}{2} m l^2 \\dot{\\theta}^2$.',
            'Potential energy (zero at bottom): $V = m g h = m g l (1 - \\cos\\theta)$.',
            'Form Lagrangian: $L = T - V = \\frac{1}{2} m l^2 \\dot{\\theta}^2 - m g l (1 - \\cos\\theta)$.',
            'Compute derivatives: $\\frac{\\partial L}{\\partial \\dot{\\theta}} = m l^2 \\dot{\\theta} \\implies \\frac{d}{dt}(m l^2 \\dot{\\theta}) = m l^2 \\ddot{\\theta}$.',
            'Compute $\\frac{\\partial L}{\\partial \\theta} = -m g l \\sin\\theta$.',
            'Substitute into Euler-Lagrange: $m l^2 \\ddot{\\theta} - (-m g l \\sin\\theta) = 0 \\implies \\ddot{\\theta} + \\frac{g}{l}\\sin\\theta = 0$.',
          ],
          finalAnswer: '$\\ddot{\\theta} + \\frac{g}{l}\\sin\\theta = 0$',
          keyTakeaway: 'The Lagrangian method yields exact non-linear equations of motion without needing free-body force diagrams.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-phys-amp-01',
          trapTitle: 'Confusing Total Energy with the Lagrangian',
          flawedReasoning: 'Setting $L = T + V$.',
          correctConcept: 'The Lagrangian is strictly $L = T - V$. Total mechanical energy is the Hamiltonian $H = T + V$.',
          counterExample: 'Using $T + V$ in Euler-Lagrange inverts gravitational signs, producing exponential explosion instead of harmonic oscillation.',
        },
      ],
      prerequisites: [{ id: 'concept-energy-cons', title: 'Work-Energy Theorem & Conservation of Energy', subjectId: 'physics' }],
      relatedConcepts: [{ id: 'concept-lagrange-multipliers', title: 'Lagrange Multipliers & Constrained Optimization', subjectId: 'math' }],
      miniCheckQuestion: {
        prompt: 'According to Noether Theorem, which continuous symmetry of the Lagrangian guarantees the conservation of linear momentum?',
        options: [
          'Time translation invariance',
          'Spatial translation invariance',
          'Rotational invariance',
          'Gauge invariance',
        ],
        correctIndex: 1,
        explanation: 'Spatial translation symmetry of the Lagrangian implies that $\\partial L / \\partial x = 0$, conserving generalized momentum $p_x$.',
      },
    },
  ],

  // ==========================================
  // CHEMISTRY ADDITIONAL HIGH-DENSITY CONCEPTS
  // ==========================================
  'chem-topic-substitution': [
    {
      id: 'concept-e1-e2-elimination-kinetics',
      subjectId: 'chemistry',
      examTracks: ['all', 'jee_advanced', 'jee_main', 'ap_stem'],
      chapterId: 'chem-ch-organic',
      topicId: 'chem-topic-substitution',
      subtopicId: 'chem-sub-sn2',
      title: 'E1 vs. E2 Elimination Kinetics & Zaitsev Stereoselectivity',
      summary: 'Analyze regiochemical (Zaitsev vs. Hofmann) and stereochemical (anti-periplanar) requirements in alkene-forming elimination reactions.',
      difficulty: 'hard',
      estimatedMinutes: 16,
      xpReward: 35,
      formalDefinition: 'E2 is a concerted bimolecular elimination requiring anti-coplanar / anti-periplanar dihedral alignment ($180^\\circ$) between the $\\beta$-hydrogen and the leaving group. E1 is a stepwise unimolecular pathway proceeding through a carbocation intermediate.',
      intuitiveExplanation: 'In E2, the base pulls off a hydrogen while the leaving group departs at the exact same moment. For maximum orbital overlap, the departing H and the leaving group must face opposite sides like dancers back-to-back ($180^\\circ$). If they can not align anti-periplanar, the reaction will not happen.',
      keyFormulas: [
        {
          label: 'E2 Rate Law Equation',
          latex: '\\text{Rate}_{E2} = k [\\text{Substrate}] [\\text{Base}]',
          explanation: 'Second-order overall kinetics; favored by strong unhindered or bulky bases ($t\\text{-BuO}^-$, $\\text{EtO}^-$).',
        },
      ],
      keyObservations: [
        'Zaitsev rule yields the most substituted, thermodynamically stable alkene under small bases ($\\text{MeO}^-$, $\\text{EtO}^-$).',
        'Bulky hindered bases ($t\\text{-BuOK}$) abstract the most accessible proton, favoring the less substituted Hofmann alkene.',
        'In cyclohexanes, the leaving group MUST occupy an axial position to achieve the required anti-periplanar dihedral angle with an axial $\\beta$-hydrogen.',
      ],
      workedExamples: [
        {
          id: 'we-chem-amp-01',
          title: 'Predicting Regiochemistry with Bulky Potassium tert-Butoxide',
          problemStatement: 'Predict the major alkene product when 2-bromo-2-methylbutane reacts with potassium tert-butoxide ($t\\text{-BuOK}$) in $t\\text{-BuOH}$.',
          difficulty: 'medium',
          stepByStepSolution: [
            'Classify substrate: 2-bromo-2-methylbutane is a tertiary alkyl halide (favors E2 over substitution).',
            'Classify base: $t\\text{-BuOK}$ is a sterically hindered strong base.',
            'Identify $\\beta$-hydrogens: Internal methylene ($-\\text{CH}_2-$) vs. terminal methyl ($-\\text{CH}_3$).',
            'Apply steric control: The bulky tert-butoxide cannot easily reach the crowded internal proton.',
            'Conclude product: Deprotonation occurs at the terminal methyl, yielding 2-methyl-1-butene (Hofmann product).',
          ],
          finalAnswer: '2-methyl-1-butene (Hofmann elimination product)',
          keyTakeaway: 'Bulky bases force deprotonation at the least hindered carbon, yielding the less substituted alkene.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-chem-amp-01',
          trapTitle: 'Forgetting the Axial Requirement in Cyclohexane Rings',
          flawedReasoning: 'Predicting the Zaitsev product from a menthyl chloride derivative when the leaving group is equatorial.',
          correctConcept: 'An equatorial leaving group cannot undergo E2 elimination until the ring flips into the less stable conformer where the halogen is axial.',
          counterExample: 'Neomenthyl chloride reacts much faster than menthyl chloride because chlorine is already axial.',
        },
      ],
      prerequisites: [{ id: 'concept-sn1-sn2', title: 'SN1 vs SN2 Mechanisms & Stereochemistry', subjectId: 'chemistry' }],
      relatedConcepts: [{ id: 'concept-arrhenius-kinetics', title: 'Chemical Kinetics & Arrhenius Activation Energy', subjectId: 'chemistry' }],
      miniCheckQuestion: {
        prompt: 'What spatial arrangement between the beta-hydrogen and the leaving group is required for concerted E2 elimination?',
        options: [
          'Syn-periplanar ($0^\\circ$ dihedral)',
          'Anti-periplanar ($180^\\circ$ dihedral)',
          'Gauche ($60^\\circ$ dihedral)',
          'Orthogonal ($90^\\circ$ dihedral)',
        ],
        correctIndex: 1,
        explanation: 'Anti-periplanar alignment ($180^\\circ$) allows simultaneous overlap between the $\\sigma_{\\text{C-H}}$ bonding orbital and $\\sigma^*_{\\text{C-X}}$ antibonding orbital.',
      },
    },
  ],

  // ==========================================
  // BIOLOGY ADDITIONAL HIGH-DENSITY CONCEPTS
  // ==========================================
  'bio-topic-central-dogma': [
    {
      id: 'concept-epigenetic-histone-methylation',
      subjectId: 'biology',
      examTracks: ['all', 'stem_olympiad', 'ap_stem'],
      chapterId: 'bio-ch-genetics',
      topicId: 'bio-topic-central-dogma',
      subtopicId: 'bio-sub-translation',
      title: 'Epigenetic Regulation, Histone Acetylation & CpG Methylation',
      summary: 'Analyze chromatin remodeling, histone acetyltransferases (HATs), and DNA methyltransferases in transcriptional switching.',
      difficulty: 'hard',
      estimatedMinutes: 16,
      xpReward: 35,
      formalDefinition: 'Epigenetics refers to heritable phenotypic changes in gene expression that do not alter the underlying nucleotide sequence, mediated through chromatin remodeling via histone tail post-translational modifications and covalent DNA methylation of CpG islands.',
      intuitiveExplanation: 'DNA is a library of books. Your genes are the text. Epigenetics is deciding which books are kept on open display desks (euchromatin, actively read) and which books are locked inside tightly coiled metal safes (heterochromatin, silenced). Adding acetyl groups opens the safe; adding methyl groups locks it.',
      keyFormulas: [
        {
          label: 'Histone Charge Neutralization Invariant',
          latex: '\\text{Lysine}^+ + \\text{Acetyl-CoA} \\xrightarrow{\\quad \\text{HAT} \\quad} \\text{Acetyl-Lysine}^0 \\implies \\text{Weakened DNA Electrostatic Binding}',
          explanation: 'Neutralizing positive lysine charges loosens histone grip on negative DNA phosphate backbone, opening chromatin.',
        },
      ],
      keyObservations: [
        'Histone Acetylation (via HATs) relaxes chromatin into transcriptionally active euchromatin.',
        'Histone Deacetylation (via HDACs) restores positive charge, condensing chromatin into inactive heterochromatin.',
        'DNA methylation of promoter CpG islands typically silences transcription by recruiting methyl-CpG-binding proteins.',
      ],
      workedExamples: [
        {
          id: 'we-bio-amp-01',
          title: 'Predicting Transcriptional Consequences of HDAC Inhibition',
          problemStatement: 'A cancer chemotherapy agent inhibits Histone Deacetylase (HDAC) enzymes. What is the molecular consequence on tumor suppressor gene expression?',
          difficulty: 'medium',
          stepByStepSolution: [
            'Determine normal HDAC action: HDAC removes acetyl groups, condensing chromatin and silencing genes.',
            'Inhibit HDAC: Acetyl groups remain attached to histone lysine tails.',
            'Consequence on chromatin: Chromatin remains relaxed in open euchromatin state.',
            'Consequence on transcription: RNA polymerase II and transcription factors can access promoter regions.',
            'Result: Re-activation of previously silenced tumor suppressor genes, triggering apoptosis.',
          ],
          finalAnswer: 'HDAC inhibition maintains histone acetylation, opening chromatin and re-activating gene transcription.',
          keyTakeaway: 'Inhibiting deacetylation tips the balance toward open euchromatin and active transcription.',
        },
      ],
      commonPitfalls: [
        {
          id: 'cp-bio-amp-01',
          trapTitle: 'Confusing DNA Methylation with Histone Acetylation',
          flawedReasoning: 'Believing that DNA methylation opens chromatin for expression.',
          correctConcept: 'DNA methylation almost always silences promoters; histone acetylation opens chromatin.',
          counterExample: 'Hypermethylated CpG islands in tumor suppressor promoters are a classic cause of oncogenesis.',
        },
      ],
      prerequisites: [{ id: 'concept-central-dogma', title: 'Molecular Biology & Central Dogma', subjectId: 'biology' }],
      relatedConcepts: [{ id: 'concept-crispr-cas9-pcr', title: 'CRISPR-Cas9 & Genetic Editing', subjectId: 'biology' }],
      miniCheckQuestion: {
        prompt: 'What chemical alteration occurs when Histone Acetyltransferase (HAT) enzymes modify lysine residues on core histones?',
        options: [
          'It adds a positive charge, causing chromatin to bind DNA more tightly.',
          'It neutralizes the positive charge on lysine, weakening electrostatic interaction with DNA and opening chromatin.',
          'It hydrolyzes phosphodiester bonds in the promoter region.',
          'It terminates peptide elongation during mRNA translation.',
        ],
        correctIndex: 1,
        explanation: 'Acetylation neutralizes the positive charge on basic lysine amino acids, relaxing nucleosome compaction.',
      },
    },
  ],
};
