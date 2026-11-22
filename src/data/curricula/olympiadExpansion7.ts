import { ChapterAddition } from './curriculumExpansion';

/**
 * Olympiad & International Exam Expansion (Olympiad Expansion 7)
 * Registers dedicated multi-topic chapters (`newChapter`) across:
 *  - Physics (IPhO Wave Optics, Analytical Mechanics & Electrodynamics)
 *  - Chemistry (IChO Thermodynamics, Electrochemistry & Ligand Fields)
 *  - Biology (IBHO / IJSO Enzymology, Bioenergetics & Population Genetics)
 *  - Computer Science (ICT International Coding Test: Segment Trees, BIT, Graphs & DP)
 *  - Mathematics (INMO Functional Equations, Inequalities & Number Theory)
 *  - Data Science (Olympiad Information Theory, ROC-AUC, Boosting & SVD)
 */

export const OLYMPIAD_EXPANSION_7: ChapterAddition[] = [
  {
    subjectId: 'physics',
    chapterId: 'phys-ch-ipho-olympiad',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_advanced'],
    newChapter: {
      id: 'phys-ch-ipho-olympiad',
      title: 'IPhO Olympiad: Wave Optics, Lagrangians & Electrodynamics',
      sequenceOrder: 9,
      description:
        'International Physics Olympiad (IPhO) modules spanning thin-film phase shifts, diffraction resolving power, Euler-Lagrange dynamics, and Poynting energy flux.',
    },
    topics: [
      {
        id: 'phys-topic-ipho-wave-optics',
        title: 'IPhO Wave Optics & Interference Invariants',
        description: 'Thin-film phase reversal, optical path difference, and diffraction grating resolving power.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'phys-sub-thin-film-diffraction',
            title: 'Thin-Film Phase Shifts & Grating Resolution',
            description: 'Phase shifts upon reflection (π shift on denser boundary) and Rayleigh resolving power R = λ/Δλ.',
            concepts: [
              {
                id: 'concept-ipho-thin-film',
                title: 'Thin-Film Interference & Phase Reversal',
                summary: 'Constructive and destructive reflection conditions in layered dielectric films accounting for interfacial π phase shifts.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 50,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'For normal incidence on a film of thickness t and refractive index n₂ between media n₁ and n₃, a π phase inversion occurs at each boundary where light encounters a higher refractive index. Constructive reflection satisfies 2n₂t = (m + 1/2)λ when exactly one interface inverts phase.',
                intuitiveExplanation:
                  'Reflection off a denser optical boundary flips the wave crest upside down just like a pulse hitting a fixed wall on a stretched string, toggling whether whole-wavelength path differences appear bright or dark.',
                keyFormulas: [
                  {
                    label: 'One Phase Reversal Condition',
                    latex: '2n_2 t = \\left(m + \\frac{1}{2}\\right)\\lambda \\quad (\\text{constructive reflection})',
                    explanation: 'Use when exactly one reflecting boundary satisfies n_next > n_prev.',
                  },
                  {
                    label: 'Zero or Two Phase Reversals (Destructive)',
                    latex: '2n_2 t = \\left(m + \\frac{1}{2}\\right)\\lambda \\quad (\\text{anti-reflective})',
                    explanation: 'Anti-reflective coatings satisfy n₁ < n₂ < n₃ so both boundaries invert and cancel.',
                  },
                ],
                keyObservations: [
                  'Compare n₁ vs n₂ and n₂ vs n₃ separately before writing the path difference equation.',
                  'Optical path difference is evaluated inside the film medium with wavelength λ/n₂.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-film-01',
                    title: 'Minimum Anti-Reflective Coating Thickness',
                    problemStatement:
                      'Find the minimum non-zero thickness t (in nm) of a MgF₂ coating (n₂ = 1.38) on crown glass (n₃ = 1.52) to cancel reflection of λ = 550 nm light in air (n₁ = 1.00).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Both air-to-MgF₂ (1.00 < 1.38) and MgF₂-to-glass (1.38 < 1.52) undergo 180° phase shifts, so net boundary shift is 0.',
                      'Destructive reflection therefore requires 2n₂t = (m + 1/2)λ; for minimum non-zero t take m = 0.',
                      'Compute t = 550 / (4 × 1.38) = 99.6 nm.',
                    ],
                    finalAnswer: '99.6 nm',
                    keyTakeaway: 'Double phase-shift boundaries swap constructive and destructive formulas relative to soap films in air.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-film-01',
                    trapTitle: 'Using vacuum wavelength instead of medium optical path 2n₂t',
                    flawedReasoning: 'Setting 2t = λ/2 without multiplying t by n₂.',
                    correctConcept: 'Phase accumulation inside the dielectric scales with refractive index n₂.',
                    counterExample: 'Ignoring n₂ = 1.38 overestimates MgF₂ thickness by 38%.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When light in air (n = 1.00) reflects off water (n = 1.33), what phase shift occurs on reflection?',
                  options: ['180° (π radians)', '0° (no phase shift)', '90° (π/2 radians)', '270° (3π/2 radians)'],
                  correctIndex: 0,
                  explanation: 'Reflecting off an optically denser medium (n_next > n_prev) imposes an immediate π phase reversal.',
                },
              },
              {
                id: 'concept-ipho-grating-resolving',
                title: 'Diffraction Grating Dispersion & Chromatic Resolving Power',
                summary: 'Resolve adjacent spectral lines using Rayleigh criterion R = λ/Δλ = mN across m-th order diffraction with N illuminated slits.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'For a plane transmission grating with groove spacing d illuminated across N rulings at diffraction order m, the principal maxima satisfy d sinθ = mλ and chromatic resolving power equals R = λ / Δλ_min = mN.',
                intuitiveExplanation:
                  'Illuminating more grooves sharpens every principal maximum because tiny wavelength offsets quickly throw distant slits out of phase, allowing closely spaced spectral doublets to separate cleanly.',
                keyFormulas: [
                  {
                    label: 'Grating Principal Maxima',
                    latex: 'd\\sin\\theta = m\\lambda',
                    explanation: 'm is the diffraction order integer.',
                  },
                  {
                    label: 'Chromatic Resolving Power',
                    latex: 'R = \\frac{\\lambda}{\\Delta\\lambda_{\\min}} = mN',
                    explanation: 'Depends solely on order m and total illuminated slits N, independent of groove width.',
                  },
                ],
                keyObservations: [
                  'Highest observable order satisfies m_max = floor(d / λ).',
                  'Missing orders occur when principal grating maxima align with single-slit diffraction minima.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-grating-01',
                    title: 'Resolving the Sodium D Doublet',
                    problemStatement:
                      'How many illuminated rulings N are minimally needed on a diffraction grating to resolve the Sodium D doublet (λ₁ = 589.0 nm, λ₂ = 589.6 nm) in the second order (m = 2)?',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Compute average wavelength λ ≈ 589.3 nm and separation Δλ = 0.6 nm.',
                      'Required resolving power R = λ / Δλ = 589.3 / 0.6 ≈ 982.2.',
                      'Using R = mN with m = 2: N = 982.2 / 2 ≈ 492 slits.',
                    ],
                    finalAnswer: '492',
                    keyTakeaway: 'Always round slit counts upward to guarantee complete Rayleigh separation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-grating-01',
                    trapTitle: 'Confusing grating resolution with groove spacing d',
                    flawedReasoning: 'Halving d doubles resolving power even when N stays fixed.',
                    correctConcept: 'For fixed illuminated slit count N and order m, R = mN is unchanged.',
                    counterExample: 'A narrower beam covering half the grating halves R even with identical line density.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Doubling both the diffraction order m and the number of illuminated rulings N changes chromatic resolving power R by what factor?',
                  options: ['4×', '2×', '1× (unchanged)', '0.5×'],
                  correctIndex: 0,
                  explanation: 'Since R = mN, doubling both m and N multiplies resolving power by 2 × 2 = 4.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-ipho-analytical-em',
        title: 'IPhO Analytical Mechanics & Electrodynamics',
        description: 'Generalized Lagrangian coordinates, cyclic momenta conservation, Faraday disk EMF, and Poynting flux.',
        estimatedHours: 9,
        subtopics: [
          {
            id: 'phys-sub-lagrangian-electrodynamics',
            title: 'Euler-Lagrange Invariants & Poynting Energy Transport',
            description: 'Symmetry-to-conservation correspondence via Noether cyclic coordinates and field energy conservation.',
            concepts: [
              {
                id: 'concept-ipho-lagrangian-generalized',
                title: 'Euler-Lagrange Equations & Cyclic Coordinate Conservation',
                summary: 'Derive equations of motion in arbitrary generalized coordinates q_i from L = T - V and extract conserved canonical momenta.',
                difficulty: 'hard',
                estimatedMinutes: 26,
                xpReward: 55,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'For a holonomic system with Lagrangian L(q, q̇, t) = T - V, stationary action yields d/dt(∂L/∂q̇_i) - ∂L/∂q_i = 0. Whenever ∂L/∂q_k = 0 (cyclic coordinate), the conjugate momentum p_k = ∂L/∂q̇_k is strictly conserved.',
                intuitiveExplanation:
                  'Instead of chasing unknown constraint forces like rod tension or normal reactions, Lagrangians focus purely on kinetic minus potential energy and turn every coordinate symmetry directly into a conserved quantity.',
                keyFormulas: [
                  {
                    label: 'Euler-Lagrange Equation',
                    latex: '\\frac{d}{dt}\\left(\\frac{\\partial L}{\\partial \\dot{q}_i}\\right) - \\frac{\\partial L}{\\partial q_i} = 0',
                    explanation: 'Holds across polar, cylindrical, or moving constraint coordinates.',
                  },
                ],
                keyObservations: [
                  'Cyclic angular coordinate θ gives conservation of canonical angular momentum.',
                  'L = T - V is scalar, eliminating vector reaction-force decomposition mistakes.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-lag-01',
                    title: 'Atwood Pulley Reduced Acceleration',
                    problemStatement:
                      'For a massless pulley with masses m₁ = 5 kg and m₂ = 3 kg under g = 10 m/s², find the magnitude of downward acceleration of m₁ in m/s² using L = T - V.',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Let x be the downward displacement of m₁: T = (1/2)(m₁ + m₂)ẋ² and V = -(m₁ - m₂)gx.',
                      'Apply Euler-Lagrange: (m₁ + m₂)ẍ = (m₁ - m₂)g.',
                      'Substitute values: a = ((5 - 3) / (5 + 3)) × 10 = 2.5 m/s².',
                    ],
                    finalAnswer: '2.5',
                    keyTakeaway: 'Effective inertia equals total mass (m₁ + m₂) while generalized force equals weight difference.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-lag-01',
                    trapTitle: 'Using T + V instead of T - V inside the Lagrangian',
                    flawedReasoning: 'Writing L = T + V because total mechanical energy is E = T + V.',
                    correctConcept: 'Action minimization requires L = T - V; T + V produces inverted forces.',
                    counterExample: 'Setting L = T + V reverses the sign of gravitational acceleration.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a system’s Lagrangian L does not explicitly contain coordinate φ (∂L/∂φ = 0), which quantity is guaranteed constant in time?',
                  options: [
                    'Conjugate momentum p_φ = ∂L/∂φ̇',
                    'Kinetic energy T alone',
                    'Generalized velocity φ̇ alone',
                    'Potential energy V alone',
                  ],
                  correctIndex: 0,
                  explanation: 'When ∂L/∂φ = 0, Euler-Lagrange reduces directly to d(∂L/∂φ̇)/dt = 0.',
                },
              },
              {
                id: 'concept-ipho-faraday-poynting',
                title: 'Homopolar Faraday Disk EMF & Poynting Energy Flux',
                summary: 'Analyze motional EMF along rotating conductors and electromagnetic power transport S = (1/μ₀)(E × B).',
                difficulty: 'hard',
                estimatedMinutes: 25,
                xpReward: 52,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'A conducting disk of radius R rotating at angular speed ω in a uniform axial magnetic field B generates radial motional EMF ε = ∫₀ᴿ (ωr)B dr = (1/2)BωR². Field energy flux density obeys the Poynting vector S = (E × B)/μ₀.',
                intuitiveExplanation:
                  'Charges further from the hub sweep magnetic field lines faster (v = ωr), so integrating vB from center to rim gives half the rectangular loop factor (1/2)BωR².',
                keyFormulas: [
                  {
                    label: 'Faraday Rotating Disk EMF',
                    latex: '\\mathcal{E} = \\frac{1}{2} B \\omega R^2',
                    explanation: 'Measured between center axle brush and outer rim brush.',
                  },
                  {
                    label: 'Poynting Vector',
                    latex: '\\vec{S} = \\frac{1}{\\mu_0}(\\vec{E} \\times \\vec{B})',
                    explanation: 'Gives instantaneous electromagnetic power per unit area in W/m².',
                  },
                ],
                keyObservations: [
                  'Power dissipated in a current-carrying resistor actually enters radially inward through surrounding fields via S.',
                ],
                workedExamples: [
                  {
                    id: 'we-ipho-em-01',
                    title: 'Homopolar Generator Rim Voltage',
                    problemStatement:
                      'A copper disk of radius R = 0.4 m spins at ω = 50 rad/s perpendicular to a uniform B = 0.2 T magnetic field. Compute the center-to-rim EMF in Volts.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Apply ε = (1/2) B ω R².',
                      'Substitute B = 0.2, ω = 50, R² = 0.16.',
                      'ε = 0.5 × 0.2 × 50 × 0.16 = 0.8 V.',
                    ],
                    finalAnswer: '0.8',
                    keyTakeaway: 'Linear radial velocity variation creates the 1/2 prefactor.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ipho-em-01',
                    trapTitle: 'Applying N dΦ/dt blindly to steady-state rotating disks',
                    flawedReasoning: 'Concluding ε = 0 because the circular area of the disk intercepts constant total flux.',
                    correctConcept: 'Use Lorentz force v × B along the radial conductor segment between the stationary brushes.',
                    counterExample: 'Faraday homopolar generators produce steady DC voltage even under constant axial B.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a resistor carries steady DC current axially upward while an external electric field E points upward along the wire, which direction does the Poynting vector S = (E × B)/μ₀ point around the wire surface?',
                  options: [
                    'Radially inward toward the wire axis',
                    'Radially outward away from the wire',
                    'Parallel to the current direction',
                    'Opposite to the current direction',
                  ],
                  correctIndex: 0,
                  explanation: 'E points axially and B circles azimuthally; by the right-hand rule E × B points radially inward, delivering Joule heat.',
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
    chapterId: 'chem-ch-icho-olympiad',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_advanced'],
    newChapter: {
      id: 'chem-ch-icho-olympiad',
      title: 'IChO Olympiad: Equilibria, Electrochemistry & Ligand Fields',
      sequenceOrder: 9,
      description:
        'International Chemistry Olympiad (IChO) modules covering Van ’t Hoff and Clausius-Clapeyron thermodynamics, Nernst free energy, and Octahedral Crystal Field Splitting Δ_o.',
    },
    topics: [
      {
        id: 'chem-topic-icho-thermo-phase',
        title: 'IChO Chemical Thermodynamics & Van ’t Hoff Equilibria',
        description: 'Temperature dependence of equilibrium constants and phase-boundary vapor pressure equations.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'chem-sub-vant-hoff-clausius',
            title: 'Van ’t Hoff & Clausius-Clapeyron Equations',
            description: 'Extracting reaction enthalpy ΔH° and vaporization enthalpy ΔH_vap from logarithmic equilibrium/pressure ratios.',
            concepts: [
              {
                id: 'concept-icho-vant-hoff',
                title: 'Van ’t Hoff Equation & Equilibrium Temperature Shift',
                summary: 'Predict quantitatively how equilibrium constant K varies across temperatures from reaction enthalpy ΔH°.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 48,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Starting from ΔG° = -RT ln K = ΔH° - TΔS°, differentiation gives d(ln K)/dT = ΔH° / (RT²), integrating to ln(K₂/K₁) = -(ΔH°/R)(1/T₂ - 1/T₁) over intervals where ΔH° is constant.',
                intuitiveExplanation:
                  'Endothermic reactions absorb heat and climb toward higher K when warmed; exothermic reactions release heat so raising temperature pushes equilibrium backward.',
                keyFormulas: [
                  {
                    label: 'Integrated Van ’t Hoff Equation',
                    latex: '\\ln\\!\\left(\\frac{K_2}{K_1}\\right) = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)',
                    explanation: 'Always convert temperatures to Kelvin and match R = 8.314 J/(mol·K) with ΔH° in J/mol.',
                  },
                ],
                keyObservations: [
                  'Plotting ln(K) vs 1/T yields a straight line with slope -ΔH°/R.',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-vh-01',
                    title: 'Extracting ΔH° from Two Equilibrium Temperatures',
                    problemStatement:
                      'Equilibrium constant K equals 2.0 at 300 K and 8.0 at 400 K. Calculate ΔH° in kJ/mol assuming constant enthalpy (to 1 decimal place).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Substitute into Van ’t Hoff: ln(8/2) = ln(4) = -(ΔH° / 8.314)(1/400 - 1/300).',
                      'Simplify (1/400 - 1/300) = -1/1200 K⁻¹.',
                      'ΔH° = 1.3863 × 8.314 × 1200 = 13,831 J/mol ≈ 13.8 kJ/mol.',
                    ],
                    finalAnswer: '13.8',
                    keyTakeaway: 'K increasing with T strictly implies positive (endothermic) ΔH°.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-vh-01',
                    trapTitle: 'Using base-10 log without the ln(10) = 2.303 factor or Celsius temperatures',
                    flawedReasoning: 'Plugging log10(K₂/K₁) directly with °C into Van ’t Hoff.',
                    correctConcept: 'Use natural logarithm ln and absolute Kelvin temperatures.',
                    counterExample: 'Using 27 °C and 127 °C instead of 300 K and 400 K corrupts ΔH° by an order of magnitude.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For an exothermic reaction (ΔH° < 0), raising temperature causes the equilibrium constant K to:',
                  options: ['Decrease', 'Increase', 'Stay unchanged', 'Approach infinity'],
                  correctIndex: 0,
                  explanation: 'With ΔH° < 0 and T₂ > T₁, -(ΔH°/R)(1/T₂ - 1/T₁) is negative, making K₂ < K₁.',
                },
              },
              {
                id: 'concept-icho-clausius-clapeyron',
                title: 'Clausius-Clapeyron Phase Boundary Equation',
                summary: 'Relate equilibrium vapor pressure of liquids and solids to temperature via molar enthalpy of phase transition.',
                difficulty: 'medium_hard',
                estimatedMinutes: 20,
                xpReward: 44,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Along a liquid-vapor coexistence curve assuming ideal gas vapor and negligible condensed volume, d(ln P)/dT = ΔH_vap / (RT²), integrating to ln(P₂/P₁) = -(ΔH_vap/R)(1/T₂ - 1/T₁).',
                intuitiveExplanation:
                  'Higher temperature exponentially boosts the fraction of molecules exceeding intermolecular escape energy, sending saturation vapor pressure climbing steeply until boiling meets ambient pressure.',
                keyFormulas: [
                  {
                    label: 'Clausius-Clapeyron Equation',
                    latex: '\\ln\\!\\left(\\frac{P_2}{P_1}\\right) = -\\frac{\\Delta H_{\\text{vap}}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)',
                    explanation: 'Valid when ΔH_vap stays nearly constant over [T₁, T₂].',
                  },
                ],
                keyObservations: [
                  'Normal boiling point occurs where equilibrium vapor pressure reaches 1 atm (101.325 kPa).',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-cc-01',
                    title: 'Slope of Vapor Pressure Curve',
                    problemStatement:
                      'For a liquid with ΔH_vap = 41.57 kJ/mol, what is the slope d(ln P)/d(1/T) in Kelvin (use R = 8.314 J/mol·K)?',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Note slope of ln P vs (1/T) equals -ΔH_vap / R.',
                      'Convert ΔH_vap = 41,570 J/mol.',
                      'Compute -41,570 / 8.314 = -5000 K.',
                    ],
                    finalAnswer: '-5000',
                    keyTakeaway: 'Steeper negative slopes correspond to stronger intermolecular cohesion (higher ΔH_vap).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-cc-01',
                    trapTitle: 'Mixing kJ/mol for ΔH_vap with J/(mol·K) for R',
                    flawedReasoning: 'Dividing 41.57 directly by 8.314 without converting kJ to J.',
                    correctConcept: 'Always express both ΔH and R in Joules (×1000).',
                    counterExample: 'Missing the 10³ factor predicts boiling point shifts by thousands of degrees.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'At the normal boiling point of a pure liquid in an open beaker at 1 atm, its equilibrium vapor pressure equals:',
                  options: ['1.00 atm', '0.50 atm', '0.00 atm', '2.00 atm'],
                  correctIndex: 0,
                  explanation: 'Boiling occurs precisely when equilibrium vapor pressure matches external ambient pressure (1 atm).',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-icho-electro-ligand',
        title: 'IChO Electrochemistry & Coordination Ligand Fields',
        description: 'Nernst Gibbs free energy coupling, frost/latimer diagrams, and octahedral crystal field splitting Δ_o.',
        estimatedHours: 8,
        subtopics: [
          {
            id: 'chem-sub-nernst-cft',
            title: 'Nernst Thermodynamics & Crystal Field Stabilization',
            description: 'Non-additive standard potentials via ΔG° = -nFE° and d-orbital t_2g / e_g splitting.',
            concepts: [
              {
                id: 'concept-icho-nernst-gibbs',
                title: 'Nernst Equation & Non-Additivity of Half-Cell Potentials',
                summary: 'Combine half-reactions correctly through extensive Gibbs free energy ΔG° = -nFE° rather than directly adding intensive potentials.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Cell potential follows E = E° - (RT/nF) ln Q while ΔG° = -nFE°. When summing two half-reactions with electron counts n₁ and n₂ to form n₃ = n₁ + n₂, the composite potential satisfies E₃° = (n₁E₁° + n₂E₂°) / (n₁ + n₂).',
                intuitiveExplanation:
                  'Voltage measures energy per charge, just like price per kilogram; to combine two processes into one net change you must sum total energy (nE), never add raw voltages.',
                keyFormulas: [
                  {
                    label: 'Latimer Composite Potential',
                    latex: 'E_3^\\circ = \\frac{n_1 E_1^\\circ + n_2 E_2^\\circ}{n_1 + n_2}',
                    explanation: 'Derived directly from ΔG₃° = ΔG₁° + ΔG₂°.',
                  },
                ],
                keyObservations: [
                  'Disproportionation is spontaneous whenever the right-hand reduction potential exceeds the left-hand potential in a Latimer diagram.',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-nernst-01',
                    title: 'Composite Standard Potential in Iron Reduction',
                    problemStatement:
                      'Given Fe³⁺ + e⁻ → Fe²⁺ (E₁° = +0.77 V) and Fe²⁺ + 2e⁻ → Fe (E₂° = -0.44 V), compute E° (in V, to 3 decimals) for Fe³⁺ + 3e⁻ → Fe.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Use weighted average via ΔG° = -nFE°: n₃E₃° = n₁E₁° + n₂E₂°.',
                      'Substitute n₁ = 1, E₁° = 0.77, n₂ = 2, E₂° = -0.44, n₃ = 3.',
                      'E₃° = (1×0.77 + 2×(-0.44)) / 3 = (0.77 - 0.88) / 3 = -0.037 V.',
                    ],
                    finalAnswer: '-0.037',
                    keyTakeaway: 'Always weight standard half-cell potentials by electron stoichiometry n.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-nernst-01',
                    trapTitle: 'Adding two reduction half-cell E° values directly',
                    flawedReasoning: 'Computing 0.77 + (-0.44) = +0.33 V for Fe³⁺ → Fe.',
                    correctConcept: 'Voltage is an intensive property; add extensive Gibbs free energies ΔG° = -nFE° instead.',
                    counterExample: 'Wrongly predicts Fe³⁺ reduces spontaneously to metallic Fe vs H₂.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Why can you directly subtract cathode and anode reduction potentials for a balanced overall cell (E_cell° = E_cathode° - E_anode°), yet NOT add two reduction potentials to get a third reduction half-cell?',
                  options: [
                    'Because the balanced cell cancels equal electrons n on both sides, whereas combining two reduction steps changes n',
                    'Because Faraday’s constant F doubles during oxidation',
                    'Because Q = 1 only in balanced cells',
                    'Because oxidation potentials are always zero',
                  ],
                  correctIndex: 0,
                  explanation: 'When n_ox = n_red, the common factor n divides cleanly out of ΔG°; combining sequential reductions sums unequal electron steps.',
                },
              },
              {
                id: 'concept-icho-crystal-field-splitting',
                title: 'Octahedral Crystal Field Splitting (Δ_o) & Spin Pairing',
                summary: 'Determine high-spin vs low-spin d-electron configurations, CFSE, and spin-only magnetic moments in octahedral complexes.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 50,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'In an octahedral ligand field, five degenerate d-orbitals split into lower-energy triply degenerate t₂g (-0.4 Δ_o) and higher doubly degenerate e_g (+0.6 Δ_o) orbitals. Low-spin pairing occurs for d⁴–d⁷ when Δ_o > P (pairing energy).',
                intuitiveExplanation:
                  'Six ligands approaching along ±x, ±y, ±z repel d_x²-y² and d_z² lobes head-on, pushing them up in energy while letting t₂g orbitals tuck comfortably between the ligand axes.',
                keyFormulas: [
                  {
                    label: 'Octahedral CFSE',
                    latex: '\\text{CFSE} = (-0.4\\,n_{t_{2g}} + 0.6\\,n_{e_g})\\Delta_o',
                    explanation: 'Relative to spherical barycenter (excluding pairing energy P terms).',
                  },
                ],
                keyObservations: [
                  'Strong-field ligands (CN⁻, CO) raise Δ_o and favor low-spin complexes; weak-field halides favor high-spin.',
                ],
                workedExamples: [
                  {
                    id: 'we-icho-cft-01',
                    title: 'CFSE of Low-Spin Octahedral d⁶ Complex',
                    problemStatement:
                      'Compute the magnitude of Crystal Field Stabilization Energy (as a multiple of Δ_o) for low-spin [Fe(CN)₆]⁴⁻ (Fe²⁺ is d⁶).',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Fe²⁺ has 6 valence d-electrons; strong-field CN⁻ enforces low-spin configuration t₂g⁶ e_g⁰.',
                      'Compute CFSE = -0.4(6)Δ_o + 0.6(0)Δ_o = -2.4 Δ_o.',
                      'Magnitude is 2.4 Δ_o.',
                    ],
                    finalAnswer: '2.4',
                    keyTakeaway: 'Low-spin d⁶ maximizes t₂g stabilization and exhibits 0 unpaired electrons (diamagnetic).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-icho-cft-01',
                    trapTitle: 'Applying tetrahedral splitting energy values (-0.4/+0.6) to octahedral or vice versa',
                    flawedReasoning: 'Assuming t₂g sits above e_g in octahedral geometry.',
                    correctConcept: 'In octahedral complexes e_g (+0.6 Δ_o) is higher than t₂g (-0.4 Δ_o); tetrahedral inverts the order with Δ_t ≈ (4/9)Δ_o.',
                    counterExample: 'Inverting energy levels misassigns Jahn-Teller distortion in d⁹ Cu²⁺.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'How many unpaired electrons are present in high-spin octahedral d⁵ (such as [Fe(H₂O)₆]³⁺)?',
                  options: ['5', '1', '3', '0'],
                  correctIndex: 0,
                  explanation: 'When Δ_o < P (weak-field H₂O), Hund’s rule places one electron in each of t₂g³ and e_g², yielding 5 unpaired spins.',
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
    chapterId: 'bio-ch-ibho-ijso-olympiad',
    examTracks: ['all', 'nsejs', 'iapt_exams', 'stem_olympiad'],
    newChapter: {
      id: 'bio-ch-ibho-ijso-olympiad',
      title: 'IBHO & IJSO Olympiad: Enzymology, Bioenergetics & Genetics',
      sequenceOrder: 9,
      description:
        'International Biology (IBHO) and Junior Science (IJSO) Olympiad topics covering Michaelis-Menten inhibition, proton-motive ATP synthesis, population selection drift, and molecular cloning.',
    },
    topics: [
      {
        id: 'bio-topic-ibho-enzymology-bioenergetics',
        title: 'IBHO / IJSO Enzymology & Bioenergetics',
        description: 'Competitive, noncompetitive, and uncompetitive kinetics alongside chemiosmotic proton gradients.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'bio-sub-enzyme-atp',
            title: 'Michaelis-Menten Kinetics & Chemiosmotic ATP Synthase',
            description: 'Kinetic parameter shifts under inhibitors and proton-motive stoichiometry in oxidative phosphorylation.',
            concepts: [
              {
                id: 'concept-ibho-michaelis-menten',
                title: 'Michaelis-Menten Kinetics & Reversible Inhibition Patterns',
                summary: 'Distinguish competitive, noncompetitive, and uncompetitive enzyme inhibitors by how apparent V_max and K_m respond.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 46,
                examTracks: ['all', 'nsejs', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Initial catalytic rate follows v₀ = V_max [S] / (K_m + [S]). Competitive inhibitors bind the active site and raise apparent K_m without changing V_max; noncompetitive inhibitors reduce V_max at fixed K_m; uncompetitive inhibitors bind ES exclusively and lower both V_max and K_m proportionally.',
                intuitiveExplanation:
                  'Competitive inhibitors merely play musical chairs at the active site so flooding with substrate outcompetes them; noncompetitive inhibitors break the enzyme machinery itself, lowering ceiling throughput even at infinite substrate.',
                keyFormulas: [
                  {
                    label: 'Michaelis-Menten Rate Law',
                    latex: 'v_0 = \\frac{V_{\\max}[S]}{K_m + [S]}',
                    explanation: 'When [S] = K_m, initial velocity equals half of V_max.',
                  },
                ],
                keyObservations: [
                  'On Lineweaver-Burk 1/v₀ vs 1/[S] plots, uncompetitive inhibition produces parallel lines.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibho-mm-01',
                    title: 'Velocity at Fractional Substrate Saturation',
                    problemStatement:
                      'An enzyme has V_max = 120 μM/min and K_m = 10 μM. Compute initial reaction velocity v₀ (in μM/min) when [S] = 30 μM.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Plug into v₀ = V_max [S] / (K_m + [S]).',
                      'Compute 120 × 30 / (10 + 30) = 3600 / 40.',
                      'v₀ = 90 μM/min.',
                    ],
                    finalAnswer: '90',
                    keyTakeaway: 'At [S] = 3 K_m, catalysis runs at exactly 75% of V_max.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibho-mm-01',
                    trapTitle: 'Confusing K_m directly with substrate affinity direction',
                    flawedReasoning: 'Assuming higher K_m means tighter substrate binding.',
                    correctConcept: 'Lower K_m means half-maximal velocity is reached at lower substrate concentration, indicating tighter binding.',
                    counterExample: 'Adding a competitive inhibitor raises apparent K_m, weakening apparent affinity.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which type of reversible enzyme inhibitor leaves V_max unchanged while increasing apparent K_m?',
                  options: ['Competitive inhibitor', 'Noncompetitive inhibitor', 'Uncompetitive inhibitor', 'Irreversible suicide inhibitor'],
                  correctIndex: 0,
                  explanation: 'High [S] completely outcompetes active-site competitive blockers, restoring true V_max.',
                },
              },
              {
                id: 'concept-ibho-chemiosmotic-atp',
                title: 'Chemiosmotic Coupling & Proton-Motive Force',
                summary: 'Quantify electrochemical H⁺ gradients across the inner mitochondrial membrane driving F₀F₁-ATP synthase rotation.',
                difficulty: 'hard',
                estimatedMinutes: 20,
                xpReward: 44,
                examTracks: ['all', 'nsejs', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'Proton-motive force combines membrane voltage Δψ and pH gradient: Δp = Δψ - (2.303 RT/F)ΔpH. Protons flowing down Δp through the F₀ c-ring drive conformational ATP synthesis on F₁.',
                intuitiveExplanation:
                  'Electron transport pumps protons into the intermembrane space like water behind a hydroelectric dam; both electrical attraction and H⁺ concentration pressure spin the ATP synthase turbine.',
                keyFormulas: [
                  {
                    label: 'Proton-Motive Force (37 °C)',
                    latex: '\\Delta p = \\Delta\\psi - 0.0615\\,\\Delta\\text{pH}',
                    explanation: 'Both inside-negative membrane potential and acidic exterior boost Δp.',
                  },
                ],
                keyObservations: [
                  'Chemical uncouplers like DNP dissipate Δp by ferrying H⁺ across membranes, accelerating O₂ consumption and heat release without ATP synthesis.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibho-atp-01',
                    title: 'P/O Stoichiometry Comparison',
                    problemStatement:
                      'Under standard mammalian stoichiometry where 10 H⁺ are pumped per NADH, 6 H⁺ per FADH₂, and 4 H⁺ are consumed per ATP synthesized/exported, how many net ATP are produced from 1 NADH + 1 FADH₂?',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Total protons pumped = 10 + 6 = 16 H⁺.',
                      'Divide by 4 H⁺ per ATP: 16 / 4 = 4 ATP.',
                    ],
                    finalAnswer: '4',
                    keyTakeaway: 'NADH yields ~2.5 ATP and FADH₂ yields ~1.5 ATP because Complex I is bypassed by FADH₂.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibho-atp-01',
                    trapTitle: 'Assuming uncouplers inhibit the electron transport chain directly',
                    flawedReasoning: 'Believing DNP blocks Complex IV oxygen reduction like cyanide.',
                    correctConcept: 'Uncouplers collapse the proton gradient so ETC speeds up uninhibited while ATP synthesis halts.',
                    counterExample: 'DNP causes hyperthermia precisely because respiration accelerates into pure heat.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Adding an ionophore proton uncoupler (such as DNP) to actively respiring mitochondria causes oxygen consumption to:',
                  options: [
                    'Increase rapidly while ATP synthesis drops toward zero',
                    'Stop completely while ATP surges',
                    'Reverse to generate oxygen gas',
                    'Remain unchanged alongside ATP rate',
                  ],
                  correctIndex: 0,
                  explanation: 'Removing back-pressure from the proton gradient allows NADH oxidation and O₂ reduction to run maximally without making ATP.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-ibho-genetics-cloning',
        title: 'IBHO Population Genetics & Molecular Cloning',
        description: 'Quantitative Hardy-Weinberg selection dynamics and restriction/qPCR assay calculations.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'bio-sub-genetics-qpcr',
            title: 'Allele Frequency Shifts & Quantitative PCR Analysis',
            description: 'Selection coefficients on genotypes and Ct cycle threshold folding in qPCR.',
            concepts: [
              {
                id: 'concept-ibho-hardy-weinberg-selection',
                title: 'Hardy-Weinberg Deviations & Heterozygote Advantage',
                summary: 'Compute equilibrium allele frequencies maintained under balancing selection where heterozygote fitness exceeds both homozygotes.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 46,
                examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'When genotypes AA, Aa, aa have relative fitnesses 1 - s₁, 1, and 1 - s₂ respectively, balancing selection maintains stable equilibrium allele frequency p̂ = s₂ / (s₁ + s₂).',
                intuitiveExplanation:
                  'Whenever heterozygotes out-survive both purebred lines (like sickle-cell carriers in malaria zones), natural selection preserves both alleles instead of driving one to extinction.',
                keyFormulas: [
                  {
                    label: 'Overdominance Equilibrium',
                    latex: '\\hat{p} = \\frac{s_2}{s_1 + s_2}, \\quad \\hat{q} = \\frac{s_1}{s_1 + s_2}',
                    explanation: 'Equal selection penalties yield symmetric p̂ = q̂ = 0.5.',
                  },
                ],
                keyObservations: [
                  'Hardy-Weinberg proportions apply only after one generation of random mating without selection, migration, mutation, or genetic drift.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibho-hw-01',
                    title: 'Equilibrium Frequency Under Asymmetric Selection',
                    problemStatement:
                      'Heterozygotes Aa have fitness 1.0, AA has fitness 0.8 (s₁ = 0.2), and aa has fitness 0.4 (s₂ = 0.6). Calculate the equilibrium frequency of allele A.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Apply balancing equilibrium formula p̂ = s₂ / (s₁ + s₂).',
                      'Compute p̂ = 0.6 / (0.2 + 0.6) = 0.6 / 0.8 = 0.75.',
                    ],
                    finalAnswer: '0.75',
                    keyTakeaway: 'The fitter homozygote’s allele settles at higher equilibrium frequency.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibho-hw-01',
                    trapTitle: 'Dividing by s₂ instead of (s₁ + s₂) or swapping s₁ and s₂',
                    flawedReasoning: 'Assigning p̂ = s₁ / (s₁ + s₂), giving high frequency to the penalized allele.',
                    correctConcept: 'Allele A equilibrium frequency is proportional to the penalty s₂ on the opposing aa homozygote.',
                    counterExample: 'If s₂ = 0.8 (aa almost lethal), allele A dominates with p̂ near 1.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a population starts at non-HWE genotype counts (say 50% AA and 50% aa, with 0% Aa) and immediately begins random mating with no evolutionary forces, how many generations are needed to restore exact Hardy-Weinberg genotype ratios?',
                  options: ['1 generation', '2 generations', '5 generations', 'Infinite generations'],
                  correctIndex: 0,
                  explanation: 'Random union of gametes immediately resets genotype proportions to p², 2pq, q² in a single generation.',
                },
              },
              {
                id: 'concept-ibho-qpcr-cloning',
                title: 'Quantitative PCR (ΔΔCt) & Restriction Mapping',
                summary: 'Quantify relative mRNA transcript abundance using ΔΔCt exponential fold-change and circular plasmid fragment sizing.',
                difficulty: 'medium_hard',
                estimatedMinutes: 18,
                xpReward: 40,
                examTracks: ['all', 'nsejs', 'iapt_exams', 'stem_olympiad'],
                formalDefinition:
                  'At 100% PCR amplification efficiency, target abundance doubles every thermal cycle, yielding relative fold expression 2^(-ΔΔCt) where ΔΔCt = (Ct_target,treated - Ct_ref,treated) - (Ct_target,ctrl - Ct_ref,ctrl).',
                intuitiveExplanation:
                  'Each 1-cycle shift earlier in threshold crossing means you started with twice as much DNA; subtracting a housekeeping gene removes pipetting variations.',
                keyFormulas: [
                  {
                    label: 'Livak 2^(-ΔΔCt) Fold Change',
                    latex: '\\text{Fold Change} = 2^{-\\Delta\\Delta C_t}',
                    explanation: 'Lower Ct values denote higher initial transcript abundance.',
                  },
                ],
                keyObservations: [
                  'A ΔCt decrease of 3 cycles corresponds to an 8-fold increase in initial cDNA.',
                ],
                workedExamples: [
                  {
                    id: 'we-ibho-qpcr-01',
                    title: 'Transcript Fold Upregulation from qPCR Shift',
                    problemStatement:
                      'A treated sample crosses threshold 4 cycles earlier than control after normalizing to GAPDH (ΔΔCt = -4). What is the fold change in gene expression?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Apply Fold Change = 2^(-ΔΔCt).',
                      'Substitute ΔΔCt = -4: 2^(-(-4)) = 2⁴ = 16.',
                    ],
                    finalAnswer: '16',
                    keyTakeaway: 'Earlier threshold crossing (negative ΔΔCt) always means upregulation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ibho-qpcr-01',
                    trapTitle: 'Treating larger Ct as higher concentration',
                    flawedReasoning: 'Assuming Ct = 28 contains more template than Ct = 20.',
                    correctConcept: 'Smaller Ct requires fewer doubling cycles to cross threshold, meaning greater initial template.',
                    counterExample: 'Diluting template 1:8 increases Ct by +3 cycles.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When a linear DNA molecule is digested with a restriction enzyme having 3 distinct recognition sites, how many fragments are produced (versus a circular plasmid with 3 sites)?',
                  options: [
                    '4 linear fragments vs 3 plasmid fragments',
                    '3 linear fragments vs 4 plasmid fragments',
                    '3 fragments for both',
                    '4 fragments for both',
                  ],
                  correctIndex: 0,
                  explanation: 'k cuts produce k+1 pieces on a linear strand and exactly k pieces on a closed circle.',
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
    chapterId: 'cs-ch-ict-olympiad',
    examTracks: ['all', 'ict_hackathon', 'ai_ml_foundations', 'stem_olympiad'],
    newChapter: {
      id: 'cs-ch-ict-olympiad',
      title: 'ICT International Coding Test: Range Trees, Graphs & DP',
      sequenceOrder: 9,
      description:
        'International Coding Test (ICT) algorithmic toolkit: Segment Trees with Lazy Propagation, Fenwick Binary Indexed Trees, Dijkstra vs Bellman-Ford shortest paths, and Bitmask/Tree DP.',
    },
    topics: [
      {
        id: 'cs-topic-ict-range-structures',
        title: 'ICT International Coding Test: Range Queries & Trees',
        description: 'Segment trees with lazy propagation and Fenwick Binary Indexed Trees for O(log N) prefix and interval aggregates.',
        estimatedHours: 10,
        subtopics: [
          {
            id: 'cs-sub-segment-fenwick',
            title: 'Segment Trees & Fenwick BIT',
            description: 'Logarithmic-time updates and queries across dynamic numeric arrays.',
            concepts: [
              {
                id: 'concept-ict-segment-tree',
                title: 'Segment Tree Range Queries & Lazy Propagation',
                summary: 'Hierarchical binary interval tree supporting O(log N) range queries and deferred lazy range updates.',
                difficulty: 'hard',
                estimatedMinutes: 28,
                xpReward: 55,
                examTracks: ['all', 'ict_hackathon', 'ai_ml_foundations'],
                formalDefinition:
                  'A binary tree over [0, N-1] storing associative monoid values per segment [L, R]. Splitting queries along mid = (L+R)/2 touches O(log N) disjoint intervals; lazy tags postpone child propagation until traversal reaches a descendant.',
                intuitiveExplanation:
                  'Instead of adding +5 to a million elements one by one, place a sticky note (+5) on a high-level summary node and only push that note downward when a future query actually peers inside its sub-intervals.',
                keyFormulas: [
                  {
                    label: 'Safe Static Tree Capacity',
                    latex: '\\text{Capacity} = 4N',
                    explanation: 'Bounds recursive 1-indexed binary heap storage 2·idx and 2·idx+1 for arbitrary N.',
                  },
                ],
                keyObservations: [
                  'Lazy propagation works cleanly for any distributive update-over-query pair such as range-add + range-sum.',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-seg-01',
                    title: 'Worst-Case Nodes Visited Per Level',
                    problemStatement:
                      'For an array of size N = 1,024 (2¹⁰), what is the exact tree height (number of edges from root to a single leaf)?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Segment tree halves interval size at each level.',
                      '1024 = 2¹⁰ halves cleanly 10 times to reach length-1 leaves.',
                      'Height = 10.',
                    ],
                    finalAnswer: '10',
                    keyTakeaway: '10 levels cover 1,024 elements, and 20 levels cover over a million.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-seg-01',
                    trapTitle: 'Forgetting to push lazy tags before branching into children during queries',
                    flawedReasoning: 'Only pushing lazy updates inside update() and not query().',
                    correctConcept: 'Both query() and update() must call push(node) before descending into 2·node and 2·node+1.',
                    counterExample: 'Stale child values cause queries inside updated ranges to return outdated answers.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the tight worst-case time complexity of a range-add update [L, R] using a Lazy Segment Tree on N elements?',
                  options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(√N)'],
                  correctIndex: 0,
                  explanation: 'At most 4 nodes per level are expanded along the two query boundaries, keeping work strictly O(log N).',
                },
              },
              {
                id: 'concept-ict-fenwick-bit',
                title: 'Fenwick Tree (Binary Indexed Tree) Bit-Trick Prefix Sums',
                summary: 'Compact O(N)-memory structure maintaining prefix aggregates in O(log N) via least significant set bit i & (-i).',
                difficulty: 'medium_hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'ict_hackathon'],
                formalDefinition:
                  'A 1-indexed array BIT[1..N] where BIT[i] stores the sum of the trailing lsb(i) = i & (-i) elements ending at i. Prefix queries clear LSBs via i -= i & (-i); updates add i += i & (-i).',
                intuitiveExplanation:
                  'Every index splits into power-of-two blocks matching its binary representation; jumping by the lowest set bit lets you assemble any prefix sum in at most log₂(N) hops using zero pointers.',
                keyFormulas: [
                  {
                    label: 'Lowest Set Bit Isolation',
                    latex: '\\text{LSB}(i) = i \\mathbin{\\&} (-i)',
                    explanation: 'Uses two’s complement bit arithmetic in O(1).',
                  },
                ],
                keyObservations: [
                  'Fenwick trees require only N+1 integers of memory—4× smaller and faster constant factor than recursive Segment Trees.',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-bit-01',
                    title: 'Prefix Sum Chain Length',
                    problemStatement:
                      'Using i -= i & (-i) starting from 1-indexed i = 13 (binary 1101₂), how many elements of BIT[] are summed to compute prefix_sum(13)?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      '13 = 1101₂ → LSB = 1 → next is 12 (1100₂).',
                      '12 = 1100₂ → LSB = 4 → next is 8 (1000₂).',
                      '8 = 1000₂ → LSB = 8 → next is 0 (stop).',
                      'Total BIT entries summed = 3 (matching popcount of 13).',
                    ],
                    finalAnswer: '3',
                    keyTakeaway: 'Prefix query hop count equals exact number of 1-bits (popcount) in index i.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-bit-01',
                    trapTitle: 'Using 0-based indexing in BIT loops',
                    flawedReasoning: 'Running while (i >= 0) { i += i & (-i); } starting at i = 0.',
                    correctConcept: 'Since 0 & (-0) == 0, starting updates at i = 0 causes an infinite loop; BIT must be 1-indexed.',
                    counterExample: 'Indexing from 1 ensures LSB >= 1 at every valid slot.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which standard query cannot be answered directly with a single Fenwick Tree storing sums without an auxiliary trick or Segment Tree?',
                  options: [
                    'Dynamic arbitrary Range Minimum Query [L, R] after decreases and increases',
                    'Dynamic prefix sum [1..R]',
                    'Dynamic subarray sum [L..R]',
                    'Inversion counting via coordinate compression',
                  ],
                  correctIndex: 0,
                  explanation: 'Minimum has no additive inverse (min(A) cannot subtract min(B)), unlike sum or XOR.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'cs-topic-ict-graphs-dp',
        title: 'ICT Shortest Paths & Dynamic Programming',
        description: 'Dijkstra priority-queue invariants, Bellman-Ford negative cycles, and Bitmask/Tree DP.',
        estimatedHours: 10,
        subtopics: [
          {
            id: 'cs-sub-graphs-dp',
            title: 'Weighted Graph Shortest Paths & State Compression DP',
            description: 'Choosing optimal O((V+E) log V) or O(VE) shortest-path algorithms and exponential state bitmasks.',
            concepts: [
              {
                id: 'concept-ict-dijkstra-bellman',
                title: 'Dijkstra Priority Queue vs Bellman-Ford Negative Weights',
                summary: 'Understand why greedy priority-queue relaxation fails on negative edges while Bellman-Ford detects negative cycles in V-1 passes.',
                difficulty: 'medium_hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'ict_hackathon'],
                formalDefinition:
                  'Dijkstra settles vertices in non-decreasing distance order in O((V + E) log V) assuming edge weights w(u, v) ≥ 0. Bellman-Ford relaxes all E edges V - 1 times in O(VE); a successful V-th relaxation proves a reachable negative-weight cycle.',
                intuitiveExplanation:
                  'With non-negative roads, taking more edges can never shrink a detour below what you have already found—so the closest unsettled node is permanently optimal; negative shortcuts break that guarantee.',
                keyFormulas: [
                  {
                    label: 'Dijkstra Binary Heap Time',
                    latex: 'T = O((V + E)\\log V)',
                    explanation: 'Optimal for sparse non-negative ICT contest graphs.',
                  },
                ],
                keyObservations: [
                  'Never skip stale priority-queue entries without checking if popped_dist > dist[u].',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-graph-01',
                    title: 'Bellman-Ford Maximum Edge Passes',
                    problemStatement:
                      'In a directed graph with V = 25 vertices and no negative cycles, at most how many full relaxation passes over all edges can reduce any simple shortest-path distance?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'A simple path over V vertices contains at most V - 1 edges.',
                      'Each pass extends guaranteed shortest paths by at least 1 edge.',
                      'Maximum useful passes = 25 - 1 = 24.',
                    ],
                    finalAnswer: '24',
                    keyTakeaway: 'If pass 25 still improves any dist[v], a negative cycle exists.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-graph-01',
                    trapTitle: 'Marking nodes visited upon push rather than upon priority-queue pop in Dijkstra',
                    flawedReasoning: 'Setting visited[v] = true the first time v is pushed with a suboptimal path.',
                    correctConcept: 'Mark visited (or check d > dist[u]) only when popping from the min-heap.',
                    counterExample: 'Push-marking locks in a slow 1-hop path over a cheaper 2-hop path.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Adding a large constant C to every edge weight in a graph containing negative edges fixes Dijkstra’s algorithm for general shortest paths:',
                  options: [
                    'False — paths with more edges receive disproportionately larger penalties C·k',
                    'True — adding a uniform shift preserves path ordering',
                    'True only for undirected graphs',
                    'True whenever C > max edge weight',
                  ],
                  correctIndex: 0,
                  explanation: 'Johnson’s algorithm reweights via vertex potentials h(u) - h(v) that telescope along paths, whereas adding constant C penalizes longer paths.',
                },
              },
              {
                id: 'concept-ict-bitmask-tree-dp',
                title: 'Bitmask Subset DP & Rerooting Dynamic Programming on Trees',
                summary: 'Encode visited subset states in O(N²·2ᴺ) and evaluate all tree roots simultaneously in O(N) via two DFS passes.',
                difficulty: 'hard',
                estimatedMinutes: 26,
                xpReward: 55,
                examTracks: ['all', 'ict_hackathon'],
                formalDefinition:
                  'Bitmask DP stores state dp[mask][last] over integer subset mask ∈ [0, 2ⁿ - 1] with transitions testing (mask & (1 << next)) === 0. Rerooting tree DP combines bottom-up subtree answers down[u] with top-down parent contributions up[u].',
                intuitiveExplanation:
                  'When N ≤ 20, an ordinary 32-bit integer tracks every combination of visited cities in a single array index; on trees, shifting the root along an edge adjusts only two nodes’ contributions instead of recomputing the whole tree.',
                keyFormulas: [
                  {
                    label: 'TSP Bitmask Transition',
                    latex: '\\text{dp}[\\text{mask} \\mid 2^v][v] = \\min_{u \\in \\text{mask}} (\\text{dp}[\\text{mask}][u] + w(u, v))',
                    explanation: 'Solves Traveling Salesperson exactly for N ≤ 20.',
                  },
                ],
                keyObservations: [
                  'Total non-empty subsets across N items equals 2^N - 1.',
                ],
                workedExamples: [
                  {
                    id: 'we-ict-dp-01',
                    title: 'Bitmask State Count for Small Set',
                    problemStatement:
                      'For an ICT Held-Karp Traveling Salesperson instance with N = 8 vertices, how many distinct bitmask subsets exist (2⁸)?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Each vertex is either visited (1) or unvisited (0).',
                      '2⁸ = 256 possible masks.',
                    ],
                    finalAnswer: '256',
                    keyTakeaway: '2^N · N remains under 10⁷ operations well past N = 16.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ict-dp-01',
                    trapTitle: 'Operator precedence bugs in C++/JS bit tests: mask & (1 << i) == 0',
                    flawedReasoning: 'Omitting parentheses around (mask & (1 << i)).',
                    correctConcept: '== has higher precedence than &, so always wrap bitwise expressions in parentheses.',
                    counterExample: 'mask & (1 << i) == 0 evaluates as mask & 0 = 0 every time!',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If we run subset-over-subset iteration `for (sub = mask; sub > 0; sub = (sub - 1) & mask)` over all 2ⁿ masks of an N-element set, what is the exact total number of inner iterations?',
                  options: ['O(3ⁿ)', 'O(4ⁿ)', 'O(n · 2ⁿ)', 'O(2ⁿ)'],
                  correctIndex: 0,
                  explanation: 'Every element independently falls into 3 choices: outside mask, inside mask\sub, or inside sub, yielding 3ⁿ pairs.',
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
    chapterId: 'math-ch-inmo-olympiad',
    examTracks: ['all', 'stem_olympiad', 'jee_advanced'],
    newChapter: {
      id: 'math-ch-inmo-olympiad',
      title: 'INMO Olympiad: Inequalities, Functional Eqs & Vieta Jumping',
      sequenceOrder: 12,
      description:
        'Olympiad proof toolkit covering Titu’s Lemma (Engel Cauchy-Schwarz), Cauchy Functional Equations, Lifting the Exponent (LTE), and Extremal Monovariants.',
    },
    topics: [
      {
        id: 'math-topic-inmo-ineq-func',
        title: 'INMO Inequalities & Functional Equations',
        description: 'Engel form Cauchy-Schwarz fractional inequalities and additive Cauchy functional constraints.',
        estimatedHours: 9,
        subtopics: [
          {
            id: 'math-sub-cauchy-functional',
            title: 'Engel Form Inequalities & Additive Functions',
            description: 'Titu’s Lemma optimization and forcing linearity f(x) = cx via monotonicity/continuity.',
            concepts: [
              {
                id: 'concept-inmo-cauchy-engels',
                title: 'Titu’s Lemma (Engel Form of Cauchy-Schwarz)',
                summary: 'Lower-bound sums of ratios a_i² / b_i over positive denominators by aggregating numerators and denominators separately.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 50,
                examTracks: ['all', 'stem_olympiad', 'jee_advanced'],
                formalDefinition:
                  'For arbitrary real numbers a₁,…,aₙ and strictly positive reals b₁,…,bₙ, ∑(a_i² / b_i) ≥ (∑ a_i)² / (∑ b_i), with equality iff a_i / b_i is constant across all i.',
                intuitiveExplanation:
                  'Whenever fractions have squares on top and positive sums underneath, Cauchy-Schwarz collapses the entire sum of fractions into one single tidy fraction.',
                keyFormulas: [
                  {
                    label: 'Titu’s Lemma',
                    latex: '\\sum_{i=1}^{n} \\frac{a_i^2}{b_i} \\ge \\frac{\\left(\\sum_{i=1}^{n} a_i\\right)^2}{\\sum_{i=1}^{n} b_i}',
                    explanation: 'Direct corollary of Cauchy-Schwarz on vectors (a_i/√b_i) and (√b_i).',
                  },
                ],
                keyObservations: [
                  'Combine with AM-GM or Schur’s inequality for cyclic three-variable Olympiad bounds like Nesbitt’s inequality.',
                ],
                workedExamples: [
                  {
                    id: 'we-inmo-titu-01',
                    title: 'Minimum Value via Titu’s Lemma',
                    problemStatement:
                      'Given positive reals x, y, z with x + y + z = 6, find the minimum value of 1/x + 4/y + 9/z.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Write 1²/x + 2²/y + 3²/z ≥ (1 + 2 + 3)² / (x + y + z).',
                      'Substitute sum = 6: minimum = 6² / 6 = 36 / 6 = 6.',
                      'Check equality 1/x = 2/y = 3/z gives (x, y, z) = (1, 2, 3), which sums to 6.',
                    ],
                    finalAnswer: '6',
                    keyTakeaway: 'Always verify that equality conditions are simultaneously achievable within the domain.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-inmo-titu-01',
                    trapTitle: 'Applying Titu’s Lemma when denominators b_i can be negative',
                    flawedReasoning: 'Bounding a²/b₁ + c²/b₂ without checking sign of b₁, b₂.',
                    correctConcept: 'Positive denominators b_i > 0 are mandatory because √b_i must stay real.',
                    counterExample: 'Negative b_i breaks Cauchy-Schwarz direction.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For positive reals a, b, c, what is the minimum possible value of a/(b+c) + b/(c+a) + c/(a+b) (Nesbitt’s Inequality)?',
                  options: ['3/2', '1', '2', '3'],
                  correctIndex: 0,
                  explanation: 'Rewrite numerators as a²/(ab+ac) and apply Titu’s Lemma to get (a+b+c)² / (2(ab+bc+ca)) ≥ 3/2.',
                },
              },
              {
                id: 'concept-inmo-functional-cauchy',
                title: 'Cauchy Functional Equation & Rational Density',
                summary: 'Solve f(x + y) = f(x) + f(y) over ℚ and upgrade to f(x) = cx on ℝ via continuity, monotonicity, or boundedness.',
                difficulty: 'hard',
                estimatedMinutes: 24,
                xpReward: 50,
                examTracks: ['all', 'stem_olympiad'],
                formalDefinition:
                  'Any additive map f: ℝ → ℝ satisfying f(x + y) = f(x) + f(y) satisfies f(qx) = q f(x) for all q ∈ ℚ. If f is also continuous at a single point, monotonic on an interval, or bounded from one side on an open interval, then f(x) = f(1)·x for all x ∈ ℝ.',
                intuitiveExplanation:
                  'Additivity pins down values on every fraction first; adding even mild smoothness prevents pathological Hamel-basis jumps and forces the graph onto a straight line through the origin.',
                keyFormulas: [
                  {
                    label: 'Cauchy Additive Property on ℚ',
                    latex: 'f\\!\\left(\\frac{p}{q}x\\right) = \\frac{p}{q}f(x), \\quad p,q \\in \\mathbb{Z},\\ q \\neq 0',
                    explanation: 'Follows inductively from integers down to unit fractions.',
                  },
                ],
                keyObservations: [
                  'Test x = 0, y = 0 first to determine f(0), then check injectivity/surjectivity substitutions.',
                ],
                workedExamples: [
                  {
                    id: 'we-inmo-func-01',
                    title: 'Evaluating Linear Monotone Additive Function',
                    problemStatement:
                      'A continuous function f: ℝ → ℝ satisfies f(x + y) = f(x) + f(y) for all real x, y and f(3) = 12. Find f(7).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Continuous additive Cauchy functions have the exact form f(x) = cx.',
                      'Using f(3) = 3c = 12 gives c = 4.',
                      'Compute f(7) = 4 × 7 = 28.',
                    ],
                    finalAnswer: '28',
                    keyTakeaway: 'Always verify that your candidate linear/constant family actually solves the original functional equation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-inmo-func-01',
                    trapTitle: 'Assuming f(x) = cx on ℝ without verifying regularity (continuity/monotonicity)',
                    flawedReasoning: 'Claiming additivity alone prevents non-linear functions on ℝ.',
                    correctConcept: 'Under the Axiom of Choice, wild non-measurable Hamel-basis solutions exist unless boundedness/monotonicity/continuity is given.',
                    counterExample: 'Over ℚ, f(qx) = q f(x) holds unconditionally; over ℝ you must invoke regularity.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If f: ℝ → ℝ satisfies f(x + y) = f(x) + f(y) for all real x, y, what must f(0) equal?',
                  options: ['0', '1', '-1', 'Any real constant'],
                  correctIndex: 0,
                  explanation: 'Setting x = 0, y = 0 yields f(0) = f(0) + f(0), forcing f(0) = 0.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'math-topic-inmo-nt-comb',
        title: 'INMO Number Theory & Combinatorial Invariants',
        description: 'Lifting the Exponent Lemma (LTE), Vieta Jumping, and Extremal Monovariants.',
        estimatedHours: 9,
        subtopics: [
          {
            id: 'math-sub-lte-extremal',
            title: 'Lifting the Exponent & Extremal Principle',
            description: 'Exact prime-power valuations v_p(aⁿ - bⁿ) and discrete descent arguments.',
            concepts: [
              {
                id: 'concept-inmo-vieta-lte',
                title: 'Lifting The Exponent Lemma (LTE) & Vieta Jumping',
                summary: 'Compute exact p-adic exponents v_p(xⁿ - yⁿ) and descend minimal counterexamples via Vieta root flipping.',
                difficulty: 'hard',
                estimatedMinutes: 26,
                xpReward: 55,
                examTracks: ['all', 'stem_olympiad'],
                formalDefinition:
                  'For odd prime p dividing x - y with p ∤ x, y, LTE gives v_p(xⁿ - yⁿ) = v_p(x - y) + v_p(n). In quadratic Diophantine equations x² - kxy + y² = c, Vieta jumping treats the larger variable as root of a quadratic and replaces it by the smaller companion root k·y - x.',
                intuitiveExplanation:
                  'LTE counts exact factors of a prime p inside differences of powers automatically, while Vieta jumping takes the smallest positive counterexample and leaps to an even smaller integer solution—proving none can exist.',
                keyFormulas: [
                  {
                    label: 'Odd Prime LTE Valuation',
                    latex: 'v_p(x^n - y^n) = v_p(x - y) + v_p(n)',
                    explanation: 'Valid when p is odd prime, p | (x - y), and p does not divide x or y.',
                  },
                ],
                keyObservations: [
                  'For p = 2, check n even separately using v₂(xⁿ - yⁿ) = v₂(x - y) + v₂(x + y) + v₂(n) - 1.',
                ],
                workedExamples: [
                  {
                    id: 'we-inmo-lte-01',
                    title: 'Exact 3-adic Valuation via LTE',
                    problemStatement:
                      'Compute v₃(7⁹ - 4⁹), the highest exponent k such that 3^k divides 7⁹ - 4⁹.',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Verify conditions: p = 3 is odd, 3 | (7 - 4), and 3 ∤ 7, 3 ∤ 4.',
                      'Apply LTE: v₃(7⁹ - 4⁹) = v₃(7 - 4) + v₃(9) = v₃(3) + v₃(3²).',
                      'Sum exponents: 1 + 2 = 3.',
                    ],
                    finalAnswer: '3',
                    keyTakeaway: 'Always check the divisibility preconditions (p | x - y and p ∤ x) before applying LTE.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-inmo-lte-01',
                    trapTitle: 'Applying odd-prime LTE to p = 2 when 4 ∤ (x - y)',
                    flawedReasoning: 'Writing v₂(3² - 1²) = v₂(2) + v₂(2) = 2 instead of 3.',
                    correctConcept: 'For p = 2 and even n, 2² splits as (x-y)(x+y), contributing v₂(x+y) - 1 extra power.',
                    counterExample: '3² - 1² = 8 has v₂(8) = 3, not 2.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Under odd prime LTE preconditions (p odd, p | x + y, p ∤ x, y), for which exponents n is v_p(xⁿ + yⁿ) = v_p(x + y) + v_p(n) valid?',
                  options: ['Odd positive integers n', 'Even positive integers n', 'Powers of two only', 'All real numbers n'],
                  correctIndex: 0,
                  explanation: 'Replacing y with -y preserves (-y)ⁿ = -yⁿ solely when n is odd.',
                },
              },
              {
                id: 'concept-inmo-extremal-monovariant',
                title: 'Extremal Principle & Discrete Monovariants',
                summary: 'Prove finiteness and structural uniqueness by focusing on maximal elements or strictly monotonic integer potential functions.',
                difficulty: 'hard',
                estimatedMinutes: 20,
                xpReward: 46,
                examTracks: ['all', 'stem_olympiad'],
                formalDefinition:
                  'A discrete monovariant M: State → ℤ≥₀ that strictly decreases under every legal transition (M(S_{t+1}) ≤ M(S_t) - 1) guarantees termination in at most M(S₀) steps.',
                intuitiveExplanation:
                  'If every move drops a non-negative whole-number scorecard by at least 1, the game cannot run forever—you must eventually hit a terminal configuration.',
                keyFormulas: [
                  {
                    label: 'Well-Ordering Termination Bound',
                    latex: 'M(S_t) \\le M(S_0) - t \\implies t_{\\max} \\le M(S_0)',
                    explanation: 'Turns infinite-seeming combinatorial rewrites into finite descent.',
                  },
                ],
                keyObservations: [
                  'Pair extremal configurations (minimum area triangle, shortest segment, maximum degree) with local improvement contradictions.',
                ],
                workedExamples: [
                  {
                    id: 'we-inmo-mono-01',
                    title: 'Bubble-Sort Swap Upper Bound',
                    problemStatement:
                      'What is the maximum number of adjacent inversion-eliminating swaps possible on a 6-element permutation before termination?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Let monovariant M be the count of inverted pairs (i < j, a_i > a_j).',
                      'Each swap removes 1 inversion; worst-case reverse-sorted array has C(6, 2) = 6 × 5 / 2 = 15.',
                    ],
                    finalAnswer: '15',
                    keyTakeaway: 'Pair inversions act as an exact integer monovariant bounded by n(n-1)/2.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-inmo-mono-01',
                    trapTitle: 'Using a monovariant on ℝ without a discrete step floor ε > 0',
                    flawedReasoning: 'Claiming termination because a positive real quantity decreases each step.',
                    correctConcept: 'A sequence like 1/2^t decreases forever above zero; finite discrete range or minimum decrement is required.',
                    counterExample: 'Real averages can converge asymptotically without halting.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'In an Olympiad tournament graph or grid rewrite, an invariant modulo 2 is best used to prove:',
                  options: [
                    'Which final states are unreachable (impossibility proofs)',
                    'The exact number of moves taken along the shortest path',
                    'Whether continuous eigenvalues are positive',
                    'Polynomial interpolation degree',
                  ],
                  correctIndex: 0,
                  explanation: 'Parity invariants split the state space into disconnected equivalence classes; if start and target differ, reachability is impossible.',
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
    chapterId: 'ds-ch-ioai-olympiad',
    examTracks: ['all', 'ai_ml_foundations', 'ict_hackathon', 'stem_olympiad'],
    newChapter: {
      id: 'ds-ch-ioai-olympiad',
      title: 'Data Science Olympiad: Information Theory, Boosting & SVD',
      sequenceOrder: 5,
      description:
        'Competition data science modules: KL divergence & cross-entropy calibration, ROC-AUC rank-sum theorem, gradient boosted tree residuals, and ridge SVD.',
    },
    topics: [
      {
        id: 'ds-topic-ioai-info-roc',
        title: 'Data Science Olympiad: Probabilistic Calibration & Information Theory',
        description: 'KL divergence asymmetry, proper scoring rules, and Mann-Whitney U probabilistic meaning of ROC-AUC.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'ds-sub-kl-roc',
            title: 'KL Divergence & ROC-AUC Rank Statistics',
            description: 'Information-theoretic loss decomposition and threshold-free ranking evaluation.',
            concepts: [
              {
                id: 'concept-ioai-kl-crossentropy',
                title: 'KL Divergence, Cross-Entropy & Proper Calibration',
                summary: 'Measure excess coding bits D_KL(P || Q) when model Q approximates true distribution P, proving minimizing cross-entropy recovers true probabilities.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'ai_ml_foundations'],
                formalDefinition:
                  'Cross-entropy H(P, Q) = -∑ P(x) log Q(x) decomposes into H(P) + D_KL(P || Q), where D_KL(P || Q) = ∑ P(x) log(P(x)/Q(x)) ≥ 0 by Gibbs’ inequality with equality iff Q = P.',
                intuitiveExplanation:
                  'Using someone else’s codebook wastes extra bits per message whenever your predictions disagree with reality; training with cross-entropy squeezes that waste toward zero.',
                keyFormulas: [
                  {
                    label: 'Entropy-Divergence Decomposition',
                    latex: 'H(P, Q) = H(P) + D_{\\text{KL}}(P \\parallel Q)',
                    explanation: 'D_KL is non-negative and asymmetric: D_KL(P || Q) ≠ D_KL(Q || P).',
                  },
                ],
                keyObservations: [
                  'Forward KL D_KL(P || Q) is zero-avoiding (mode-covering), while reverse KL is mode-seeking.',
                ],
                workedExamples: [
                  {
                    id: 'we-ioai-kl-01',
                    title: 'Exact Binary KL Divergence Calculation',
                    problemStatement:
                      'True distribution P assigns probabilities (0.5, 0.5) while model Q predicts (0.25, 0.75). Compute D_KL(P || Q) in bits (base-2 log, to 3 decimals; log2(4/3) ≈ 0.415).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'D_KL(P || Q) = 0.5 log₂(0.5 / 0.25) + 0.5 log₂(0.5 / 0.75).',
                      'First term = 0.5 × log₂(2) = 0.5 bits; second term = 0.5 × log₂(2/3) = -0.5 × 0.585 = -0.2925 bits.',
                      'Sum = 0.5 - 0.2925 = 0.2075 ≈ 0.208 bits.',
                    ],
                    finalAnswer: '0.208',
                    keyTakeaway: 'D_KL(P || Q) always stays ≥ 0 bits even when individual log ratios are negative.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ioai-kl-01',
                    trapTitle: 'Treating KL divergence as a symmetric Euclidean distance metric',
                    flawedReasoning: 'Assuming D_KL(P || Q) == D_KL(Q || P) and satisfies the triangle inequality.',
                    correctConcept: 'KL divergence fails both symmetry and the triangle inequality; use Jensen-Shannon divergence for a symmetric metric.',
                    counterExample: 'Assigning Q(x)=0 where P(x)>0 blows up forward KL to +∞.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'When is Kullback-Leibler divergence D_KL(P || Q) equal to zero?',
                  options: [
                    'If and only if Q matches P almost everywhere',
                    'Whenever P and Q share the same mean',
                    'Whenever P is uniform',
                    'Whenever entropy H(P) = 0',
                  ],
                  correctIndex: 0,
                  explanation: 'By Gibbs’ inequality (Jensen on strictly concave log), D_KL = 0 iff P = Q.',
                },
              },
              {
                id: 'concept-ioai-roc-auc-ranksum',
                title: 'Probabilistic Interpretation of ROC-AUC & PR Curves',
                summary: 'Interpret ROC-AUC as concordance probability P(score(X⁺) > score(X⁻)) and handle extreme class imbalance with Precision-Recall AUC.',
                difficulty: 'medium_hard',
                estimatedMinutes: 20,
                xpReward: 44,
                examTracks: ['all', 'ai_ml_foundations'],
                formalDefinition:
                  'ROC-AUC equals the Mann-Whitney U concordance probability P(s(x⁺) > s(x⁻)) + 0.5 P(s(x⁺) = s(x⁻)) over randomly drawn positive x⁺ and negative x⁻ pairs, remaining invariant to monotone score transforms.',
                intuitiveExplanation:
                  'Pick one positive example and one negative example at random: AUC is simply the probability your model scores the positive higher.',
                keyFormulas: [
                  {
                    label: 'Mann-Whitney AUC Formula',
                    latex: '\\text{AUC} = \\frac{1}{|P||N|} \\sum_{x^+ \\in P}\\sum_{x^- \\in N} \\mathbf{1}[s(x^+) > s(x^-)]',
                    explanation: 'Random classifier yields expected AUC = 0.5 regardless of class ratio.',
                  },
                ],
                keyObservations: [
                  'Under 1:1000 class skew, Precision-Recall AUC exposes false-positive floods hidden by ROC-AUC.',
                ],
                workedExamples: [
                  {
                    id: 'we-ioai-auc-01',
                    title: 'Discrete Rank-Sum AUC Calculation',
                    problemStatement:
                      'Positive scores are [0.9, 0.4] and negative scores are [0.6, 0.2]. Compute exact ROC-AUC.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Form all 2 × 2 = 4 (pos, neg) pairs: (0.9, 0.6)✓, (0.9, 0.2)✓, (0.4, 0.6)✗, (0.4, 0.2)✓.',
                      '3 out of 4 pairs rank positive > negative → AUC = 3 / 4 = 0.75.',
                    ],
                    finalAnswer: '0.75',
                    keyTakeaway: 'ROC-AUC depends exclusively on relative rank ordering, not probability calibration.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ioai-auc-01',
                    trapTitle: 'Concluding high ROC-AUC proves calibrated probabilities',
                    flawedReasoning: 'Dividing all predicted probabilities by 100 reduces calibration while keeping predictions unchanged.',
                    correctConcept: 'Strictly monotonic rescaling leaves ROC-AUC identical even while Brier score / log-loss degrades severely.',
                    counterExample: 'Multiplying logits by 0.01 keeps AUC constant but ruins threshold τ = 0.5.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'If a binary classifier predicts p_i′ = 0.01 × p_i for every sample, what happens to its ROC-AUC?',
                  options: ['Stays exactly unchanged', 'Drops by a factor of 100', 'Drops to 0.5', 'Increases toward 1.0'],
                  correctIndex: 0,
                  explanation: 'Positive linear scaling preserves every pairwise ranking, so ROC-AUC is strictly unchanged.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'ds-topic-ioai-boosting-svd',
        title: 'Ensemble Boosting & Feature Orthogonalization',
        description: 'Gradient boosted pseudo-residuals and singular value ridge shrinkage.',
        estimatedHours: 7,
        subtopics: [
          {
            id: 'ds-sub-gbdt-svd',
            title: 'Gradient Boosted Trees & Ridge SVD Filtering',
            description: 'Functional gradient descent on decision trees and spectral shrinkage σ_i / (σ_i² + λ).',
            concepts: [
              {
                id: 'concept-ioai-gbdt-residuals',
                title: 'Gradient Boosted Decision Trees (GBDT) & Pseudo-Residuals',
                summary: 'Minimize arbitrary differentiable loss L(y, F(x)) iteratively by fitting shallow regression trees to negative functional gradients.',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'ai_ml_foundations'],
                formalDefinition:
                  'At boosting stage m, each tree h_m(x) fits pseudo-residuals r_im = -∂L(y_i, F(x_i)) / ∂F(x_i) evaluated at F_{m-1}, updating F_m(x) = F_{m-1}(x) + ν h_m(x) with learning-rate shrinkage ν ∈ (0, 1].',
                intuitiveExplanation:
                  'Boosting chains weak shallow trees in series so every new tree cleans up the exact leftover errors the previous ensemble missed, unlike Random Forests which average independent trees in parallel.',
                keyFormulas: [
                  {
                    label: 'Additive Functional Gradient Step',
                    latex: 'F_m(x) = F_{m-1}(x) + \\nu\\,h_m(x)',
                    explanation: 'Under squared error loss, pseudo-residuals simplify directly to y_i - F_{m-1}(x_i).',
                  },
                ],
                keyObservations: [
                  'Low learning rate ν paired with more trees reduces variance and improves generalization.',
                ],
                workedExamples: [
                  {
                    id: 'we-ioai-gbdt-01',
                    title: 'Squared-Loss Residual Update',
                    problemStatement:
                      'True target y = 10, current prediction F₀ = 6. A regression tree fits residual r = 4 with leaf value h₁ = 4 and shrinkage ν = 0.25. What is updated prediction F₁?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute F₁ = F₀ + ν · h₁.',
                      'F₁ = 6 + 0.25 × 4 = 7.',
                    ],
                    finalAnswer: '7',
                    keyTakeaway: 'Shrinkage ν prevents any single tree from overfitting noisy residuals.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ioai-gbdt-01',
                    trapTitle: 'Confusing GBDT functional boosting with Random Forest variance reduction',
                    flawedReasoning: 'Expecting deeper and deeper trees without shrinkage to remain immune to overfitting.',
                    correctConcept: 'Boosting primarily reduces bias sequentially and can overfit if tree count or depth grows unchecked without early stopping.',
                    counterExample: 'Adding infinite trees on noisy labels memorizes training noise.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Under L₂ squared error loss L(y, F) = ½(y - F)², the negative gradient pseudo-residual -∂L/∂F equals:',
                  options: ['y - F', '(y - F)²', 'sign(y - F)', 'F - y'],
                  correctIndex: 0,
                  explanation: 'Differentiating ½(y - F)² wrt F gives -(y - F), so its negative gradient is y - F.',
                },
              },
              {
                id: 'concept-ioai-svd-ridge',
                title: 'SVD Spectral Shrinkage in Ridge Regression',
                summary: 'Stabilize ill-conditioned collinear feature matrices via spectral filter weights σ_i² / (σ_i² + λ).',
                difficulty: 'hard',
                estimatedMinutes: 22,
                xpReward: 48,
                examTracks: ['all', 'ai_ml_foundations'],
                formalDefinition:
                  'With data matrix X = UΣVᵀ, Ridge regression w_ridge = (XᵀX + λI)⁻¹ Xᵀy projects predictions onto principal directions U with damped spectral filter factors d_i = σ_i² / (σ_i² + λ).',
                intuitiveExplanation:
                  'Tiny singular values explode OLS coefficients when features are correlated; adding λI leaves strong signal directions intact while gently muting noisy directions.',
                keyFormulas: [
                  {
                    label: 'Ridge Spectral Filter Factor',
                    latex: 'd_i = \\frac{\\sigma_i^2}{\\sigma_i^2 + \\lambda}',
                    explanation: 'Shrinks directions with σ_i² ≪ λ strongly toward zero.',
                  },
                ],
                keyObservations: [
                  'Effective degrees of freedom equals df(λ) = ∑ σ_i² / (σ_i² + λ).',
                ],
                workedExamples: [
                  {
                    id: 'we-ioai-svd-01',
                    title: 'Spectral Damping Factor',
                    problemStatement:
                      'A principal direction has singular value σ = 2 and Ridge penalty λ = 12. Compute the Ridge filter factor d = σ² / (σ² + λ).',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Compute σ² = 2² = 4.',
                      'Substitute into filter formula: d = 4 / (4 + 12) = 4 / 16 = 0.25.',
                    ],
                    finalAnswer: '0.25',
                    keyTakeaway: 'Small singular values receive heavier shrinkage toward zero.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ioai-svd-01',
                    trapTitle: 'Applying Ridge regression without standardizing feature scales first',
                    flawedReasoning: 'Feeding features measured in millimeters alongside kilometers directly into L₂ regularization.',
                    correctConcept: 'Because λ||w||₂² penalizes raw weight magnitudes uniformly, standardizing features to unit variance prevents arbitrary unit bias.',
                    counterExample: 'Multiplying a feature by 0.001 forces its weight 1000× larger, triggering massive unequal penalty.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'As the Ridge regularization penalty λ → ∞, the effective degrees of freedom df(λ) = ∑ σ_i² / (σ_i² + λ) approaches:',
                  options: ['0', 'p (number of features)', 'N (number of samples)', '1'],
                  correctIndex: 0,
                  explanation: 'Each denominator grows without bound, shrinking every non-intercept weight toward 0.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
