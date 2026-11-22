// services/marketplaceService.js
const admin = require('../server/services/firebaseAdminCompat.cjs');

let db = null;
function getDb() {
  if (!db) {
    try {
      db = admin.firestore();
    } catch {
      db = null;
    }
  }
  return db;
}

// Runtime fallback state is temporary and is lost when the process restarts.
const localPublishedCourses = new Map(); // courseId -> course
const localEnrollments = new Map(); // uid -> Set<courseId>
const localCourseCounters = new Map(); // courseId -> { enrolledDelta, rating, ratingCount }
const localReviews = new Map(); // courseId -> Array<{ id, userId, userName, rating, comment, createdAt }>
const localCourseProgress = new Map(); // uid -> Map<courseId, { completedLessonIds, quizResults, updatedAt }>

function buildLesson(id, moduleIndex, moduleTitle, title, durationMinutes, summary, contentMarkdown, keyFormulas, quiz) {
  return {
    id,
    moduleIndex,
    moduleTitle,
    title,
    durationMinutes,
    summary,
    contentMarkdown,
    keyFormulas,
    quiz,
  };
}

const SEED_COURSES = [
  {
    id: 'course-calc-mastery',
    title: 'Advanced Multivariable Calculus & Vector Fields',
    description: 'First-principles intuition for Green, Stokes, and Divergence Theorems with worked geometric derivations.',
    subject: 'math',
    tags: ['Calculus', 'Vector Analysis', 'Differential Forms', 'Engineering Math'],
    modules: [
      'Partial Derivatives & Gradients',
      'Multiple Integrals & Jacobians',
      'Line & Surface Integrals',
      'Stokes & Divergence Theorems',
    ],
    lessons: [
      buildLesson(
        'calc-l1',
        0,
        'Partial Derivatives & Gradients',
        'Directional Derivatives & Steepest Ascent',
        25,
        'Why the gradient vector $\\nabla f$ always points perpendicular to level sets toward fastest increase.',
        'For a differentiable scalar field $f(x, y, z)$, linear approximation along unit direction $\\mathbf{u}$ gives $D_{\\mathbf{u}} f = \\nabla f \\cdot \\mathbf{u} = \\|\\nabla f\\| \\cos\\theta$. Maximum growth occurs exclusively when $\\theta = 0$, aligning $\\mathbf{u}$ directly with $\\nabla f$. Moving tangent to a contour $f(x,y)=c$ forces $D_{\\mathbf{u}}f = 0$, proving $\\nabla f$ is orthogonal to level curves.',
        ['$D_{\\mathbf{u}} f = \\nabla f \\cdot \\mathbf{u}$', '$\\nabla f = (\\partial f/\\partial x, \\partial f/\\partial y, \\partial f/\\partial z)$'],
        {
          question: 'Along a smooth level surface $f(x, y, z) = 10$, what is the angle between the gradient $\\nabla f$ (when nonzero) and any tangent vector $\\mathbf{v}$?',
          options: ['0 degrees', '45 degrees', '90 degrees', '180 degrees'],
          correctIndex: 2,
          explanation: 'Because $f$ is constant along every curve lying on the level surface, the directional derivative $D_{\\mathbf{v}} f = \\nabla f \\cdot \\mathbf{v} = 0$, so $\\nabla f$ is orthogonal (90 degrees) to $\\mathbf{v}$.',
        }
      ),
      buildLesson(
        'calc-l2',
        1,
        'Multiple Integrals & Jacobians',
        'Change of Variables & The Jacobian Determinant',
        30,
        'How $dA$ stretches under coordinate mappings like polar, cylindrical, and general curvilinear transformations.',
        'Mapping $(u, v) \\mapsto (x(u,v), y(u,v))$ sends an infinitesimal rectangle $du\\,dv$ into a parallelogram spanned by $\\partial \\mathbf{r}/\\partial u\\, du$ and $\\partial \\mathbf{r}/\\partial v\\, dv$. Its signed area is the 2D cross-product magnitude $|\\det J|\\,du\\,dv$. In polar coordinates $x = r\\cos\\theta, y = r\\sin\\theta$, this yields $|\\det J| = r$.',
        ['$\\iint_R f(x,y)\\,dx\\,dy = \\iint_S f(x(u,v),y(u,v))\\,|\\det J|\\,du\\,dv$', '$dx\\,dy = r\\,dr\\,d\\theta$'],
        {
          question: 'When converting a 3D integral from Cartesian $(x,y,z)$ to spherical $(r, \\theta, \\phi)$ with polar angle $\\phi$ from the positive $z$-axis, what is the volume scaling factor $|\\det J|$?',
          options: ['$r$', '$r^2$', '$r^2 \\sin\\phi$', '$r \\cos\\phi$'],
          correctIndex: 2,
          explanation: 'The three spherical edge lengths are $dr$, $r\\,d\\phi$, and $(r\\sin\\phi)\\,d\\theta$, giving $dV = r^2 \\sin\\phi\\,dr\\,d\\phi\\,d\\theta$.',
        }
      ),
      buildLesson(
        'calc-l3',
        2,
        'Line & Surface Integrals',
        'Conservative Fields & Path Independence',
        35,
        'Connecting $\\int_C \\mathbf{F}\\cdot d\\mathbf{r}$ to potential functions $\\phi$ and zero-curl criteria.',
        'If $\\mathbf{F} = \\nabla \\phi$ on an open connected domain, the Fundamental Theorem for Line Integrals states $\\int_C \\mathbf{F}\\cdot d\\mathbf{r} = \\phi(\\mathbf{b}) - \\phi(\\mathbf{a})$, independent of the path taken between $\\mathbf{a}$ and $\\mathbf{b}$. On simply connected domains, $\\nabla \\times \\mathbf{F} = \\mathbf{0}$ is both necessary and sufficient for conservativity.',
        ['$\\int_C \\nabla \\phi \\cdot d\\mathbf{r} = \\phi(B) - \\phi(A)$', '$\\nabla \\times (\\nabla \\phi) = \\mathbf{0}$'],
        {
          question: 'What is the work $\\oint_C \\mathbf{F}\\cdot d\\mathbf{r}$ around any smooth closed loop $C$ inside a simply connected domain if $\\mathbf{F} = \\nabla(x^2 y + e^z)$?',
          options: ['$0$', '$2\\pi$', 'Depends on the radius of $C$', '$e^z - x^2y$'],
          correctIndex: 0,
          explanation: 'Because $\\mathbf{F}$ is explicitly a gradient field, it is conservative; the integral around any closed loop where start equals end is $\\phi(A) - \\phi(A) = 0$.',
        }
      ),
      buildLesson(
        'calc-l4',
        3,
        'Stokes & Divergence Theorems',
        'Unifying Curl, Flux & Generalized Boundary Integration',
        40,
        'Why boundary circulation equals interior curl flux (Stokes) and closed-surface flux equals interior divergence (Gauss).',
        'Both Green/Stokes and Gauss Divergence Theorems express one unifying geometric principle: summing infinitesimal local rotation (curl) or local expansion (divergence) inside a domain cancels along shared interior edges, leaving only the net contribution at the outer boundary $\\partial M$.',
        ['$\\iint_S (\\nabla \\times \\mathbf{F})\\cdot d\\mathbf{S} = \\oint_{\\partial S} \\mathbf{F}\\cdot d\\mathbf{r}$', '$\\iiint_V (\\nabla \\cdot \\mathbf{F})\\,dV = \\oiint_{\\partial V} \\mathbf{F}\\cdot d\\mathbf{S}$'],
        {
          question: 'For $\\mathbf{F}(x,y,z) = (x, y, z)$, what is the outward flux $\\oiint_S \\mathbf{F}\\cdot d\\mathbf{S}$ across the unit sphere $x^2+y^2+z^2 = 1$?',
          options: ['$\\pi$', '$4\\pi / 3$', '$4\\pi$', '$8\\pi / 3$'],
          correctIndex: 2,
          explanation: '$\\nabla \\cdot \\mathbf{F} = 1+1+1 = 3$. By the Divergence Theorem, the flux is $\\iiint_{B_1} 3\\,dV = 3 \\cdot (\\frac{4}{3}\\pi(1)^3) = 4\\pi$.',
        }
      ),
    ],
    creatorUid: 'creator-dr-elena',
    creatorName: 'Dr. Elena Rostova',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 12,
    difficulty: 'advanced',
    rating: 4.9,
    ratingCount: 142,
    enrolledCount: 1280,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-quantum-mechanics',
    title: 'Quantum Mechanics: From State Vectors to Entanglement',
    description: 'Dirac notation, Hermitian operators, Harmonic Oscillator, and Bell inequality violations explained rigorously.',
    subject: 'physics',
    tags: ['Quantum', 'Linear Algebra', 'Schrodinger Equation', 'Atomic Physics'],
    modules: [
      'Hilbert Spaces & Dirac Bra-Ket Notation',
      'Time Evolution & Schrodinger Equation',
      'Quantum Harmonic Oscillator',
      'Spin, Angular Momentum & Entanglement',
    ],
    lessons: [
      buildLesson(
        'qm-l1',
        0,
        'Hilbert Spaces & Dirac Bra-Ket Notation',
        'Superposition, Inner Products & Born Measurement Rule',
        30,
        'How physical quantum states live in complex inner-product spaces and collapse probabilistically upon measurement.',
        'A normalized state $|\\psi\\rangle = \\sum_n c_n |\\phi_n\\rangle$ expanded in an orthonormal eigenbasis of observable $\\hat{A}$ satisfies $\\sum_n |c_n|^2 = 1$. Measuring $\\hat{A}$ yields eigenvalue $a_n$ with Born probability $P(a_n) = |\\langle \\phi_n | \\psi \\rangle|^2 = |c_n|^2$.',
        ['$|\\psi\\rangle = \\sum_n |\\phi_n\\rangle\\langle \\phi_n | \\psi \\rangle$', '$P(a_n) = |\\langle \\phi_n | \\psi \\rangle|^2$'],
        {
          question: 'Why must physical observable operators $\\hat{A}$ be Hermitian ($\\hat{A}^\\dagger = \\hat{A}$)?',
          options: [
            'So eigenvalues are always negative',
            'So measurement outcomes are real numbers and eigenstates of distinct eigenvalues are orthogonal',
            'So all states travel faster than light',
            'So momentum commutes with position',
          ],
          correctIndex: 1,
          explanation: 'Hermitian operators guarantee real eigenvalues (physical measurements) and an orthogonal complete eigenbasis.',
        }
      ),
      buildLesson(
        'qm-l2',
        1,
        'Time Evolution & Schrodinger Equation',
        'Unitary Evolution & Stationary States',
        35,
        'Deriving time-dependent phase factors $e^{-iE_n t / \\hbar}$ from the Hamiltonian $\\hat{H}$.',
        'For a time-independent Hamiltonian $\\hat{H}|E_n\\rangle = E_n|E_n\\rangle$, the Schrodinger equation $i\\hbar \\frac{d}{dt}|\\psi(t)\\rangle = \\hat{H}|\\psi(t)\\rangle$ evolves each energy eigenstate by unitary operator $\\hat{U}(t) = e^{-i\\hat{H}t/\\hbar}$, preserving total probability $\\langle \\psi(t)|\\psi(t)\\rangle = 1$.',
        ['$i\\hbar \\partial_t |\\psi(t)\\rangle = \\hat{H}|\\psi(t)\\rangle$', '$|\\psi(t)\\rangle = \\sum_n c_n e^{-iE_n t/\\hbar}|E_n\\rangle$'],
        {
          question: 'If a system starts in a single energy eigenstate $|E_2\\rangle$, how does the probability density $|\\psi(x,t)|^2$ evolve over time?',
          options: [
            'It oscillates sinusoidally with frequency $E_2/h$',
            'It decays exponentially',
            'It remains strictly constant in time (stationary state)',
            'It spreads linearly with $t$',
          ],
          correctIndex: 2,
          explanation: 'The overall phase factor $e^{-iE_2 t/\\hbar}$ cancels in $|\\psi(x,t)|^2 = |e^{-iE_2 t/\\hbar}\\psi_2(x)|^2 = |\\psi_2(x)|^2$.',
        }
      ),
      buildLesson(
        'qm-l3',
        2,
        'Quantum Harmonic Oscillator',
        'Ladder Operators & Zero-Point Energy',
        40,
        'Solving the quadratic potential algebraically via creation $\\hat{a}^\\dagger$ and annihilation $\\hat{a}$ operators.',
        'Factoring $\\hat{H} = \\hbar\\omega(\\hat{a}^\\dagger\\hat{a} + \\frac{1}{2})$ avoids messy Hermite polynomial differential equations. Because $\\|\\hat{a}|\\psi_0\\rangle\\|^2 \\ge 0$ demands a lowest state $\\hat{a}|0\\rangle = 0$, the ground state carries nonzero energy $E_0 = \\frac{1}{2}\\hbar\\omega$, required by Heisenberg uncertainty.',
        ['$[\\hat{a}, \\hat{a}^\\dagger] = 1$', '$E_n = \\hbar\\omega(n + \\frac{1}{2})$'],
        {
          question: 'What is the energy gap $\\Delta E = E_{n+1} - E_n$ between adjacent states of a quantum harmonic oscillator?',
          options: ['$\\frac{1}{2}\\hbar\\omega$', '$\\hbar\\omega$', '$n\\hbar\\omega$', '$(n+1)\\hbar\\omega$'],
          correctIndex: 1,
          explanation: 'Harmonic oscillator energy levels are equally spaced by $\\hbar\\omega$ at all quantum numbers $n$.',
        }
      ),
      buildLesson(
        'qm-l4',
        3,
        'Spin, Angular Momentum & Entanglement',
        'Bell States & Non-Factorizable Two-Qubit Systems',
        40,
        'Why entangled pairs like $(|00\\rangle + |11\\rangle)/\\sqrt{2}$ violate classical local realism.',
        'A composite state $|\\Psi\\rangle \\in \\mathcal{H}_A \\otimes \\mathcal{H}_B$ is entangled iff it cannot be factored as $|\\alpha\\rangle_A \\otimes |\\beta\\rangle_B$. Tracing out subsystem B leaves subsystem A in a maximally mixed reduced density matrix $\\rho_A = \\frac{1}{2}I$, even though the global pair is pure.',
        ['$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$', '$|S(\\text{CHSH})| \\le 2\\sqrt{2} > 2$'],
        {
          question: 'Which two-qubit state is a maximally entangled Bell state rather than a separable product state?',
          options: [
            '$\\frac{1}{2}(|00\\rangle + |01\\rangle + |10\\rangle + |11\\rangle)$',
            '$\\frac{1}{\\sqrt{2}}(|00\\rangle + |01\\rangle)$',
            '$\\frac{1}{\\sqrt{2}}(|01\\rangle - |10\\rangle)$',
            '$|10\\rangle$',
          ],
          correctIndex: 2,
          explanation: 'The singlet state $\\frac{1}{\\sqrt{2}}(|01\\rangle - |10\\rangle)$ cannot be factored into $|a\\rangle\\otimes|b\\rangle$, unlike $(|0\\rangle+|1\\rangle)\\otimes(|0\\rangle+|1\\rangle)/2$ or $|0\\rangle\\otimes(|0\\rangle+|1\\rangle)/\\sqrt{2}$.',
        }
      ),
    ],
    creatorUid: 'creator-marcus',
    creatorName: 'Marcus Vance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 16,
    difficulty: 'advanced',
    rating: 4.95,
    ratingCount: 98,
    enrolledCount: 950,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-organic-mechanisms',
    title: 'Organic Chemistry: Curved Arrow Reaction Mechanisms',
    description: 'Master nucleophilic attacks, carbocation rearrangements, and retrosynthetic analysis without rote memorization.',
    subject: 'chemistry',
    tags: ['Organic', 'Mechanisms', 'Stereochemistry', 'Synthesis'],
    modules: [
      'Electron Pushing & Acid-Base Equilibria',
      'SN1, SN2, E1 & E2 Competition',
      'Carbonyl Chemistry & Enolates',
      'Multi-Step Retrosynthesis',
    ],
    lessons: [
      buildLesson(
        'org-l1',
        0,
        'Electron Pushing & Acid-Base Equilibria',
        'ARIO Principle & Curved Arrow Conventions',
        25,
        'Predicting conjugate base stability using Atom, Resonance, Induction, and Orbital effects.',
        'Curved arrows always track the flow of electron pairs from high electron density (nucleophile/HOMO) toward electron-deficient centers (electrophile/LUMO). Acid-base equilibrium favors the side with the weaker conjugate base, evaluated via Atom electronegativity/size, Resonance delocalization, Inductive pull, and s-character Orbital hybridization.',
        ['$\\Delta pK_a = pK_a(\\text{conjugate acid}) - pK_a(\\text{acid})$', '$sp > sp^2 > sp^3$ acidity'],
        {
          question: 'Which factor primarily explains why acetic acid ($pK_a \\approx 4.8$) is far more acidic than ethanol ($pK_a \\approx 16$)?',
          options: [
            'Steric hindrance on the methyl group',
            'Resonance delocalization of negative charge across two oxygen atoms in the carboxylate',
            'Lower molar mass of acetic acid',
            'Stronger O-H bond energy',
          ],
          correctIndex: 1,
          explanation: 'Deprotonating acetic acid yields an acetate anion stabilized equally across two resonance structures on electronegative oxygen atoms.',
        }
      ),
      buildLesson(
        'org-l2',
        1,
        'SN1, SN2, E1 & E2 Competition',
        'Backside Attack Stereochemistry & Leaving Group Kinetics',
        35,
        'Resolving substitution vs elimination pathways using substrate branching, base strength, and solvent polarity.',
        'SN2 proceeds in one concerted step via 180-degree backside attack, inverting stereocenters (Walden inversion) and favoring primary/methyl halides in polar aprotic solvents. Conversely, tertiary halides with strong bulky bases (e.g., t-BuO-) undergo concerted anti-periplanar E2 elimination to form the Hoffman alkene.',
        ['Rate(SN2) $= k[R-X][Nu]$', 'Rate(SN1) $= k[R-X]$'],
        {
          question: 'Treating $(R)$-2-bromobutane with $\\text{NaCN}$ in polar aprotic DMSO primarily yields which organic product?',
          options: [
            'Racemic 2-butanenitrile via SN1',
            '$(S)$-2-methylbutanenitrile with inversion of configuration via SN2',
            '1-butene exclusively via E1',
            'No reaction occurs',
          ],
          correctIndex: 1,
          explanation: 'Cyanide ($\text{CN}^-$) is a strong, non-bulky nucleophile in polar aprotic DMSO; it performs concerted SN2 backside attack, cleanly inverting $(R)$ to $(S)$.',
        }
      ),
      buildLesson(
        'org-l3',
        2,
        'Carbonyl Chemistry & Enolates',
        'Aldol Addition & Alpha-Carbon Reactivity',
        30,
        'How carbonyl polarization makes both the electrophilic carbonyl carbon and acidic alpha-protons reactive.',
        'Resonance stabilization of the conjugate enolate lowers alpha-C-H $pK_a$ from ~50 down to ~19-20 in aldehydes/ketones. Acting as a carbon nucleophile, the enolate attacks a second carbonyl carbon to forge a carbon-carbon bond in the Aldol reaction.',
        ['$\\alpha$-CH $pK_a \\approx 19$ (ketones)', '$C=O \\leftrightarrow C^+-O^-$ dipole'],
        {
          question: 'Why does heating an aldol addition $\\beta$-hydroxy ketone with base or acid readily drive dehydration to an $\\alpha,\\beta$-unsaturated ketone?',
          options: [
            'To escape steric crowding at the carbonyl oxygen',
            'Formation of a conjugated $\\pi$ system lowers overall molecular energy',
            'Carbonyl carbons become sp3 hybridized',
            'Water acts as a strong oxidant',
          ],
          correctIndex: 1,
          explanation: 'Extended conjugation between the $C=C$ double bond and $C=O$ carbonyl stabilizes the $\\alpha,\\beta$-unsaturated product thermodynamically.',
        }
      ),
      buildLesson(
        'org-l4',
        3,
        'Multi-Step Retrosynthesis',
        'Disconnection Strategy & Protecting Group Logic',
        35,
        'Working backward from target carbon skeletons to commercially available starting materials.',
        'Effective retrosynthesis identifies strategic bonds near functional groups (disconnections) to create known synthons (e.g., Grignard $R^-$ + ketone $C^+$). Chemoselective protecting groups such as cyclic acetals shield ketones temporarily when stronger nucleophiles must react elsewhere first.',
        ['Target $\\Rightarrow$ Synthons $\\Rightarrow$ Reagents', 'Diol + $H^+$ protects ketones as acetals'],
        {
          question: 'Which protecting group shields an aldehyde selectively against strong basic nucleophiles like Grignard reagents ($R\\text{MgBr}$)?',
          options: [
            'Dilute aqueous $\\text{HCl}$',
            'Cyclic acetal formed with ethylene glycol and catalytic acid',
            '$\\text{NaBH}_4$ reduction',
            'Permanganate oxidation',
          ],
          correctIndex: 1,
          explanation: 'Acetals are stable to strong bases and Grignard nucleophiles and can be hydrolyzed cleanly back to the carbonyl under mild aqueous acid.',
        }
      ),
    ],
    creatorUid: 'creator-priya',
    creatorName: 'Priya Sharma',
    thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 10,
    difficulty: 'intermediate',
    rating: 4.85,
    ratingCount: 76,
    enrolledCount: 710,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-algorithms-dp',
    title: 'Algorithms, Graph Theory & Dynamic Programming',
    description: 'Build systematic mastery over recurrence relations, shortest paths, network flow, and NP-completeness proofs.',
    subject: 'cs',
    tags: ['Algorithms', 'Dynamic Programming', 'Graphs', 'Complexity'],
    modules: [
      'Asymptotics & Divide-and-Conquer',
      'Greedy Invariants & Shortest Paths',
      'Dynamic Programming State Compression',
      'Max-Flow Min-Cut & Reductions',
    ],
    lessons: [
      buildLesson(
        'alg-l1',
        0,
        'Asymptotics & Divide-and-Conquer',
        'Master Theorem & Recurrence Trees',
        30,
        'Bounding recursive algorithms $T(n) = aT(n/b) + f(n)$ tightly across all three regimes.',
        'A divide-and-conquer algorithm splits an input of size $n$ into $a$ subproblems of size $n/b$ with combine cost $f(n)$. Comparing the leaf count weight $n^{\\log_b a}$ against $f(n)$ immediately decides whether work concentrates at leaves, equally across $\\log_b n$ levels, or at the root.',
        ['$T(n) = aT(n/b) + f(n)$', 'MergeSort: $T(n)=2T(n/2)+\\Theta(n) \\implies \\Theta(n\\log n)$'],
        {
          question: 'Using the Master Theorem, what is the tight asymptotic bound for $T(n) = 4T(n/2) + n$?',
          options: ['$\\Theta(n)$', '$\\Theta(n\\log n)$', '$\\Theta(n^2)$', '$\\Theta(n^2 \\log n)$'],
          correctIndex: 2,
          explanation: 'Here $n^{\\log_2 4} = n^2$, which polynomially dominates $f(n) = n$, placing it in Case 1: $T(n) = \\Theta(n^2)$.',
        }
      ),
      buildLesson(
        'alg-l2',
        1,
        'Greedy Invariants & Shortest Paths',
        'Dijkstra Relaxation & Exchange Arguments',
        35,
        'Proving why non-negative edge weights allow greedy settling of minimum-distance vertices.',
        'Dijkstra maintains a frontier of unvisited vertices via a min-priority queue. When vertex $u$ with smallest tentative distance $d[u]$ is extracted, no remaining path through another unvisited vertex $w$ ($d[w] \\ge d[u]$) can reach $u$ strictly faster as long as every edge weight $w(e) \\ge 0$.',
        ['$O((V + E)\\log V)$ with binary heap', 'Requires $w(u,v) \\ge 0$'],
        {
          question: 'Why can Dijkstra’s algorithm produce an incorrect shortest path when graphs contain negative edge weights?',
          options: [
            'Priority queues overflow on negative integers',
            'A previously settled vertex might later be improved via a negative-weight detour',
            'Graphs with negative weights cannot have topological orders',
            'Adjacency lists ignore negative weights',
          ],
          correctIndex: 1,
          explanation: 'Dijkstra assumes path lengths are monotonically non-decreasing; a negative edge breaks the settled-vertex invariant.',
        }
      ),
      buildLesson(
        'alg-l3',
        2,
        'Dynamic Programming State Compression',
        'Optimal Substructure, DAG Transitions & Bitmask DP',
        40,
        'Turning exponential recursion into polynomial-time table transitions by eliminating redundant state.',
        'Dynamic programming requires two conditions: optimal substructure and overlapping subproblems. Writing explicit state definitions (e.g., $dp[mask][last]$ for Traveling Salesperson over subsets) exposes an implicit DAG over subproblems solvable bottom-up in $O(n^2 2^n)$ rather than $O(n!)$.',
        ['TSP Bitmask: $dp[S][v] = \\min_{u \\in S\\setminus\\{v\\}} (dp[S\\setminus\\{v\\}][u] + w(u,v))$', 'Rolling array compresses space from $O(N \\cdot W)$ to $O(W)$'],
        {
          question: 'In the 0/1 Knapsack DP transition $dp[i][w] = \\max(dp[i-1][w], dp[i-1][w-w_i] + v_i)$, why must we iterate capacity $w$ downward when using a single 1D array $dp[w]$?',
          options: [
            'To improve CPU cache prefetching only',
            'To prevent the same item $i$ from being used multiple times in the same row',
            'Because negative weights require descending order',
            'It is optional and gives identical results in either direction',
          ],
          correctIndex: 1,
          explanation: 'Iterating $w$ from $W$ down to $w_i$ ensures $dp[w - w_i]$ still holds the value from row $i-1$ rather than the already updated item-$i$ state (which would be Unbounded Knapsack).',
        }
      ),
      buildLesson(
        'alg-l4',
        3,
        'Max-Flow Min-Cut & Reductions',
        'Residual Networks, Ford-Fulkerson & Polynomial Reductions',
        40,
        'Using augmenting paths and backward residual edges to certify maximum flow and prove NP-completeness.',
        'The Max-Flow Min-Cut Theorem guarantees that when no $s\\text{-}t$ augmenting path exists in the residual graph $G_f$, the current flow value equals the minimum capacity across all $s\\text{-}t$ cuts. Backward residual edges let algorithms undo earlier greedy flow choices safely.',
        ['$\\max |f| = \\min_{S,T} c(S, T)$', '$A \\le_P B$: $B$ is at least as hard as $A$'],
        {
          question: 'When proving a new decision problem $X$ is NP-complete (once $X \\in \\text{NP}$), which polynomial-time reduction direction is required?',
          options: [
            'Reduce $X$ to a known NP-complete problem $K$ ($X \\le_P K$)',
            'Reduce a known NP-complete problem $K$ to $X$ ($K \\le_P X$)',
            'Reduce $X$ to Sorting ($X \\le_P \\text{Sort}$)',
            'Prove $X$ takes exponential space',
          ],
          correctIndex: 1,
          explanation: 'Reducing a known NP-complete problem $K$ into $X$ ($K \\le_P X$) shows that any polynomial solver for $X$ would solve $K$ in polynomial time too.',
        }
      ),
    ],
    creatorUid: 'creator-kenji',
    creatorName: 'Prof. Kenji Takahashi',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 14,
    difficulty: 'intermediate',
    rating: 4.9,
    ratingCount: 184,
    enrolledCount: 1640,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-molecular-biology',
    title: 'Molecular Biology & Cellular Gene Regulation',
    description: 'Explore CRISPR mechanisms, chromatin epigenetics, metabolic pathways, and signal transduction cascades.',
    subject: 'biology',
    tags: ['Genetics', 'CRISPR', 'Biochemistry', 'Cell Biology'],
    modules: [
      'DNA Replication & Repair Fidelity',
      'Transcription & Epigenetic Control',
      'Metabolic Flux & ATP Synthesis',
      'CRISPR-Cas9 Engineering',
    ],
    lessons: [
      buildLesson(
        'bio-l1',
        0,
        'DNA Replication & Repair Fidelity',
        '5’ to 3’ Polymerase Directionality & Okazaki Fragments',
        25,
        'How cells replicate antiparallel strands continuously on the leading strand and discontinuously on the lagging strand.',
        'DNA Polymerases synthesize exclusively in the 5’ to 3’ direction by attacking incoming dNTP 5’-triphosphates with the free 3’-OH group. Because the two template strands are antiparallel, the lagging strand is synthesized in short Okazaki fragments primed by primase and sealed by DNA ligase.',
        ['$5\' \\rightarrow 3\'$ polymerization + $3\' \\rightarrow 5\'$ exonuclease proofreading', 'Fidelity $\\approx 1$ error per $10^9$ bp after mismatch repair'],
        {
          question: 'Why does DNA synthesis require a free 3’-hydroxyl ($\\text{-OH}$) primer and proceed 5’ to 3’?',
          options: [
            '3’-OH breaks hydrogen bonds between A and T',
            'Nucleophilic attack by the 3’-OH on the incoming dNTP alpha-phosphate powers phosphodiester bond formation',
            'RNA polymerase cannot read 3’ to 5’ templates',
            'Telomerase prevents 3’ growth',
          ],
          correctIndex: 1,
          explanation: 'If synthesis ran 3’ to 5’, proofreading excision of a mismatched nucleotide would leave a 5’-monophosphate with no triphosphate energy source to continue elongation.',
        }
      ),
      buildLesson(
        'bio-l2',
        1,
        'Transcription & Epigenetic Control',
        'Histone Acetylation, Chromatin Accessibility & Promoters',
        30,
        'How reversible histone modifications toggle gene expression without mutating the DNA sequence.',
        'DNA wraps tightly around positively charged lysine-rich histone octamers. Histone acetyltransferases (HATs) neutralize lysine’s positive charge by adding acetyl groups, loosening euchromatin so transcription factors and RNA Polymerase II can bind promoter TATA boxes and enhancers.',
        ['HAT $\\rightarrow$ acetylation $\\rightarrow$ open euchromatin', 'HDAC $\\rightarrow$ deacetylation $\\rightarrow$ condensed heterochromatin'],
        {
          question: 'What is the primary biochemical effect of histone lysine acetylation on chromatin structure?',
          options: [
            'Adds positive charges to pull DNA tighter',
            'Neutralizes positive lysine charges, weakening electrostatic attraction to negatively charged DNA backbones',
            'Cleaves DNA into fragments',
            'Degrades messenger RNA transcripts',
          ],
          correctIndex: 1,
          explanation: 'Neutralizing lysine reduces electrostatic attraction to the negatively charged phosphate backbone of DNA, opening chromatin for transcription.',
        }
      ),
      buildLesson(
        'bio-l3',
        2,
        'Metabolic Flux & ATP Synthesis',
        'Chemiosmotic Proton Gradient & ATP Synthase Rotary Catalysis',
        30,
        'Connecting NADH oxidation in the electron transport chain to oxidative phosphorylation.',
        'Electrons from NADH and $\\text{FADH}_2$ power Complexes I, III, and IV to pump protons into the mitochondrial intermembrane space. The resulting electrochemical proton-motive force drives protons back through the $F_0 F_1$ ATP synthase rotor, inducing conformational changes that phosphorylate ADP.',
        ['$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\rightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\sim 30\\text{–}32\\text{ ATP}$', 'Final electron acceptor: $\\text{O}_2$'],
        {
          question: 'If a protonophore uncoupler makes the inner mitochondrial membrane freely permeable to $\\text{H}^+$ ions, what happens immediately to ATP synthesis and $\\text{O}_2$ consumption?',
          options: [
            'Both ATP synthesis and $\\text{O}_2$ consumption stop completely',
            'ATP synthesis drops sharply while $\\text{O}_2$ consumption and heat generation increase',
            'ATP synthesis doubles',
            'Glycolysis halts immediately',
          ],
          correctIndex: 1,
          explanation: 'Dissipating the proton gradient removes back-pressure on the electron transport chain, causing rapid NADH oxidation and O2 reduction without generating ATP.',
        }
      ),
      buildLesson(
        'bio-l4',
        3,
        'CRISPR-Cas9 Engineering',
        'PAM Recognition, Guide RNA Pairing & NHEJ vs HDR',
        35,
        'How bacterial adaptive immunity was repurposed into programmable double-strand DNA editing.',
        'Cas9 scans DNA for a short Protospacer Adjacent Motif (PAM, e.g., 5’-NGG-3’ for SpCas9) before testing complementarity against its 20-nt sgRNA. A matching target activates RuvC and HNH nuclease domains to create a double-strand break, repaired via fast knockout-prone NHEJ or templated HDR.',
        ['SpCas9 PAM: $5\'\\text{-NGG-}3\'$', 'NHEJ $\\rightarrow$ indels (knockout) | HDR $\\rightarrow$ precise insertion'],
        {
          question: 'Why does Cas9 require a PAM sequence (such as $5\'\\text{-NGG-}3\'$) adjacent to the target DNA even when the guide RNA matches perfectly?',
          options: [
            'To synthesize the template strand',
            'To prevent Cas9 from cleaving its own host CRISPR array in bacteria and initiate local DNA unwinding',
            'To convert RNA directly into protein',
            'To duplicate the plasmid vector',
          ],
          correctIndex: 1,
          explanation: 'Because the host CRISPR locus lacks PAM motifs, PAM recognition prevents self-cleavage autoimmunity and triggers initial DNA strand separation.',
        }
      ),
    ],
    creatorUid: 'creator-amara',
    creatorName: 'Dr. Amara Okafor',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 9,
    difficulty: 'beginner',
    rating: 4.8,
    ratingCount: 64,
    enrolledCount: 590,
    price: 0,
    status: 'published',
  },
  {
    id: 'course-linear-algebra-ml',
    title: 'Linear Algebra for Machine Learning & Optimization',
    description: 'Eigenvalues, SVD, matrix calculus, and convex gradient descent explained visually for modern AI engineers.',
    subject: 'math',
    tags: ['Linear Algebra', 'SVD', 'Optimization', 'Machine Learning'],
    modules: [
      'Vector Spaces & Orthogonal Projections',
      'Eigenvalues & Spectral Theorem',
      'Singular Value Decomposition',
      'Convex Optimization & Hessians',
    ],
    lessons: [
      buildLesson(
        'la-l1',
        0,
        'Vector Spaces & Orthogonal Projections',
        'Least Squares Regression via Column Space Geometry',
        30,
        'Solving overdetermined linear systems $A\\mathbf{x} \\approx \\mathbf{b}$ by projecting onto $\\text{Col}(A)$.',
        'When $\\mathbf{b} \\notin \\text{Col}(A)$, the closest point $\\hat{\\mathbf{b}} = A\\hat{\\mathbf{x}}$ minimizes $\\|A\\mathbf{x} - \\mathbf{b}\\|_2$ precisely when the error residual $\\mathbf{b} - A\\hat{\\mathbf{x}}$ is orthogonal to every column of $A$, yielding the normal equations $A^T A \\hat{\\mathbf{x}} = A^T \\mathbf{b}$.',
        ['$A^T(A\\hat{\\mathbf{x}} - \\mathbf{b}) = \\mathbf{0}$', '$\\hat{\\mathbf{x}} = (A^T A)^{-1} A^T \\mathbf{b}$'],
        {
          question: 'Geometrically, why does the least-squares residual vector $\\mathbf{r} = \\mathbf{b} - A\\hat{\\mathbf{x}}$ lie in the left nullspace $N(A^T)$?',
          options: [
            'Because $A$ must always be square and invertible',
            'Because the shortest vector from $\\mathbf{b}$ to $\\text{Col}(A)$ must be perpendicular to every column in $A$',
            'Because $\\mathbf{b}$ has zero norm',
            'Because $A^T A = I$ for every matrix',
          ],
          correctIndex: 1,
          explanation: 'Orthogonality to $\\text{Col}(A)$ means $A^T \\mathbf{r} = \\mathbf{0}$, which by definition places $\\mathbf{r}$ in $N(A^T)$.',
        }
      ),
      buildLesson(
        'la-l2',
        1,
        'Eigenvalues & Spectral Theorem',
        'Diagonalization, PCA Covariance & Symmetric Matrices',
        35,
        'Why symmetric covariance matrices $C = \\frac{1}{n}X^T X$ guarantee real eigenvalues and orthogonal principal axes.',
        'For any real symmetric matrix $S = S^T$, the Spectral Theorem guarantees $S = Q \\Lambda Q^T$ where $Q$ is orthogonal ($Q^T Q = I$) and $\\Lambda$ is real diagonal. In Principal Component Analysis (PCA), the eigenvector with largest eigenvalue maximizes projected dataset variance.',
        ['$S = Q\\Lambda Q^T$', '$\\text{Var}(\\mathbf{u}^T X) = \\mathbf{u}^T C \\mathbf{u}$'],
        {
          question: 'For a centered dataset covariance matrix $C = \\frac{1}{n} X^T X$, what property is guaranteed for every eigenvalue $\\lambda_i$?',
          options: [
            'All eigenvalues are purely imaginary',
            'All eigenvalues are real and non-negative ($\\lambda_i \\ge 0$)',
            'Eigenvalues sum to 1 always',
            'No eigenvalues can equal zero',
          ],
          correctIndex: 1,
          explanation: 'Because $C$ is symmetric positive semidefinite ($\\mathbf{u}^T C \\mathbf{u} = \\frac{1}{n}\\|X\\mathbf{u}\\|_2^2 \\ge 0$), its eigenvalues are always real and $\\ge 0$.',
        }
      ),
      buildLesson(
        'la-l3',
        2,
        'Singular Value Decomposition',
        'Low-Rank Compression, Eckart-Young & Pseudoinverses',
        35,
        'Decomposing any rectangular matrix $A \\in \\mathbb{R}^{m \\times n}$ into rotation, scaling, and rotation.',
        'Every matrix admits $A = U \\Sigma V^T$, connecting input orthonormal directions $V$ to output directions $U$ scaled by non-negative singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge 0$. Keeping only the top $k$ singular triplets produces the provably best rank-$k$ approximation in Frobenius and spectral norm.',
        ['$A = \\sum_{i=1}^r \\sigma_i \\mathbf{u}_i \\mathbf{v}_i^T$', '$A^+ = V \\Sigma^+ U^T$'],
        {
          question: 'If an $m \\times n$ weight matrix $A$ is truncated to its top $k$ singular values, what is the storage cost of its compressed rank-$k$ representation?',
          options: [
            '$mn$ floats',
            '$k(m + n + 1)$ floats',
            '$k^2$ floats',
            '$m^2 + n^2$ floats',
          ],
          correctIndex: 1,
          explanation: 'Storing $k$ columns of $U$ ($mk$), $k$ rows of $V^T$ ($nk$), and $k$ singular values requires $k(m + n + 1)$ numbers — the foundation of LoRA and matrix compression.',
        }
      ),
      buildLesson(
        'la-l4',
        3,
        'Convex Optimization & Hessians',
        'Condition Numbers, Step Sizes & Newton Curvature',
        40,
        'How Hessian eigenvalues dictate gradient descent speed and optimal learning rates $\\eta < 2/L$.',
        'For an $L$-smooth convex loss $f$, Taylor’s second-order bound shows gradient descent $w_{t+1} = w_t - \\eta \\nabla f(w_t)$ decreases loss monotonically when $0 < \\eta < 2/L$, where $L = \\lambda_{\\max}(H)$. High condition numbers $\\kappa = \\lambda_{\\max}/\\lambda_{\\min}$ create narrow valleys cured by momentum or preconditioning.',
        ['$w_{t+1} = w_t - \\eta \\nabla f(w_t)$', '$\\kappa(H) = \\lambda_{\\max}(H) / \\lambda_{\\min}(H)$'],
        {
          question: 'What happens to vanilla gradient descent on a quadratic bowl when the learning rate $\\eta$ exceeds $2 / \\lambda_{\\max}(H)$?',
          options: [
            'It converges exponentially faster',
            'Iterates overshoot and diverge along the sharpest curvature eigenvector',
            'The Hessian automatically scales itself down',
            'It reaches zero error in 1 step',
          ],
          correctIndex: 1,
          explanation: 'Along the largest curvature direction $\\lambda_{\\max}$, the update multiplier is $|1 - \\eta\\lambda_{\\max}|$; when $\\eta > 2/\\lambda_{\\max}$, this multiplier exceeds $1$, causing oscillations to explode.',
        }
      ),
    ],
    creatorUid: 'creator-dr-elena',
    creatorName: 'Dr. Elena Rostova',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    totalLessons: 4,
    totalModules: 4,
    estimatedHours: 11,
    difficulty: 'beginner',
    rating: 4.92,
    ratingCount: 215,
    enrolledCount: 1890,
    price: 0,
    status: 'published',
  },
];

function findCourseInMemory(courseId) {
  return localPublishedCourses.get(courseId) || SEED_COURSES.find((c) => c.id === courseId) || null;
}

function buildGeneratedLessons(course) {
  if (Array.isArray(course.lessons) && course.lessons.length > 0) return course.lessons;
  const modules = Array.isArray(course.modules) && course.modules.length > 0
    ? course.modules
    : ['Core Foundations', 'Applied Problem Solving'];
  return modules.map((modTitle, idx) =>
    buildLesson(
      `${course.id}-l${idx + 1}`,
      idx,
      String(modTitle),
      `${String(modTitle)}: Guided Walkthrough`,
      20,
      `Structured exploration of ${String(modTitle)} within ${course.title}.`,
      course.description || `Study module ${idx + 1} focusing on ${String(modTitle)}.`,
      course.tags?.slice(0, 2) || [course.subject?.toUpperCase() || 'STEM'],
      {
        question: `Which statement best summarizes the goal of module "${String(modTitle)}"?`,
        options: [
          `Build intuition and verify key principles of ${String(modTitle)}`,
          'Skip foundational definitions and guess results',
          'Ignore boundary conditions when solving problems',
          'Avoid checking units and dimensional consistency',
        ],
        correctIndex: 0,
        explanation: `Mastering ${String(modTitle)} centers on rigorous definitions, dimensional checks, and first-principles problem solving.`,
      }
    )
  );
}

function applyLocalStats(course) {
  const stats = localCourseCounters.get(course.id);
  const normalized = {
    ...course,
    lessons: buildGeneratedLessons(course),
  };
  normalized.totalLessons = normalized.lessons.length;
  if (!stats) return normalized;
  return {
    ...normalized,
    enrolledCount: (normalized.enrolledCount || 0) + (stats.enrolledDelta || 0),
    rating: stats.rating ?? normalized.rating,
    ratingCount: stats.ratingCount ?? normalized.ratingCount,
  };
}

/**
 * Publish only after the Firestore transaction commits.
 */
async function publishCourse(uid, courseId, courseData) {
  const existingLocal = localPublishedCourses.get(courseId);
  if (existingLocal && existingLocal.creatorUid !== uid) {
    const error = new Error('You cannot publish another creator’s course.');
    error.statusCode = 403;
    throw error;
  }

  const modules = Array.isArray(courseData.modules) && courseData.modules.length > 0
    ? courseData.modules.map((m) => String(m).trim()).filter(Boolean)
    : ['Core Foundations', 'Worked Examples & Verification'];

  const lessons = Array.isArray(courseData.lessons) && courseData.lessons.length > 0
    ? courseData.lessons.map((l, idx) => ({
        id: String(l.id || `${courseId}-l${idx + 1}`),
        moduleIndex: Number.isInteger(l.moduleIndex) ? l.moduleIndex : idx,
        moduleTitle: String(l.moduleTitle || modules[idx % modules.length] || `Module ${idx + 1}`),
        title: String(l.title || `Lesson ${idx + 1}`).trim(),
        durationMinutes: Number(l.durationMinutes) || 20,
        summary: String(l.summary || '').trim(),
        contentMarkdown: String(l.contentMarkdown || l.summary || '').trim(),
        keyFormulas: Array.isArray(l.keyFormulas) ? l.keyFormulas.map(String) : [],
        quiz: l.quiz && typeof l.quiz.question === 'string' && Array.isArray(l.quiz.options) && l.quiz.options.length >= 2
          ? {
              question: String(l.quiz.question),
              options: l.quiz.options.map(String),
              correctIndex: Math.max(0, Math.min(l.quiz.options.length - 1, Number(l.quiz.correctIndex) || 0)),
              explanation: String(l.quiz.explanation || 'Review the lesson intuition and key formula above.'),
            }
          : buildGeneratedLessons({ id: courseId, title: courseData.title, modules: [modules[idx % modules.length]], subject: courseData.subject })[0].quiz,
      }))
    : buildGeneratedLessons({
        id: courseId,
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        subject: courseData.subject.trim().toLowerCase(),
        modules,
        tags: courseData.tags || [],
      });

  const baseCourse = {
    id: courseId,
    title: courseData.title.trim(),
    description: courseData.description.trim(),
    subject: courseData.subject.trim().toLowerCase(),
    tags: Array.isArray(courseData.tags) ? courseData.tags : [],
    modules,
    lessons,
    creatorUid: uid,
    creatorName: courseData.creatorName || 'Scholar Educator',
    thumbnailUrl: courseData.thumbnailUrl || null,
    totalLessons: lessons.length,
    totalModules: modules.length,
    estimatedHours: Number(courseData.estimatedHours) || Math.max(2, lessons.length * 2),
    difficulty: (courseData.difficulty || 'beginner').toLowerCase(),
    price: Number(courseData.price) || 0,
    rating: 0,
    ratingCount: 0,
    enrolledCount: 0,
    status: 'published',
    publishedAt: existingLocal?.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const firestore = getDb();
  if (!firestore) {
    const error = new Error('Publishing is unavailable until persistent storage is configured.');
    error.statusCode = 503;
    throw error;
  }
  {
    try {
      const marketplaceRef = firestore.collection('marketplace').doc(courseId);
      const userCourseRef = firestore.collection('users').doc(uid).collection('courses').doc(courseId);
      await firestore.runTransaction(async (transaction) => {
        const existing = await transaction.get(marketplaceRef);
        if (existing.exists && existing.data().creatorUid !== uid) {
          const error = new Error('You cannot publish another creator’s course.');
          error.statusCode = 403;
          throw error;
        }
        const payload = {
          ...baseCourse,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!existing.exists) {
          payload.publishedAt = admin.firestore.FieldValue.serverTimestamp();
        } else {
          // Counters and initial publication time are server-owned.
          const current = existing.data();
          baseCourse.rating = current.rating ?? 0;
          baseCourse.ratingCount = current.ratingCount ?? 0;
          baseCourse.enrolledCount = current.enrolledCount ?? 0;
          baseCourse.publishedAt = current.publishedAt || baseCourse.publishedAt;
          delete payload.rating;
          delete payload.ratingCount;
          delete payload.enrolledCount;
          delete payload.publishedAt;
        }
        transaction.set(marketplaceRef, payload, { merge: true });
        transaction.set(
          userCourseRef,
          { status: 'published', publishedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      });
    } catch (err) {
      if (err?.statusCode === 403) throw err;
      const error = new Error('Publishing is temporarily unavailable.');
      error.statusCode = 503;
      throw error;
    }
  }

  return baseCourse;
}

/**
 * Search marketplace with filters
 */
async function searchCourses({ query, subject, difficulty, sort, limit } = {}) {
  const firestore = getDb();
  let courses = [];
  let fetchedFromFirestore = false;
  const requestedLimit = Number(limit);
  const pageSize = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 24;

  if (firestore) {
    try {
      let q = firestore.collection('marketplace').where('status', '==', 'published');
      if (subject && subject !== 'all' && subject !== '') {
        q = q.where('subject', '==', subject.toLowerCase());
      }
      if (difficulty && difficulty !== 'all' && difficulty !== '') {
        q = q.where('difficulty', '==', difficulty.toLowerCase());
      }
      const snap = await q.limit(pageSize).get();
      courses = snap.docs.map((d) => applyLocalStats({ ...d.data(), id: d.id })).filter((c) => c.status === 'published');
      fetchedFromFirestore = true;
    } catch {
      fetchedFromFirestore = false;
    }
  }

  // Show the illustrative sample catalog only when Firestore is unavailable.
  // Never blend samples into a successful query as though they were real courses.
  const mergedMap = new Map();
  if (!fetchedFromFirestore) for (const c of SEED_COURSES) mergedMap.set(c.id, applyLocalStats(c));
  for (const c of courses) {
    const existing = mergedMap.get(c.id);
    mergedMap.set(c.id, existing ? { ...existing, ...c, lessons: c.lessons?.length ? c.lessons : existing.lessons } : applyLocalStats(c));
  }
  for (const [id, c] of localPublishedCourses.entries()) {
    mergedMap.set(id, applyLocalStats(c));
  }

  let list = Array.from(mergedMap.values());

  if (subject && subject !== 'all') {
    const targetSubj = subject.trim().toLowerCase();
    list = list.filter((c) => {
      const s = (c.subject || '').toLowerCase();
      if (targetSubj === 'programming') return s === 'cs' || s === 'programming';
      if (targetSubj === 'science') return s === 'physics' || s === 'chemistry' || s === 'biology' || s === 'science';
      return s === targetSubj;
    });
  }

  if (difficulty && difficulty !== 'all') {
    const targetDiff = difficulty.trim().toLowerCase();
    list = list.filter((c) => (c.difficulty || '').toLowerCase() === targetDiff);
  }

  if (query && typeof query === 'string' && query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.title?.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery) ||
        c.creatorName?.toLowerCase().includes(lowerQuery) ||
        c.subject?.toLowerCase().includes(lowerQuery) ||
        c.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  if (sort === 'popular') {
    list = [...list].sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
  } else if (sort === 'rating') {
    list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    list = [...list].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  }

  return {
    courses: list.slice(0, pageSize),
    catalogSource: fetchedFromFirestore ? 'firebase' : 'sample',
  };
}

/**
 * Get full course details (including interactive lessons)
 */
async function getCourseDetails(courseId, uid = null) {
  let course = findCourseInMemory(courseId);
  const firestore = getDb();
  if (!course && firestore) {
    try {
      const snap = await firestore.collection('marketplace').doc(courseId).get();
      if (snap.exists) {
        course = { id: snap.id, ...snap.data() };
      }
    } catch {
      // Ignore fallback miss
    }
  }
  if (!course || course.status !== 'published') {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }

  const enriched = applyLocalStats(course);
  const progress = uid ? await getUserCourseProgress(uid, courseId, enriched.lessons.length) : null;
  return { course: enriched, progress };
}

/**
 * Get user enrolled course IDs
 */
async function getUserEnrollments(uid) {
  const enrolled = new Set(localEnrollments.get(uid) || []);
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore.collection('users').doc(uid).collection('enrollments').get();
      snap.docs.forEach((d) => enrolled.add(d.id));
    } catch {
      // Fallback to local enrollment store
    }
  }
  return Array.from(enrolled);
}

/**
 * Enroll in a course (Firestore + resilient fallback)
 */
async function enrollCourse(uid, courseId) {
  const firestore = getDb();
  let course = findCourseInMemory(courseId);
  if (firestore) {
    try {
      const snapshot = await firestore.collection('marketplace').doc(courseId).get();
      if (snapshot.exists) course = { id: snapshot.id, ...snapshot.data() };
    } catch {
      // Keep local/seed course if Admin Firestore is unreachable
    }
  }
  if (!course || course.status !== 'published') {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }
  if (typeof course.price !== 'number' || !Number.isFinite(course.price) || course.price < 0) {
    const error = new Error('Course price could not be verified.');
    error.statusCode = 503;
    throw error;
  }
  if (course.price > 0) {
    const error = new Error('Paid course enrollment is not available yet.');
    error.statusCode = 402;
    throw error;
  }
  if (!localEnrollments.has(uid)) {
    localEnrollments.set(uid, new Set());
  }
  const userSet = localEnrollments.get(uid);
  if (userSet.has(courseId)) {
    return { success: true, alreadyEnrolled: true, persistence: 'memory' };
  }

  let persistedToFirebase = false;
  if (firestore) {
    try {
      const enrollmentRef = firestore.collection('users').doc(uid).collection('enrollments').doc(courseId);
      const existing = await enrollmentRef.get();
      if (existing && existing.exists) {
        userSet.add(courseId);
        return { success: true, alreadyEnrolled: true, persistence: 'firebase' };
      }

      await enrollmentRef.set({
        courseId,
        enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 0,
      });

      await firestore
        .collection('marketplace')
        .doc(courseId)
        .update({
          enrolledCount: admin.firestore.FieldValue.increment(1),
        })
        .catch(() => {});
      persistedToFirebase = true;
    } catch {
      persistedToFirebase = false;
    }
  }

  userSet.add(courseId);
  if (!persistedToFirebase) {
    const prev = localCourseCounters.get(courseId) || { enrolledDelta: 0 };
    localCourseCounters.set(courseId, { ...prev, enrolledDelta: (prev.enrolledDelta || 0) + 1 });
  }

  return { success: true, alreadyEnrolled: false, persistence: persistedToFirebase ? 'firebase' : 'memory' };
}

/**
 * Get user's progress for a single course or all courses
 */
async function getUserCourseProgress(uid, courseId, totalLessonsCount = null) {
  let userMap = localCourseProgress.get(uid);
  if (!userMap) {
    userMap = new Map();
    localCourseProgress.set(uid, userMap);
  }
  let entry = userMap.get(courseId);

  const firestore = getDb();
  if (!entry && firestore) {
    try {
      const snap = await firestore.collection('users').doc(uid).collection('progress').doc(courseId).get();
      if (snap.exists) {
        const d = snap.data() || {};
        entry = {
          courseId,
          completedLessonIds: Array.isArray(d.completedLessonIds) ? d.completedLessonIds : [],
          quizResults: d.quizResults || {},
          completionPercent: Number(d.completionPercent || 0),
          updatedAt: String(d.updatedAt || new Date().toISOString()),
        };
        userMap.set(courseId, entry);
      }
    } catch {
      // Ignore Firestore miss
    }
  }

  if (!entry) {
    return {
      courseId,
      completedLessonIds: [],
      quizResults: {},
      completionPercent: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  const course = findCourseInMemory(courseId);
  const total = totalLessonsCount || (course ? applyLocalStats(course).lessons.length : 1);
  const pct = total > 0 ? Math.min(100, Math.round((entry.completedLessonIds.length / total) * 100)) : 0;
  return { ...entry, completionPercent: pct };
}

async function getAllUserProgress(uid) {
  const result = {};
  const userMap = localCourseProgress.get(uid);
  if (userMap) {
    for (const [cid, val] of userMap.entries()) {
      result[cid] = val;
    }
  }
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore.collection('users').doc(uid).collection('progress').get();
      snap.docs.forEach((d) => {
        const data = d.data() || {};
        if (!result[d.id] && Array.isArray(data.completedLessonIds)) {
          result[d.id] = {
            courseId: d.id,
            completedLessonIds: data.completedLessonIds,
            quizResults: data.quizResults || {},
            completionPercent: Number(data.completionPercent || 0),
            updatedAt: String(data.updatedAt || new Date().toISOString()),
          };
        }
      });
    } catch {
      // Keep local map
    }
  }
  return result;
}

/**
 * Record lesson completion & interactive quiz answer for an enrolled course
 */
async function saveLessonProgress(uid, courseId, { lessonId, completed = true, quizChoiceIndex = null }) {
  const rawCourse = findCourseInMemory(courseId);
  const course = rawCourse ? applyLocalStats(rawCourse) : null;
  if (!course || course.status !== 'published') {
    const error = new Error('Course not found.');
    error.statusCode = 404;
    throw error;
  }

  const lesson = course.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    const error = new Error('Lesson not found in this course.');
    error.statusCode = 404;
    throw error;
  }

  // Auto-enroll user if they open/complete a free course lesson
  const userEnrollments = localEnrollments.get(uid) || new Set();
  if (!userEnrollments.has(courseId) && course.price === 0) {
    await enrollCourse(uid, courseId);
  }

  const current = await getUserCourseProgress(uid, courseId, course.lessons.length);
  const completedSet = new Set(current.completedLessonIds || []);
  const quizResults = { ...(current.quizResults || {}) };

  let quizEvaluation = null;
  if (typeof quizChoiceIndex === 'number' && Number.isInteger(quizChoiceIndex) && lesson.quiz) {
    const correct = quizChoiceIndex === lesson.quiz.correctIndex;
    quizResults[lessonId] = {
      selectedIndex: quizChoiceIndex,
      correct,
      answeredAt: new Date().toISOString(),
    };
    quizEvaluation = {
      correct,
      correctIndex: lesson.quiz.correctIndex,
      explanation: lesson.quiz.explanation,
    };
    if (correct && completed !== false) {
      completedSet.add(lessonId);
    }
  } else if (completed) {
    completedSet.add(lessonId);
  } else {
    completedSet.delete(lessonId);
  }

  const completedLessonIds = Array.from(completedSet);
  const completionPercent =
    course.lessons.length > 0 ? Math.min(100, Math.round((completedLessonIds.length / course.lessons.length) * 100)) : 0;

  const updated = {
    courseId,
    completedLessonIds,
    quizResults,
    completionPercent,
    updatedAt: new Date().toISOString(),
  };

  let userMap = localCourseProgress.get(uid);
  if (!userMap) {
    userMap = new Map();
    localCourseProgress.set(uid, userMap);
  }
  userMap.set(courseId, updated);

  const firestore = getDb();
  let progressPersisted = false;
  if (firestore) {
    try {
      await firestore.collection('users').doc(uid).collection('progress').doc(courseId).set(updated, { merge: true });
      progressPersisted = true;
      await firestore
        .collection('users')
        .doc(uid)
        .collection('enrollments')
        .doc(courseId)
        .set({ courseId, progress: completionPercent }, { merge: true });
    } catch {
      // Non-fatal fallback
    }
  }

  return { progress: updated, quizEvaluation, persistence: progressPersisted ? 'firebase' : 'memory' };
}

/**
 * Get reviews for a course
 */
async function getCourseReviews(courseId) {
  const firestore = getDb();
  if (firestore) {
    try {
      const snap = await firestore
        .collection('marketplace')
        .doc(courseId)
        .collection('reviews')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (rows.length > 0) return rows;
    } catch {
      // Fall through to local reviews
    }
  }
  return localReviews.get(courseId) || [];
}

/**
 * Submit a review
 */
async function submitReview(uid, userName, courseId, rating, comment) {
  const firestore = getDb();
  const cleanReview = {
    id: `rev-${uid}-${Date.now().toString(36)}`,
    userId: uid,
    userName: userName || 'Scholar',
    rating: Number(rating),
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString(),
  };

  let persistedToFirebase = false;
  if (firestore) {
    try {
      const existingSnap = await firestore
        .collection('marketplace')
        .doc(courseId)
        .collection('reviews')
        .where('userId', '==', uid)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        await existingSnap.docs[0].ref.update({
          rating: cleanReview.rating,
          comment: cleanReview.comment,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await firestore.collection('marketplace').doc(courseId).collection('reviews').add({
          userId: uid,
          userName: cleanReview.userName,
          rating: cleanReview.rating,
          comment: cleanReview.comment,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await recalculateRating(courseId);
      persistedToFirebase = true;
    } catch {
      persistedToFirebase = false;
    }
  }

  const list = localReviews.get(courseId) || [];
  const existingIndex = list.findIndex((r) => r.userId === uid);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...cleanReview };
  } else {
    list.unshift(cleanReview);
  }
  localReviews.set(courseId, list);

  const baseCourse = findCourseInMemory(courseId);
  const baseCount = baseCourse ? baseCourse.ratingCount : 0;
  const baseTotal = baseCourse ? baseCourse.rating * baseCount : 0;
  const sumLocal = list.reduce((acc, r) => acc + r.rating, 0);
  const totalCount = baseCount + list.length;
  const avg = totalCount > 0 ? Math.round(((baseTotal + sumLocal) / totalCount) * 10) / 10 : cleanReview.rating;
  const prev = localCourseCounters.get(courseId) || { enrolledDelta: 0 };
  localCourseCounters.set(courseId, { ...prev, rating: avg, ratingCount: totalCount });

  return { ...cleanReview, persistence: persistedToFirebase ? 'firebase' : 'memory' };
}

async function recalculateRating(courseId) {
  const firestore = getDb();
  if (!firestore) return;

  try {
    const reviewsSnap = await firestore.collection('marketplace').doc(courseId).collection('reviews').get();
    const reviews = reviewsSnap.docs.map((d) => d.data());
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;
    await firestore.collection('marketplace').doc(courseId).update({
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: reviews.length,
    });
  } catch (err) {
    console.warn('Recalculate rating warning:', err.message);
  }
}

function resetMarketplaceForTests() {
  localPublishedCourses.clear();
  localEnrollments.clear();
  localCourseCounters.clear();
  localReviews.clear();
  localCourseProgress.clear();
}

module.exports = {
  publishCourse,
  searchCourses,
  getCourseDetails,
  getUserEnrollments,
  enrollCourse,
  getAllUserProgress,
  getUserCourseProgress,
  saveLessonProgress,
  getCourseReviews,
  submitReview,
  recalculateRating,
  resetMarketplaceForTests,
  SEED_COURSES,
};
