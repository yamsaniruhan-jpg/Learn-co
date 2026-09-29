export interface ArchiveChapterQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  hint: string;
  explanation: string;
  xpReward: number;
}

export interface ArchiveCoreTheorem {
  name: string;
  statement: string;
  intuition: string;
  proofSnippet?: string;
}

export interface ChapterArchiveResource {
  id: string;
  subjectId: 'math' | 'cs' | 'physics' | 'chemistry' | 'biology';
  chapterId: string;
  chapterTitle: string;
  bookTitle: string;
  authors: string;
  editionOrYear: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Olympiad/Graduate';
  description: string;
  keyTopicsCovered: string[];
  coreTheorems: ArchiveCoreTheorem[];
  interactiveQuestions: ArchiveChapterQuestion[];
  chapterSummaryMarkdown: string;
}

export const DIGITAL_ARCHIVE_RESOURCES: ChapterArchiveResource[] = [
  // ==========================================
  // MATHEMATICS (6 Chapters)
  // ==========================================
  {
    id: 'res-math-01',
    subjectId: 'math',
    chapterId: 'math-ch-diff-calc',
    chapterTitle: 'Differential Calculus & Real Analysis',
    bookTitle: 'Calculus: Early Transcendentals & Analysis',
    authors: 'James Stewart & Walter Rudin',
    editionOrYear: 'Standard Pedagogical Edition',
    level: 'Intermediate',
    description: 'Gold standard comprehensive foundation for continuous limits, derivatives, monotonicity, mean value theorems, and extremal optimization.',
    keyTopicsCovered: ['Epsilon-Delta Limits', 'Derivative Invariants', 'Rolle Theorem', 'Taylor Polynomials', 'Uniform Continuity'],
    coreTheorems: [
      {
        name: "Cauchy Mean Value Theorem",
        statement: "If f and g are continuous on [a, b] and differentiable on (a, b), then there exists c in (a, b) such that (f(b) - f(a)) * g'(c) = (g(b) - g(a)) * f'(c).",
        intuition: "Generalizes standard MVT to parameterized curves, directly yielding L'Hopital's Rule as a special case.",
        proofSnippet: "Define auxiliary function h(x) = f(x)*(g(b)-g(a)) - g(x)*(f(b)-f(a)). Apply Rolle's Theorem to h(x) on [a,b].",
      },
      {
        name: "Taylor's Theorem with Lagrange Remainder",
        statement: "f(x) = sum_{k=0}^n [f^(k)(a)/k! * (x-a)^k] + f^(n+1)(xi)/(n+1)! * (x-a)^(n+1) for xi between a and x.",
        intuition: "Approximates any smooth function locally by an n-th degree polynomial with an exact error bound.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-diff-1',
        questionText: 'Given f(x) = x^3 - 3x on [-2, 2], how many points c in (-2, 2) satisfy f\'(c) = (f(2) - f(-2))/(2 - (-2)) by the Mean Value Theorem?',
        options: ['0 points', '1 point', '2 points', 'Infinitely many'],
        correctAnswerIndex: 2,
        hint: 'Calculate f(2) = 2, f(-2) = -2, average slope = 4/4 = 1. Solve 3c^2 - 3 = 1.',
        explanation: 'f\'(x) = 3x^2 - 3. Setting 3c^2 - 3 = 1 gives 3c^2 = 4, so c = ±√(4/3) = ±2/√3 ≈ ±1.155, both of which lie strictly within (-2, 2). Thus, exactly 2 points exist.',
        xpReward: 25,
      },
      {
        id: 'q-diff-2',
        questionText: 'What is the limit of (sin(x) - x) / x^3 as x approaches 0?',
        options: ['0', '-1/6', '1/6', 'Undefined'],
        correctAnswerIndex: 1,
        hint: 'Use the Taylor expansion sin(x) = x - x^3/3! + O(x^5).',
        explanation: 'Substituting sin(x) = x - x^3/6 + O(x^5) into the numerator yields (-x^3/6 + O(x^5)) / x^3 = -1/6 as x -> 0.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Differential Calculus & Analysis Foundations
* **Rigorous Limit Definition**: $\\forall \\varepsilon > 0, \\exists \\delta > 0$ such that $0 < |x - c| < \\delta \\implies |f(x) - L| < \\varepsilon$.
* **Differentiability Invariant**: Differentiability at $x_0$ strictly implies continuity at $x_0$, but the converse is not true (e.g. $|x|$ at $x=0$, or the Weierstrass function).
* **Optimization Criterion**: Local extrema of a differentiable function on an open interval occur strictly at stationary critical points where $f'(x) = 0$.`,
  },
  {
    id: 'res-math-02',
    subjectId: 'math',
    chapterId: 'math-ch-integral-calc',
    chapterTitle: 'Integral Calculus & Differential Equations',
    bookTitle: 'Calculus & Differential Systems with Applications',
    authors: 'Tom M. Apostol & Boyce-DiPrima',
    editionOrYear: 'Comprehensive Mathematical Edition',
    level: 'Advanced',
    description: 'Comprehensive integration theory, ordinary differential equations, linear systems, and vector calculus invariants.',
    keyTopicsCovered: ['Fundamental Theorem of Calculus', 'Integration Techniques', 'Linear ODEs', 'Integrating Factors', 'Series Solutions'],
    coreTheorems: [
      {
        name: "Fundamental Theorem of Calculus (FTC)",
        statement: "If f is continuous on [a, b] and F(x) = integral_a^x f(t)dt, then F'(x) = f(x), and integral_a^b f(x)dx = F(b) - F(a).",
        intuition: "Bridges the rate of change (derivative) with accumulation (integral) as inverse analytical operations.",
      },
      {
        name: "First-Order Linear ODE Integrating Factor",
        statement: "For y' + P(x)y = Q(x), multiplying by mu(x) = exp(integral P(x)dx) turns the left-hand side into [mu(x)*y]'.",
        intuition: "Transforms an insoluble product into the exact derivative of a combined product.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-int-1',
        questionText: 'What is the general solution to the first-order differential equation dy/dx + 2y = 4?',
        options: ['y(x) = 2 + C*e^(-2x)', 'y(x) = 4 + C*e^(2x)', 'y(x) = 2*e^(-2x) + C', 'y(x) = C*e^(-2x) - 4'],
        correctAnswerIndex: 0,
        hint: 'The integrating factor is e^(integral 2 dx) = e^(2x).',
        explanation: 'Multiplying by e^(2x): d/dx [y * e^(2x)] = 4*e^(2x). Integrating gives y * e^(2x) = 2*e^(2x) + C, so y(x) = 2 + C*e^(-2x).',
        xpReward: 30,
      },
      {
        id: 'q-int-2',
        questionText: 'Evaluate the improper integral integral_0^infinity x * e^(-x) dx.',
        options: ['0', '1', '2', 'Diverges'],
        correctAnswerIndex: 1,
        hint: 'Use integration by parts with u = x and dv = e^(-x) dx, or recognize Gamma(2) = 1! = 1.',
        explanation: 'Integration by parts: [-x*e^(-x)]_0^infinity + integral_0^infinity e^(-x) dx = 0 + [-e^(-x)]_0^infinity = 1.',
        xpReward: 35,
      },
    ],
    chapterSummaryMarkdown: `### Integration & Differential Systems
* **Riemann-Stieltjes Integrability**: A bounded function on a compact interval is Riemann integrable if and only if its set of discontinuities has Lebesgue measure zero.
* **Separation of Variables**: First-order equations of form $g(y)dy = f(x)dx$ are integrated directly on both sides.
* **Exact Differential Equations**: $M(x,y)dx + N(x,y)dy = 0$ is exact if and only if $\\frac{\\partial M}{\\partial y} = \\frac{\\partial N}{\\partial x}$.`,
  },
  {
    id: 'res-math-03',
    subjectId: 'math',
    chapterId: 'math-ch-linalg',
    chapterTitle: 'Linear Algebra & Vector Spaces',
    bookTitle: 'Linear Algebra Done Right & Matrix Theory',
    authors: 'Sheldon Axler & Gilbert Strang',
    editionOrYear: 'Modern Axiomatic Edition',
    level: 'Intermediate',
    description: 'Proof-centric determinant-free approach focusing on vector spaces, linear maps, eigenvalues, eigenvectors, and spectral theorem.',
    keyTopicsCovered: ['Vector Spaces', 'Inner Product Spaces', 'Spectral Theorem', 'Singular Value Decomposition (SVD)', 'Orthogonal Projections'],
    coreTheorems: [
      {
        name: "Spectral Theorem for Real Symmetric Matrices",
        statement: "Every real symmetric matrix A can be orthogonally diagonalized: A = Q * Lambda * Q^T, where Q is orthogonal and Lambda is real diagonal.",
        intuition: "Guarantees a complete orthonormal basis of eigenvectors for any symmetric physical or geometric transformation.",
      },
      {
        name: "Rank-Nullity Theorem",
        statement: "For any linear map T: V -> W on finite-dimensional V, dim(V) = dim(null(T)) + dim(range(T)).",
        intuition: "Every dimension lost in the kernel is exactly preserved in the output subspace.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-linalg-1',
        questionText: 'If a 3x3 real matrix A has eigenvalues 2, -3, and 5, what is the determinant of A?',
        options: ['4', '-30', '30', '0'],
        correctAnswerIndex: 1,
        hint: 'The determinant of a matrix equals the product of its eigenvalues.',
        explanation: 'det(A) = lambda_1 * lambda_2 * lambda_3 = 2 * (-3) * 5 = -30.',
        xpReward: 25,
      },
      {
        id: 'q-linalg-2',
        questionText: 'Which condition guarantees that two vectors u and v in an inner product space are orthogonal?',
        options: ['||u + v|| = ||u|| + ||v||', '<u, v> = 0', 'u = c * v for scalar c', 'det([u v]) = 1'],
        correctAnswerIndex: 1,
        hint: 'By definition, orthogonality in an inner product space requires the inner product to vanish.',
        explanation: 'Vectors u and v are orthogonal if and only if <u, v> = 0, which also implies the Pythagorean theorem ||u + v||^2 = ||u||^2 + ||v||^2.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Linear Vector Spaces & Operators
* **Linear Independence**: Vectors $\\{v_1, \\dots, v_k\\}$ are linearly independent if $c_1 v_1 + \\dots + c_k v_k = 0 \\implies c_1 = \\dots = c_k = 0$.
* **Gram-Schmidt Process**: Converts any arbitrary basis into an orthonormal basis through recursive projections.
* **Singular Value Decomposition (SVD)**: $A = U \\Sigma V^T$ decomposes any $m \\times n$ real matrix into orthogonal rotations and non-negative singular stretch factors.`,
  },
  {
    id: 'res-math-04',
    subjectId: 'math',
    chapterId: 'math-ch-multivariable',
    chapterTitle: 'Multivariable Calculus & Vector Fields',
    bookTitle: 'Vector Calculus & Differential Forms',
    authors: 'Jerrold E. Marsden & Anthony Tromba',
    editionOrYear: 'Classical & Differential Edition',
    level: 'Advanced',
    description: 'Multivariable derivatives, Jacobian matrices, gradient vector fields, line integrals, Stokes theorem, and Gauss divergence theorem.',
    keyTopicsCovered: ['Jacobian Matrix', 'Lagrange Multipliers', 'Green Theorem', 'Stokes & Divergence Theorems', 'Conservative Fields'],
    coreTheorems: [
      {
        name: "Stokes' Theorem",
        statement: "integral_{partial S} F . dr = integral integral_S (curl F) . n dS.",
        intuition: "The circulation of a vector field around a closed boundary curve equals the flux of the curl through any enclosed surface.",
      },
      {
        name: "Gauss' Divergence Theorem",
        statement: "integral integral_{partial V} F . n dS = integral integral integral_V (div F) dV.",
        intuition: "Total outward flux of a vector field through a closed boundary surface equals total volume divergence generated inside.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-multi-1',
        questionText: 'For a conservative vector field F = grad(f), what is the line integral of F along any smooth closed loop C?',
        options: ['1', '2*pi', '0', 'Depends on the enclosed area'],
        correctAnswerIndex: 2,
        hint: 'By the Fundamental Theorem of Line Integrals, integral_C grad(f) . dr = f(end) - f(start).',
        explanation: 'For any closed loop, the end point coincides with the start point, so f(end) - f(start) = 0. Therefore, line integrals of conservative fields over closed paths are strictly 0.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Multivariable Calculus & Fields
* **Gradient Direction**: $\\nabla f(x_0)$ points in the direction of maximum directional rate of increase with magnitude equal to that rate.
* **Lagrange Multiplier Condition**: Optimization of $f(x,y)$ subject to constraint $g(x,y) = c$ requires $\\nabla f = \\lambda \\nabla g$.`,
  },
  {
    id: 'res-math-05',
    subjectId: 'math',
    chapterId: 'math-ch-prob-stat',
    chapterTitle: 'Probability, Statistics & Stochastic Systems',
    bookTitle: 'A First Course in Probability & Stochastic Processes',
    authors: 'Sheldon Ross & E.T. Jaynes',
    editionOrYear: 'Probability & Inference Edition',
    level: 'Intermediate',
    description: 'Combinatorial probability, conditional expectations, continuous distributions, joint probability density, and central limit theorem.',
    keyTopicsCovered: ['Bayes Rule', 'Markov Chains', 'Moment Generating Functions', 'Central Limit Theorem', 'Maximum Likelihood Estimation'],
    coreTheorems: [
      {
        name: "Central Limit Theorem (CLT)",
        statement: "Let X_1, ..., X_n be i.i.d. random variables with mean mu and variance sigma^2. As n -> infinity, the normalized sample mean sqrt(n)*(bar(X) - mu)/sigma converges in distribution to N(0, 1).",
        intuition: "Sums of independent random variables naturally assemble into a Gaussian distribution regardless of the underlying population distribution.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-prob-1',
        questionText: 'If events A and B are independent with P(A) = 0.4 and P(B) = 0.5, what is P(A union B)?',
        options: ['0.9', '0.7', '0.2', '0.6'],
        correctAnswerIndex: 1,
        hint: 'Use the inclusion-exclusion principle: P(A union B) = P(A) + P(B) - P(A intersect B). For independent events, P(A intersect B) = P(A)*P(B).',
        explanation: 'P(A intersect B) = 0.4 * 0.5 = 0.2. Then P(A union B) = 0.4 + 0.5 - 0.2 = 0.7.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Probability & Stochastic Dynamics
* **Bayes\' Theorem**: $P(A|B) = \\frac{P(B|A)P(A)}{P(B)}$ updates prior beliefs into posterior evidence.
* **Law of Total Expectation**: $E[X] = E[E[X|Y]]$ enables hierarchical decomposition of random phenomena.`,
  },
  {
    id: 'res-math-06',
    subjectId: 'math',
    chapterId: 'math-ch-discrete-comb',
    chapterTitle: 'Discrete Mathematics, Combinatorics & Graph Theory',
    bookTitle: 'Concrete Mathematics: Discrete Foundations',
    authors: 'Ronald L. Graham, Donald E. Knuth, Oren Patashnik',
    editionOrYear: 'Discrete Algorithmics Edition',
    level: 'Advanced',
    description: 'Blends discrete math with algorithm analysis: summations, generating functions, recurrence relations, and graph invariants.',
    keyTopicsCovered: ['Generating Functions', 'Inclusion-Exclusion', 'Recurrence Relations', 'Graph Planarity', 'Euler Characteristic'],
    coreTheorems: [
      {
        name: "Euler's Planar Formula",
        statement: "For any connected planar graph with V vertices, E edges, and F faces: V - E + F = 2.",
        intuition: "Fundamental topological invariant connecting vertices, edges, and planar bounded regions.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-disc-1',
        questionText: 'How many edges does a complete graph K_6 have?',
        options: ['12', '15', '30', '36'],
        correctAnswerIndex: 1,
        hint: 'Number of edges in K_n is given by n*(n-1)/2.',
        explanation: 'For n = 6, E = 6 * 5 / 2 = 15 edges.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Discrete Combinatorics & Recurrences
* **Master Theorem**: Solves algorithmic divide-and-conquer recurrences of form $T(n) = a T(n/b) + f(n)$.
* **Pigeonhole Principle**: If $n+1$ items are placed into $n$ containers, at least one container must contain 2 or more items.`,
  },

  // ==========================================
  // COMPUTER SCIENCE & AI (5 Chapters)
  // ==========================================
  {
    id: 'res-cs-01',
    subjectId: 'cs',
    chapterId: 'cs-ch-python-dsa',
    chapterTitle: 'Python, Algorithms & Data Structures',
    bookTitle: 'Introduction to Algorithms (CLRS)',
    authors: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    editionOrYear: 'Comprehensive Core Edition',
    level: 'Intermediate',
    description: 'Comprehensive encyclopedia of asymptotic complexity, dynamic programming, graph algorithms, and balanced search trees.',
    keyTopicsCovered: ['Big-O Analysis', 'Dynamic Programming', 'Red-Black Trees', 'Dijkstra & A* Search', 'Amortized Analysis'],
    coreTheorems: [
      {
        name: "Comparison Sort Lower Bound",
        statement: "Any comparison-based sorting algorithm requires at least Omega(n log n) comparisons in the worst case.",
        intuition: "A decision tree sorting n elements must have at least n! leaves; minimum tree height is log_2(n!) = Theta(n log n).",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-cs-1',
        questionText: 'What is the tightest asymptotic time complexity of building a Binary Heap from an unordered array of n elements?',
        options: ['O(n log n)', 'O(n)', 'O(log n)', 'O(n^2)'],
        correctAnswerIndex: 1,
        hint: 'Bottom-up heapify sums the node heights: sum_{h=0}^{log n} (n / 2^(h+1)) * O(h) = O(n).',
        explanation: 'Bottom-up Build-Heap operates in linear time O(n) because the vast majority of nodes are near the bottom of the tree with small heights.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Data Structures & Algorithmic Analysis
* **Amortized Complexity**: Analyzes sequence of operations to guarantee average cost per operation (e.g. Dynamic Array resizing is $O(1)$ amortized).
* **Graph Traversal**: BFS computes shortest paths in unweighted graphs in $O(V + E)$, while Dijkstra computes optimal paths in non-negative weighted graphs in $O((V + E) \\log V)$.`,
  },
  {
    id: 'res-cs-02',
    subjectId: 'cs',
    chapterId: 'cs-ch-ml-opt',
    chapterTitle: 'Machine Learning Foundations & Optimization',
    bookTitle: 'Pattern Recognition and Machine Learning',
    authors: 'Christopher M. Bishop & Kevin Murphy',
    editionOrYear: 'Foundational Statistical Edition',
    level: 'Advanced',
    description: 'Bayesian inference, linear regression, support vector machines, gradient descent optimization, and kernel methods.',
    keyTopicsCovered: ['Convex Loss Functions', 'Stochastic Gradient Descent', 'Gaussian Processes', 'EM Algorithm', 'Bias-Variance Tradeoff'],
    coreTheorems: [
      {
        name: "Bias-Variance Decomposition",
        statement: "Expected Test Error = Bias^2 + Variance + Irreducible Noise.",
        intuition: "Underfitting corresponds to high bias; overfitting corresponds to high model sensitivity to training noise variance.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-ml-1',
        questionText: 'In L2 Regularization (Ridge Regression), what effect does increasing the regularization hyperparameter lambda have on model weights?',
        options: ['Drives weights to exactly zero (sparsity)', 'Shrinks weights smoothly toward zero without exact sparsity', 'Causes weights to oscillate exponentially', 'Has no effect on weights'],
        correctAnswerIndex: 1,
        hint: 'L2 adds lambda * sum(w_i^2), creating spherical quadratic penalties that smoothly shrink coefficients.',
        explanation: 'L2 regularization smoothly shrinks the weight coefficients toward zero by adding a quadratic penalty, while L1 regularization (Lasso) produces sharp corners driving weights to exact zeros.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Statistical Machine Learning & Optimization
* **Convex Optimization**: If the loss surface $L(\\theta)$ is strictly convex, every local minimum is guaranteed to be a global minimum.
* **Support Vector Machines**: Maximizes the geometric margin $\\frac{2}{\\|w\\|}$ between decision boundaries, leading to convex quadratic programming.`,
  },
  {
    id: 'res-cs-03',
    subjectId: 'cs',
    chapterId: 'cs-ch-deep-learning',
    chapterTitle: 'Deep Learning, Neural Networks & Transformers',
    bookTitle: 'Deep Learning & Attention Architectures',
    authors: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    editionOrYear: 'Modern Neural Systems Edition',
    level: 'Advanced',
    description: 'Deep feedforward networks, backpropagation derivations, convolutional networks, attention mechanisms, and transformers.',
    keyTopicsCovered: ['Self-Attention Mechanism', 'Backpropagation Gradient Flow', 'Layer Normalization', 'Transformers', 'Residual Connections'],
    coreTheorems: [
      {
        name: "Universal Approximation Theorem",
        statement: "A feedforward neural network with a single hidden layer and finite non-linear activation functions can approximate any continuous function on a compact set to arbitrary precision.",
        intuition: "Neural networks are theoretically capable of representing any smooth mapping given sufficient parameter width.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-dl-1',
        questionText: 'What is the computational complexity of the Scaled Dot-Product Attention mechanism Attention(Q, K, V) with sequence length N and embedding dimension d?',
        options: ['O(N * d)', 'O(N^2 * d)', 'O(N * d^2)', 'O(N^3)'],
        correctAnswerIndex: 1,
        hint: 'Computing Q * K^T requires multiplying an (N x d) matrix with a (d x N) matrix, resulting in an (N x N) attention score matrix.',
        explanation: 'Q * K^T has dimensions N x N, each element computed in O(d), yielding O(N^2 * d) time complexity. Multiplying with V (N x d) is also O(N^2 * d).',
        xpReward: 35,
      },
    ],
    chapterSummaryMarkdown: `### Neural Networks & Attention Mechanisms
* **Attention Invariant**: $\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$.
* **Residual Connections**: Skip connections $y = F(x) + x$ prevent vanishing gradients by allowing error signals $\\frac{\\partial L}{\\partial x} = \\frac{\\partial L}{\\partial y}\\left(\\frac{\\partial F}{\\partial x} + I\\right)$ to flow directly across layers.`,
  },
  {
    id: 'res-cs-04',
    subjectId: 'cs',
    chapterId: 'cs-ch-os-concurrency',
    chapterTitle: 'Operating Systems, Concurrency & Low-Level Memory',
    bookTitle: 'Computer Systems: A Programmer\'s Perspective (CS:APP)',
    authors: 'Randal E. Bryant & David R. O\'Hallaron',
    editionOrYear: 'Systems Engineering Edition',
    level: 'Intermediate',
    description: 'Machine-level representation of programs, virtual memory, cache hierarchy, process control, threads, and synchronization.',
    keyTopicsCovered: ['Virtual Memory Paging', 'Cache Coherence', 'Mutexes & Semaphores', 'Deadlock Detection', 'TLB Caching'],
    coreTheorems: [
      {
        name: "Coffman Conditions for Deadlock",
        statement: "Deadlock occurs if and only if four conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
        intuition: "Breaking any single condition eliminates the possibility of system deadlock.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-os-1',
        questionText: 'What is the purpose of the Translation Lookaside Buffer (TLB) in CPU memory architecture?',
        options: ['Cache compiled machine code instructions', 'Cache recent virtual-to-physical address translations', 'Store operating system kernel logs', 'Synchronize GPU render buffers'],
        correctAnswerIndex: 1,
        hint: 'The TLB is a high-speed hardware cache located inside the MMU to bypass multi-level page table lookups in RAM.',
        explanation: 'The TLB caches recent virtual address to physical frame translations, reducing memory lookup latency from multiple DRAM accesses to a single fast hardware check.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Systems Memory & Concurrency
* **Locality Principle**: Programs tend to reuse data and instructions near recently accessed addresses (Temporal & Spatial Locality).
* **Virtual Memory**: Provides each process with an isolated linear 64-bit address space, demand paging, and hardware memory protection.`,
  },
  {
    id: 'res-cs-05',
    subjectId: 'cs',
    chapterId: 'cs-ch-dist-systems',
    chapterTitle: 'Distributed Systems, Databases & Cloud Scalability',
    bookTitle: 'Designing Data-Intensive Applications',
    authors: 'Martin Kleppmann',
    editionOrYear: 'Distributed Architecture Edition',
    level: 'Advanced',
    description: 'Deep dive into fault tolerance, CAP theorem, consensus protocols (Raft/Paxos), replication, partitioning, and ACID transactions.',
    keyTopicsCovered: ['CAP Theorem Invariants', 'Consensus Raft Protocol', 'Two-Phase Commit', 'LSM Trees', 'Vector Clocks'],
    coreTheorems: [
      {
        name: "Brewer's CAP Theorem",
        statement: "In an asynchronous network with partitions (P), a distributed data store can simultaneously provide at most Consistency (C) or Availability (A), but not both.",
        intuition: "During a network partition, nodes must either reject writes to preserve consistency or accept writes and risk divergent state.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-dist-1',
        questionText: 'In the Raft consensus protocol, what happens if the current Leader fails or becomes partitioned from the majority of followers?',
        options: ['The cluster permanently halts all reads', 'Followers time out their heartbeat timers and trigger a new Leader Election', 'The client is elected as the new leader', 'Nodes erase all uncommitted logs'],
        correctAnswerIndex: 1,
        hint: 'Followers maintain randomized election timeouts; when no heartbeat is received, a follower transitions to Candidate status.',
        explanation: 'When followers do not receive leader heartbeats within their randomized timeout, they transition to Candidate state, increment their term, and request votes to elect a new leader.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Distributed Systems & Consensus
* **Log-Structured Merge (LSM) Trees**: Appends writes sequentially to an in-memory MemTable and flushes to immutable disk SSTables for high write throughput.
* **Vector Clocks**: Captures causal ordering across distributed concurrent processes without relying on synchronized physical wall clocks.`,
  },

  // ==========================================
  // PHYSICS (5 Chapters)
  // ==========================================
  {
    id: 'res-phys-01',
    subjectId: 'physics',
    chapterId: 'phys-ch-mechanics',
    chapterTitle: 'Classical Mechanics, Kinematics & Conservation Laws',
    bookTitle: 'Classical Mechanics & Variational Principles',
    authors: 'Herbert Goldstein, Charles P. Poole, John L. Safko',
    editionOrYear: 'Theoretical Mechanics Edition',
    level: 'Advanced',
    description: 'Lagrangian and Hamiltonian formulations, central force motion, rigid body dynamics, and canonical transformations.',
    keyTopicsCovered: ['Work-Energy Theorem', 'Lagrangian Dynamics', 'Central Force Orbits', 'Momentum Conservation', 'Euler-Lagrange Equations'],
    coreTheorems: [
      {
        name: "Noether's Theorem",
        statement: "Every continuous differentiable symmetry of the action of a physical system has a corresponding conservation law.",
        intuition: "Time translation invariance gives energy conservation; spatial translation invariance gives linear momentum conservation; rotational invariance gives angular momentum conservation.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-phys-1',
        questionText: 'If a particle of mass m moves under a central potential V(r), which of the following quantities is strictly conserved throughout its motion?',
        options: ['Total linear momentum', 'Angular momentum vector L', 'Velocity vector v', 'Radial acceleration'],
        correctAnswerIndex: 1,
        hint: 'The torque tau = r x F. Since central force F is parallel to position vector r, the torque vanishes identically.',
        explanation: 'Because tau = r x F = 0 for any central force, dL/dt = tau = 0. Therefore, the angular momentum vector L is constant in both magnitude and direction.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Analytical Mechanics
* **Euler-Lagrange Equation**: $\\frac{d}{dt}\\left(\\frac{\\partial L}{\\partial \\dot{q}_i}\\right) - \\frac{\\partial L}{\\partial q_i} = 0$, where $L = T - V$.
* **Hamiltonian Mechanics**: $H(q, p) = \\sum p_i \\dot{q}_i - L$ defines the phase space trajectories via $\\dot{q}_i = \\frac{\\partial H}{\\partial p_i}$ and $\\dot{p}_i = -\\frac{\\partial H}{\\partial q_i}$.`,
  },
  {
    id: 'res-phys-02',
    subjectId: 'physics',
    chapterId: 'phys-ch-electromagnetism',
    chapterTitle: 'Electromagnetism & Maxwell\'s Equations',
    bookTitle: 'Introduction to Electrodynamics',
    authors: 'David J. Griffiths & Edward Purcell',
    editionOrYear: 'Standard Electrodynamics Edition',
    level: 'Intermediate',
    description: 'Electrostatics, magnetostatics, electrodynamics, Maxwell\'s equations in differential form, electromagnetic waves, and Poynting vector.',
    keyTopicsCovered: ['Faraday Law of Induction', 'Maxwell Equations', 'Poynting Flux', 'Electromagnetic Radiation', 'Gauss Law'],
    coreTheorems: [
      {
        name: "Maxwell's Equations in Differential Form",
        statement: "div(E) = rho/epsilon_0, div(B) = 0, curl(E) = -dB/dt, curl(B) = mu_0*J + mu_0*epsilon_0*dE/dt.",
        intuition: "Unified framework describing how charges create fields and how dynamic electric and magnetic fields induce each other at light speed c.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-em-1',
        questionText: 'What physical property does the Maxwell equation div(B) = 0 represent?',
        options: ['Electric charges are conserved', 'Magnetic monopoles do not exist in classical electrodynamics', 'Electric fields have zero divergence in vacuum', 'Current produces zero magnetic force'],
        correctAnswerIndex: 1,
        hint: 'A divergence of zero across any closed volume implies magnetic field lines never terminate at a single isolated pole.',
        explanation: 'div(B) = 0 indicates that magnetic flux through any closed surface is identically zero, meaning isolated magnetic charges (monopoles) do not exist.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Electrodynamics & Wave Propagation
* **Poynting Vector**: $S = \\frac{1}{\\mu_0} (E \\times B)$ quantifies the directional energy flux density carried by an electromagnetic wave.
* **Speed of Light Invariant**: $c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}} \\approx 3 \\times 10^8 \\text{ m/s}$.`,
  },
  {
    id: 'res-phys-03',
    subjectId: 'physics',
    chapterId: 'phys-ch-thermo',
    chapterTitle: 'Thermodynamics & Statistical Mechanics',
    bookTitle: 'An Introduction to Thermal Physics & Statistical States',
    authors: 'Daniel V. Schroeder & F. Mandl',
    editionOrYear: 'Thermal Systems Edition',
    level: 'Intermediate',
    description: 'First & second laws of thermodynamics, Carnot heat engines, microstates, Boltzmann distribution, and partition functions.',
    keyTopicsCovered: ['First & Second Laws', 'Carnot Cycle Efficiency', 'Boltzmann Entropy S = k ln(Omega)', 'Partition Functions', 'Helmholtz Free Energy'],
    coreTheorems: [
      {
        name: "Carnot's Theorem",
        statement: "No heat engine operating between hot reservoir T_H and cold reservoir T_C can be more efficient than a reversible Carnot engine: eta_max = 1 - T_C/T_H.",
        intuition: "Thermodynamic irreversibility establishes a fundamental theoretical ceiling for heat-to-work conversion.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-thermo-1',
        questionText: 'A Carnot engine operates between a heat source at 600 K and a heat sink at 300 K. What is its maximum theoretical thermal efficiency?',
        options: ['25%', '50%', '66.7%', '100%'],
        correctAnswerIndex: 1,
        hint: 'Carnot efficiency eta = 1 - (T_C / T_H).',
        explanation: 'eta = 1 - (300 / 600) = 1 - 0.5 = 0.50 (50%).',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Thermodynamics & Ensembles
* **Boltzmann Entropy**: $S = k_B \\ln(\\Omega)$ links microscopic multiplicity $\\Omega$ with macroscopic state entropy $S$.
* **First Law**: $dU = \\delta Q - \\delta W$, establishing conservation of internal energy.`,
  },
  {
    id: 'res-phys-04',
    subjectId: 'physics',
    chapterId: 'phys-ch-quantum',
    chapterTitle: 'Quantum Mechanics & Wave-Particle Duality',
    bookTitle: 'Principles of Quantum Mechanics',
    authors: 'R. Shankar & David J. Griffiths',
    editionOrYear: 'Quantum Physics Edition',
    level: 'Advanced',
    description: 'Wavefunctions, Hilbert space, Schrödinger equation, Heisenberg uncertainty principle, and harmonic oscillators.',
    keyTopicsCovered: ['Schrödinger Equation', 'Heisenberg Uncertainty', 'Wavefunction Normalization', 'Quantum Harmonic Oscillator', 'Spin Operators'],
    coreTheorems: [
      {
        name: "Heisenberg Uncertainty Principle",
        statement: "sigma_x * sigma_p >= hbar / 2.",
        intuition: "Fundamental non-commutativity of conjugate position and momentum operators [x, p] = i*hbar.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-qm-1',
        questionText: 'What is the ground state energy E_0 of a 1D quantum harmonic oscillator with angular frequency omega?',
        options: ['0', '(1/2) * hbar * omega', 'hbar * omega', '(3/2) * hbar * omega'],
        correctAnswerIndex: 1,
        hint: 'Energy levels are given by E_n = (n + 1/2) * hbar * omega. Ground state corresponds to n = 0.',
        explanation: 'For n = 0, E_0 = (0 + 1/2)*hbar*omega = (1/2)*hbar*omega, representing irreducible zero-point energy.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Quantum State Mechanics
* **Time-Dependent Schrödinger Equation**: $i\\hbar \\frac{\\partial \\psi}{\\partial t} = \\hat{H}\\psi$.
* **Born Rule Probability**: $P(x) = |\\psi(x)|^2$ represents the spatial probability density of locating the particle.`,
  },
  {
    id: 'res-phys-05',
    subjectId: 'physics',
    chapterId: 'phys-ch-optics',
    chapterTitle: 'Optics, Wave Mechanics & Modern Physics',
    bookTitle: 'Optics & Wave Physics',
    authors: 'Eugene Hecht',
    editionOrYear: 'Physical Optics Edition',
    level: 'Intermediate',
    description: 'Interference, diffraction, polarization, laser physics, relativistic spacetime transformations, and photon momentum.',
    keyTopicsCovered: ['Young Double Slit Interference', 'Diffraction Gratings', 'Lorentz Transformations', 'Photoelectric Effect', 'Special Relativity'],
    coreTheorems: [
      {
        name: "Lorentz Invariance",
        statement: "Spacetime interval s^2 = c^2*Delta(t)^2 - Delta(x)^2 is invariant across all inertial reference frames.",
        intuition: "The speed of light c is constant for all observers, necessitating time dilation and length contraction.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-opt-1',
        questionText: 'In a Young\'s double-slit experiment, what happens to the fringe width beta = (lambda * D) / d if the distance D between the slits and screen is doubled?',
        options: ['Halved', 'Doubled', 'Quadrupled', 'Remains unchanged'],
        correctAnswerIndex: 1,
        hint: 'Fringe width is directly proportional to D.',
        explanation: 'Since beta = lambda * D / d, doubling D doubles the fringe width beta proportionally.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Wave Optics & Special Relativity
* **Photoelectric Einstein Invariant**: $K_{\\text{max}} = hf - \\Phi$, proving light quantization into discrete photons.
* **Lorentz Factor**: $\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$, dictating relativistic dilation.`,
  },

  // ==========================================
  // CHEMISTRY (5 Chapters)
  // ==========================================
  {
    id: 'res-chem-01',
    subjectId: 'chemistry',
    chapterId: 'chem-ch-atomic-bonding',
    chapterTitle: 'Atomic Structure, Quantum Orbitals & Chemical Bonding',
    bookTitle: 'Physical Chemistry & Molecular Quantum Structure',
    authors: 'Peter Atkins, Julio de Paula, James Keeler',
    editionOrYear: 'Molecular Foundations Edition',
    level: 'Intermediate',
    description: 'Quantum numbers, atomic orbitals, electron configuration, Lewis structures, molecular orbital theory, and hybridization.',
    keyTopicsCovered: ['Pauli Exclusion Principle', 'Hund Rule', 'Hybridization (sp, sp2, sp3)', 'Molecular Orbital Theory', 'Periodic Trends'],
    coreTheorems: [
      {
        name: "Pauli Exclusion Principle",
        statement: "No two fermions (electrons) in the same atom can have the same four quantum numbers (n, l, m_l, m_s).",
        intuition: "Enforces atomic electron shell structure and governs the entire periodic table of elements.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-chem-1',
        questionText: 'What is the hybridization and molecular geometry of methane (CH4)?',
        options: ['sp2, Trigonal Planar', 'sp3, Tetrahedral', 'sp, Linear', 'dsp2, Square Planar'],
        correctAnswerIndex: 1,
        hint: 'Carbon has 4 single sigma bonds and 0 lone pairs.',
        explanation: 'Carbon forms 4 identical sigma bonds directed to tetrahedral vertices with bond angle 109.5°, requiring sp3 hybridization.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Atomic Orbitals & Chemical Bonding
* **Molecular Orbital Theory**: Linear combination of atomic orbitals (LCAO) yields constructive bonding ($\sigma, \pi$) and destructive antibonding ($\sigma^*, \pi^*$) orbitals.
* **Bond Order**: $\\text{Bond Order} = \\frac{N_b - N_a}{2}$.`,
  },
  {
    id: 'res-chem-02',
    subjectId: 'chemistry',
    chapterId: 'chem-ch-thermo-equilibrium',
    chapterTitle: 'Chemical Thermodynamics, Equilibrium & Kinetics',
    bookTitle: 'Chemical Principles: The Quest for Insight',
    authors: 'Peter Atkins & Loretta Jones',
    editionOrYear: 'Thermodynamics Edition',
    level: 'Advanced',
    description: 'Gibbs free energy, enthalpy, entropy of reactions, Le Chatelier\'s principle, equilibrium constants, and reaction rates.',
    keyTopicsCovered: ['Gibbs Free Energy Delta(G) = Delta(H) - T*Delta(S)', 'Le Chatelier Principle', 'Arrhenius Equation', 'Equilibrium Constant K_eq', 'Catalysis Kinetics'],
    coreTheorems: [
      {
        name: "Van 't Hoff Equation",
        statement: "d(ln K_eq)/dT = Delta(H_rxn)/(R * T^2).",
        intuition: "Quantifies how chemical equilibrium shifts with temperature based on endothermic or exothermic reaction enthalpy.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-chem-2',
        questionText: 'For a chemical reaction at constant temperature and pressure, which condition guarantees spontaneous forward progress?',
        options: ['Delta(H) > 0', 'Delta(G) < 0', 'Delta(S) < 0', 'K_eq = 0'],
        correctAnswerIndex: 1,
        hint: 'Spontaneity is determined by the sign of the Gibbs Free Energy change.',
        explanation: 'A reaction is spontaneous in the forward direction at constant T and P if and only if Delta(G) < 0.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Chemical Equilibrium & Free Energy
* **Gibbs Standard Free Energy**: $\\Delta G^\\circ = -RT \\ln(K_{\\text{eq}})$.
* **Arrhenius Reaction Rate**: $k = A e^{-E_a / (RT)}$, indicating exponential rate acceleration with lower activation energy $E_a$.`,
  },
  {
    id: 'res-chem-03',
    subjectId: 'chemistry',
    chapterId: 'chem-ch-organic',
    chapterTitle: 'Organic Chemistry & Reaction Mechanisms',
    bookTitle: 'Organic Chemistry: Mechanisms & Structure',
    authors: 'Jonathan Clayden, Nick Greeves, Stuart Warren',
    editionOrYear: 'Standard Organic Edition',
    level: 'Advanced',
    description: 'Nucleophilic substitution (SN1/SN2), elimination (E1/E2), aromatic chemistry, carbonyl additions, and retrosynthesis.',
    keyTopicsCovered: ['SN1 vs SN2 Mechanisms', 'E1 vs E2 Elimination', 'Electrophilic Aromatic Substitution', 'Carbonyl Chemistry', 'Stereochemistry & Chiral Centers'],
    coreTheorems: [
      {
        name: "Hückel's Rule for Aromaticity",
        statement: "A planar cyclic conjugated ring system is aromatic if it possesses (4n + 2) pi electrons, where n is a non-negative integer.",
        intuition: "Completely fills closed bonding molecular orbital shells, conferring extraordinary chemical stability.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-org-1',
        questionText: 'Which mechanism proceeds with a single concerted bimolecular transition state and complete inversion of stereochemical configuration (Walden inversion)?',
        options: ['SN1', 'SN2', 'E1', 'Radical halogenation'],
        correctAnswerIndex: 1,
        hint: 'Backside attack by a strong nucleophile on a primary or secondary carbon.',
        explanation: 'SN2 proceeds via a single-step concerted mechanism with backside nucleophilic attack, inverting the chiral center stereochemistry.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Organic Mechanisms & Aromaticity
* **Carbocation Stability**: Tertiary ($3^\\circ$) > Secondary ($2^\\circ$) > Primary ($1^\\circ$) > Methyl due to hyperconjugation and inductive electron donation.
* **Markovnikov\'s Rule**: Electrophilic addition of HX to an alkene places the hydrogen atom on the carbon with more hydrogen substituents.`,
  },
  {
    id: 'res-chem-04',
    subjectId: 'chemistry',
    chapterId: 'chem-ch-inorganic',
    chapterTitle: 'Inorganic Chemistry & Coordination Complexes',
    bookTitle: 'Inorganic Chemistry & Crystal Field Theory',
    authors: 'Gary L. Miessler, Paul J. Fischer, Donald A. Tarr',
    editionOrYear: 'Coordination Systems Edition',
    level: 'Advanced',
    description: 'Transition metal coordination compounds, crystal field splitting (octahedral/tetrahedral), spectrochemical series, and ligand field theory.',
    keyTopicsCovered: ['Crystal Field Theory', 'd-Orbital Splitting (t_2g, e_g)', 'Jahn-Teller Distortion', 'Spectrochemical Series', 'Isomerism in Complexes'],
    coreTheorems: [
      {
        name: "Crystal Field Octahedral Splitting",
        statement: "In an octahedral ligand field, five degenerate d orbitals split into lower energy t_2g (d_xy, d_yz, d_xz) and higher energy e_g (d_z^2, d_x^2-y^2) states by Delta_oct.",
        intuition: "Electrostatic repulsion from point charges along coordinate axes destabilizes axial orbitals preferentially.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-inorg-1',
        questionText: 'In an octahedral coordination complex, which d-orbitals point directly at the incoming ligands and experience greater electrostatic repulsion?',
        options: ['d_xy and d_yz', 'd_z^2 and d_x^2-y^2 (e_g set)', 'd_xz and d_yz (t_2g set)', 'All d-orbitals equally'],
        correctAnswerIndex: 1,
        hint: 'The ligands approach along the x, y, and z Cartesian axes.',
        explanation: 'The e_g orbitals (d_z^2 and d_x^2-y^2) lie directly along the x, y, and z axes, experiencing direct ligand repulsion and splitting upward by +0.6 Delta_oct.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Inorganic Coordination Theory
* **High-Spin vs Low-Spin**: If $\\Delta_{\\text{oct}} > P$ (pairing energy), electrons pair up in lower $t_{2g}$ orbitals (low spin).
* **Chelate Effect**: Multidentate ligands form much more thermodynamically stable complexes than equivalent monodentate ligands due to positive entropy gain $\\Delta S > 0$.`,
  },
  {
    id: 'res-chem-05',
    subjectId: 'chemistry',
    chapterId: 'chem-ch-analytical',
    chapterTitle: 'Analytical Chemistry, Spectroscopy & Electrochemistry',
    bookTitle: 'Quantitative Chemical Analysis',
    authors: 'Daniel C. Harris & Charles A. Lucy',
    editionOrYear: 'Analytical Precision Edition',
    level: 'Intermediate',
    description: 'Potentiometry, Nernst equation, UV-Vis spectroscopy, NMR spectroscopy, chromatography, and electrochemical cells.',
    keyTopicsCovered: ['Nernst Equation', 'Beer-Lambert Law (A = epsilon * b * c)', '1H & 13C NMR Shifts', 'Galvanic & Electrolytic Cells', 'Chromatographic Retention'],
    coreTheorems: [
      {
        name: "Nernst Equation",
        statement: "E_cell = E_cell^circ - (RT / (nF)) * ln(Q). At 298 K: E_cell = E_cell^circ - (0.0592 / n) * log_10(Q).",
        intuition: "Quantifies the cell potential under non-standard state concentration conditions.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-anal-1',
        questionText: 'According to the Beer-Lambert Law A = epsilon * b * c, if a solution\'s concentration c is tripled while maintaining identical path length b, what happens to its absorbance A?',
        options: ['Tripled', 'Remains unchanged', 'Decreases by a factor of 3', 'Increases 9-fold'],
        correctAnswerIndex: 0,
        hint: 'Absorbance is strictly linear with respect to analyte concentration.',
        explanation: 'Absorbance A is directly proportional to concentration c. Tripling concentration triples the absorbance value.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Electrochemistry & Spectroscopic Methods
* **Faraday\'s Law of Electrolysis**: Total mass deposited $m = \\frac{Q M}{n F} = \\frac{I t M}{n F}$.
* **Standard Hydrogen Electrode (SHE)**: Assigned $E^\\circ = 0.00 \\text{ V}$ as the universal benchmark for reduction potentials.`,
  },

  // ==========================================
  // BIOLOGY (4 Chapters)
  // ==========================================
  {
    id: 'res-bio-01',
    subjectId: 'biology',
    chapterId: 'bio-ch-cell-bio',
    chapterTitle: 'Cell Biology, Molecular Genetics & Signal Transduction',
    bookTitle: 'Molecular Biology of the Cell',
    authors: 'Bruce Alberts, Rebecca Heald, Alexander Johnson, David Morgan',
    editionOrYear: 'Cellular Foundations Edition',
    level: 'Intermediate',
    description: 'Membrane transport, protein synthesis, DNA replication fork, transcription, translation, and G-protein coupled receptors.',
    keyTopicsCovered: ['DNA Semi-Conservative Replication', 'Central Dogma (Transcription & Translation)', 'GPCR Signal Cascades', 'Mitochondrial ATP Synthase', 'Membrane Fluidity'],
    coreTheorems: [
      {
        name: "Central Dogma of Molecular Biology",
        statement: "Sequential genetic information transfers unidirectionally: DNA -> RNA -> Protein.",
        intuition: "Nucleotide sequence blueprints transcribe into mRNA messenger transcripts before ribosomal translation into functional protein enzymes.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-bio-1',
        questionText: 'During eukaryotic DNA replication, which enzyme synthesizes short RNA primers required for DNA Polymerase to initiate synthesis on both leading and lagging strands?',
        options: ['DNA Ligase', 'DNA Primase', 'Topoisomerase', 'Telomerase'],
        correctAnswerIndex: 1,
        hint: 'DNA polymerases cannot initiate de novo synthesis; they require a free 3\'-OH group provided by RNA.',
        explanation: 'DNA Primase synthesizes an initial ~10-nucleotide RNA primer, providing the free 3\'-hydroxyl group that DNA Polymerase requires for elongation.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Cell Biology & Molecular Genetics
* **Semi-Conservative Replication**: Meselson-Stahl experiment confirmed each daughter DNA duplex contains one intact parental template strand and one newly synthesized strand.
* **Proton Motive Force**: Chemiosmotic coupling across the inner mitochondrial membrane drives ATP synthesis via $F_0 F_1$-ATP synthase rotational catalysis.`,
  },
  {
    id: 'res-bio-02',
    subjectId: 'biology',
    chapterId: 'bio-ch-genetics-evolution',
    chapterTitle: 'Genetics, Evolution & Population Dynamics',
    bookTitle: 'Evolution & Population Genetics',
    authors: 'Douglas J. Futuyma & Mark Kirkpatrick',
    editionOrYear: 'Evolutionary Biology Edition',
    level: 'Intermediate',
    description: 'Mendelian inheritance, epistasis, Hardy-Weinberg equilibrium, genetic drift, natural selection, and phylogenetics.',
    keyTopicsCovered: ['Hardy-Weinberg Equilibrium (p^2 + 2pq + q^2 = 1)', 'Genetic Drift & Bottlenecks', 'Mendelian Segregation', 'Phylogenetic Cladistics', 'Speciation Mechanisms'],
    coreTheorems: [
      {
        name: "Hardy-Weinberg Equilibrium Principle",
        statement: "Allele and genotype frequencies remain constant across generations in a large, randomly mating diploid population with no mutation, migration, or selection: p^2 + 2pq + q^2 = 1.",
        intuition: "Serves as the baseline null model to detect evolutionary forces acting on populations.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-gen-1',
        questionText: 'In a population in Hardy-Weinberg equilibrium, if the frequency of a recessive allele a is q = 0.3, what percentage of the population is heterozygous (Aa)?',
        options: ['9%', '42%', '49%', '21%'],
        correctAnswerIndex: 1,
        hint: 'p = 1 - q = 0.7. Heterozygote frequency is 2*p*q.',
        explanation: 'p = 1 - 0.3 = 0.7. Heterozygote frequency 2pq = 2 * 0.7 * 0.3 = 0.42 = 42%.',
        xpReward: 25,
      },
    ],
    chapterSummaryMarkdown: `### Evolutionary Genetics
* **Genetic Drift**: Random sampling fluctuations in allele frequencies that have pronounced evolutionary effects in small populations.
* **Allopatric vs Sympatric Speciation**: Geographical physical isolation vs ecological reproductive divergence within an overlapping geographic area.`,
  },
  {
    id: 'res-bio-03',
    subjectId: 'biology',
    chapterId: 'bio-ch-biochem-metabolism',
    chapterTitle: 'Biochemistry, Enzymology & Metabolic Pathways',
    bookTitle: 'Lehninger Principles of Biochemistry',
    authors: 'David L. Nelson & Michael M. Cox',
    editionOrYear: 'Biochemical Principles Edition',
    level: 'Advanced',
    description: 'Glycolysis, Krebs cycle, oxidative phosphorylation, enzyme kinetics (Michaelis-Menten), allosteric regulation, and lipid metabolism.',
    keyTopicsCovered: ['Michaelis-Menten Enzyme Kinetics', 'Glycolytic Pathway', 'Citric Acid (Krebs) Cycle', 'Beta-Oxidation of Fatty Acids', 'Allosteric Inhibition'],
    coreTheorems: [
      {
        name: "Michaelis-Menten Equation",
        statement: "v_0 = (V_max * [S]) / (K_m + [S]).",
        intuition: "Relates reaction velocity v_0 to substrate concentration [S]; K_m is the substrate concentration at half-maximal velocity V_max/2.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-biochem-1',
        questionText: 'What is the net yield of ATP produced per molecule of glucose consumed during anaerobic glycolysis (before oxidative phosphorylation)?',
        options: ['1 ATP', '2 ATP', '4 ATP', '32 ATP'],
        correctAnswerIndex: 1,
        hint: '4 gross ATP are generated, but 2 ATP are consumed during the preparatory priming phase.',
        explanation: 'Glycolysis consumes 2 ATP (hexokinase and PFK-1) and produces 4 ATP (substrate-level phosphorylation), giving a net yield of 2 ATP and 2 NADH.',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Enzymology & Cellular Metabolism
* **Competitive Inhibition**: Increases apparent $K_m$ without changing $V_{\\max}$ because inhibitor competes directly with substrate for active site.
* **Krebs Cycle Flux**: Each acetyl-CoA cycle yields $3 \\text{ NADH} + 1 \\text{ FADH}_2 + 1 \\text{ GTP} + 2 \\text{ CO}_2$.`,
  },
  {
    id: 'res-bio-04',
    subjectId: 'biology',
    chapterId: 'bio-ch-physiology-systems',
    chapterTitle: 'Physiology, Neurobiology & Immune Mechanisms',
    bookTitle: 'Guyton and Hall Textbook of Medical Physiology',
    authors: 'John E. Hall & Arthur C. Guyton',
    editionOrYear: 'Human Physiology Edition',
    level: 'Advanced',
    description: 'Action potential propagation, synaptic transmission, cardiac cycle, renal nephron countercurrent multiplier, and adaptive immunity.',
    keyTopicsCovered: ['Action Potential (Hodgkin-Huxley)', 'Synaptic Neurotransmission', 'Renal Nephron Countercurrent', 'Cardiac Action Potentials', 'B-Cell & T-Cell Adaptive Immunity'],
    coreTheorems: [
      {
        name: "Hodgkin-Huxley Action Potential Mechanism",
        statement: "Depolarization past threshold triggers rapid opening of voltage-gated Na+ channels (depolarization spike), followed by inactivation and delayed voltage-gated K+ opening (repolarization).",
        intuition: "Sequential time-dependent ionic conductances generate the all-or-none electrical impulse.",
      },
    ],
    interactiveQuestions: [
      {
        id: 'q-physio-1',
        questionText: 'During a neuronal action potential, what rapid ionic event is directly responsible for the rapid upward depolarization phase from -70 mV toward +30 mV?',
        options: ['Outflow of K+ ions', 'Inflow of Na+ ions through voltage-gated channels', 'Active transport of Cl- ions', 'Efflux of Ca2+ ions'],
        correctAnswerIndex: 1,
        hint: 'Voltage-gated sodium channels open rapidly when membrane threshold (-55 mV) is reached.',
        explanation: 'The fast opening of voltage-gated Na+ channels allows Na+ to rush into the neuron down its electrochemical gradient, causing rapid membrane depolarization toward E_Na (+60 mV).',
        xpReward: 30,
      },
    ],
    chapterSummaryMarkdown: `### Systems Physiology & Neurobiology
* **Refractory Period**: Absolute refractory period is enforced by voltage-gated $Na^+$ channel inactivation gates, preventing reverse signal propagation.
* **Nephron Countercurrent Multiplication**: Loop of Henle creates a hyperosmotic medullary gradient enabling vasopressin (ADH)-mediated water reabsorption in collecting ducts.`,
  },
];
