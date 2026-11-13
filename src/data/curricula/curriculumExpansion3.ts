import { ChapterAddition } from './curriculumExpansion';

/**
 * Curriculum depth expansion, batch 3 (mathematics + computer science).
 *
 * Every chapter in these subjects still held a single topic after batches 1–2,
 * so a learner opening "Multivariable Calculus" or "Deep Learning" found exactly
 * one narrow topic and nothing else. This batch gives each remaining chapter a
 * second, prerequisite-ordered topic so the chapter can be studied end to end.
 */

const ALL: ChapterAddition['examTracks'] = ['all'];

export const CURRICULUM_EXPANSION_3: ChapterAddition[] = [
  // ---------------- MATHEMATICS ----------------
  {
    subjectId: 'math',
    examTracks: ALL,
    chapterId: 'math-ch-multivariable',
    topics: [
      {
        id: 'math-topic-partial-derivatives',
        title: 'Partial Derivatives & the Multivariable Chain Rule',
        description:
          'Extending differentiation to functions of several variables, and how change propagates through composed dependencies.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'math-sub-partials-chain',
            title: 'Partial Differentiation & Total Derivative',
            description: 'Holding other variables fixed, then accounting for every dependency at once.',
            concepts: [
              {
                id: 'concept-partial-derivatives',
                title: 'Partial Derivatives & the Gradient Vector',
                summary:
                  'Differentiate with respect to one variable while freezing the rest, then assemble the results into a direction of steepest ascent.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'For $f(x,y)$, the partial derivative $\\frac{\\partial f}{\\partial x}$ differentiates with respect to $x$ holding $y$ constant. The gradient $\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}\\right)$ points in the direction of steepest increase, and $\\nabla f \\perp$ level curves.',
                intuitiveExplanation:
                  'On a hillside, walking due east changes your height at a rate given by the $x$-partial, while your northing is frozen. The gradient combines all such rates into a single arrow pointing straight uphill.',
                keyFormulas: [
                  {
                    label: 'Gradient Vector',
                    latex: '\\nabla f = \\left(\\frac{\\partial f}{\\partial x},\\ \\frac{\\partial f}{\\partial y}\\right)',
                    explanation: 'Each component is a one-variable derivative with the others frozen.',
                  },
                  {
                    label: 'Directional Derivative',
                    latex: 'D_{\\hat{u}} f = \\nabla f \\cdot \\hat{u}',
                    explanation: 'The rate of change along any unit direction is the gradient projected onto it.',
                  },
                ],
                keyObservations: [
                  'The gradient is orthogonal to level curves — the basis of all constrained optimisation.',
                  'A zero gradient is necessary but not sufficient for an extremum (saddle points exist).',
                  'Partial derivatives can exist while the function is still discontinuous at a point.',
                ],
                workedExamples: [
                  {
                    id: 'we-pd-01',
                    title: 'Gradient of a Mixed Function',
                    problemStatement: 'Find $\\nabla f$ for $f(x,y) = x^2y + 3y^2$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Differentiate with respect to $x$ treating $y$ as a constant: $\\frac{\\partial f}{\\partial x} = 2xy$.',
                      'Differentiate with respect to $y$ treating $x$ as a constant: $\\frac{\\partial f}{\\partial y} = x^2 + 6y$.',
                      'Assemble the vector.',
                    ],
                    finalAnswer: '$\\nabla f = (2xy,\\ x^2 + 6y)$',
                    keyTakeaway:
                      'The "frozen variable" discipline is the whole technique — applied twice, once per coordinate.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-pd-01',
                    trapTitle: 'Differentiating the frozen variable too',
                    flawedReasoning: 'Treat $y^2$ as if it were $x^2$ when differentiating with respect to $x$.',
                    correctConcept:
                      'A variable held constant has zero derivative, so terms containing only $y$ vanish under $\\partial/\\partial x$.',
                    counterExample:
                      'For $f = x^2 y^3$, $\\partial f/\\partial x = 2xy^3$; writing $3x^2y^2$ computes the $y$-partial instead.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-lagrange-multipliers', title: 'Lagrange Multipliers & Constrained Extrema', subjectId: 'math' },
                ],
                miniCheckQuestion: {
                  prompt: 'What is $\\frac{\\partial}{\\partial y}(x^3 y^2)$?',
                  options: ['$3x^2y^2$', '$2x^3y$', '$x^3y$', '$6x^2y$'],
                  correctIndex: 1,
                  explanation: '$x^3$ is constant with respect to $y$, so the derivative of $y^2$ gives $2x^3y$.',
                },
              },
              {
                id: 'concept-multivariable-chain-rule',
                title: 'The Multivariable Chain Rule & Total Derivative',
                summary:
                  'When every variable depends on a common parameter, sum the contributions of each path instead of following one.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  'If $z = f(x,y)$ with $x = x(t)$ and $y = y(t)$, then $\\frac{dz}{dt} = \\frac{\\partial f}{\\partial x}\\frac{dx}{dt} + \\frac{\\partial f}{\\partial y}\\frac{dy}{dt}$. This is the gradient dotted with the velocity vector.',
                intuitiveExplanation:
                  'Walking a path across a hillside, your height changes for two reasons at once: how steep it is in each direction and how fast you are moving in each direction. The chain rule adds those two contributions.',
                keyFormulas: [
                  {
                    label: 'Chain Rule Along a Path',
                    latex: '\\frac{dz}{dt} = \\nabla f \\cdot \\left(\\frac{dx}{dt}, \\frac{dy}{dt}\\right)',
                    explanation: 'The rate of change is the projection of the gradient onto the velocity.',
                  },
                ],
                keyObservations: [
                  'Each dependency path contributes one product term.',
                  'If the path is tangent to a level curve, the total derivative is zero.',
                  'Implicit differentiation is a special case obtained by setting $\\frac{dz}{dt} = 0$.',
                ],
                workedExamples: [
                  {
                    id: 'we-pd-02',
                    title: 'Rate of Change Along a Parametrised Path',
                    problemStatement:
                      'For $z = x^2 y$ with $x = t$ and $y = t^2$, find $\\frac{dz}{dt}$ at $t = 1$.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Compute the partials: $\\frac{\\partial z}{\\partial x} = 2xy$ and $\\frac{\\partial z}{\\partial y} = x^2$.',
                      'Compute the path derivatives: $\\frac{dx}{dt} = 1$ and $\\frac{dy}{dt} = 2t$.',
                      'Apply the chain rule: $\\frac{dz}{dt} = 2xy(1) + x^2(2t)$.',
                      'At $t = 1$: $x = 1$, $y = 1$, so $\\frac{dz}{dt} = 2 + 2 = 4$.',
                    ],
                    finalAnswer: '$4$',
                    keyTakeaway:
                      'Verify by substituting directly: $z = t^4$, whose derivative $4t^3$ gives the same $4$ at $t=1$.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-pd-02',
                    trapTitle: 'Using only one path term',
                    flawedReasoning: 'Differentiate the $x$ dependency and assume the $y$ dependency is independent.',
                    correctConcept:
                      'Every variable that depends on $t$ contributes a term. Omitting one systematically underestimates the rate.',
                    counterExample:
                      'In the example above, keeping only $\\frac{\\partial z}{\\partial x}\\frac{dx}{dt}$ gives $2$ instead of the true $4$.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-partial-derivatives', title: 'Partial Derivatives & the Gradient Vector', subjectId: 'math' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'How many terms does the chain rule give for $f(x,y,z)$ with all three depending on $t$?',
                  options: ['One', 'Two', 'Three', 'Nine'],
                  correctIndex: 2,
                  explanation: 'One product term per intermediate variable, so three.',
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
    examTracks: ALL,
    chapterId: 'math-ch-prob-stat',
    topics: [
      {
        id: 'math-topic-random-variables',
        title: 'Random Variables, Expectation & Variance',
        description:
          'Distributions, expected value and spread — the machinery that Bayesian inference operates on.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'math-sub-expectation-variance',
            title: 'Expectation & Variance',
            description: 'Computing averages and spread, and how they combine across independent variables.',
            concepts: [
              {
                id: 'concept-expectation-variance',
                title: 'Expectation & Variance of Random Variables',
                summary:
                  'Condense a whole distribution into a centre and a spread, then combine them algebraically.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'For a discrete random variable, $E[X] = \\sum x_i p_i$ and $\\operatorname{Var}(X) = E[X^2] - (E[X])^2$. Expectation is linear: $E[aX + bY] = aE[X] + bE[Y]$. Variance adds only for independent variables: $\\operatorname{Var}(X + Y) = \\operatorname{Var}(X) + \\operatorname{Var}(Y)$.',
                intuitiveExplanation:
                  'Expectation is where the distribution balances on a pivot. Variance measures how far it spreads around that pivot. Linearity makes means easy; variance needs independence because correlated variables can reinforce or cancel.',
                keyFormulas: [
                  {
                    label: 'Variance Shortcut',
                    latex: '\\operatorname{Var}(X) = E[X^2] - (E[X])^2',
                    explanation: 'Usually faster than the deviation form.',
                  },
                  {
                    label: 'Standard Deviation',
                    latex: '\\sigma = \\sqrt{\\operatorname{Var}(X)}',
                    explanation: 'Returns the units to those of the variable.',
                  },
                ],
                keyObservations: [
                  'Expectation is always linear, even for dependent variables.',
                  'Variance is not linear: scaling by $a$ multiplies variance by $a^2$.',
                  'Correlated variables require a covariance term in the variance of a sum.',
                ],
                workedExamples: [
                  {
                    id: 'we-rv-01',
                    title: 'Expectation and Variance of a Fair Die',
                    problemStatement: 'Find $E[X]$ and $\\operatorname{Var}(X)$ for a fair six-sided die.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Each face has probability $1/6$, so $E[X] = (1+2+3+4+5+6)/6 = 3.5$.',
                      'Compute $E[X^2] = (1+4+9+16+25+36)/6 = 91/6 \\approx 15.17$.',
                      'Apply the shortcut: $\\operatorname{Var}(X) = 91/6 - (3.5)^2$.',
                      'This gives $15.167 - 12.25 = 35/12 \\approx 2.92$.',
                    ],
                    finalAnswer: '$E[X] = 3.5$, $\\operatorname{Var}(X) = \\frac{35}{12} \\approx 2.92$',
                    keyTakeaway:
                      'The mean of a symmetric discrete distribution can land on a value the variable never takes.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-rv-01',
                    trapTitle: 'Adding variances without checking independence',
                    flawedReasoning: 'Since means add, variances must add for any two variables.',
                    correctConcept:
                      'Variance of a sum includes $2\\operatorname{Cov}(X,Y)$. Only independence removes it.',
                    counterExample:
                      'For $X$ and $Y = -X$, variances each equal $\\sigma^2$ but $\\operatorname{Var}(X + Y) = 0$.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-bayes-theorem', title: 'Bayes Theorem & Posterior Estimation', subjectId: 'math' },
                ],
                miniCheckQuestion: {
                  prompt: 'If $\\operatorname{Var}(X) = 4$, what is $\\operatorname{Var}(3X)$?',
                  options: ['$4$', '$12$', '$36$', '$9$'],
                  correctIndex: 2,
                  explanation: 'Scaling multiplies variance by the square of the constant: $9 \\times 4 = 36$.',
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
    examTracks: ALL,
    chapterId: 'math-ch-discrete-comb',
    topics: [
      {
        id: 'math-topic-counting-probability',
        title: 'Counting Principles & Combinatorial Probability',
        description:
          'Permutations, combinations and the counting habits that make probability computable rather than guesswork.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'math-sub-permutations-combinations',
            title: 'Permutations, Combinations & the Binomial Theorem',
            description: 'Choosing with and without order, and the algebra of repeated choices.',
            concepts: [
              {
                id: 'concept-permutations-combinations',
                title: 'Permutations vs Combinations',
                summary: 'Decide whether order matters, then choose the corresponding formula rather than reasoning from scratch.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'The number of ordered arrangements of $r$ items from $n$ is $^nP_r = \\frac{n!}{(n-r)!}$. The number of unordered selections is $\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$, and $\\binom{n}{r} = \\binom{n}{n-r}$.',
                intuitiveExplanation:
                  'A permutation counts seats in a row where swapping two people makes a new arrangement. A combination counts a hand of cards where order is irrelevant, so divide by the number of ways to reorder the chosen set.',
                keyFormulas: [
                  {
                    label: 'Combination',
                    latex: '\\binom{n}{r} = \\frac{n!}{r!(n-r)!}',
                    explanation: 'Permutation divided by $r!$, the number of orderings of the chosen items.',
                  },
                  {
                    label: 'Binomial Theorem',
                    latex: '(a + b)^n = \\sum_{r=0}^{n} \\binom{n}{r} a^{n-r} b^{r}',
                    explanation: 'The coefficient of each term counts how many ways that power combination arises.',
                  },
                ],
                keyObservations: [
                  'If order is mentioned or implied, it is a permutation. If "choose a group", it is a combination.',
                  'The binomial theorem coefficients are exactly the combinations.',
                  'With repetition allowed, replace the factorial formulas with stars and bars.',
                ],
                workedExamples: [
                  {
                    id: 'we-count-01',
                    title: 'Choosing a Committee',
                    problemStatement: 'In how many ways can a 3-person committee be chosen from 10 people?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'A committee has no internal ordering, so order does not matter.',
                      'Apply $\\binom{10}{3} = \\frac{10!}{3!\\,7!}$.',
                      'Expand: $\\frac{10 \\cdot 9 \\cdot 8}{3 \\cdot 2 \\cdot 1}$.',
                      'Evaluate: $720/6 = 120$.',
                    ],
                    finalAnswer: '$120$',
                    keyTakeaway:
                      'Cancel the larger factorial before multiplying — $\\frac{10\\cdot9\\cdot8}{6}$ is far less error-prone than $3628800/30240$.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-count-01',
                    trapTitle: 'Using permutations for a selection problem',
                    flawedReasoning: 'There are 10 choices then 9 then 8, so the answer is 720.',
                    correctConcept:
                      '$10 \\cdot 9 \\cdot 8$ counts ordered lineups. A committee $\{A,B,C\}$ is the same as $\{C,B,A\}$, so divide by $3! = 6$.',
                    counterExample:
                      'Choosing a president, secretary and treasurer *would* be 720, because those roles distinguish order.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-pigeonhole-invariants', title: 'Pigeonhole Principle & Discrete Invariants', subjectId: 'math' },
                ],
                miniCheckQuestion: {
                  prompt: 'How many ways can 2 books be chosen from 5?',
                  options: ['$10$', '$20$', '$25$', '$5$'],
                  correctIndex: 0,
                  explanation: '$\\binom{5}{2} = \\frac{5 \\cdot 4}{2} = 10$.',
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
    examTracks: ALL,
    chapterId: 'math-ch-conics-geo',
    topics: [
      {
        id: 'math-topic-circles-lines',
        title: 'Straight Lines, Circles & Distance Geometry',
        description:
          'The coordinate geometry underneath every conic section: distance, slope, tangency and locus.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'math-sub-lines-circles',
            title: 'Line Equations, Distance & Circles',
            description: 'Converting between forms and using perpendicular distance to test tangency.',
            concepts: [
              {
                id: 'concept-line-circle-geometry',
                title: 'Line Forms, Perpendicular Distance & Circles',
                summary:
                  'Convert freely between slope, general and normal forms, and use perpendicular distance to decide whether a line meets a circle.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'A line $ax + by + c = 0$ has distance $\\frac{|ax_0 + by_0 + c|}{\\sqrt{a^2 + b^2}}$ from $(x_0, y_0)$. A circle $(x-h)^2 + (y-k)^2 = r^2$ is tangent to a line exactly when that distance equals $r$.',
                intuitiveExplanation:
                  'Perpendicular distance is the shortest gap from a point to a line. Comparing it with the radius tells you immediately whether the line cuts, touches or misses the circle — no solving of quadratics required.',
                keyFormulas: [
                  {
                    label: 'Perpendicular Distance',
                    latex: 'd = \\frac{|ax_0 + by_0 + c|}{\\sqrt{a^2 + b^2}}',
                    explanation: 'The denominator normalises the coefficients to a unit normal.',
                  },
                  {
                    label: 'Tangency Condition',
                    latex: 'd = r \\iff \\text{the line touches the circle once}',
                    explanation: '$d < r$ gives two intersections, $d > r$ gives none.',
                  },
                ],
                keyObservations: [
                  'Parallel lines have proportional $a$ and $b$; perpendicular lines satisfy $a_1a_2 + b_1b_2 = 0$.',
                  'Completing the square converts general circle form to centre-radius form.',
                  'Distance geometry avoids solving for intersections entirely.',
                ],
                workedExamples: [
                  {
                    id: 'we-geo-01',
                    title: 'Testing a Line Against a Circle',
                    problemStatement:
                      'Is the line $3x + 4y - 10 = 0$ tangent to the circle $x^2 + y^2 = 4$?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'The circle is centred at the origin with radius $r = 2$.',
                      'Apply the distance formula with $(x_0, y_0) = (0,0)$: $d = \\frac{|0 + 0 - 10|}{\\sqrt{9 + 16}}$.',
                      'Simplify: $d = 10/5 = 2$.',
                      'Since $d = r = 2$, the line is tangent.',
                    ],
                    finalAnswer: 'Yes — the line is tangent to the circle.',
                    keyTakeaway:
                      'Perpendicular distance converts a tangency question into a single arithmetic comparison.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-geo-01',
                    trapTitle: 'Forgetting to normalise the line equation',
                    flawedReasoning: 'Use the constant term directly as the distance from the origin.',
                    correctConcept:
                      'Coefficients must be divided by $\\sqrt{a^2+b^2}$; otherwise the "distance" scales with how the equation happens to be written.',
                    counterExample:
                      'Writing the same line as $6x + 8y - 20 = 0$ would give a bogus distance of 20 instead of 2.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-conics-focal-properties', title: 'Focal Invariants & Eccentricity Relations', subjectId: 'math' },
                ],
                miniCheckQuestion: {
                  prompt: 'The distance from the origin to $x + y - 4 = 0$ is:',
                  options: ['$4$', '$2\\sqrt{2}$', '$2$', '$\\sqrt{2}$'],
                  correctIndex: 1,
                  explanation: '$d = \\frac{|-4|}{\\sqrt{1+1}} = \\frac{4}{\\sqrt{2}} = 2\\sqrt{2}$.',
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
    examTracks: ALL,
    chapterId: 'math-ch-number-theory',
    topics: [
      {
        id: 'math-topic-divisibility',
        title: 'Divisibility, GCD & the Euclidean Algorithm',
        description:
          'The multiplicative structure of the integers that modular arithmetic and cryptography rely on.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'math-sub-gcd-euclid',
            title: 'GCD, Bézout & Diophantine Equations',
            description: 'Computing greatest common divisors efficiently and solving linear integer equations.',
            concepts: [
              {
                id: 'concept-gcd-euclidean',
                title: 'Euclidean Algorithm, Bézout\'s Identity & Modular Inverses',
                summary:
                  'Compute gcds in logarithmic time, express them as integer combinations, and invert numbers modulo $n$.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'The Euclidean algorithm uses $\\gcd(a,b) = \\gcd(b, a \\bmod b)$ until the remainder is zero. Bézout\'s identity states that there exist integers $x,y$ with $ax + by = \\gcd(a,b)$. If $\\gcd(a,n) = 1$ then $a$ has a multiplicative inverse modulo $n$.',
                intuitiveExplanation:
                  'Repeatedly trading a number for its remainder shrinks the problem fast without ever changing the gcd. Bézout then unwinds those steps to express the gcd — which is exactly how modular inverses are found.',
                keyFormulas: [
                  {
                    label: 'Euclidean Step',
                    latex: '\\gcd(a, b) = \\gcd(b,\\ a \\bmod b)',
                    explanation: 'The gcd is invariant under this reduction.',
                  },
                  {
                    label: 'Bézout',
                    latex: 'ax + by = \\gcd(a,b)',
                    explanation: 'Solvable in integers for every pair $a, b$.',
                  },
                ],
                keyObservations: [
                  'The algorithm terminates because remainders strictly decrease.',
                  'An inverse modulo $n$ exists exactly when $\\gcd(a,n) = 1$.',
                  'This is the mathematical core of RSA key generation.',
                ],
                workedExamples: [
                  {
                    id: 'we-nt-01',
                    title: 'Euclidean Algorithm by Hand',
                    problemStatement: 'Compute $\\gcd(252, 105)$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      '$252 = 2 \\cdot 105 + 42$, so $\\gcd(252,105) = \\gcd(105,42)$.',
                      '$105 = 2 \\cdot 42 + 21$, so $\\gcd(105,42) = \\gcd(42,21)$.',
                      '$42 = 2 \\cdot 21 + 0$, so the gcd is $21$.',
                    ],
                    finalAnswer: '$21$',
                    keyTakeaway:
                      'Each step replaces the pair with (divisor, remainder) until the remainder vanishes.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-nt-01',
                    trapTitle: 'Assuming an inverse always exists',
                    flawedReasoning: 'Every number can be divided modulo any other number.',
                    correctConcept:
                      'Inverses exist only for coprime residues. If $\\gcd(a,n) > 1$, no integer $x$ satisfies $ax \\equiv 1 \\pmod n$.',
                    counterExample:
                      '$2x \\equiv 1 \\pmod 4$ has no solution, since every multiple of 2 is even.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-euler-totient-fermat', title: "Fermat's Little Theorem & Modular Inverses", subjectId: 'math' },
                ],
                miniCheckQuestion: {
                  prompt: 'What is $\\gcd(48, 18)$?',
                  options: ['$2$', '$3$', '$6$', '$9$'],
                  correctIndex: 2,
                  explanation: '$48 = 2\\cdot18 + 12$; $18 = 1\\cdot12 + 6$; $12 = 2\\cdot6 + 0$, so the gcd is 6.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- COMPUTER SCIENCE ----------------
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-ml-opt',
    topics: [
      {
        id: 'cs-topic-linear-regression',
        title: 'Linear & Logistic Regression from First Principles',
        description:
          'Least squares and maximum likelihood as the concrete starting points for every later model.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-least-squares',
            title: 'Least Squares & Logistic Likelihood',
            description: 'Why squared error and cross-entropy are the natural losses for these models.',
            concepts: [
              {
                id: 'concept-least-squares',
                title: 'Least Squares & the Normal Equation',
                summary:
                  'Fit a line by minimising squared residuals, which has a closed-form solution but real numerical caveats.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  'Minimising $\\|X\\theta - y\\|^2$ gives the normal equation $\\theta = (X^TX)^{-1}X^Ty$, provided $X^TX$ is invertible. Squared error corresponds to Gaussian noise assumptions.',
                intuitiveExplanation:
                  'Squaring residuals punishes large misses disproportionately, so the fitted line is pulled toward outliers. Solving for the minimum directly is possible because the loss is quadratic in the parameters.',
                keyFormulas: [
                  {
                    label: 'Normal Equation',
                    latex: '\\theta = (X^{T}X)^{-1}X^{T}y',
                    explanation: 'Valid only when $X^TX$ is invertible; otherwise use the pseudoinverse.',
                  },
                  {
                    label: 'Squared Error Loss',
                    latex: 'L(\\theta) = \\frac{1}{n}\\sum (y_i - \\hat{y}_i)^2',
                    explanation: 'Convex in $\\theta$, so a single global minimum exists.',
                  },
                ],
                keyObservations: [
                  'Collinear features make $X^TX$ singular, so the solution is not unique.',
                  'For large $n$ or many features, gradient descent is cheaper than inverting the matrix.',
                  'One extreme outlier can distort the fit far more under squared than absolute error.',
                ],
                workedExamples: [
                  {
                    id: 'we-ls-01',
                    title: 'Fitting a Line Through Two Points',
                    problemStatement: 'Find the least-squares line through $(1,2)$ and $(3,6)$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Two distinct points define a line exactly, so the least-squares solution passes through both.',
                      'Slope: $m = (6-2)/(3-1) = 2$.',
                      'Intercept from $2 = 2(1) + c$ gives $c = 0$.',
                      'Therefore $\\hat{y} = 2x$, with zero residuals.',
                    ],
                    finalAnswer: '$\\hat{y} = 2x$',
                    keyTakeaway:
                      'With exactly two parameters and two points, the fit is exact — residual analysis needs more data than parameters.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ls-01',
                    trapTitle: 'Inverting $X^TX$ when features are collinear',
                    flawedReasoning: 'The normal equation is a formula, so applying it always works.',
                    correctConcept:
                      'Perfectly collinear features make $X^TX$ singular, so it has no inverse. Use regularisation (ridge) or drop redundant features.',
                    counterExample:
                      'If one feature equals another exactly, infinitely many coefficient pairs achieve the same fit.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-grad-descent', title: 'Gradient Descent & Learning Rate Dynamics', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which problem makes the normal equation unreliable?',
                  options: ['Too few rows', 'Collinear features', 'Gaussian noise', 'A convex loss'],
                  correctIndex: 1,
                  explanation: 'Collinearity makes $X^TX$ singular, so the matrix is not invertible.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-deep-learning',
    topics: [
      {
        id: 'cs-topic-neural-training',
        title: 'Backpropagation, Activations & Training Dynamics',
        description:
          'How a network actually learns: gradient flow through layers, non-linearity and the failure modes of deep training.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-backprop',
            title: 'Backpropagation & Non-Linear Activations',
            description: 'The chain rule applied layer by layer, and why depth without non-linearity is useless.',
            concepts: [
              {
                id: 'concept-backpropagation',
                title: 'Backpropagation & Why Activations Matter',
                summary:
                  'Propagate error backwards with the chain rule, and understand why stacking linear layers collapses to one.',
                difficulty: 'hard',
                estimatedMinutes: 17,
                xpReward: 30,
                formalDefinition:
                  'For a layer $a_{l} = \\sigma(W_l a_{l-1} + b_l)$, backpropagation computes $\\delta_l = (W_{l+1}^{T}\\delta_{l+1}) \\odot \\sigma\'(z_l)$, giving gradients $\\nabla_{W_l}L = \\delta_l a_{l-1}^{T}$. Vanishing gradients arise when repeated $\\sigma\'$ factors are below 1.',
                intuitiveExplanation:
                  'Each layer is blamed for the error in proportion to how strongly it influenced the output. Sending that blame backwards through the chain rule assigns credit layer by layer — and if the activation squashes derivatives, the blame fades to nothing in deep stacks.',
                keyFormulas: [
                  {
                    label: 'Layer Delta',
                    latex: '\\delta_l = \\left(W_{l+1}^{T}\\delta_{l+1}\\right) \\odot \\sigma\'(z_l)',
                    explanation: 'The Hadamard product applies the activation slope elementwise.',
                  },
                ],
                keyObservations: [
                  'Composing two linear maps is still linear, so non-linear activations are mandatory.',
                  'Sigmoid derivatives cap at $0.25$, so deep sigmoid stacks vanish.',
                  'ReLU avoids saturation for positive inputs but introduces dead units.',
                ],
                workedExamples: [
                  {
                    id: 'we-bp-01',
                    title: 'Why Two Linear Layers Collapse',
                    problemStatement: 'Show that $W_2(W_1 x)$ equals a single linear layer.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Write the composition: $W_2(W_1 x)$.',
                      'Matrix multiplication is associative, so this equals $(W_2 W_1)x$.',
                      'Define $W = W_2W_1$, which is again a single matrix.',
                      'Therefore the two-layer network is exactly one linear map, with no added representational power.',
                    ],
                    finalAnswer: '$W_2W_1$ is a single matrix — depth without activation is pointless.',
                    keyTakeaway:
                      'This is precisely why non-linear activations, not extra layers, create expressive power.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bp-01',
                    trapTitle: 'Thinking more layers always means more capacity',
                    flawedReasoning: 'Each extra layer adds parameters, so it must add representational power.',
                    correctConcept:
                      'Without non-linearity the composition is linear regardless of depth. Capacity grows only when activations break linearity.',
                    counterExample:
                      'A 100-layer network of purely linear layers is mathematically identical to a single affine transform.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-grad-descent', title: 'Gradient Descent & Learning Rate Dynamics', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'What is the main cause of vanishing gradients in deep sigmoid networks?',
                  options: [
                    'Too many parameters',
                    'Activation derivatives smaller than 1 compounding across layers',
                    'Excessive learning rate',
                    'Insufficient training data',
                  ],
                  correctIndex: 1,
                  explanation: 'Multiplying many factors below 1 shrinks the gradient exponentially with depth.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-os-concurrency',
    topics: [
      {
        id: 'cs-topic-processes-threads',
        title: 'Processes, Threads & Scheduling',
        description:
          'The execution models and scheduling decisions that come before synchronisation problems arise.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-process-thread-model',
            title: 'Process vs Thread & Scheduling Policies',
            description: 'Sharing models, context-switch cost and the trade-offs between scheduling strategies.',
            concepts: [
              {
                id: 'concept-process-thread-model',
                title: 'Processes, Threads & Scheduling Trade-offs',
                summary:
                  'Choose between isolation and sharing, then understand why no scheduler optimises everything at once.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'A process has its own virtual address space; threads within a process share the address space but have separate stacks and registers. A context switch saves and restores execution state, costing on the order of microseconds when the address space changes.',
                intuitiveExplanation:
                  'A process is a separate building with its own address; threads are workers inside that building sharing the same rooms. Sharing makes collaboration cheap and accidental interference easy.',
                keyFormulas: [
                  {
                    label: 'CPU Utilisation',
                    latex: 'U = 1 - p^{n}',
                    explanation: 'With $n$ processes each waiting a fraction $p$ of the time.',
                  },
                ],
                keyObservations: [
                  'Thread context switches are cheaper because the address space does not change.',
                  'A crash in one thread can take down the whole process.',
                  'Round-robin favours responsiveness; shortest-job-first favours average throughput.',
                ],
                workedExamples: [
                  {
                    id: 'we-os-01',
                    title: 'Utilisation with Four Waiting Processes',
                    problemStatement:
                      'Four processes each wait 40% of the time. What is the probability the CPU is idle?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'The CPU is idle only when all four are simultaneously waiting.',
                      'Assuming independence, multiply: $0.4^4$.',
                      'Compute: $0.4^2 = 0.16$ and $0.16^2 = 0.0256$.',
                      'So utilisation is $1 - 0.0256 = 0.9744$.',
                    ],
                    finalAnswer: 'About $97.4\\%$ utilisation.',
                    keyTakeaway:
                      'Idle probability falls exponentially with the number of runnable processes — the basis of multiprogramming.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-os-01',
                    trapTitle: 'Assuming threads make a program faster automatically',
                    flawedReasoning: 'More threads means more parallelism, so always add threads.',
                    correctConcept:
                      'On a single core, threads add switching overhead with no parallelism. Threads also contend on shared locks, and beyond a point throughput falls.',
                    counterExample:
                      'A CPU-bound loop run with 100 threads on 4 cores is often slower than with 4, because of context switching.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-deadlock-coffman', title: 'Coffman Deadlock Conditions & Resource Allocation', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'What do threads in the same process share?',
                  options: ['Stack and registers', 'Address space', 'Program counter', 'Nothing'],
                  correctIndex: 1,
                  explanation: 'Threads share the address space and open resources but keep private stacks and registers.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-dist-systems',
    topics: [
      {
        id: 'cs-topic-replication-sharding',
        title: 'Replication, Sharding & Consistency Models',
        description:
          'How data is copied and partitioned across machines, and what consistency guarantees survive that.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-replication-consistency',
            title: 'Replication & Strong vs Eventual Consistency',
            description: 'The cost of keeping copies in agreement and when weaker guarantees are acceptable.',
            concepts: [
              {
                id: 'concept-replication-consistency',
                title: 'Replication Lag & Consistency Models',
                summary:
                  'Strong consistency serialises every read behind agreement; eventual consistency trades freshness for availability.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'In synchronous replication the write is acknowledged only after all replicas persist it, giving strong consistency at the cost of latency. Asynchronous replication acknowledges after the primary commits, giving eventual consistency where reads may be stale.',
                intuitiveExplanation:
                  'Synchronous replication is waiting for every friend to confirm before you act. Asynchronous replication is acting immediately and telling them afterwards — faster, but they may briefly hold outdated information.',
                keyFormulas: [
                  {
                    label: 'Quorum Condition',
                    latex: 'R + W > N',
                    explanation: 'Read and write quorums must overlap for a read to observe the latest write.',
                  },
                ],
                keyObservations: [
                  'Quorum sizes let you tune the latency/consistency trade-off per operation.',
                  'Read-your-own-writes is a weaker, often sufficient guarantee.',
                  'Sharding improves write throughput but makes cross-shard transactions expensive.',
                ],
                workedExamples: [
                  {
                    id: 'we-ds-01',
                    title: 'Choosing Quorum Sizes',
                    problemStatement: 'With $N = 3$ replicas, do $W = 2$ and $R = 2$ guarantee a fresh read?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Check the quorum condition: $R + W > N$.',
                      'Substitute: $2 + 2 = 4 > 3$.',
                      'Any two-node read set must intersect any two-node write set in at least one node.',
                      'That overlapping node holds the newest value, so the read sees it.',
                    ],
                    finalAnswer: 'Yes — $R = W = 2$ gives strong read-after-write consistency.',
                    keyTakeaway:
                      'The overlap argument, not the individual sizes, is what guarantees freshness.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ds-01',
                    trapTitle: 'Assuming replicas are always in sync',
                    flawedReasoning: 'Data is replicated, so every replica holds the same value.',
                    correctConcept:
                      'Replicas converge over time. Under asynchronous replication, a read from a lagging replica can legitimately return stale data.',
                    counterExample:
                      'A user updates a profile then immediately refreshes and sees the old value — a classic replication-lag symptom.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-cap-theorem', title: 'CAP Theorem & Consistency Guarantees', subjectId: 'cs' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'With $N=3$, which pair does NOT guarantee a fresh read?',
                  options: ['$W=2, R=2$', '$W=3, R=1$', '$W=1, R=1$', '$W=3, R=2$'],
                  correctIndex: 2,
                  explanation: '$1 + 1 = 2 \\le 3$, so the read and write quorums can miss each other entirely.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-adv-algorithms',
    topics: [
      {
        id: 'cs-topic-greedy-intervals',
        title: 'Greedy Algorithms & Interval Scheduling',
        description:
          'When a locally optimal choice is provably globally optimal, and how to recognise when it is not.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-greedy-exchange',
            title: 'Greedy Choice & the Exchange Argument',
            description: 'Proving greedy correctness and identifying the counterexamples that break it.',
            concepts: [
              {
                id: 'concept-greedy-intervals',
                title: 'Greedy Interval Scheduling & Exchange Arguments',
                summary:
                  'Sort by earliest finish time to maximise the number of non-overlapping intervals — and prove it with an exchange argument.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'For the activity-selection problem, sorting intervals by finishing time and greedily taking each compatible one yields a maximum-size set. Correctness follows from an exchange argument: any optimal solution can swap its first interval for the earliest-finishing one without becoming worse.',
                intuitiveExplanation:
                  'Finishing earliest leaves the most remaining time for everything else. Unlike "shortest first" or "earliest start first", it can never consume a slot that a better choice needed.',
                keyFormulas: [
                  {
                    label: 'Complexity',
                    latex: 'O(n \\log n)',
                    explanation: 'Dominated by the sort; the selection pass is linear.',
                  },
                ],
                keyObservations: [
                  'Maximising *count* of intervals is greedy-solvable; maximising *total weight* is not.',
                  'Sorting by duration or start time both have simple counterexamples.',
                  'Exchange arguments are the standard correctness proof for greedy algorithms.',
                ],
                workedExamples: [
                  {
                    id: 'we-greedy-01',
                    title: 'Selecting Maximum Non-Overlapping Meetings',
                    problemStatement:
                      'Intervals: A[1,4], B[3,5], C[0,6], D[5,7], E[3,9], F[5,9], G[6,10], H[8,11]. Select the maximum number that do not overlap.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Sort by finish time: A(4), B(5), C(6), D(7), E(9), F(9), G(10), H(11).',
                      'Take A, which ends at 4.',
                      'Next compatible start must be $\\ge 4$: take B (3–5)? It starts at 3, so it conflicts. The next compatible is D (5–7).',
                      'After D ends at 7, take H (8–11).',
                    ],
                    finalAnswer: 'A, D, H — three intervals, the maximum.',
                    keyTakeaway:
                      'Earliest-finish ordering leaves the most room; it is the only sort key that is provably optimal here.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-greedy-01',
                    trapTitle: 'Applying greedy to weighted interval scheduling',
                    flawedReasoning: 'Earliest finish maximises count, so it also maximises total value.',
                    correctConcept:
                      'With weights, taking many short low-value intervals can beat one long high-value interval. This variant needs dynamic programming.',
                    counterExample:
                      'One interval worth 100 that blocks two intervals worth 10 each: greedy picks the two and loses 80.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-memoization-dp', title: 'Memoisation & Dynamic Programming', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which sort key makes interval scheduling greedy optimal?',
                  options: ['Earliest start', 'Shortest duration', 'Earliest finish', 'Latest finish'],
                  correctIndex: 2,
                  explanation: 'Earliest finish leaves the greatest remaining capacity, which the exchange argument formalises.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-hackathon-eng',
    topics: [
      {
        id: 'cs-topic-api-design',
        title: 'HTTP API Design & Error Handling',
        description:
          'Resource modelling, status codes and idempotency — the contract a client actually depends on.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'cs-sub-rest-contracts',
            title: 'REST Contracts, Status Codes & Idempotency',
            description: 'Designing endpoints whose failure behaviour is predictable.',
            concepts: [
              {
                id: 'concept-rest-idempotency',
                title: 'REST Semantics, Status Codes & Idempotency',
                summary:
                  'Choose methods and status codes by their defined semantics so clients can retry safely.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'In HTTP, GET, PUT and DELETE are idempotent (repeating has the same effect); POST is not. 4xx signals a client fault, 5xx a server fault, and 2xx success. A well-formed API never returns 200 with an error body.',
                intuitiveExplanation:
                  'Idempotency is what makes retries safe. If a network drops the response to a GET, the client can retry harmlessly; retrying a POST may create a duplicate order.',
                keyFormulas: [
                  {
                    label: 'Idempotent Methods',
                    latex: '\\{\\text{GET},\\ \\text{PUT},\\ \\text{DELETE}\\}',
                    explanation: 'Repeating them leaves the server in the same state.',
                  },
                ],
                keyObservations: [
                  'Returning 200 with `{"error": ...}` breaks every generic HTTP client.',
                  'Use 401 for unauthenticated and 403 for authenticated-but-forbidden.',
                  'Idempotency keys let non-idempotent POSTs be retried safely.',
                ],
                workedExamples: [
                  {
                    id: 'we-api-01',
                    title: 'Choosing the Right Status',
                    problemStatement:
                      'A client sends a valid request to create a resource but is not logged in. Which status code?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'The request itself is well-formed, so it is not a 400.',
                      'The failure is authentication: the caller has not proven identity.',
                      '401 Unauthorized is the defined code for missing or invalid credentials.',
                      '403 would apply if the caller were authenticated but lacked permission.',
                    ],
                    finalAnswer: '401',
                    keyTakeaway:
                      '401 means "we do not know who you are"; 403 means "we know, and you may not".',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-api-01',
                    trapTitle: 'Returning 200 for failures',
                    flawedReasoning: 'The server responded successfully, so 200 is accurate.',
                    correctConcept:
                      'The status code describes the *operation*, not the network. A rejected operation needs a 4xx or 5xx so clients, proxies and monitors behave correctly.',
                    counterExample:
                      'Retry middleware and uptime monitors both treat 200 as success, silently hiding errors.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-jwt-cache-invalidation', title: 'Stateless JWT Auth & Cache-Aside Strategy', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which method is NOT idempotent?',
                  options: ['GET', 'PUT', 'DELETE', 'POST'],
                  correctIndex: 3,
                  explanation: 'Repeating a POST typically creates another resource.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
