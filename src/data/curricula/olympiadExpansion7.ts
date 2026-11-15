import { ChapterAddition } from './curriculumExpansion';

/**
 * Olympiad & International Exam Expansion (Olympiad Expansion 7)
 * Adds specialized chapters and concepts for:
 *  - Physics: IPhO (International Physics Olympiad) Optics & Electromagnetism
 *  - Chemistry: IChO (International Chemistry Olympiad) Thermodynamics & Equilibrium
 *  - Biology / IJSO: IBHO / IJSO Molecular Genetics & Enzymology
 *  - Computer Science: ICT International Coding Test & Competitive Programming
 *  - Mathematics: INMO Proof Techniques & Number Theory
 */

export const OLYMPIAD_EXPANSION_7: ChapterAddition[] = [
  {
    subjectId: 'physics',
    chapterId: 'phys-ch-ipho-optics',
    topics: [
      {
        id: 'phys-topic-ipho-wave-optics',
        title: 'IPhO Wave Optics & Interference Invariants',
        description: 'Thin-film interference, diffraction gratings, Fresnel/Fraunhofer regimes, and polarization Stokes parameters.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'phys-sub-thin-film-diffraction',
            title: 'Thin-Film Interference & Diffraction Gratings',
            description: 'Phase changes upon reflection (180° / π phase shift on denser medium) and grating dispersion resolving power.',
            concepts: [
              {
                id: 'concept-ipho-thin-film',
                title: 'Thin-Film Interference & Phase Reversal',
                summary: 'Constructive and destructive interference in thin soap films or oil slicks, accounting for internal reflection phase shifts.',
                difficulty: 'hard',
                estimatedMinutes: 25,
                xpReward: 50,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition: 'For normal incidence on a film of thickness t and refractive index n_2 between media n_1 and n_3, reflection phase shifts occur if n_1 < n_2 and/or n_2 < n_3. Constructive interference for transmission/reflection depends on 2n_2 t = (m + \\phi)\\lambda.',
                intuitiveExplanation: 'Light reflecting off a denser medium inverts its phase (like a clamped rope bouncing upside down), altering whether path length differences create bright or dark bands.',
                keyFormulas: [
                  {
                    label: 'One Phase Reversal Condition',
                    latex: '2n_2 t = \\left(m + \\frac{1}{2}\\right)\\lambda \\quad (\\text{constructive reflection})',
                    explanation: 'Applies when exactly one reflecting interface causes a 180° phase shift.',
                  },
                ],
                keyObservations: [
                  'Always check refractive index hierarchy n_1, n_2, n_3 before setting up path difference conditions.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-film-01',
                    title: 'Anti-Reflective Coating Thickness',
                    problemStatement: 'Find minimum non-zero thickness t for a MgF2 coating (n = 1.38) on glass (n = 1.52) to eliminate reflection at lambda = 550 nm.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Both air-to-coating (1.0 < 1.38) and coating-to-glass (1.38 < 1.52) reflections undergo 180° phase shifts, so phase shifts cancel.',
                      'Condition for destructive reflection: 2nt = (m + 1/2)lambda -> for m=0, t = lambda / (4n).',
                      'Compute t = 550 nm / (4 * 1.38) = 99.6 nm.',
                    ],
                    finalAnswer: '99.6 nm',
                    keyTakeaway: 'Matching phase shift conditions eliminates destructive vs constructive confusion.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-film-01',
                    trapTitle: 'Forgetting phase reversal on lower refractive index transition',
                    flawedReasoning: 'Assume standard 2nt = m*lambda without checking medium boundaries.',
                    correctConcept: 'Reflection off a optically denser medium introduces a pi phase shift.',
                    counterExample: 'Failing to include the half-wavelength shift reverses bright and dark fringes.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When light reflects from a boundary transitioning from air (n=1.0) to water (n=1.33), what phase shift occurs in the reflected wave?',
                  options: ['180 degrees (pi radians)', '0 degrees', '90 degrees (pi/2)', '360 degrees (2pi)'],
                  correctIndex: 0,
                  explanation: 'Reflection from an optically denser medium (higher refractive index) introduces a 180° phase shift.',
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
    chapterId: 'chem-ch-icho-thermo',
    topics: [
      {
        id: 'chem-topic-icho-advanced-equilibrium',
        title: 'IChO Advanced Chemical Thermodynamics & Electrochemistry',
        description: 'Van \'t Hoff equation, complex ion equilibria, solubility product with common-ion effect, and overpotential kinetics.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'chem-sub-vant-hoff',
            title: 'Van \'t Hoff Enthalpy Equation & Temperature Dependence',
            description: 'Relating equilibrium constant shift with enthalpy change d(ln K)/dT = Delta H / (R T^2).',
            concepts: [
              {
                id: 'concept-icho-vant-hoff',
                title: 'Van \'t Hoff Equation & Equilibrium Temperature Shift',
                summary: 'Quantitative prediction of how equilibrium constant K changes across temperatures via standard reaction enthalpy Delta H°.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 48,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition: 'd(ln K)/dT = \\Delta H^\\circ / (R T^2), integrating to ln(K_2/K_1) = -(\\Delta H^\\circ / R) (1/T_2 - 1/T_1).',
                intuitiveExplanation: 'Endothermic reactions shift toward products at higher temperatures (K increases); exothermic reactions shift toward reactants (K decreases).',
                keyFormulas: [
                  {
                    label: 'Integrated Van \'t Hoff Equation',
                    latex: '\\ln\\!\\left(\\frac{K_2}{K_1}\\right) = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)',
                    explanation: 'Allows determining Delta H° from K measured at two distinct temperatures.',
                  },
                ],
                keyObservations: [
                  'Temperature in Kelvin is strictly required; R = 8.314 J/(mol K).',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-vh-01',
                    title: 'Calculating Enthalpy from K at Two Temperatures',
                    problemStatement: 'K for a reaction is 2.0 at 300 K and 8.0 at 400 K. Find Delta H° assuming temperature independence.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Apply Van \'t Hoff: ln(8/2) = - (Delta H° / 8.314) * (1/400 - 1/300).',
                      'ln(4) = 1.3863 = - (Delta H° / 8.314) * (0.0025 - 0.003333) = (Delta H° / 8.314) * 0.0008333.',
                      'Delta H° = 1.3863 * 8.314 / 0.0008333 = 13,845 J/mol = 13.8 kJ/mol.',
                    ],
                    finalAnswer: '+13.8 kJ/mol (Endothermic)',
                    keyTakeaway: 'Positive Delta H° matches increase in K with rising temperature.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-vh-01',
                    trapTitle: 'Mixing up T1 and T2 order in 1/T2 - 1/T1 subtraction',
                    flawedReasoning: 'Using (1/T1 - 1/T2) without accounting for the negative sign.',
                    correctConcept: 'Keep consistent pairing between K2, T2 and K1, T1.',
                    counterExample: 'Inverting terms inverts the sign of Delta H°.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For an exothermic reaction, what happens to the equilibrium constant K when temperature is increased?',
                  options: ['K decreases', 'K increases', 'K remains exactly constant', 'K drops to zero'],
                  correctIndex: 0,
                  explanation: 'Exothermic reactions have negative Delta H°; raising temperature shifts equilibrium toward reactants, decreasing K.',
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
    chapterId: 'cs-ch-ict-international-coding',
    topics: [
      {
        id: 'cs-topic-ict-advanced-algorithms',
        title: 'ICT International Coding Test: Advanced Data Structures & Graph Algorithms',
        description: 'Segment trees, Fenwick trees (Binary Indexed Trees), Dijkstra with priority queue, and dynamic programming on trees.',
        estimatedHours: 10,
        subtopics: [
          {
            id: 'cs-sub-segment-trees',
            title: 'Segment Trees & Range Minimum/Sum Queries',
            description: 'Efficient O(log n) point updates and range queries over static and lazy-propagated arrays.',
            concepts: [
              {
                id: 'concept-ict-segment-tree',
                title: 'Segment Tree Range Queries & Lazy Propagation',
                summary: 'Data structure storing interval aggregates in a binary tree representation supporting logarithmic updates and queries.',
                difficulty: 'hard',
                estimatedMinutes: 28,
                xpReward: 55,
                examTracks: ['all', 'ict_hackathon', 'ai_ml_foundations'],
                formalDefinition: 'A complete binary tree over array of size n where each node represents interval [L, R], root covers [0, n-1], and child nodes split intervals at mid = (L+R)/2.',
                intuitiveExplanation: 'Instead of linear O(n) scans for range sums or maximums, segment trees pre-aggregate intervals so queries jump across tree heights in O(log n).',
                keyFormulas: [
                  {
                    label: 'Tree Array Size Allocation',
                    latex: '\\text{Size} = 2^{\\lceil \\log_2 n \\rceil + 1}',
                    explanation: 'Safe upper bound array size for iterative or recursive segment tree storage.',
                  },
                ],
                keyObservations: [
                  'Lazy propagation is required when range updates (e.g. add v to all elements in [L, R]) are performed.',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-seg-01',
                    title: 'Range Sum Query Time Complexity',
                    problemStatement: 'What is the worst-case time complexity of a range sum query on a Segment Tree of size N?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'At each tree level, at most 4 nodes are visited during a range query interval overlap check.',
                      'Tree height is ceil(log2 N), so max nodes visited is bounded by 4 * log2 N.',
                      'Complexity is O(log N).',
                    ],
                    finalAnswer: 'O(log N)',
                    keyTakeaway: 'Logarithmic height ensures sub-millisecond queries even for N = 1,000,000.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-seg-01',
                    trapTitle: 'Allocating array of size 4N without power-of-two padding',
                    flawedReasoning: 'Using exact size N for tree storage.',
                    correctConcept: 'Tree indexing requires 4N storage capacity to prevent out-of-bounds index errors.',
                    counterExample: 'Index overflow in right child 2*idx + 1 on non-power-of-two sizes.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the time complexity of a point update in a Fenwick Tree (Binary Indexed Tree) of size N?',
                  options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'],
                  correctIndex: 0,
                  explanation: 'Fenwick trees update prefix sums by manipulating least significant bits (LSB) in O(log N) steps.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
