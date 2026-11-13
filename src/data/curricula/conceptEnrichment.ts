import { ConceptDetail } from '../../types/curriculum';

/**
 * Content-completeness pass.
 *
 * Audit finding: 36 of the original 63 concepts were shipped as "summary only"
 * — a formal definition, an intuition and formulas, but **no worked examples,
 * no common pitfalls and no mini-check question**. The concept view hides those
 * tabs when the arrays are empty, so more than half the library silently lost
 * its practice surface while still counting toward the curriculum totals.
 *
 * This module fills those gaps with real subject content, keyed by concept id.
 * Anything already complete is left untouched.
 */

type Enrichment = Pick<ConceptDetail, 'workedExamples' | 'commonPitfalls' | 'miniCheckQuestion'>;

export const CONCEPT_ENRICHMENT: Record<string, Enrichment> = {
  'concept-concavity-second-deriv': {
    workedExamples: [
      {
        id: 'we-enr-concavity-1',
        title: 'Classifying a Critical Point with the Second Derivative',
        problemStatement: 'Classify the critical points of $f(x) = x^3 - 3x^2$.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Find critical points: $f\'(x) = 3x^2 - 6x = 3x(x - 2)$, so $x = 0$ and $x = 2$.',
          'Compute the second derivative: $f\'\'(x) = 6x - 6$.',
          'At $x = 0$: $f\'\'(0) = -6 < 0$, so the graph is concave down — a local maximum.',
          'At $x = 2$: $f\'\'(2) = 6 > 0$, so the graph is concave up — a local minimum.',
        ],
        finalAnswer: 'Local maximum at $x = 0$, local minimum at $x = 2$.',
        keyTakeaway:
          'The sign of $f\'\'$ at a stationary point decides the type — negative is a peak, positive is a valley.',
      },
      {
        id: 'we-enr-concavity-2',
        title: 'Finding an Inflection Point',
        problemStatement: 'Locate the inflection point of $g(x) = x^3 - 6x^2 + 5x$.',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Differentiate twice: $g\'(x) = 3x^2 - 12x + 5$ and $g\'\'(x) = 6x - 12$.',
          'Set $g\'\'(x) = 0$: $6x - 12 = 0$ gives $x = 2$.',
          'Check the sign change: $g\'\'(1) = -6 < 0$ and $g\'\'(3) = 6 > 0$.',
          'Concavity flips from down to up across $x = 2$, confirming an inflection point there.',
        ],
        finalAnswer: 'An inflection point at $x = 2$.',
        keyTakeaway:
          'A zero second derivative is necessary but not sufficient — concavity must actually change sign.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-concavity-1',
        trapTitle: 'Treating $f\'\'(c) = 0$ as proof of an inflection point',
        flawedReasoning: 'If the second derivative vanishes at $c$, the curve must change concavity there.',
        correctConcept:
          'You must verify a genuine sign change of $f\'\'$ across $c$; otherwise the curvature may simply flatten and resume.',
        counterExample: 'For $f(x) = x^4$, $f\'\'(0) = 0$ but $f\'\' = 12x^2 \\ge 0$ everywhere — no inflection.',
      },
      {
        id: 'cp-enr-concavity-2',
        trapTitle: 'Confusing concave up with increasing',
        flawedReasoning: 'A concave-up curve is going up, so concavity describes the direction of travel.',
        correctConcept:
          'Concavity describes how the slope is *changing*, not whether the function is rising. A concave-up function can be decreasing.',
        counterExample: '$f(x) = x^2$ is concave up everywhere, yet it decreases on $(-\\infty, 0)$.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'If $f\'(3) = 0$ and $f\'\'(3) = 4$, what is at $x = 3$?',
      options: ['Local maximum', 'Local minimum', 'Inflection point', 'Nothing can be concluded'],
      correctIndex: 1,
      explanation: 'Positive second derivative at a stationary point means concave up, which is a local minimum.',
    },
  },

  'concept-ftc-leibniz': {
    workedExamples: [
      {
        id: 'we-enr-ftc-1',
        title: 'Evaluating a Definite Integral',
        problemStatement: 'Evaluate $\\int_1^3 (2x + 1)\\,dx$ using the Fundamental Theorem.',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Find an antiderivative: $F(x) = x^2 + x$.',
          'Apply the theorem: $\\int_1^3 = F(3) - F(1)$.',
          'Compute $F(3) = 9 + 3 = 12$ and $F(1) = 1 + 1 = 2$.',
          'Subtract: $12 - 2 = 10$.',
        ],
        finalAnswer: '$10$',
        keyTakeaway:
          'The theorem converts an area problem into two evaluations of an antiderivative — no Riemann sums needed.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-ftc-1',
        trapTitle: 'Forgetting the constant cancels',
        flawedReasoning: 'Different antiderivatives give different answers, so pick the one with $+C = 0$.',
        correctConcept:
          'Any antiderivative works because subtracting $F(a)$ from $F(b)$ eliminates $C$ automatically.',
        counterExample: 'Using $F(x) = x^2 + x + 5$ gives $(9+3+5) - (1+1+5) = 10$, identical.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What does $\\frac{d}{dx}\\int_a^x f(t)\\,dt$ equal?',
      options: ['$f\'(x)$', '$f(x)$', '$f(x) - f(a)$', '$\\int_a^x f\'(t)dt$'],
      correctIndex: 1,
      explanation: 'This is the first part of the Fundamental Theorem: differentiating an accumulation function returns the integrand.',
    },
  },

  'concept-eigenvalues-vectors': {
    workedExamples: [
      {
        id: 'we-enr-eigen-1',
        title: 'Eigenvalues of a 2x2 Matrix',
        problemStatement: 'Find the eigenvalues of $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3\\end{pmatrix}$.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Use $\\det(A - \\lambda I) = 0$.',
          'Form $A - \\lambda I = \\begin{pmatrix} 4-\\lambda & 1 \\\\ 2 & 3-\\lambda\\end{pmatrix}$.',
          'Determinant: $(4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\lambda + 10$.',
          'Factor: $(\\lambda - 5)(\\lambda - 2) = 0$, so $\\lambda = 5$ or $\\lambda = 2$.',
        ],
        finalAnswer: '$\\lambda = 5$ and $\\lambda = 2$.',
        keyTakeaway:
          'For a $2\\times2$ matrix the characteristic polynomial is $\\lambda^2 - \\text{tr}(A)\\lambda + \\det(A)$ — a useful check.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-eigen-1',
        trapTitle: 'Solving $Av = \\lambda v$ by guessing $v$',
        flawedReasoning: 'Try vectors until one satisfies $Av = \\lambda v$.',
        correctConcept:
          'Eigenvalues come from $\\det(A - \\lambda I) = 0$ first; eigenvectors then solve the homogeneous system for each eigenvalue.',
        counterExample:
          'For the matrix above, guessing arbitrary vectors rarely works — the correct eigenvectors are $(1,1)$ and $(1,-2)$.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'The sum of eigenvalues of a matrix equals which quantity?',
      options: ['Its determinant', 'Its trace', 'Its rank', 'Its nullity'],
      correctIndex: 1,
      explanation: 'The characteristic polynomial\'s $\\lambda^{n-1}$ coefficient equals the negative trace, so the eigenvalues sum to the trace.',
    },
  },

  'concept-lagrange-multipliers': {
    workedExamples: [
      {
        id: 'we-enr-lagrange-1',
        title: 'Maximising a Product under a Sum Constraint',
        problemStatement: 'Maximise $f(x,y) = xy$ subject to $x + y = 10$ with $x, y > 0$.',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Set up $\\nabla f = \\lambda \\nabla g$: $y = \\lambda$ and $x = \\lambda$.',
          'The first two equations force $x = y$.',
          'Substitute into the constraint: $2x = 10$, so $x = y = 5$.',
          'The maximum value is $f(5,5) = 25$.',
        ],
        finalAnswer: 'Maximum $25$ at $(5, 5)$.',
        keyTakeaway:
          'Gradient alignment turns an optimisation into a system of equations; the constraint then pins the scale.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-lagrange-1',
        trapTitle: 'Ignoring the boundary of the constraint set',
        flawedReasoning: 'Lagrange multipliers find the global optimum, so checking the interior suffices.',
        correctConcept:
          'The method finds stationary points of the Lagrangian only. A maximum can occur where $\\nabla g = 0$ or on an endpoint of the domain.',
        counterExample:
          'Maximising $f(x,y)=x$ on the disc $x^2+y^2 \\le 1$ from the interior alone misses nothing, but on a square the corners carry the maxima.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What condition does the method impose at an optimum?',
      options: [
        '$\\nabla f = 0$',
        '$\\nabla f$ is parallel to $\\nabla g$',
        '$\\nabla g = 0$',
        '$f = g$',
      ],
      correctIndex: 1,
      explanation: 'At a constrained extremum the objective\'s gradient must be a scalar multiple of the constraint\'s gradient.',
    },
  },

  'concept-bayes-theorem': {
    workedExamples: [
      {
        id: 'we-enr-bayes-1',
        title: 'A Diagnostic Test',
        problemStatement:
          'A disease affects 1% of a population. A test is 95% sensitive and 90% specific. Given a positive result, what is the probability of disease?',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Write prior: $P(D) = 0.01$, so $P(\\text{no } D) = 0.99$.',
          'Likelihoods: $P(+|D) = 0.95$ and $P(+|\\text{no } D) = 1 - 0.90 = 0.10$.',
          'Total probability: $P(+) = (0.95)(0.01) + (0.10)(0.99) = 0.0095 + 0.099 = 0.1085$.',
          'Apply Bayes: $P(D|+) = \\frac{0.0095}{0.1085} \\approx 0.0876$.',
        ],
        finalAnswer: 'About $8.8\\%$ — despite the positive test.',
        keyTakeaway:
          'When a condition is rare, most positive results are false positives; the base rate dominates.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-bayes-1',
        trapTitle: 'Equating $P(+|D)$ with $P(D|+)$',
        flawedReasoning: 'The test detects the disease 95% of the time, so a positive means a 95% chance of disease.',
        correctConcept:
          'Conditioning is not symmetric. $P(+|D)$ is a property of the test; $P(D|+)$ also depends on prevalence.',
        counterExample:
          'In the example above the answer is $8.8\\%$, not $95\\%$, purely because the disease is rare.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'A test has a 10% false positive rate and the disease is very rare. What does a positive result imply?',
      options: [
        'A high probability of disease',
        'Possibly a low probability of disease',
        'Certainty of disease',
        'Nothing at all',
      ],
      correctIndex: 1,
      explanation: 'With low prevalence, false positives can vastly outnumber true positives.',
    },
  },

  'concept-pigeonhole-invariants': {
    workedExamples: [
      {
        id: 'we-enr-pigeon-1',
        title: 'Duplicate Birth Months',
        problemStatement: 'Show that among any 13 people, at least two share a birth month.',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'There are 12 possible birth months — these are the "holes".',
          'There are 13 people — these are the "pigeons".',
          'Since $13 > 12$, some hole must receive at least two pigeons.',
          'Therefore at least two people share a birth month.',
        ],
        finalAnswer: 'Guaranteed by the pigeonhole principle.',
        keyTakeaway:
          'Identify the objects and the categories, then compare counts — no probability is involved.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-pigeon-1',
        trapTitle: 'Treating a pigeonhole argument as probabilistic',
        flawedReasoning: '13 people will *probably* share a month, so this is a likelihood statement.',
        correctConcept:
          'The principle is a certainty result about counts. No distribution or randomness is assumed.',
        counterExample:
          'With 12 people it fails absolutely — a group could cover all twelve months exactly once.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'How many people guarantee at least two share a birth month?',
      options: ['12', '13', '24', '365'],
      correctIndex: 1,
      explanation: 'One more than the number of categories: $12 + 1 = 13$.',
    },
  },

  'concept-conics-focal-properties': {
    workedExamples: [
      {
        id: 'we-enr-conics-1',
        title: 'Foci of an Ellipse',
        problemStatement: 'Find the foci of $\\frac{x^2}{25} + \\frac{y^2}{9} = 1$.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Identify $a^2 = 25$ and $b^2 = 9$, so $a = 5$ and $b = 3$.',
          'For an ellipse, $c^2 = a^2 - b^2 = 25 - 9 = 16$.',
          'Therefore $c = 4$.',
          'The major axis is horizontal, so the foci are at $(\\pm 4, 0)$.',
        ],
        finalAnswer: '$(\\pm 4, 0)$',
        keyTakeaway:
          'For an ellipse $c^2 = a^2 - b^2$; for a hyperbola it is $c^2 = a^2 + b^2$.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-conics-1',
        trapTitle: 'Using the hyperbola relation for an ellipse',
        flawedReasoning: 'Always compute $c^2 = a^2 + b^2$ because that is the Pythagorean form.',
        correctConcept:
          'An ellipse has $c < a$, so $c^2 = a^2 - b^2$; a hyperbola has $c > a$, so $c^2 = a^2 + b^2$.',
        counterExample:
          'Using the plus sign on the ellipse above would give $c = \\sqrt{34} > 5$, outside the ellipse entirely.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'The reflecting property of an ellipse sends a ray from one focus to where?',
      options: ['Infinity', 'The other focus', 'The centre', 'The vertex'],
      correctIndex: 1,
      explanation: 'Every ray from one focus reflects to the other — the basis of whispering galleries and lithotripsy.',
    },
  },

  'concept-euler-totient-fermat': {
    workedExamples: [
      {
        id: 'we-enr-euler-1',
        title: 'Computing a Totient',
        problemStatement: 'Compute $\\varphi(36)$.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Factor: $36 = 2^2 \\cdot 3^2$.',
          'Use multiplicativity with prime powers: $\\varphi(p^k) = p^k - p^{k-1}$.',
          '$\\varphi(4) = 4 - 2 = 2$ and $\\varphi(9) = 9 - 3 = 6$.',
          'Multiply: $\\varphi(36) = 2 \\cdot 6 = 12$.',
        ],
        finalAnswer: '$12$',
        keyTakeaway:
          'The totient is multiplicative across coprime prime powers, so factor first and multiply the pieces.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-euler-1',
        trapTitle: 'Assuming Fermat applies to composite moduli',
        flawedReasoning: 'Fermat\'s little theorem says $a^{p-1} \\equiv 1$, so use it for any modulus.',
        correctConcept:
          'Fermat requires a prime modulus. For composite $n$ use Euler\'s theorem, $a^{\\varphi(n)} \\equiv 1 \\pmod n$, and only when $\\gcd(a,n)=1$.',
        counterExample:
          '$2^{8} \\equiv 1 \\pmod 9$ holds by Euler since $\\varphi(9) = 6$ and $8$ is not a multiple of it — so exponents must be reduced mod $\\varphi(n)$, not $n-1$.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What is $\\varphi(10)$?',
      options: ['$4$', '$5$', '$9$', '$10$'],
      correctIndex: 0,
      explanation: 'The numbers $1, 3, 7, 9$ are coprime to 10 — four of them.',
    },
  },

  'concept-asymptotic-big-o': {
    workedExamples: [
      {
        id: 'we-enr-bigo-1',
        title: 'Simplifying a Complexity Expression',
        problemStatement: 'Express $T(n) = 3n^2 + 100n + 5000$ in Big-O notation.',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Identify the dominant term as $n \\to \\infty$: $n^2$ outgrows both $n$ and any constant.',
          'Drop constant factors: the coefficient $3$ does not affect the growth class.',
          'Drop lower-order terms: $100n$ and $5000$ are asymptotically negligible.',
        ],
        finalAnswer: '$O(n^2)$',
        keyTakeaway:
          'Big-O keeps only the fastest-growing term, without its coefficient — it describes shape, not speed on small inputs.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-bigo-1',
        trapTitle: 'Believing a smaller Big-O is always faster',
        flawedReasoning: 'An $O(n)$ algorithm always beats an $O(n^2)$ one.',
        correctConcept:
          'Big-O describes growth for large $n$. For small inputs, constant factors can reverse the ordering.',
        counterExample:
          'A $50n$ algorithm beats $n^2$ only once $n > 50$; below that the quadratic can be faster.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What is the complexity of $T(n) = 5n + 2n\\log n$?',
      options: ['$O(n)$', '$O(n\\log n)$', '$O(n^2)$', '$O(\\log n)$'],
      correctIndex: 1,
      explanation: '$n\\log n$ dominates $n$ for large $n$, so the class is $O(n\\log n)$.',
    },
  },

  'concept-grad-descent': {
    workedExamples: [
      {
        id: 'we-enr-grad-1',
        title: 'Two Steps Down a Quadratic',
        problemStatement: 'Apply gradient descent to $L(w) = (w - 5)^2$ from $w_0 = 0$ with $\\eta = 0.1$.',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'The gradient is $L\'(w) = 2(w - 5)$.',
          'At $w_0 = 0$: gradient $= -10$.',
          'Update: $w_1 = 0 - 0.1(-10) = 1$.',
          'At $w_1 = 1$: gradient $= -8$, so $w_2 = 1 - 0.1(-8) = 1.8$.',
        ],
        finalAnswer: '$w_1 = 1$, $w_2 = 1.8$ — climbing toward the minimum at $w = 5$.',
        keyTakeaway:
          'The negative gradient points uphill; subtracting it moves downhill toward the minimum.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-grad-1',
        trapTitle: 'Assuming a fixed learning rate works for every problem',
        flawedReasoning: 'If $\\eta = 0.01$ converged once, it is safe everywhere.',
        correctConcept:
          'The stable step size depends on the curvature of the loss. Steep losses need smaller steps or they diverge.',
        counterExample:
          'With $L(w) = 1000w^2$, a step of $0.01$ gives a factor $|1 - 2(1000)(0.01)| = 19$ per step — explosive divergence.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What does the sign of the update indicate?',
      options: [
        'Add the gradient to increase loss',
        'Subtract the gradient to decrease loss',
        'Multiply the gradient by the loss',
        'Ignore the gradient',
      ],
      correctIndex: 1,
      explanation: 'Gradient descent moves opposite the gradient, which is the direction of steepest decrease.',
    },
  },

  'concept-transformer-attention': {
    workedExamples: [
      {
        id: 'we-enr-attn-1',
        title: 'Scoring One Query Against Two Keys',
        problemStatement:
          'Given query $q = (1, 0)$, keys $k_1 = (1, 0)$ and $k_2 = (0, 1)$, compute the softmax attention weights (ignore scaling).',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Compute dot products: $q \\cdot k_1 = 1$ and $q \\cdot k_2 = 0$.',
          'Exponentiate: $e^1 \\approx 2.718$ and $e^0 = 1$.',
          'Sum the exponentials: $2.718 + 1 = 3.718$.',
          'Normalise: weights are $0.731$ and $0.269$.',
        ],
        finalAnswer: 'Weights $\\approx (0.73, 0.27)$ — attention concentrates on the aligned key.',
        keyTakeaway:
          'Dot products measure alignment; softmax converts those scores into a probability distribution.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-attn-1',
        trapTitle: 'Assuming attention captures word order',
        flawedReasoning: 'Attention looks at the whole sequence, so it understands position inherently.',
        correctConcept:
          'Dot-product attention is permutation invariant; positional information must be injected through encodings.',
        counterExample:
          'Without positional encoding, "dog bites man" and "man bites dog" produce identical attention outputs.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Why is the dot product divided by $\\sqrt{d_k}$?',
      options: [
        'To normalise the output to unit length',
        'To prevent softmax saturation from large scores',
        'To reduce the parameter count',
        'To make the operation invertible',
      ],
      correctIndex: 1,
      explanation: 'Large dot products push softmax into saturated regions with vanishing gradients; scaling keeps logits in a useful range.',
    },
  },

  'concept-deadlock-coffman': {
    workedExamples: [
      {
        id: 'we-enr-deadlock-1',
        title: 'Spotting a Circular Wait',
        problemStatement:
          'Process P1 holds resource A and requests B; P2 holds B and requests A. Can either proceed?',
        difficulty: 'medium',
        stepByStepSolution: [
          'Check mutual exclusion: both A and B are held exclusively — satisfied.',
          'Check hold and wait: each process holds one resource while requesting another — satisfied.',
          'Check no preemption: neither can have its held resource taken — satisfied.',
          'Check circular wait: P1 waits for P2\'s resource and P2 waits for P1\'s — satisfied.',
        ],
        finalAnswer: 'All four Coffman conditions hold, so this is a deadlock.',
        keyTakeaway:
          'Breaking any single Coffman condition is sufficient to prevent deadlock — this is why the conditions matter.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-deadlock-1',
        trapTitle: 'Confusing deadlock with starvation',
        flawedReasoning: 'A process that never runs must be deadlocked.',
        correctConcept:
          'Deadlock is a circular wait in which nothing can progress. Starvation is indefinite postponement with no cycle — the system is still making progress elsewhere.',
        counterExample:
          'A low-priority task continuously overtaken by higher-priority ones starves, yet no cycle exists.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Which condition must hold for deadlock to be possible?',
      options: ['Preemption', 'Circular wait', 'Shared read-only access', 'Priority inversion'],
      correctIndex: 1,
      explanation: 'Deadlock requires a cycle of waiting processes — one of the four Coffman conditions.',
    },
  },
};

/**
 * Physics, chemistry and biology completeness pass. Appended as a second map so
 * each subject's content stays easy to review in isolation.
 */
export const CONCEPT_ENRICHMENT_2: Record<string, Enrichment> = {
  'concept-cap-theorem': {
    workedExamples: [
      {
        id: 'we-enr-cap-1',
        title: 'Classifying a Partitioned System',
        problemStatement:
          'A network splits so two data centres cannot talk. Each accepts writes independently. Which CAP guarantee is being preserved?',
        difficulty: 'medium',
        stepByStepSolution: [
          'The partition is real: messages between the halves are dropped.',
          'Both sides continue accepting writes, so the system stays available.',
          'The two halves now hold diverging values for the same key, so they are not consistent.',
          'CAP forces a choice exactly here, and this design chose availability.',
        ],
        finalAnswer: 'Availability and partition tolerance (an AP system).',
        keyTakeaway:
          'During a partition you must choose: refuse writes to stay consistent, or accept divergence to stay available.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-cap-1',
        trapTitle: 'Saying a system is "CA" and partition-tolerant',
        flawedReasoning: 'A design can be consistent and available and also handle partitions.',
        correctConcept:
          'Partitions are a property of the network, not a design option. Since they can always occur, a distributed system is really choosing CP or AP.',
        counterExample:
          'Single-node databases are "CA" only because they never face a partition — which makes them non-distributed.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'A system rejects writes during a network split to preserve correctness. Which is it?',
      options: ['AP', 'CP', 'CA', 'Neither'],
      correctIndex: 1,
      explanation: 'Choosing consistency by refusing writes during a partition is the CP trade-off.',
    },
  },

  'concept-dijkstra-relaxation': {
    workedExamples: [
      {
        id: 'we-enr-dijkstra-1',
        title: 'One Relaxation Step',
        problemStatement:
          'Distances from source A are $d(A)=0$, $d(B)=4$, $d(C)=9$. An edge $B \\to C$ has weight 3. Does relaxing it help?',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Proposed distance to C via B: $d(B) + w(B,C) = 4 + 3 = 7$.',
          'Compare with the current $d(C) = 9$.',
          'Since $7 < 9$, the relaxation succeeds.',
          'Update $d(C) = 7$ and record B as its predecessor.',
        ],
        finalAnswer: '$d(C)$ improves from 9 to 7.',
        keyTakeaway:
          'Relaxation is just "$d(v) > d(u) + w$" — every shortest-path algorithm is a different order of applying it.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-dijkstra-1',
        trapTitle: 'Running Dijkstra on negative edges',
        flawedReasoning: 'Dijkstra finds shortest paths, so edge signs should not matter.',
        correctConcept:
          'Dijkstra finalises a node once popped, assuming no later path can be shorter. A negative edge can invalidate that, so use Bellman-Ford.',
        counterExample:
          'With A→B (1), A→C (2), C→B (−2), Dijkstra finalises B at distance 1, but the true shortest is 0 via C.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Which algorithm handles negative edge weights correctly?',
      options: ['Dijkstra', 'Bellman-Ford', 'BFS', 'Prim'],
      correctIndex: 1,
      explanation: 'Bellman-Ford relaxes all edges repeatedly, so negative weights (but not negative cycles) are safe.',
    },
  },

  'concept-jwt-cache-invalidation': {
    workedExamples: [
      {
        id: 'we-enr-jwt-1',
        title: 'Cache-Aside Read Path',
        problemStatement:
          'A profile endpoint is read 10,000 times per minute but updated once per hour. Describe the cache-aside flow.',
        difficulty: 'medium',
        stepByStepSolution: [
          'On read, check the cache first.',
          'On a hit, return the cached value without touching the database.',
          'On a miss, load from the database and populate the cache.',
          'On update, write to the database and invalidate (delete) the cache key.',
        ],
        finalAnswer: 'Cache-aside: read-through with explicit invalidation on write.',
        keyTakeaway:
          'Delete rather than overwrite on write, so concurrent readers cannot repopulate a stale value.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-jwt-1',
        trapTitle: 'Assuming JWTs can be revoked by deleting a session row',
        flawedReasoning: 'Logging out deletes the session, so the token instantly stops working.',
        correctConcept:
          'A JWT is self-contained and valid until expiry. Revocation needs a denylist, a token version, or short lifetimes with refresh tokens.',
        counterExample:
          'A stolen token keeps working after logout unless the issuer checks a revocation list.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Why are short-lived access tokens recommended?',
      options: [
        'They are cheaper to sign',
        'They limit the damage window if leaked',
        'They remove the need for authentication',
        'They make caching unnecessary',
      ],
      correctIndex: 1,
      explanation: 'A short lifetime bounds how long a leaked token remains usable.',
    },
  },

  'concept-energy-cons': {
    workedExamples: [
      {
        id: 'we-enr-energy-1',
        title: 'Speed from a Height Drop',
        problemStatement: 'A $2\\,\\text{kg}$ ball is released from $5\\,\\text{m}$. Find its speed at the ground ($g = 10\\,\\text{m/s}^2$).',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Initial energy is all potential: $mgh = 2 \\cdot 10 \\cdot 5 = 100\\,\\text{J}$.',
          'At the ground all of it is kinetic (energy conserved, no friction).',
          'Set $\\tfrac12 mv^2 = 100$.',
          'Solve: $v^2 = 100$, so $v = 10\\,\\text{m/s}$.',
        ],
        finalAnswer: '$10\\,\\text{m/s}$',
        keyTakeaway:
          'Mass cancels, so the speed depends only on the height dropped — a useful sanity check.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-energy-1',
        trapTitle: 'Assuming mechanical energy survives friction',
        flawedReasoning: 'Energy is conserved, so the speed at the bottom is always $\\sqrt{2gh}$.',
        correctConcept:
          'Mechanical energy is conserved only without non-conservative work. Friction converts some to heat, lowering the final speed.',
        counterExample:
          'A block sliding down a rough incline arrives measurably slower than $\\sqrt{2gh}$.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'A ball is thrown upward; at its highest point its energy is:',
      options: ['All kinetic', 'All potential', 'Half each', 'Zero'],
      correctIndex: 1,
      explanation: 'Velocity is zero at the apex, so all mechanical energy is potential.',
    },
  },

  'concept-faraday-induction': {
    workedExamples: [
      {
        id: 'we-enr-faraday-1',
        title: 'EMF from a Changing Flux',
        problemStatement:
          'A coil of 50 turns sees its flux change from $0.02\\,\\text{Wb}$ to $0.06\\,\\text{Wb}$ in $0.1\\,\\text{s}$. Find the induced EMF.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Use Faraday\'s law: $\\mathcal{E} = -N\\frac{\\Delta\\Phi}{\\Delta t}$.',
          'Compute the flux change: $0.06 - 0.02 = 0.04\\,\\text{Wb}$.',
          'Divide by time: $0.04 / 0.1 = 0.4\\,\\text{Wb/s}$.',
          'Multiply by turns: $N \\cdot 0.4 = 50 \\cdot 0.4 = 20\\,\\text{V}$.',
        ],
        finalAnswer: '$20\\,\\text{V}$ (magnitude)',
        keyTakeaway:
          'Rate matters, not the absolute flux — a large but constant flux induces nothing.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-faraday-1',
        trapTitle: 'Expecting EMF from a static field',
        flawedReasoning: 'A strong magnet near a coil must induce a current.',
        correctConcept:
          'EMF requires a *changing* flux. A stationary magnet with a stationary coil induces nothing, however strong.',
        counterExample:
          'A magnet resting inside a coil produces no current until it is moved.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'According to Lenz\'s law, the induced current:',
      options: [
        'Reinforces the flux change',
        'Opposes the flux change',
        'Is always clockwise',
        'Depends only on resistance',
      ],
      correctIndex: 1,
      explanation: 'The induced current creates a field opposing the change, which is a consequence of energy conservation.',
    },
  },

  'concept-carnot-entropy': {
    workedExamples: [
      {
        id: 'we-enr-carnot-1',
        title: 'Maximum Efficiency',
        problemStatement:
          'An engine operates between $500\\,\\text{K}$ and $300\\,\\text{K}$. What is its maximum possible efficiency?',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Use the Carnot limit: $\\eta = 1 - T_c/T_h$ with absolute temperatures.',
          'Substitute: $\\eta = 1 - 300/500$.',
          'Simplify: $1 - 0.6 = 0.4$.',
        ],
        finalAnswer: '$40\\%$',
        keyTakeaway:
          'Efficiency depends only on the two reservoir temperatures — never on the working substance.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-carnot-1',
        trapTitle: 'Using Celsius in the Carnot formula',
        flawedReasoning: 'Substitute $500^\\circ\\text{C}$ and $300^\\circ\\text{C}$ directly since both are temperatures.',
        correctConcept:
          'Thermodynamic efficiency needs absolute temperature; Celsius values give nonsense such as negative efficiency.',
        counterExample:
          'Using 500 and 300 Celsius numerically gives the same 0.4 only by coincidence of the difference — try $27^\\circ\\text{C}$ and $227^\\circ\\text{C}$ to see it fail.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Can a real engine exceed the Carnot efficiency?',
      options: ['Yes, with better materials', 'Yes, at very high speed', 'No, it is a hard theoretical limit', 'Only in a vacuum'],
      correctIndex: 2,
      explanation: 'Carnot efficiency follows from the second law and is unattainable in practice; real engines fall short.',
    },
  },

  'concept-wave-interference-ydse': {
    workedExamples: [
      {
        id: 'we-enr-ydse-1',
        title: 'Fringe Spacing',
        problemStatement:
          'In a double-slit experiment with $\\lambda = 600\\,\\text{nm}$, slit separation $0.2\\,\\text{mm}$ and screen distance $1\\,\\text{m}$, find the fringe spacing.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Use $\\Delta y = \\lambda L / d$.',
          'Convert to metres: $\\lambda = 6 \\times 10^{-7}$, $d = 2 \\times 10^{-4}$, $L = 1$.',
          'Substitute: $\\Delta y = (6 \\times 10^{-7})(1)/(2 \\times 10^{-4})$.',
          'Evaluate: $3 \\times 10^{-3}\\,\\text{m} = 3\\,\\text{mm}$.',
        ],
        finalAnswer: '$3\\,\\text{mm}$',
        keyTakeaway:
          'Spacing grows with wavelength and screen distance and shrinks as slits move further apart.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-ydse-1',
        trapTitle: 'Mixing up constructive and destructive conditions',
        flawedReasoning: 'Bright fringes occur at half-integer path differences.',
        correctConcept:
          'Constructive interference needs a path difference of a whole number of wavelengths; half-integers give dark fringes.',
        counterExample:
          'At $\\Delta = \\lambda/2$ the waves cancel and the centre of that order is dark.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'If the slit separation doubles, what happens to fringe spacing?',
      options: ['Doubles', 'Halves', 'Unchanged', 'Quadruples'],
      correctIndex: 1,
      explanation: 'Since $\\Delta y \\propto 1/d$, doubling $d$ halves the spacing.',
    },
  },

  'concept-photoelectric-effect': {
    workedExamples: [
      {
        id: 'we-enr-photo-1',
        title: 'Stopping Potential',
        problemStatement:
          'Light of energy $3.0\\,\\text{eV}$ strikes a metal with work function $2.2\\,\\text{eV}$. Find the stopping potential.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Apply Einstein\'s equation: $K_{max} = hf - \\phi$.',
          'Substitute: $K_{max} = 3.0 - 2.2 = 0.8\\,\\text{eV}$.',
          'The stopping potential in volts equals the maximum kinetic energy in eV.',
          'Therefore $V_s = 0.8\\,\\text{V}$.',
        ],
        finalAnswer: '$0.8\\,\\text{V}$',
        keyTakeaway:
          'Only photon energy above the work function becomes kinetic energy — the excess is linear in frequency.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-photo-1',
        trapTitle: 'Expecting brighter light to increase electron energy',
        flawedReasoning: 'A brighter beam carries more energy, so it should eject faster electrons.',
        correctConcept:
          'Intensity controls the *number* of photons, hence the current. Energy per electron is set by frequency alone.',
        counterExample:
          'Doubling intensity at a fixed frequency doubles the current but leaves the stopping potential unchanged.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What happens below the threshold frequency?',
      options: ['Fewer electrons', 'Slower electrons', 'No emission at all', 'Emission after a delay'],
      correctIndex: 2,
      explanation: 'If $hf < \\phi$, no single photon can free an electron, regardless of intensity.',
    },
  },

  'concept-buoyancy-archimedes': {
    workedExamples: [
      {
        id: 'we-enr-buoy-1',
        title: 'Fraction Submerged',
        problemStatement:
          'A block of density $600\\,\\text{kg/m}^3$ floats in water ($1000\\,\\text{kg/m}^3$). What fraction is submerged?',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'For floating, buoyant force equals weight: $\\rho_w g V_{sub} = \\rho_b g V_{total}$.',
          'Cancel $g$ and rearrange: $V_{sub}/V_{total} = \\rho_b/\\rho_w$.',
          'Substitute: $600/1000 = 0.6$.',
        ],
        finalAnswer: '$60\\%$ submerged',
        keyTakeaway:
          'The submerged fraction is simply the density ratio — a floating object reveals its density.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-buoy-1',
        trapTitle: 'Assuming heavier objects always sink',
        flawedReasoning: 'A large steel ship is made of metal, so it must sink.',
        correctConcept:
          'Buoyancy compares average density with the fluid. A hollow hull lowers the average density below water.',
        counterExample:
          'A steel block sinks, but the same steel shaped into a hull floats because the enclosed air dominates the volume.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'An object floats with 25% of its volume above water. Its density is:',
      options: ['$250\\,\\text{kg/m}^3$', '$750\\,\\text{kg/m}^3$', '$1000\\,\\text{kg/m}^3$', '$1250\\,\\text{kg/m}^3$'],
      correctIndex: 1,
      explanation: '75% is submerged, so density is $0.75 \\times 1000 = 750\\,\\text{kg/m}^3$.',
    },
  },

  'concept-orbital-vis-viva': {
    workedExamples: [
      {
        id: 'we-enr-orbit-1',
        title: 'Speed at a Circular Orbit',
        problemStatement:
          'Find the orbital speed at radius $r = 2R_E$ (Earth radius $6400\\,\\text{km}$), with $GM = 3.986 \\times 10^{14}\\,\\text{m}^3/\\text{s}^2$.',
        difficulty: 'medium',
        stepByStepSolution: [
          'For a circular orbit use the vis-viva equation with $r = a$.',
          'Compute the radius: $2 \\times 6.4 \\times 10^6 = 1.28 \\times 10^7\\,\\text{m}$.',
          'Apply $v = \\sqrt{GM/r}$.',
          'Evaluate: $\\sqrt{3.986\\times10^{14}/1.28\\times10^7} \\approx 5.58 \\times 10^3\\,\\text{m/s}$.',
        ],
        finalAnswer: '$\\approx 5.6\\,\\text{km/s}$',
        keyTakeaway:
          'Speed falls as the inverse square root of radius — higher orbits are slower.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-orbit-1',
        trapTitle: 'Using the vis-viva equation with a non-orbital path',
        flawedReasoning: 'The formula gives the speed of any object at any distance.',
        correctConcept:
          'Vis-viva applies to bodies on bound Keplerian trajectories. A radial free-fall or a trajectory above escape speed needs different treatment.',
        counterExample:
          'For an object dropped from rest, vis-viva predicts a finite speed at the centre, which is not the physical radial-fall result.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'For an elliptical orbit, where is the orbital speed greatest?',
      options: ['At apoapsis', 'At periapsis', 'It is constant', 'At the semi-minor axis'],
      correctIndex: 1,
      explanation: 'Angular momentum conservation makes speed highest at the closest approach.',
    },
  },
};

/** Chemistry completeness pass. */
export const CONCEPT_ENRICHMENT_3: Record<string, Enrichment> = {
  'concept-sn1-sn2': {
    workedExamples: [
      {
        id: 'we-enr-sn-1',
        title: 'Predicting the Mechanism',
        problemStatement:
          'Predict whether 2-bromopropane reacts with water by SN1 or SN2, and justify it.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Classify the substrate: 2-bromopropane is secondary.',
          'Water is a weak nucleophile and a polar protic solvent, which favours carbocation formation.',
          'The secondary carbocation is reasonably stabilised by hyperconjugation.',
          'Therefore SN1 dominates, giving a racemised product with possible rearrangement.',
        ],
        finalAnswer: 'SN1 — weak nucleophile, polar protic solvent, secondary substrate.',
        keyTakeaway:
          'Decide using four inputs: substrate degree, nucleophile strength, solvent polarity and leaving group.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-sn-1',
        trapTitle: 'Expecting complete inversion for every substitution',
        flawedReasoning: 'All nucleophilic substitutions invert stereochemistry like the SN2 picture.',
        correctConcept:
          'Inversion is an SN2 signature. SN1 proceeds through a planar carbocation and gives racemisation.',
        counterExample:
          'Hydrolysis of a tertiary halide yields a roughly 1:1 mixture of retained and inverted products.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Which condition most strongly favours SN2?',
      options: [
        'Tertiary substrate, weak nucleophile',
        'Primary substrate, strong nucleophile, aprotic solvent',
        'Secondary substrate, protic solvent',
        'Any substrate with heat',
      ],
      correctIndex: 1,
      explanation: 'SN2 needs an accessible carbon, a strong nucleophile and an aprotic solvent to keep the nucleophile unencumbered.',
    },
  },

  'concept-arrhenius-kinetics': {
    workedExamples: [
      {
        id: 'we-enr-arrhenius-1',
        title: 'Rate Constant at a Higher Temperature',
        problemStatement:
          'A reaction has $E_a = 50\\,\\text{kJ/mol}$. By what factor does $k$ change from $300\\,\\text{K}$ to $310\\,\\text{K}$? ($R = 8.314$)',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Use $\\ln(k_2/k_1) = -\\frac{E_a}{R}(1/T_2 - 1/T_1)$.',
          'Compute the temperature term: $1/310 - 1/300 = -1.075 \\times 10^{-4}$.',
          'Multiply: $-\\frac{50000}{8.314}(-1.075\\times10^{-4}) \\approx 0.646$.',
          'Exponentiate: $k_2/k_1 = e^{0.646} \\approx 1.91$.',
        ],
        finalAnswer: 'The rate roughly doubles.',
        keyTakeaway:
          'A $10\\,\\text{K}$ rise near room temperature typically doubles a reaction rate — Arrhenius quantifies it.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-arrhenius-1',
        trapTitle: 'Using degrees Celsius in the Arrhenius equation',
        flawedReasoning: 'Temperatures are usually quoted in Celsius, so substitute them directly.',
        correctConcept:
          'The exponential requires absolute temperature; Celsius values produce meaningless ratios and can even give negative absolute temperatures.',
        counterExample:
          'Using 27 and 37 instead of 300 and 310 changes the computed factor from about 1.9 to about 1.06.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What does a larger activation energy do to the rate constant at fixed temperature?',
      options: ['Increases it', 'Decreases it', 'No effect', 'Makes it independent of T'],
      correctIndex: 1,
      explanation: 'Since $k \\propto e^{-E_a/RT}$, a larger $E_a$ shrinks the exponential.',
    },
  },

  'concept-mo-theory-bond-order': {
    workedExamples: [
      {
        id: 'we-enr-mo-1',
        title: 'Bond Order of O2',
        problemStatement: 'Compute the bond order of $\\text{O}_2$ from its molecular orbital configuration.',
        difficulty: 'medium',
        stepByStepSolution: [
          'O₂ has 12 valence electrons.',
          'Fill: $\\sigma_{2s}^2 \\sigma^*_{2s}{}^2 \\sigma_{2p_z}^2 \\pi_{2p}^4 \\pi^*_{2p}{}^2$.',
          'Bonding electrons $= 8$, antibonding $= 4$.',
          'Bond order $= (8 - 4)/2 = 2$.',
        ],
        finalAnswer: 'Bond order 2, with two unpaired $\\pi^*$ electrons — hence O₂ is paramagnetic.',
        keyTakeaway:
          'MO theory explains paramagnetism in O₂, which Lewis structures cannot.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-mo-1',
        trapTitle: 'Predicting O2 is diamagnetic from its Lewis structure',
        flawedReasoning: 'The double bond pairs every electron, so O₂ should be diamagnetic.',
        correctConcept:
          'The two highest-energy electrons occupy degenerate $\\pi^*$ orbitals singly (Hund\'s rule), giving two unpaired spins.',
        counterExample:
          'Liquid oxygen sticks to a magnet — direct evidence of unpaired electrons.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What bond order does $\\text{N}_2$ have?',
      options: ['1', '2', '3', '2.5'],
      correctIndex: 2,
      explanation: 'N₂ has 10 valence electrons with 8 bonding and 2 antibonding, giving $(8-2)/2 = 3$.',
    },
  },

  'concept-nernst-equation': {
    workedExamples: [
      {
        id: 'we-enr-nernst-1',
        title: 'Cell Potential Away from Standard Conditions',
        problemStatement:
          'For a cell with $E^\\circ = 1.10\\,\\text{V}$ transferring 2 electrons, find $E$ when $[\\text{products}]/[\\text{reactants}] = 0.01$ at $298\\,\\text{K}$.',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Use $E = E^\\circ - \\frac{0.0592}{n}\\log Q$.',
          'Substitute $n = 2$ and $Q = 0.01$.',
          'Compute the correction: $\\frac{0.0592}{2}(-2) = -0.0592$.',
          'The correction is subtracted, so $E = 1.10 + 0.0592 \\approx 1.16\\,\\text{V}$.',
        ],
        finalAnswer: '$\\approx 1.16\\,\\text{V}$',
        keyTakeaway:
          'A small Q (few products) pushes the potential *above* standard, which is why the sign matters.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-nernst-1',
        trapTitle: 'Using the wrong electron count',
        flawedReasoning: 'Use $n = 1$ because the formula usually shows 0.059.',
        correctConcept:
          'The coefficient is $0.0592/n$, where $n$ is the number of electrons transferred in the balanced half-reactions.',
        counterExample:
          'For $\\text{Zn}/\\text{Cu}^{2+}$, $n = 2$; using $n = 1$ doubles the concentration correction.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'At equilibrium, what is the cell potential $E$?',
      options: ['$E^\\circ$', 'Zero', 'Infinite', 'Negative'],
      correctIndex: 1,
      explanation: 'At equilibrium there is no driving force, so $E = 0$ and $E^\\circ = \\frac{0.0592}{n}\\log K$.',
    },
  },

  'concept-crystal-field-theory': {
    workedExamples: [
      {
        id: 'we-enr-cft-1',
        title: 'High-Spin or Low-Spin?',
        problemStatement:
          'Predict whether $[\\text{Fe(CN)}_6]^{4-}$ ($d^6$) is high-spin or low-spin.',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'Cyanide is a strong-field ligand, producing a large splitting $\\Delta_o$.',
          'For $d^6$, pairing energy must be compared with $\\Delta_o$.',
          'A large $\\Delta_o$ exceeds the pairing energy, so pairing is preferred.',
          'All six electrons pair in the lower $t_{2g}$ set: $t_{2g}^6 e_g^0$, low-spin and diamagnetic.',
        ],
        finalAnswer: 'Low-spin, diamagnetic.',
        keyTakeaway:
          'Strong-field ligands give large splitting and low-spin; weak-field ligands give high-spin.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-cft-1',
        trapTitle: 'Assuming more unpaired electrons is always more stable',
        flawedReasoning: 'Hund\'s rule maximises unpaired spins, so high-spin must always win.',
        correctConcept:
          'Hund\'s rule applies within degenerate orbitals. When $\\Delta_o$ exceeds the pairing energy, occupying the higher set costs more than pairing.',
        counterExample:
          '$[\\text{Co(NH}_3)_6]^{3+}$ is low-spin while $[\\text{CoF}_6]^{3-}$ is high-spin — same ion, different ligand field.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Which ligand produces the largest octahedral splitting?',
      options: ['$\\text{F}^-$', '$\\text{H}_2\\text{O}$', '$\\text{NH}_3$', '$\\text{CN}^-$'],
      correctIndex: 3,
      explanation: 'Cyanide sits at the strong-field end of the spectrochemical series.',
    },
  },

  'concept-mole-limiting-reactant': {
    workedExamples: [
      {
        id: 'we-enr-mole-1',
        title: 'Finding the Limiting Reagent',
        problemStatement:
          'For $\\text{N}_2 + 3\\text{H}_2 \\to 2\\text{NH}_3$, 2 mol N₂ reacts with 3 mol H₂. Which is limiting?',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Stoichiometry requires 3 mol H₂ per 1 mol N₂.',
          '2 mol N₂ would need 6 mol H₂, but only 3 mol are available.',
          'Dividing available by required: N₂ gives $2/1 = 2$; H₂ gives $3/3 = 1$.',
          'The smaller ratio identifies the limiting reagent: H₂.',
        ],
        finalAnswer: 'H₂ is limiting; N₂ is in excess.',
        keyTakeaway:
          'Divide moles available by the stoichiometric coefficient — the smallest quotient is limiting.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-mole-1',
        trapTitle: 'Choosing the reagent with fewer moles',
        flawedReasoning: 'H₂ has fewer moles here, so it must be limiting — but the rule is "fewest moles".',
        correctConcept:
          'Limiting is decided after dividing by the stoichiometric coefficient. Fewer moles alone is not meaningful.',
        counterExample:
          'With 1 mol N₂ and 2.9 mol H₂, H₂ has more moles but is still limiting ($2.9/3 < 1/1$).',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What is the theoretical yield defined by?',
      options: ['The excess reagent', 'The limiting reagent', 'The catalyst amount', 'The total mass'],
      correctIndex: 1,
      explanation: 'The limiting reagent runs out first and therefore caps the product formed.',
    },
  },

  'concept-ellingham-reduction': {
    workedExamples: [
      {
        id: 'we-enr-ellingham-1',
        title: 'Why Carbon Reduces Iron Oxide',
        problemStatement:
          'Explain using Ellingham principles why coke can reduce FeO but not Al₂O₃ at about $1200\\,\\text{K}$.',
        difficulty: 'medium_hard',
        stepByStepSolution: [
          'The Ellingham diagram plots $\\Delta G^\\circ$ for oxide formation against temperature.',
          'A metal whose line lies below another\'s can reduce that oxide.',
          'The $2\\text{C} + \\text{O}_2 \\to 2\\text{CO}$ line descends steeply with temperature because gas moles increase.',
          'It crosses below the FeO line near $1000\\,\\text{K}$ but never below the very stable Al₂O₃ line.',
        ],
        finalAnswer: 'Carbon becomes competitive with FeO at high temperature, but Al₂O₃ remains more stable throughout.',
        keyTakeaway:
          'Reduction is favourable when the reducing agent has a more negative oxide formation energy.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-ellingham-1',
        trapTitle: 'Reading the diagram as a kinetic prediction',
        flawedReasoning: 'A favourable line crossing means the reaction will proceed at a useful rate.',
        correctConcept:
          'Ellingham gives thermodynamics, not kinetics. A favourable reaction may still be impossibly slow without a catalyst or sufficient temperature.',
        counterExample:
          'Diamond converting to graphite is thermodynamically favoured at room temperature yet immeasurably slow.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What does a steeper downward slope on an Ellingham diagram indicate?',
      options: [
        'Lower entropy of reaction',
        'Larger positive entropy change',
        'A catalyst is present',
        'Higher melting point',
      ],
      correctIndex: 1,
      explanation: 'Slope is $-\\Delta S^\\circ$; producing more gas moles gives a large positive $\\Delta S$ and thus a steeper descent.',
    },
  },
};

/** Biology completeness pass. */
export const CONCEPT_ENRICHMENT_4: Record<string, Enrichment> = {
  'concept-central-dogma': {
    workedExamples: [
      {
        id: 'we-enr-dogma-1',
        title: 'From Template to Peptide',
        problemStatement:
          'A DNA template reads 3\'-TAC GGA TTC-5\'. Give the mRNA and the peptide (start codon AUG).',
        difficulty: 'medium',
        stepByStepSolution: [
          'Transcription is antiparallel and complementary: A pairs with U in RNA.',
          'Template TAC GGA TTC gives mRNA 5\'-AUG CCU AAG-3\'.',
          'Read codons: AUG, CCU, AAG.',
          'Translate: AUG = Met, CCU = Pro, AAG = Lys.',
        ],
        finalAnswer: 'mRNA 5\'-AUG CCU AAG-3\' → Met-Pro-Lys.',
        keyTakeaway:
          'Always confirm the direction of the template strand before writing the mRNA.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-dogma-1',
        trapTitle: 'Transcribing with T instead of U',
        flawedReasoning: 'The mRNA is a copy of the DNA, so it should contain thymine.',
        correctConcept:
          'RNA contains uracil in place of thymine. Writing T in an mRNA sequence is a category error.',
        counterExample:
          'A template TAC must give AUG, not ATG — ATG is the DNA coding-strand equivalent.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Which enzyme performs transcription?',
      options: ['Ribosome', 'RNA polymerase', 'DNA ligase', 'Helicase'],
      correctIndex: 1,
      explanation: 'RNA polymerase reads the DNA template and synthesises the complementary RNA strand.',
    },
  },

  'concept-cellular-respiration-atp': {
    workedExamples: [
      {
        id: 'we-enr-resp-1',
        title: 'Counting ATP per Glucose',
        problemStatement: 'Give the approximate ATP yield of complete aerobic oxidation of one glucose molecule.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Glycolysis yields 2 net ATP and 2 NADH.',
          'Pyruvate oxidation plus the Krebs cycle yields 2 ATP and 8 NADH/FADH₂ equivalents.',
          'Each NADH contributes about 2.5 ATP and each FADH₂ about 1.5 through the electron transport chain.',
          'Total is approximately 30–32 ATP, depending on the shuttle used.',
        ],
        finalAnswer: 'About 30–32 ATP per glucose.',
        keyTakeaway:
          'The great majority of ATP comes from oxidative phosphorylation, not from substrate-level steps.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-resp-1',
        trapTitle: 'Believing anaerobic respiration yields 36 ATP',
        flawedReasoning: 'Fermentation is just a variant of respiration, so the ATP yield is similar.',
        correctConcept:
          'Without oxygen the electron transport chain stalls, so only glycolysis\' 2 net ATP remain. Fermentation merely regenerates NAD⁺.',
        counterExample:
          'A sprinter relies on anaerobic glycolysis and fatigues quickly because the ATP yield per glucose drops roughly fifteenfold.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'Where does oxidative phosphorylation take place in eukaryotes?',
      options: ['Cytoplasm', 'Nucleus', 'Inner mitochondrial membrane', 'Ribosome'],
      correctIndex: 2,
      explanation: 'The electron transport chain and ATP synthase are embedded in the inner mitochondrial membrane.',
    },
  },

  'concept-hardy-weinberg': {
    workedExamples: [
      {
        id: 'we-enr-hw-1',
        title: 'Allele Frequencies from a Phenotype',
        problemStatement:
          'A recessive disorder affects 1 in 10,000 people. Estimate the carrier frequency assuming Hardy-Weinberg equilibrium.',
        difficulty: 'medium',
        stepByStepSolution: [
          'Affected individuals are $q^2 = 1/10000 = 0.0001$.',
          'Square root: $q = 0.01$.',
          'Then $p = 1 - q = 0.99$.',
          'Carriers are $2pq = 2(0.99)(0.01) = 0.0198$, about 1 in 50.',
        ],
        finalAnswer: 'Carrier frequency $\\approx 2\\%$ — about 1 in 50.',
        keyTakeaway:
          'Rare recessive alleles hide overwhelmingly in carriers, whose frequency is roughly $2\\sqrt{q^2}$.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-hw-1',
        trapTitle: 'Treating $q^2$ as the carrier frequency',
        flawedReasoning: 'The disorder frequency is the frequency of the recessive allele carriers.',
        correctConcept:
          '$q^2$ is the frequency of affected homozygotes. Carriers are heterozygotes, at frequency $2pq$.',
        counterExample:
          'For $q = 0.01$, affected individuals are 1 in 10,000 but carriers are about 1 in 50 — a 200-fold difference.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'If $p = 0.7$, what is the expected frequency of heterozygotes?',
      options: ['$0.09$', '$0.42$', '$0.49$', '$0.21$'],
      correctIndex: 1,
      explanation: '$2pq = 2(0.7)(0.3) = 0.42$.',
    },
  },

  'concept-action-potential-neuro': {
    workedExamples: [
      {
        id: 'we-enr-ap-1',
        title: 'Which Way Do Sodium Ions Move?',
        problemStatement:
          'At rest the inside of a neuron is $-70\\,\\text{mV}$ and $\\text{Na}^+$ is far more concentrated outside. When channels open, which way does $\\text{Na}^+$ flow and why?',
        difficulty: 'medium',
        stepByStepSolution: [
          'Chemical gradient: $\\text{Na}^+$ is higher outside, so diffusion drives it inward.',
          'Electrical gradient: the inside is negative, which also attracts the positive ion.',
          'Both forces point the same way.',
          'Sodium therefore rushes inward, depolarising the membrane toward threshold.',
        ],
        finalAnswer: 'Inward, driven by both the chemical and electrical gradients.',
        keyTakeaway:
          'Use the electrochemical gradient — when both components agree, the flow is strongly one-directional.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-ap-1',
        trapTitle: 'Thinking the resting potential is set by sodium',
        flawedReasoning: 'Sodium is the main extracellular cation, so it must define the resting voltage.',
        correctConcept:
          'At rest the membrane is far more permeable to potassium, so the resting potential sits near the $\\text{K}^+$ equilibrium potential.',
        counterExample:
          'Blocking $\\text{K}^+$ channels depolarises the cell strongly, while blocking $\\text{Na}^+$ channels barely shifts the resting value.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What causes repolarisation during an action potential?',
      options: [
        'Sodium channels opening',
        'Potassium efflux',
        'Calcium influx',
        'Chloride influx only',
      ],
      correctIndex: 1,
      explanation: 'Inactivation of Na⁺ channels plus opening of K⁺ channels lets positive charge leave, restoring the negative interior.',
    },
  },

  'concept-logistic-population-growth': {
    workedExamples: [
      {
        id: 'we-enr-logistic-1',
        title: 'Growth Rate at Half Capacity',
        problemStatement:
          'In the logistic model $\\frac{dN}{dt} = rN(1 - N/K)$, at what population size is growth fastest?',
        difficulty: 'medium',
        stepByStepSolution: [
          'The per-capita growth rate falls linearly as $N$ approaches $K$.',
          'Absolute growth is the product of $N$ and that declining rate.',
          'This product is maximised where $N$ is half the carrying capacity.',
          'So $N = K/2$ gives maximum growth.',
        ],
        finalAnswer: '$N = K/2$',
        keyTakeaway:
          'Logistic growth is sigmoidal: slow at first, fastest at half capacity, then slowing to zero at $K$.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-logistic-1',
        trapTitle: 'Assuming growth stops as soon as it nears K',
        flawedReasoning: 'Once a population approaches carrying capacity, growth rate is essentially zero.',
        correctConcept:
          'The rate approaches zero asymptotically; the steepest decline in *per-capita* rate happens early, but absolute growth only vanishes at $N = K$.',
        counterExample:
          'At $N = 0.9K$ growth is still about 9% of the maximum rate, not zero.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What happens to a population if it slightly exceeds K?',
      options: [
        'It grows faster',
        'It declines back toward K',
        'Nothing changes',
        'It doubles',
      ],
      correctIndex: 1,
      explanation: 'Above $K$ the term $(1 - N/K)$ becomes negative, so growth turns into decline.',
    },
  },

  'concept-crispr-cas9-pcr': {
    workedExamples: [
      {
        id: 'we-enr-crispr-1',
        title: 'PCR Amplification after 20 Cycles',
        problemStatement: 'Starting from one DNA molecule, how many copies exist after 20 PCR cycles?',
        difficulty: 'easy_medium',
        stepByStepSolution: [
          'Each cycle doubles the number of target molecules.',
          'Doubling for $n$ cycles multiplies by $2^n$.',
          'With $n = 20$, the count is $2^{20}$.',
          'That is $1{,}048{,}576$ copies.',
        ],
        finalAnswer: 'About $1.05$ million copies.',
        keyTakeaway:
          'PCR is exponential: 30 cycles already exceeds a billion copies from a single template.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-crispr-1',
        trapTitle: 'Assuming Cas9 cuts any matching sequence',
        flawedReasoning: 'A 20-base guide is unique, so Cas9 edits only the intended site.',
        correctConcept:
          'Cas9 also tolerates mismatches, especially in the 5\' end of the guide, so off-target edits occur. PAM proximity and guide design constrain specificity.',
        counterExample:
          'Early CRISPR studies reported off-target edits at sites differing by several bases from the intended target.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'What role does the PAM sequence play in Cas9 targeting?',
      options: [
        'It encodes the guide RNA',
        'It is required for Cas9 to recognise and bind the target',
        'It repairs the double-strand break',
        'It selects which strand is copied',
      ],
      correctIndex: 1,
      explanation: 'Cas9 requires an adjacent PAM motif before it will bind and cleave.',
    },
  },

  'concept-osmosis-water-potential': {
    workedExamples: [
      {
        id: 'we-enr-osmosis-1',
        title: 'Turgor Pressure from Water Potential',
        problemStatement:
          'A cell has solute potential $-0.9\\,\\text{MPa}$ and is in pure water at $0\\,\\text{MPa}$. At equilibrium, what is its pressure potential?',
        difficulty: 'medium',
        stepByStepSolution: [
          'Water enters until the cell\'s water potential equals the surrounding $0\\,\\text{MPa}$.',
          'At equilibrium $\\Psi = \\Psi_s + \\Psi_p = 0$.',
          'Substitute $\\Psi_s = -0.9$: $-0.9 + \\Psi_p = 0$.',
          'Therefore $\\Psi_p = +0.9\\,\\text{MPa}$.',
        ],
        finalAnswer: '$+0.9\\,\\text{MPa}$ of turgor pressure.',
        keyTakeaway:
          'Turgor pressure is the physical push that balances osmotic pull — it is why plants stand upright.',
      },
    ],
    commonPitfalls: [
      {
        id: 'cp-enr-osmosis-1',
        trapTitle: 'Treating solute potential as always dominant',
        flawedReasoning: 'Water potential is just the solute concentration, so ignore pressure.',
        correctConcept:
          'Pressure potential can outweigh solute potential. In a turgid cell the positive pressure term is essential to the balance.',
        counterExample:
          'A wilted plant loses turgor, so $\\Psi_p \\approx 0$ and water potential falls to the solute value alone.',
      },
    ],
    miniCheckQuestion: {
      prompt: 'A cell with $\\Psi = -0.4\\,\\text{MPa}$ is placed in a solution at $\\Psi = -0.8\\,\\text{MPa}$. What happens?',
      options: [
        'Water enters the cell',
        'Water leaves the cell',
        'No net movement',
        'The cell bursts',
      ],
      correctIndex: 1,
      explanation: 'The cell has the higher (less negative) potential, so water moves out toward the solution.',
    },
  },
};
