import { ChapterAddition } from './curriculumExpansion';

/**
 * Curriculum depth expansion, batch 4 (physics, chemistry, biology).
 *
 * Completes the "one topic per chapter" problem for the sciences: every
 * remaining single-topic chapter gains a second, prerequisite-ordered topic so
 * a learner can progress through a chapter rather than sampling one idea.
 */

const ALL: ChapterAddition['examTracks'] = ['all'];

export const CURRICULUM_EXPANSION_4: ChapterAddition[] = [
  // ---------------- PHYSICS ----------------
  {
    subjectId: 'physics',
    examTracks: ALL,
    chapterId: 'phys-ch-electromagnetism',
    topics: [
      {
        id: 'phys-topic-electrostatics',
        title: 'Electrostatics, Fields & Electric Potential',
        description:
          'The static case that induction and circuit theory both assume: charge, field, potential and capacitance.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-fields-potential',
            title: 'Electric Field & Potential',
            description: 'Relating force, field and energy, and using superposition for several charges.',
            concepts: [
              {
                id: 'concept-electric-field-potential',
                title: 'Electric Field, Potential & Superposition',
                summary:
                  'Field gives force per unit charge at a point; potential gives energy per unit charge — and their signs mean different things.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  '$\\vec{E} = \\vec{F}/q = \\frac{kQ}{r^2}\\hat{r}$ for a point charge, and $V = kQ/r$ with $\\vec{E} = -\\nabla V$. Fields from several charges add as vectors; potentials add as scalars.',
                intuitiveExplanation:
                  'The field tells you which way a positive charge is pushed. The potential tells you the energy landscape — like altitude on a map. Field is the downhill direction of that landscape.',
                keyFormulas: [
                  {
                    label: 'Point Charge Field',
                    latex: 'E = \\frac{kQ}{r^2}',
                    explanation: 'Falls off with the square of distance, pointing away from positive charge.',
                  },
                  {
                    label: 'Field-Potential Relation',
                    latex: 'E = -\\frac{dV}{dr}',
                    explanation: 'Field points from higher to lower potential.',
                  },
                ],
                keyObservations: [
                  'Field is a vector, potential is a scalar — only the former needs components.',
                  'A positive charge accelerates toward lower potential; a negative charge does the reverse.',
                  'Equipotential surfaces are always perpendicular to field lines.',
                ],
                workedExamples: [
                  {
                    id: 'we-es-01',
                    title: 'Potential at a Point from Two Charges',
                    problemStatement:
                      'Find the potential midway between $+4\\,\\mu\\text{C}$ and $-4\\,\\mu\\text{C}$ separated by $0.2\\,\\text{m}$ ($k = 9 \\times 10^9$).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'The midpoint is $0.1\\,\\text{m}$ from each charge.',
                      'Potentials are scalars, so add them with signs: $V = k(q_1 + q_2)/r$.',
                      'Since $q_1 + q_2 = 4 - 4 = 0$, the numerator vanishes.',
                      'Therefore $V = 0$, even though the field there is not zero.',
                    ],
                    finalAnswer: '$V = 0$, but $\\vec{E} \\neq 0$.',
                    keyTakeaway:
                      'Zero potential does not mean zero field — they are different quantities.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-es-01',
                    trapTitle: 'Adding field magnitudes instead of vectors',
                    flawedReasoning: 'Fields from two charges add like potentials, so just sum the magnitudes.',
                    correctConcept:
                      'Fields are vectors and require components. Two equal fields pointing opposite ways cancel completely.',
                    counterExample:
                      'At the midpoint above, the potentials cancel to zero but the fields from both charges point the same way and add.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-faraday-induction', title: "Faraday's Law of Induction & Lenz's Rule", subjectId: 'physics' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which quantity is a scalar?',
                  options: ['Electric field', 'Electric force', 'Electric potential', 'Acceleration'],
                  correctIndex: 2,
                  explanation: 'Potential is energy per unit charge with no direction attached.',
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
    examTracks: ALL,
    chapterId: 'phys-ch-thermo',
    topics: [
      {
        id: 'phys-topic-kinetic-theory',
        title: 'Kinetic Theory & the First Law',
        description:
          'Connecting macroscopic heat, work and internal energy to microscopic molecular motion.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-first-law-kinetic',
            title: 'First Law & Molecular Speeds',
            description: 'Energy bookkeeping for gases and the statistical distribution of molecular speeds.',
            concepts: [
              {
                id: 'concept-first-law-kinetic',
                title: 'First Law of Thermodynamics & Kinetic Theory',
                summary:
                  'Energy is conserved across heat, work and internal energy, and temperature measures average molecular kinetic energy.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  '$\\Delta U = Q - W$, with $W$ the work done *by* the gas. For an ideal monatomic gas, $U = \\frac{3}{2}nRT$ and root-mean-square speed is $v_{rms} = \\sqrt{3kT/m}$.',
                intuitiveExplanation:
                  'Heat in, work out, and whatever remains is stored as internal energy. On the microscopic level, that stored energy is just how fast the molecules are moving.',
                keyFormulas: [
                  {
                    label: 'First Law',
                    latex: '\\Delta U = Q - W',
                    explanation: 'Sign conventions matter: $W$ here is work done by the system.',
                  },
                  {
                    label: 'RMS Speed',
                    latex: 'v_{rms} = \\sqrt{\\frac{3kT}{m}}',
                    explanation: 'Lighter molecules move faster at the same temperature.',
                  },
                ],
                keyObservations: [
                  'A free expansion has $Q = 0$ and $W = 0$, so $\\Delta U = 0$ and temperature is unchanged for an ideal gas.',
                  'An isothermal process keeps $U$ constant, so all heat becomes work.',
                  'Temperature depends on average kinetic energy, not on total energy.',
                ],
                workedExamples: [
                  {
                    id: 'we-thermo-01',
                    title: 'Internal Energy Change',
                    problemStatement:
                      'A gas absorbs $500\\,\\text{J}$ of heat and does $200\\,\\text{J}$ of work. Find $\\Delta U$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Apply the first law with the given convention: $\\Delta U = Q - W$.',
                      'Substitute $Q = 500$ and $W = 200$.',
                      'Compute: $500 - 200 = 300\\,\\text{J}$.',
                    ],
                    finalAnswer: '$+300\\,\\text{J}$',
                    keyTakeaway:
                      'Internal energy rises by what is absorbed minus what is spent doing work.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-thermo-01',
                    trapTitle: 'Flipping the sign of work',
                    flawedReasoning: 'Work done by the gas should add to its internal energy.',
                    correctConcept:
                      'Work done *by* the gas removes energy from it. Only work done *on* the gas increases $U$. Textbooks differ on the convention, so always state it.',
                    counterExample:
                      'An adiabatic expansion does positive work with $Q = 0$, so $\\Delta U < 0$ and the gas cools.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-carnot-entropy', title: 'Carnot Engine Efficiency & Second Law Entropy', subjectId: 'physics' },
                ],
                miniCheckQuestion: {
                  prompt: 'In an isothermal expansion of an ideal gas, what stays constant?',
                  options: ['Pressure', 'Internal energy', 'Volume', 'Entropy'],
                  correctIndex: 1,
                  explanation: 'Temperature is constant and $U$ depends only on temperature for an ideal gas.',
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
    examTracks: ALL,
    chapterId: 'phys-ch-waves-optics',
    topics: [
      {
        id: 'phys-topic-sound-doppler',
        title: 'Sound Waves, Standing Waves & the Doppler Effect',
        description:
          'Wave propagation in media, resonance conditions and the frequency shifts caused by relative motion.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-doppler-standing',
            title: 'Standing Waves & Doppler Shift',
            description: 'Boundary conditions selecting harmonics, plus the observer/source asymmetry.',
            concepts: [
              {
                id: 'concept-doppler-standing',
                title: 'Standing Waves & the Doppler Effect',
                summary:
                  'Fixed boundaries quantise allowed frequencies, and relative motion shifts observed pitch depending on who is moving.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'A string of length $L$ fixed at both ends supports $f_n = \\frac{nv}{2L}$. The Doppler shift for sound is $f\' = f\\frac{v \\pm v_o}{v \\mp v_s}$, where the signs depend on whether observer and source approach.',
                intuitiveExplanation:
                  'A standing wave is a wave that fits an exact whole number of half-wavelengths between the boundaries. The Doppler shift arises because motion compresses or stretches the arriving wavefronts.',
                keyFormulas: [
                  {
                    label: 'Harmonics of a Fixed String',
                    latex: 'f_n = \\frac{nv}{2L}',
                    explanation: 'Only integer multiples of the fundamental are allowed.',
                  },
                  {
                    label: 'Doppler Shift',
                    latex: 'f\' = f\\frac{v \\pm v_o}{v \\mp v_s}',
                    explanation: 'Approaching increases observed frequency; receding decreases it.',
                  },
                ],
                keyObservations: [
                  'Doppler shift for sound is asymmetric: a moving source and moving observer give different results.',
                  'A pipe open at one end supports only odd harmonics.',
                  'Light\'s Doppler shift is symmetric because there is no medium.',
                ],
                workedExamples: [
                  {
                    id: 'we-doppler-01',
                    title: 'Approaching Ambulance',
                    problemStatement:
                      'A siren emits $800\\,\\text{Hz}$ and approaches a stationary observer at $30\\,\\text{m/s}$ ($v = 340\\,\\text{m/s}$). Find the observed frequency.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'The source moves toward the observer, so the denominator uses the minus sign for $v_s$.',
                      'The observer is stationary, so $v_o = 0$.',
                      'Apply: $f\' = 800 \\cdot \\frac{340}{340 - 30}$.',
                      'Evaluate: $800 \\cdot \\frac{340}{310} \\approx 877\\,\\text{Hz}$.',
                    ],
                    finalAnswer: '$\\approx 877\\,\\text{Hz}$ — a rise in pitch.',
                    keyTakeaway:
                      'Approaching motion raises pitch; receding motion lowers it, by the same mechanism in reverse.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-doppler-01',
                    trapTitle: 'Treating source motion and observer motion symmetrically',
                    flawedReasoning: 'Only the relative speed matters, so a moving source and a moving observer give the same shift.',
                    correctConcept:
                      'For a medium-borne wave, the two cases differ. A moving source changes the wavelength; a moving observer changes the encounter rate.',
                    counterExample:
                      'A source at $30\\,\\text{m/s}$ toward a stationary observer gives about $877\\,\\text{Hz}$, while a stationary source with the observer approaching at $30\\,\\text{m/s}$ gives about $871\\,\\text{Hz}$.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-wave-interference-ydse', title: "Young's Double-Slit Interference & Path Difference", subjectId: 'physics' },
                ],
                miniCheckQuestion: {
                  prompt: 'A car sounds its horn while driving away from you. What do you hear?',
                  options: ['A higher pitch', 'A lower pitch', 'The same pitch', 'Nothing'],
                  correctIndex: 1,
                  explanation: 'Receding motion stretches the wavefronts, lowering the observed frequency.',
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
    examTracks: ALL,
    chapterId: 'phys-ch-quantum-modern',
    topics: [
      {
        id: 'phys-topic-atomic-models',
        title: 'Atomic Models, Spectra & Wave-Particle Duality',
        description:
          'How quantised energy levels explain line spectra, and why matter itself shows wave behaviour.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-bohr-debroglie',
            title: 'Bohr Levels & de Broglie Wavelength',
            description: 'Energy quantisation from standing-wave conditions and the wavelength of matter.',
            concepts: [
              {
                id: 'concept-bohr-debroglie',
                title: 'Bohr Energy Levels & de Broglie Duality',
                summary:
                  'Constrain an orbiting electron to a standing wave and energy levels become quantised, with a definite wavelength attached to every mass.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  'Bohr levels satisfy $E_n = -\\frac{13.6\\,\\text{eV}}{n^2}$ for hydrogen, with transitions emitting $\\Delta E = hf$. De Broglie assigned $\\lambda = \\frac{h}{p}$ to every particle.',
                intuitiveExplanation:
                  'If an electron must form a standing wave around the nucleus, only certain circumferences fit an integer number of wavelengths. That geometric constraint is what produces discrete energy levels rather than a continuum.',
                keyFormulas: [
                  {
                    label: 'Hydrogen Levels',
                    latex: 'E_n = -\\frac{13.6}{n^2}\\,\\text{eV}',
                    explanation: 'Negative energies indicate bound states; $n = 1$ is the ground state.',
                  },
                  {
                    label: 'de Broglie Wavelength',
                    latex: '\\lambda = \\frac{h}{p}',
                    explanation: 'Heavier or faster particles have shorter wavelengths.',
                  },
                ],
                keyObservations: [
                  'Line spectra are the fingerprint of quantised levels, and each element has a unique set.',
                  'An electron and a proton with equal momentum have identical de Broglie wavelengths.',
                  'The Bohr model fails for multi-electron atoms but correctly predicts hydrogen spectra.',
                ],
                workedExamples: [
                  {
                    id: 'we-atom-bohr-01',
                    title: 'Energy Released in a Transition',
                    problemStatement: 'Find the photon energy emitted when hydrogen drops from $n = 3$ to $n = 2$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute $E_3 = -13.6/9 \\approx -1.51\\,\\text{eV}$.',
                      'Compute $E_2 = -13.6/4 = -3.40\\,\\text{eV}$.',
                      'The photon carries the difference: $-1.51 - (-3.40) = 1.89\\,\\text{eV}$.',
                      'This is the red Balmer line of hydrogen.',
                    ],
                    finalAnswer: '$\\approx 1.89\\,\\text{eV}$',
                    keyTakeaway:
                      'Transitions to $n = 2$ form the Balmer series — the visible hydrogen lines.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-bohr-01',
                    trapTitle: 'Using $n = \\infty$ as the ground state',
                    flawedReasoning: 'Higher $n$ means lower energy because the value becomes more negative.',
                    correctConcept:
                      'The most negative energy is the most tightly bound, which is $n = 1$. Energy approaches zero from below as $n$ grows.',
                    counterExample:
                      'The ionisation energy is the difference from $n = 1$ to $n = \\infty$, i.e. $13.6\\,\\text{eV}$, not from any higher level.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-photoelectric-effect', title: 'Einstein Photoelectric Equation & Stopping Potential', subjectId: 'physics' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'De Broglie wavelength is inversely proportional to:',
                  options: ['Energy', 'Momentum', 'Charge', 'Temperature'],
                  correctIndex: 1,
                  explanation: '$\\lambda = h/p$, so greater momentum gives a shorter wavelength.',
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
    examTracks: ALL,
    chapterId: 'phys-ch-nsejs-foundations',
    topics: [
      {
        id: 'phys-topic-pressure-surface-tension',
        title: 'Pressure, Surface Tension & Fluid Flow',
        description:
          'Hydrostatic pressure, capillarity and Bernoulli flow — the junior-olympiad fluid toolkit.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-hydrostatics',
            title: 'Hydrostatics & Bernoulli',
            description: 'Pressure with depth, continuity and energy conservation in flow.',
            concepts: [
              {
                id: 'concept-hydrostatics-bernoulli',
                title: 'Hydrostatic Pressure & Bernoulli\'s Equation',
                summary:
                  'Pressure rises with depth, and along a streamline faster fluid carries lower pressure.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'Hydrostatic pressure is $p = p_0 + \\rho g h$. For steady ideal flow, $p + \\tfrac{1}{2}\\rho v^2 + \\rho g h = \\text{constant}$ along a streamline, with continuity $A_1v_1 = A_2v_2$.',
                intuitiveExplanation:
                  'Deeper fluid supports more weight above it. In a pipe that narrows, the fluid must speed up, and the energy for that speed comes from pressure — which is why pressure drops.',
                keyFormulas: [
                  {
                    label: 'Hydrostatic Pressure',
                    latex: 'p = p_0 + \\rho g h',
                    explanation: 'Independent of container shape — the hydrostatic paradox.',
                  },
                  {
                    label: 'Bernoulli',
                    latex: 'p + \\tfrac{1}{2}\\rho v^2 + \\rho g h = \\text{const}',
                    explanation: 'Valid along a streamline for incompressible, non-viscous flow.',
                  },
                ],
                keyObservations: [
                  'Pressure depends only on depth, not on the amount of liquid.',
                  'Continuity conserves volume flow rate: narrow means fast.',
                  'Bernoulli assumes ideal flow; viscosity and turbulence invalidate it.',
                ],
                workedExamples: [
                  {
                    id: 'we-fluid-01',
                    title: 'Pressure at Depth',
                    problemStatement:
                      'Find the gauge pressure $5\\,\\text{m}$ below water ($\\rho = 1000\\,\\text{kg/m}^3$, $g = 10$).',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Gauge pressure excludes atmosphere, so use $p = \\rho g h$.',
                      'Substitute: $p = 1000 \\cdot 10 \\cdot 5$.',
                      'Compute: $50{,}000\\,\\text{Pa}$.',
                    ],
                    finalAnswer: '$5 \\times 10^4\\,\\text{Pa}$ (about half an atmosphere).',
                    keyTakeaway:
                      'Gauge pressure ignores $p_0$; absolute pressure includes it.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-fluid-01',
                    trapTitle: 'Applying Bernoulli across a viscous or turbulent region',
                    flawedReasoning: 'Bernoulli is an energy equation, so it holds for every fluid flow.',
                    correctConcept:
                      'It assumes non-viscous, incompressible, steady flow along a streamline. Real pipes with friction lose energy as heat.',
                    counterExample:
                      'In a long narrow pipe with viscosity, pressure falls steadily along the flow without any change in speed.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-buoyancy-archimedes', title: 'Archimedes Principle & Center of Buoyancy', subjectId: 'physics' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Where the pipe narrows, the fluid speed and pressure respectively:',
                  options: ['Increase, increase', 'Increase, decrease', 'Decrease, increase', 'Decrease, decrease'],
                  correctIndex: 1,
                  explanation: 'Continuity forces a speed increase, and Bernoulli converts that into a pressure drop.',
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
    examTracks: ALL,
    chapterId: 'phys-ch-astrophysics',
    topics: [
      {
        id: 'phys-topic-stellar-gravity',
        title: 'Gravitational Fields & Stellar Structure',
        description:
          'Field strength, escape velocity and the gravitational balance that lets stars exist.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'phys-sub-gravitational-fields',
            title: 'Field Strength & Escape Velocity',
            description: 'Potential energy in a field and the speed needed to leave it permanently.',
            concepts: [
              {
                id: 'concept-escape-velocity',
                title: 'Gravitational Field Strength & Escape Velocity',
                summary:
                  'Escape velocity follows from setting kinetic energy equal to the depth of the gravitational well.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 25,
                formalDefinition:
                  'Field strength is $g = GM/r^2$. Gravitational potential energy is $U = -GMm/r$, and escape velocity satisfies $\\tfrac12 mv_{esc}^2 = GMm/R$, giving $v_{esc} = \\sqrt{2GM/R} = \\sqrt{2gR}$.',
                intuitiveExplanation:
                  'A gravitational well is a valley whose depth grows without bound as you approach the mass. Escape velocity is the launch speed whose kinetic energy exactly pays for climbing out of that valley.',
                keyFormulas: [
                  {
                    label: 'Escape Velocity',
                    latex: 'v_{esc} = \\sqrt{\\frac{2GM}{R}}',
                    explanation: 'Independent of the escaping body\'s mass.',
                  },
                  {
                    label: 'Orbital Speed',
                    latex: 'v_{orb} = \\sqrt{\\frac{GM}{R}}',
                    explanation: 'Exactly $1/\\sqrt{2}$ of escape velocity at the same radius.',
                  },
                ],
                keyObservations: [
                  'Escape velocity is a speed requirement, not a direction requirement.',
                  'Potential energy is negative, with zero at infinity by convention.',
                  'A black hole is where escape velocity exceeds the speed of light.',
                ],
                workedExamples: [
                  {
                    id: 'we-grav-01',
                    title: 'Escape Velocity of Earth',
                    problemStatement:
                      'Estimate Earth\'s escape velocity using $g = 9.8\\,\\text{m/s}^2$ and $R = 6.4 \\times 10^6\\,\\text{m}$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Use the compact form $v_{esc} = \\sqrt{2gR}$.',
                      'Compute $2gR = 2 \\cdot 9.8 \\cdot 6.4\\times10^6 \\approx 1.254 \\times 10^8$.',
                      'Take the square root: $\\approx 1.12 \\times 10^4\\,\\text{m/s}$.',
                    ],
                    finalAnswer: '$\\approx 11.2\\,\\text{km/s}$',
                    keyTakeaway:
                      'The compact form avoids needing $G$ and $M$ separately — only the surface gravity and radius.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-grav-01',
                    trapTitle: 'Thinking escape needs a sustained thrust',
                    flawedReasoning: 'To escape gravity you must keep firing engines to overcome it.',
                    correctConcept:
                      'Escape is an energy condition: once the required kinetic energy is supplied, no further force is needed, though atmospheric drag still must be overcome.',
                    counterExample:
                      'A projectile launched at $11.2\\,\\text{km/s}$ in vacuum escapes with its engines off.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-orbital-vis-viva', title: 'Vis-Viva Equation & Keplerian Orbital Invariants', subjectId: 'physics' },
                ],
                miniCheckQuestion: {
                  prompt: 'How does orbital speed compare with escape speed at the same radius?',
                  options: ['Equal', 'Orbital is $1/\\sqrt{2}$ of escape', 'Orbital is twice escape', 'Unrelated'],
                  correctIndex: 1,
                  explanation: 'Orbital speed is $\\sqrt{GM/R}$ while escape is $\\sqrt{2GM/R}$.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- CHEMISTRY ----------------
  {
    subjectId: 'chemistry',
    examTracks: ALL,
    chapterId: 'chem-ch-organic',
    topics: [
      {
        id: 'chem-topic-hydrocarbons-isomerism',
        title: 'Hydrocarbons, Isomerism & Stereochemistry',
        description:
          'Naming and distinguishing molecules with the same formula — the vocabulary every reaction question assumes.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-isomerism',
            title: 'Structural & Stereoisomerism',
            description: 'Constitutional, geometric and optical isomerism with their physical consequences.',
            concepts: [
              {
                id: 'concept-isomerism-types',
                title: 'Structural, Geometric & Optical Isomerism',
                summary:
                  'Same molecular formula, different connectivity or spatial arrangement — and only some isomers rotate light.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'Structural isomers differ in connectivity. Geometric (cis-trans) isomers differ in arrangement about a rigid bond. Optical isomers are non-superimposable mirror images (enantiomers), requiring a stereocentre with four distinct substituents.',
                intuitiveExplanation:
                  'Isomers are the same set of atoms arranged differently — like the same letters forming different words. Optical isomerism is handedness: your left and right hands have identical parts but cannot be superimposed.',
                keyFormulas: [
                  {
                    label: 'Maximum Stereoisomers',
                    latex: '2^{n}',
                    explanation: '$n$ is the number of stereocentres, when no symmetry reduces the count.',
                  },
                ],
                keyObservations: [
                  'Geometric isomerism requires restricted rotation, as in a double bond or a ring.',
                  'Enantiomers have identical physical properties except the direction of optical rotation.',
                  'A molecule with an internal mirror plane is achiral regardless of stereocentres.',
                ],
                workedExamples: [
                  {
                    id: 'we-org-01',
                    title: 'Counting Stereoisomers',
                    problemStatement: 'How many stereoisomers does a molecule with two stereocentres and no symmetry have?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Apply $2^n$ with $n = 2$ stereocentres.',
                      'That gives $2^2 = 4$.',
                      'Enumerate: (R,R), (S,S), (R,S), (S,R).',
                      'Note that (R,S) and (S,R) may be identical meso forms if symmetry exists — here it does not.',
                    ],
                    finalAnswer: '4 stereoisomers',
                    keyTakeaway:
                      'The $2^n$ rule is an upper bound; check for internal symmetry that halves it.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-org-01',
                    trapTitle: 'Assuming any carbon with four bonds is a stereocentre',
                    flawedReasoning: 'A carbon bonded to four atoms must be chiral.',
                    correctConcept:
                      'The four substituents must be *different*. Two identical groups create a mirror plane and the carbon is achiral.',
                    counterExample:
                      '2-propanol\'s central carbon bears two methyl groups, so it is not a stereocentre.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-sn1-sn2', title: 'Stereochemistry of SN2 & Walden Inversion', subjectId: 'chemistry' },
                ],
                miniCheckQuestion: {
                  prompt: 'What is required for geometric (cis-trans) isomerism?',
                  options: [
                    'A stereocentre',
                    'Restricted rotation such as a double bond',
                    'A benzene ring',
                    'Four different substituents',
                  ],
                  correctIndex: 1,
                  explanation: 'Cis-trans isomerism needs hindered rotation plus two different groups on each end of the rigid unit.',
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
    examTracks: ALL,
    chapterId: 'chem-ch-electrochemistry',
    topics: [
      {
        id: 'chem-topic-electrolysis',
        title: 'Electrolysis, Faraday\'s Laws & Conductance',
        description:
          'Driving non-spontaneous reactions with current, and quantifying how much product that produces.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-faraday-electrolysis',
            title: 'Faraday\'s Laws of Electrolysis',
            description: 'Relating charge passed to moles of substance transformed.',
            concepts: [
              {
                id: 'concept-faraday-electrolysis',
                title: 'Faraday\'s Laws & Electrolytic Stoichiometry',
                summary:
                  'Moles of product are proportional to charge passed, divided by the electron count in the half-reaction.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'Charge is $Q = It$, and the amount deposited is $n = \\frac{Q}{zF}$ where $z$ is the number of electrons per ion and $F = 96485\\,\\text{C/mol}$.',
                intuitiveExplanation:
                  'Electrons are the currency. Every metal ion needs a fixed number of them to become neutral, so counting electrons (via charge) counts atoms.',
                keyFormulas: [
                  {
                    label: 'Faraday\'s Law',
                    latex: 'n = \\frac{It}{zF}',
                    explanation: 'Doubling the current or time doubles the product.',
                  },
                ],
                keyObservations: [
                  'Electrolysis drives non-spontaneous reactions; galvanic cells do the reverse.',
                  'In a series circuit, the same charge flows through every cell, so mole ratios follow $1/z$.',
                  'Competing reduction potentials determine which ion is discharged first.',
                ],
                workedExamples: [
                  {
                    id: 'we-electro-01',
                    title: 'Mass Deposited by Electrolysis',
                    problemStatement:
                      'How many moles of copper are deposited by $2\\,\\text{A}$ for $965\\,\\text{s}$ from $\\text{Cu}^{2+}$?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compute charge: $Q = It = 2 \\times 965 = 1930\\,\\text{C}$.',
                      'Identify $z = 2$ for $\\text{Cu}^{2+}$.',
                      'Apply $n = Q/(zF) = \\frac{1930}{2 \\times 96485}$.',
                      'Evaluate: $n \\approx 0.01\\,\\text{mol}$.',
                    ],
                    finalAnswer: 'About $0.01\\,\\text{mol}$ of copper (roughly $0.635\\,\\text{g}$).',
                    keyTakeaway:
                      'The electron count $z$ is the most commonly forgotten factor — check the ion charge.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-electro-01',
                    trapTitle: 'Ignoring the ion charge in $z$',
                    flawedReasoning: 'One ion is reduced per electron, so $z = 1$ always.',
                    correctConcept:
                      '$z$ equals the number of electrons the ion requires. Using $z = 1$ for $\\text{Cu}^{2+}$ doubles the predicted mass.',
                    counterExample:
                      'The same charge deposits half as many moles of $\\text{Al}^{3+}$ as of $\\text{Ag}^{+}$ because $z = 3$ versus $1$.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-nernst-equation', title: 'Nernst Equation & Thermodynamic Cell Potentials', subjectId: 'chemistry' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What quantity does one Faraday represent?',
                  options: ['One electron', 'One mole of electrons', 'One coulomb', 'One mole of ions'],
                  correctIndex: 1,
                  explanation: '$F \\approx 96485\\,\\text{C}$ is the charge of one mole of electrons.',
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
    examTracks: ALL,
    chapterId: 'chem-ch-inorganic-coordination',
    topics: [
      {
        id: 'chem-topic-coordination-isomerism',
        title: 'Coordination Number, Nomenclature & Isomerism',
        description:
          'Naming complexes correctly and recognising the isomers that change their properties.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-complex-naming',
            title: 'IUPAC Naming & Isomerism of Complexes',
            description: 'Ligand ordering, charge balance and geometric/optical isomers of complexes.',
            concepts: [
              {
                id: 'concept-coordination-nomenclature',
                title: 'Complex Nomenclature & Coordination Isomerism',
                summary:
                  'Name ligands before the metal, indicate oxidation state, and predict cis/trans and optical isomers from geometry.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'In IUPAC names, ligands are listed alphabetically before the metal, with the metal oxidation state in Roman numerals. Octahedral $MA_4B_2$ has cis and trans isomers; $M(AA)_3$ type complexes are chiral.',
                intuitiveExplanation:
                  'The name is a chemical address: what is attached, in what quantity, and the metal\'s oxidation state. Geometry then determines which spatial arrangements are actually distinct molecules.',
                keyFormulas: [
                  {
                    label: 'Oxidation State',
                    latex: 'x + \\sum(\\text{ligand charges}) = \\text{overall charge}',
                    explanation: 'Solve for the metal oxidation state $x$.',
                  },
                ],
                keyObservations: [
                  'Square planar $MA_2B_2$ has cis and trans isomers; tetrahedral $MA_2B_2$ has only one.',
                  'Octahedral complexes of the type $M(AA)_3$ are optically active.',
                  'Ionisation isomerism swaps a ligand with a counter-ion.',
                ],
                workedExamples: [
                  {
                    id: 'we-coord-01',
                    title: 'Oxidation State in a Complex Ion',
                    problemStatement: 'Find the oxidation state of iron in $[\\text{Fe(CN)}_6]^{4-}$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Each cyanide carries a charge of $-1$, so six contribute $-6$.',
                      'Let the iron oxidation state be $x$.',
                      'Set up: $x - 6 = -4$.',
                      'Solve: $x = +2$.',
                    ],
                    finalAnswer: 'Fe(II)',
                    keyTakeaway:
                      'Balance the total charge, not the number of ligands — the arithmetic is the whole method.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-coord-01',
                    trapTitle: 'Assuming tetrahedral complexes show cis-trans isomerism',
                    flawedReasoning: 'Any complex with two different ligands can be cis or trans.',
                    correctConcept:
                      'In a tetrahedron all four positions are adjacent, so swapping two ligands gives the same molecule. Cis-trans requires octahedral or square planar geometry.',
                    counterExample:
                      '$[\\text{ZnCl}_2(\\text{NH}_3)_2]$ is tetrahedral and has a single isomer.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-crystal-field-theory', title: 'Crystal Field Theory & $t_{2g}/e_g$ Splitting', subjectId: 'chemistry' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which geometry allows optical isomerism of type $M(AA)_3$?',
                  options: ['Tetrahedral', 'Square planar', 'Octahedral', 'Linear'],
                  correctIndex: 2,
                  explanation: 'An octahedral $M(AA)_3$ complex is a propeller with no mirror plane, so it is chiral.',
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
    examTracks: ALL,
    chapterId: 'chem-ch-nsejs-foundations',
    topics: [
      {
        id: 'chem-topic-solutions-colligative',
        title: 'Solutions, Concentration & Colligative Properties',
        description:
          'Expressing concentration and predicting how dissolved particles change boiling, freezing and osmotic pressure.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-colligative',
            title: 'Molarity, Molality & Colligative Properties',
            description: 'Choosing the right concentration unit and applying the property equations.',
            concepts: [
              {
                id: 'concept-colligative-properties',
                title: 'Colligative Properties & van\'t Hoff Factor',
                summary:
                  'Dissolved particles lower freezing point and raise boiling point in proportion to particle count, not identity.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  '$\\Delta T_f = iK_f m$ and $\\Delta T_b = iK_b m$, where $m$ is molality and $i$ is the van\'t Hoff factor (particles per formula unit). Osmotic pressure is $\\Pi = iMRT$.',
                intuitiveExplanation:
                  'Dissolved particles occupy surface sites and interfere with the solvent\'s ability to freeze or evaporate. Only the *number* of particles matters, which is why a salt that splits into two ions has twice the effect.',
                keyFormulas: [
                  {
                    label: 'Freezing Point Depression',
                    latex: '\\Delta T_f = i K_f m',
                    explanation: 'Molality is used because it is temperature independent.',
                  },
                  {
                    label: 'van\'t Hoff Factor',
                    latex: 'i = \\frac{\\text{particles in solution}}{\\text{formula units dissolved}}',
                    explanation: '$i = 2$ for NaCl, $3$ for CaCl$_2$, $1$ for glucose.',
                  },
                ],
                keyObservations: [
                  'Molarity changes with temperature; molality does not.',
                  'Colligative properties depend on particle count, not size or charge.',
                  'Association in solution (e.g. dimerisation) can make $i < 1$.',
                ],
                workedExamples: [
                  {
                    id: 'we-soln-01',
                    title: 'Freezing Point of a Salt Solution',
                    problemStatement:
                      'Find the freezing point depression of a $0.1\\,m$ NaCl solution ($K_f = 1.86$, complete dissociation).',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'NaCl dissociates into two ions, so $i = 2$.',
                      'Apply $\\Delta T_f = i K_f m = 2 \\cdot 1.86 \\cdot 0.1$.',
                      'Compute: $\\Delta T_f = 0.372\\,\\text{K}$.',
                      'Freezing point becomes $-0.372^\\circ\\text{C}$.',
                    ],
                    finalAnswer: '$\\approx -0.37^\\circ\\text{C}$',
                    keyTakeaway:
                      'Forgetting $i$ halves the answer — the most common error in this topic.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-soln-01',
                    trapTitle: 'Using molarity where molality is required',
                    flawedReasoning: 'Molarity is the standard concentration, so substitute it directly.',
                    correctConcept:
                      'Colligative formulas use molality because it does not change with temperature. Results differ measurably in concentrated or temperature-varying systems.',
                    counterExample:
                      'For a 1 M aqueous NaCl solution at $4^\\circ\\text{C}$ versus $60^\\circ\\text{C}$, molarity shifts while molality stays roughly constant.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-mole-limiting-reactant', title: 'Limiting Reagent & Theoretical Yield Invariant', subjectId: 'chemistry' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the van\'t Hoff factor for CaCl$_2$ assuming complete dissociation?',
                  options: ['1', '2', '3', '4'],
                  correctIndex: 2,
                  explanation: 'One Ca²⁺ plus two Cl⁻ means three particles per formula unit.',
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
    examTracks: ALL,
    chapterId: 'chem-ch-metallurgy-polymers',
    topics: [
      {
        id: 'chem-topic-polymers-materials',
        title: 'Polymers, Addition vs Condensation & Material Properties',
        description:
          'How monomers become materials, and why molecular architecture determines strength and flexibility.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-polymerisation',
            title: 'Polymerisation Mechanisms & Degree of Polymerisation',
            description: 'Chain-growth versus step-growth, and the structure–property link.',
            concepts: [
              {
                id: 'concept-polymerisation',
                title: 'Addition & Condensation Polymerisation',
                summary:
                  'Addition polymerisation joins monomers without losing atoms; condensation loses small molecules and needs two functional groups.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'Addition polymerisation opens a double bond and creates a continuous carbon backbone with no by-product (e.g. polythene). Condensation polymerisation joins monomers with elimination of water or HCl (e.g. nylon, PET).',
                intuitiveExplanation:
                  'Think of addition as linking paperclips — nothing is discarded, only joined. Condensation is like gluing with a resin that squeezes out a little waste each time two pieces bond.',
                keyFormulas: [
                  {
                    label: 'Degree of Polymerisation',
                    latex: 'DP = \\frac{M_{polymer}}{M_{monomer}}',
                    explanation: 'How many monomer units make up an average chain.',
                  },
                ],
                keyObservations: [
                  'Condensation polymers are often biodegradable because their backbone has hydrolysable ester or amide bonds.',
                  'Cross-linking restricts chain sliding, producing rigidity and thermosets.',
                  'Crystallinity raises strength, opacity and melting point.',
                ],
                workedExamples: [
                  {
                    id: 'we-poly-01',
                    title: 'Degree of Polymerisation',
                    problemStatement:
                      'A polythene sample has molar mass $56{,}000\\,\\text{g/mol}$. Ethene is $28\\,\\text{g/mol}$. Find DP.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Apply $DP = M_{polymer}/M_{monomer}$.',
                      'Substitute: $56{,}000/28$.',
                      'Compute: $2000$.',
                    ],
                    finalAnswer: '$DP = 2000$ monomer units.',
                    keyTakeaway:
                      'Degree of polymerisation measures chain length and correlates strongly with mechanical strength.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-poly-01',
                    trapTitle: 'Classifying nylon as an addition polymer',
                    flawedReasoning: 'Nylon is made from monomers, so it is an addition polymer.',
                    correctConcept:
                      'Nylon forms by condensation with elimination of water, and its amide backbone makes it hydrolysable. Addition polymers have no leaving group.',
                    counterExample:
                      'Polythene is addition (no by-product) while nylon-6,6 is condensation (water is eliminated).',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which polymer type typically releases a small molecule during formation?',
                  options: ['Addition', 'Condensation', 'Both', 'Neither'],
                  correctIndex: 1,
                  explanation: 'Condensation polymerisation eliminates small molecules such as water or HCl.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ---------------- BIOLOGY ----------------
  {
    subjectId: 'biology',
    examTracks: ALL,
    chapterId: 'bio-ch-genetics',
    topics: [
      {
        id: 'bio-topic-mutation-dna',
        title: 'DNA Structure, Replication & Mutation',
        description:
          'The molecular basis of heredity and the classes of error that produce variation.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-replication-mutation',
            title: 'Semiconservative Replication & Mutation Types',
            description: 'How DNA copies itself, and which errors change protein sequence.',
            concepts: [
              {
                id: 'concept-dna-replication-mutation',
                title: 'Semiconservative Replication & Classes of Mutation',
                summary:
                  'Each new double helix keeps one parental strand, and mutations divide into substitutions, insertions and deletions with different consequences.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'Replication is semiconservative and antiparallel (5\'→3\' synthesis with a leading and lagging strand). Substitutions alter a single base, while insertions/deletions shift the reading frame if they are not multiples of three.',
                intuitiveExplanation:
                  'Unzipping the ladder and filling in each side produces two copies that each retain half the original. Mutation types are distinguished by whether they change one letter or shift the whole reading frame — the latter is usually far more damaging.',
                keyFormulas: [
                  {
                    label: 'Frameshift Condition',
                    latex: '\\Delta n \\bmod 3 \\neq 0 \\implies \\text{frameshift}',
                    explanation: 'Insertions in multiples of three add amino acids without shifting the frame.',
                  },
                ],
                keyObservations: [
                  'The genetic code is degenerate, so many substitutions are silent.',
                  'A frameshift scrambles every downstream codon and often produces an early stop codon.',
                  'Proofreading and mismatch repair reduce error rates by orders of magnitude.',
                ],
                workedExamples: [
                  {
                    id: 'we-mut-01',
                    title: 'Predicting the Effect of a Deletion',
                    problemStatement: 'A single base is deleted from the middle of a coding sequence. What is the likely effect?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'A single base deletion has $\\Delta n = 1$, which is not a multiple of 3.',
                      'This shifts the reading frame for every downstream codon.',
                      'The resulting protein will have a different amino acid sequence after the mutation site.',
                      'An early stop codon often results in a truncated protein.',
                    ],
                    finalAnswer: 'A frameshift producing a truncated or non-functional protein.',
                    keyTakeaway:
                      'Check the modulus first: multiples of three preserve the frame, anything else shifts it.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-mut-01',
                    trapTitle: 'Assuming all substitutions change the protein',
                    flawedReasoning: 'Changing a base must change the amino acid it codes for.',
                    correctConcept:
                      'Because the code is degenerate, most third-position changes leave the amino acid unchanged (silent mutations).',
                    counterExample:
                      'GCA, GCC, GCG and GCU all encode alanine, so a change at that position is silent.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-central-dogma', title: 'Central Dogma: Transcription & Translation', subjectId: 'biology' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which mutation type most often causes the greatest disruption?',
                  options: ['Silent substitution', 'Missense substitution', 'Single-base insertion', 'Any point mutation'],
                  correctIndex: 2,
                  explanation: 'A single insertion shifts the reading frame, altering every subsequent codon.',
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
    examTracks: ALL,
    chapterId: 'bio-ch-evolution',
    topics: [
      {
        id: 'bio-topic-selection',
        title: 'Natural Selection & Speciation',
        description:
          'The mechanisms that change allele frequencies and the conditions that create new species.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-selection-types',
            title: 'Types of Selection & Reproductive Isolation',
            description: 'Directional, stabilising and disruptive selection, plus isolation mechanisms.',
            concepts: [
              {
                id: 'concept-selection-types',
                title: 'Natural Selection Modes & Speciation',
                summary:
                  'Selection can shift a trait, narrow it, or split it into two peaks — and only reproductive isolation makes the split permanent.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'Directional selection favours one extreme, stabilising favours the mean, and disruptive favours both extremes. Speciation requires reproductive isolation, which may be allopatric (geographic) or sympatric (within one range).',
                intuitiveExplanation:
                  'Selection is a filter on variation. Where the filter favours one tail, the mean moves; where it favours the middle, variance shrinks; where it favours both tails, the population heads toward two groups.',
                keyFormulas: [
                  {
                    label: 'Allele Frequency Change',
                    latex: 'p\' = \\frac{p^2 w_{AA} + pq\\, w_{Aa}}{p^2 w_{AA} + 2pq\\, w_{Aa} + q^2 w_{aa}}',
                    explanation: 'Weighted by relative fitness $w$; shows how selection moves frequencies.',
                  },
                ],
                keyObservations: [
                  'Only heritable variation can respond to selection.',
                  'Gene flow can counteract selection by reintroducing alleles.',
                  'Reproductive isolation, not phenotypic difference, defines a species boundary.',
                ],
                workedExamples: [
                  {
                    id: 'we-sel-01',
                    title: 'Identifying a Selection Mode',
                    problemStatement:
                      'During a drought, birds with either very large or very small beaks survive better than those with average beaks. Which mode of selection is this?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Identify the fitness pattern: both phenotypic extremes have higher fitness.',
                      'The average phenotype is at a disadvantage.',
                      'Selection favours both tails simultaneously.',
                      'This is disruptive selection, which can lead to bimodal distributions and speciation.',
                    ],
                    finalAnswer: 'Disruptive selection.',
                    keyTakeaway:
                      'The mode is named for which part of the distribution gains fitness, not for which way the mean moves.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-sel-01',
                    trapTitle: 'Equating change with evolution by natural selection',
                    flawedReasoning: 'Any change in allele frequency is natural selection.',
                    correctConcept:
                      'Genetic drift, mutation and gene flow also change frequencies. Natural selection specifically requires fitness differences linked to heritable traits.',
                    counterExample:
                      'A bottleneck population\'s allele frequencies shift dramatically through drift alone, with no fitness advantage involved.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-hardy-weinberg', title: 'Hardy-Weinberg Population Equilibrium', subjectId: 'biology' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which mode reduces phenotypic variance without shifting the mean?',
                  options: ['Directional', 'Stabilising', 'Disruptive', 'Artificial'],
                  correctIndex: 1,
                  explanation: 'Stabilising selection favours intermediate phenotypes, narrowing the distribution around the mean.',
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
    examTracks: ALL,
    chapterId: 'bio-ch-physiology',
    topics: [
      {
        id: 'bio-topic-homeostasis',
        title: 'Homeostasis, Circulation & Gas Exchange',
        description:
          'Negative feedback, blood transport and diffusion across exchange surfaces.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-feedback-exchange',
            title: 'Feedback Loops & Exchange Surfaces',
            description: 'Regulatory control mechanisms and the structural features that maximise diffusion.',
            concepts: [
              {
                id: 'concept-homeostasis-feedback',
                title: 'Negative Feedback & Gas Exchange Surfaces',
                summary:
                  'Stability comes from loops that detect deviation and oppose it — and exchange efficiency comes from surface area, gradient and thinness.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'Negative feedback uses a sensor, a control centre and an effector to reverse deviations from a set point. Fick\'s law gives rate of diffusion $\\propto \\frac{A \\Delta C}{d}$, where $A$ is area and $d$ is thickness.',
                intuitiveExplanation:
                  'A thermostat is the model: it senses the temperature, compares with the set point, and switches the heater in the opposite direction. Alveoli apply the same logic to diffusion by maximising area and minimising distance.',
                keyFormulas: [
                  {
                    label: "Fick's Law",
                    latex: '\\text{rate} \\propto \\frac{A \\cdot \\Delta C}{d}',
                    explanation: 'Large area, steep gradient and short distance all increase diffusion.',
                  },
                ],
                keyObservations: [
                  'Positive feedback amplifies deviation and is usually short-lived or pathological.',
                  'Alveoli provide roughly 70 m² of surface in human lungs.',
                  'Insulin and glucagon form an antagonistic pair controlling blood glucose.',
                ],
                workedExamples: [
                  {
                    id: 'we-homeo-01',
                    title: 'Tracing a Glucose Feedback Loop',
                    problemStatement: 'Blood glucose rises after a meal. Describe the negative feedback response.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Sensors in the pancreas detect the rise in blood glucose.',
                      'Beta cells of the islets of Langerhans release insulin.',
                      'Insulin promotes cellular uptake and glycogen storage in the liver.',
                      'Blood glucose falls back toward the set point, reducing insulin secretion.',
                    ],
                    finalAnswer: 'Pancreatic insulin release restores glucose toward the set point.',
                    keyTakeaway:
                      'Every negative feedback loop has a sensor, a control centre and an effector — naming all three is the complete answer.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-homeo-01',
                    trapTitle: 'Calling childbirth a negative feedback loop',
                    flawedReasoning: 'Oxytocin drives labour, which is a regulated physiological process like any other.',
                    correctConcept:
                      'Oxytocin release is triggered by cervical stretch and increases further contraction — that is positive feedback, amplifying rather than opposing the deviation.',
                    counterExample:
                      'The loop terminates not by feedback reversal but by the birth event itself.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-membrane-transport', title: 'Passive vs Active Membrane Transport', subjectId: 'biology' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which factor does Fick\'s law say decreases diffusion rate?',
                  options: ['Larger surface area', 'Steeper concentration gradient', 'Greater membrane thickness', 'Higher temperature'],
                  correctIndex: 2,
                  explanation: 'Rate is inversely proportional to diffusion distance, so thicker barriers slow exchange.',
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
    examTracks: ALL,
    chapterId: 'bio-ch-ecology',
    topics: [
      {
        id: 'bio-topic-food-webs',
        title: 'Trophic Levels, Energy Flow & Nutrient Cycles',
        description:
          'Why food chains are short, how energy is lost between levels, and how matter cycles.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-trophic-energy',
            title: 'Energy Transfer & Biogeochemical Cycles',
            description: 'The 10% rule, ecological pyramids and the carbon cycle.',
            concepts: [
              {
                id: 'concept-trophic-energy',
                title: 'Trophic Energy Transfer & the Ten Percent Rule',
                summary:
                  'Only about a tenth of energy passes to the next trophic level, which caps food-chain length and total biomass.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'Net primary productivity is the energy available to consumers. Roughly 10% transfers between trophic levels; the rest is lost to respiration, heat and excretion. This yields the pyramid of energy, which is always upright.',
                intuitiveExplanation:
                  'Each consumer spends most of what it eats simply staying alive. Only the small surplus becomes new biomass available to the next predator — so each level can support only a tenth of the one below.',
                keyFormulas: [
                  {
                    label: 'Transfer Efficiency',
                    latex: '\\eta = \\frac{\\text{energy at level } n+1}{\\text{energy at level } n} \\approx 10\\%',
                    explanation: 'Energy pyramids therefore shrink rapidly with height.',
                  },
                ],
                keyObservations: [
                  'Energy pyramids are always upright, but biomass pyramids can invert (e.g. ocean phytoplankton).',
                  'Top predators are most vulnerable to extinction because their populations are smallest.',
                  'Decomposers recycle matter, not energy — energy leaves as heat.',
                ],
                workedExamples: [
                  {
                    id: 'we-eco-01',
                    title: 'Energy Available to a Top Predator',
                    problemStatement:
                      'Producers capture $100{,}000\\,\\text{kJ}$. How much reaches the third trophic level at 10% efficiency?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Level 1 (producers) to level 2: $100{,}000 \\times 0.1 = 10{,}000\\,\\text{kJ}$.',
                      'Level 2 to level 3: $10{,}000 \\times 0.1 = 1000\\,\\text{kJ}$.',
                      'So the third level receives $1000\\,\\text{kJ}$.',
                    ],
                    finalAnswer: '$1000\\,\\text{kJ}$, i.e. 1% of the original.',
                    keyTakeaway:
                      'Efficiency compounds multiplicatively — three transfers at 10% each leave one part in a thousand.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eco-01',
                    trapTitle: 'Believing an inverted biomass pyramid is impossible',
                    flawedReasoning: 'Since energy decreases at each level, biomass must too.',
                    correctConcept:
                      'Biomass reflects standing crop, not energy flow. Phytoplankton reproduce quickly and are consumed quickly, so their standing mass can be smaller than their consumers\'.',
                    counterExample:
                      'Open-ocean ecosystems show inverted biomass pyramids while energy pyramids remain upright.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-logistic-population-growth', title: 'Logistic Growth & Environmental Carrying Capacity', subjectId: 'biology' },
                ],
                miniCheckQuestion: {
                  prompt: 'Why are food chains typically limited to four or five levels?',
                  options: [
                    'Predators cannot digest more levels',
                    'Energy loss leaves too little to support another level',
                    'There are not enough species',
                    'Biodiversity is too low',
                  ],
                  correctIndex: 1,
                  explanation: 'Each transfer loses about 90% of energy, so a sixth level would have almost nothing to eat.',
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
    examTracks: ALL,
    chapterId: 'bio-ch-biotech-comp',
    topics: [
      {
        id: 'bio-topic-gel-electrophoresis',
        title: 'Gel Electrophoresis, DNA Fingerprinting & Sequencing',
        description:
          'How DNA fragments are separated by size and read to compare individuals or assemblies.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-electrophoresis',
            title: 'Separation Principle & Fragment Sizing',
            description: 'Charge, gel matrix and reading patterns from a gel.',
            concepts: [
              {
                id: 'concept-gel-electrophoresis',
                title: 'Gel Electrophoresis & DNA Band Interpretation',
                summary:
                  'Negatively charged DNA migrates toward the anode, with shorter fragments moving faster through the gel matrix.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  'DNA is loaded at the cathode because phosphates give it a net negative charge. In the gel it moves toward the anode, with mobility inversely related to fragment length; fragments of known size in a ladder allow sizing.',
                intuitiveExplanation:
                  'The gel is a molecular obstacle course. Small fragments weave through the mesh quickly; long ones snag. The result is a size-ordered band pattern readable like a barcode.',
                keyFormulas: [
                  {
                    label: 'Migration Direction',
                    latex: '\\text{DNA} \\to \\text{anode} \\ (+)\\ \\text{when pH} > 3',
                    explanation: 'Phosphate backbone is deprotonated and negatively charged at typical pH.',
                  },
                ],
                keyObservations: [
                  'Increasing agarose concentration resolves smaller fragments better.',
                  'Ethidium bromide or similar dyes are needed because DNA is colourless.',
                  'Restriction enzymes cut at specific sequences, producing reproducible band patterns per individual.',
                ],
                workedExamples: [
                  {
                    id: 'we-gel-01',
                    title: 'Reading a Gel',
                    problemStatement:
                      'In a gel, band A travels farther than band B. Which fragment is longer, and which end is positive?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Smaller fragments travel farther, so band A is the shorter fragment.',
                      'Therefore band B is longer.',
                      'DNA migrates away from the loading wells toward the positive electrode.',
                      'So the far end of the gel is the anode (positive).',
                    ],
                    finalAnswer: 'Band B is longer; the far end is the anode.',
                    keyTakeaway:
                      'Distance travelled is inversely related to fragment length — read the gel from bottom (small) to top (large).',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-gel-01',
                    trapTitle: 'Loading the sample at the positive electrode',
                    flawedReasoning: 'Because DNA is negatively charged, it should be placed near the positive end.',
                    correctConcept:
                      'Placement must be at the opposite end from where you want migration. Loading at the anode would make the DNA run out of the gel immediately.',
                    counterExample:
                      'A gel loaded incorrectly at the anode shows bands that vanish rather than separating.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-crispr-cas9-pcr', title: 'CRISPR-Cas9 & PCR Geometric Amplification', subjectId: 'biology' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Why does DNA migrate toward the positive electrode?',
                  options: [
                    'It is positively charged',
                    'Its phosphate backbone is negatively charged',
                    'It is attracted to the gel',
                    'It is pushed by the loading dye',
                  ],
                  correctIndex: 1,
                  explanation: 'At typical pH the phosphate groups are deprotonated, giving DNA a net negative charge.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

/** Final chapter completion: NSEJS junior biology. */
CURRICULUM_EXPANSION_4.push({
  subjectId: 'biology',
  examTracks: ALL,
  chapterId: 'bio-ch-nsejs-foundations',
  topics: [
    {
      id: 'bio-topic-plant-transport',
      title: 'Plant Transport, Photosynthesis Limits & Tropisms',
      description:
        'Xylem and phloem movement plus the limiting factors that cap photosynthetic rate.',
      estimatedHours: 4,
      subtopics: [
        {
          id: 'bio-sub-plant-transport-limits',
          title: 'Vascular Transport & Limiting Factors',
          description: 'Transpiration pull, translocation and the factor currently capping photosynthesis.',
          concepts: [
            {
              id: 'concept-plant-transport',
              title: 'Xylem, Phloem & Limiting Factors of Photosynthesis',
              summary:
                'Water moves up under tension; sugars move under pressure; and the slowest factor caps the rate.',
              difficulty: 'medium',
              estimatedMinutes: 15,
              xpReward: 25,
              formalDefinition:
                'Xylem transport is passive, driven by transpiration pull and cohesion-tension. Phloem transport is active, using pressure flow from source to sink. Photosynthetic rate is limited by whichever of light intensity, CO₂ concentration or temperature is in shortest supply.',
              intuitiveExplanation:
                'Water is pulled upward like a drink through a straw as leaves evaporate. Sugars are pushed from the leaves where they are made to wherever they are needed. Growth is throttled by whichever ingredient runs short first.',
              keyFormulas: [
                {
                  label: 'Transpiration Rate',
                  latex: '\\text{rate} \\propto \\frac{\\Delta\\text{water vapour}}{\\text{resistance}}',
                  explanation: 'Higher humidity reduces the gradient and slows transpiration.',
                },
              ],
              keyObservations: [
                'Guard cells open stomata when turgid, closing them to conserve water.',
                'Phloem is bidirectional between sources and sinks; xylem flow is upward.',
                'A factor stops limiting exactly when its curve plateaus — the next factor takes over.',
              ],
              workedExamples: [
                {
                  id: 'we-plant-01',
                  title: 'Identifying the Limiting Factor',
                  problemStatement:
                    'Increasing light intensity no longer raises photosynthetic rate, but raising CO₂ does. What is limiting?',
                  difficulty: 'easy_medium',
                  stepByStepSolution: [
                    'A factor is limiting only if changing it changes the rate.',
                    'Light shows a plateau, so light is already saturating.',
                    'Raising CO₂ increases the rate immediately.',
                    'CO₂ concentration is therefore the limiting factor.',
                  ],
                  finalAnswer: 'Carbon dioxide concentration.',
                  keyTakeaway:
                    'A plateau in a rate-vs-factor curve is the signature of saturation — look for the factor whose increase still raises the rate.',
                },
              ],
              commonPitfalls: [
                {
                  id: 'cp-plant-01',
                  trapTitle: 'Assuming phloem also transports upward only',
                  flawedReasoning: 'Both xylem and phloem carry substances up the stem.',
                  correctConcept:
                    'Phloem transports bidirectionally from source to sink, which can be downward toward roots. Only xylem is consistently upward.',
                  counterExample:
                    'Sugars made in mature leaves travel downward to storage roots in autumn — against the xylem direction.',
                },
              ],
              prerequisites: [
                { id: 'concept-photosynthesis-stages', title: 'Light Reactions & the Calvin Cycle', subjectId: 'biology' },
              ],
              relatedConcepts: [],
              miniCheckQuestion: {
                prompt: 'Which tissue transports sugars from source to sink?',
                options: ['Xylem', 'Phloem', 'Epidermis', 'Cambium'],
                correctIndex: 1,
                explanation: 'Phloem performs translocation of photosynthates under pressure flow.',
              },
            },
          ],
        },
      ],
    },
  ],
});
