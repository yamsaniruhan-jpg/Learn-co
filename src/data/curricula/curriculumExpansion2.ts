import { ChapterAddition } from './curriculumExpansion';

/**
 * Curriculum depth expansion, batch 2.
 *
 * Batch 1 covered the analytical foundations (limits, kinematics, atomic
 * structure, cell membranes). This batch fills the remaining large gaps in the
 * core STEM sequence — most notably chemistry equilibrium/thermochemistry,
 * biology photosynthesis, physics rotation and oscillations, and the algorithmic
 * thinking that sits between "Big-O" and "transformers".
 *
 * Same authoring contract as batch 1: additive, prerequisite-ordered, and every
 * concept carries a formal definition, an intuition, a worked example and a
 * real pitfall. Consumed by `applyCurriculumExpansion`.
 */

const ALL: ChapterAddition['examTracks'] = ['all'];

export const CURRICULUM_EXPANSION_2: ChapterAddition[] = [
  // ===================================================================
  // PHYSICS — rotational dynamics and oscillations
  // ===================================================================
  {
    subjectId: 'physics',
    examTracks: ALL,
    chapterId: 'phys-ch-mechanics',
    topics: [
      {
        id: 'phys-topic-rotational-dynamics',
        title: 'Rotational Dynamics & Angular Momentum',
        description:
          'The rotational analogues of force, mass and momentum, and why angular momentum is conserved when linear momentum is not.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-torque-moment-inertia',
            title: 'Torque, Moment of Inertia & Rolling',
            description: 'Rotational Newton\'s law and the rolling-without-slipping condition.',
            concepts: [
              {
                id: 'concept-torque-moment-inertia',
                title: 'Torque & Rotational Inertia',
                summary:
                  'Rotational motion obeys τ = Iα exactly as linear motion obeys F = ma, but I depends on where the mass sits.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  '$\\tau = rF\\sin\\theta$ is the torque about an axis. For a rigid body, $\\tau_{net} = I\\alpha$ where $I = \\sum m_i r_i^2$. Rolling without slipping requires $v = \\omega R$ and $a = \\alpha R$.',
                intuitiveExplanation:
                  'Torque is force applied at a distance — which is why a long spanner loosens a bolt more easily. Moment of inertia is "rotational laziness": the same mass resists rotation more strongly the further it sits from the axis.',
                keyFormulas: [
                  {
                    label: 'Rotational Second Law',
                    latex: '\\tau_{net} = I\\alpha',
                    explanation: 'The direct analogue of $F = ma$; mass becomes $I$ and force becomes torque.',
                  },
                  {
                    label: 'Solid Cylinder Inertia',
                    latex: 'I = \\tfrac{1}{2}MR^2',
                    explanation: 'A hoop has $MR^2$ — mass concentrated at the rim resists rotation more.',
                  },
                  {
                    label: 'Rolling Without Slipping',
                    latex: 'v = \\omega R',
                    explanation: 'The contact point is instantaneously at rest.',
                  },
                ],
                keyObservations: [
                  'A hoop and a disc released together: the disc always wins, because its mass is closer to the axis.',
                  'Torque depends on the perpendicular distance from the axis, not the distance along the force.',
                  'Rolling bodies carry both translational and rotational kinetic energy.',
                ],
                workedExamples: [
                  {
                    id: 'we-rot-01',
                    title: 'Acceleration Down an Incline by Rolling',
                    problemStatement:
                      'A solid sphere rolls without slipping down a $30^\\circ$ incline. Find its acceleration ($g = 10\\,\\text{m/s}^2$).',
                    difficulty: 'hard',
                    stepByStepSolution: [
                      'Along the slope: $Mg\\sin\\theta - f = Ma$ (translation).',
                      'About the centre: $fR = I\\alpha$ (rotation).',
                      'Rolling constraint: $a = \\alpha R$, so $f = I a / R^2$.',
                      'For a solid sphere $I = \\tfrac{2}{5}MR^2$, so $f = \\tfrac{2}{5}Ma$.',
                      'Substitute: $Mg\\sin\\theta = Ma + \\tfrac{2}{5}Ma = \\tfrac{7}{5}Ma$, hence $a = \\tfrac{5}{7}g\\sin\\theta$.',
                      'Numerically: $\\tfrac{5}{7}(10)(0.5) = \\tfrac{25}{7} \\approx 3.57\\,\\text{m/s}^2$.',
                    ],
                    finalAnswer: '$\\tfrac{25}{7} \\approx 3.6\\,\\text{m/s}^2$ — less than the $5\\,\\text{m/s}^2$ for sliding without friction.',
                    keyTakeaway:
                      'Rolling is always slower than sliding because some gravitational energy must fund rotation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-rot-01',
                    trapTitle: 'Treating a rolling body as a point mass',
                    flawedReasoning: 'Use $a = g\\sin\\theta$ and ignore rotation entirely.',
                    correctConcept:
                      'Only a frictionless sliding block gets $g\\sin\\theta$. A rolling body must also spin up, so its acceleration is reduced by the factor $1/(1 + I/MR^2)$.',
                    counterExample:
                      'On the same incline a hoop accelerates at $\\tfrac{1}{2}g\\sin\\theta$ while a sliding block achieves $g\\sin\\theta$.',
                  },
                ],
                prerequisites: [{ id: 'concept-newton-second-law', title: "Newton's Second Law & Free-Body Diagrams", subjectId: 'physics' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'A hoop and a disc of equal mass and radius roll down the same incline. Which arrives first?',
                  options: ['The hoop', 'The disc', 'They tie', 'Depends on the incline angle'],
                  correctIndex: 1,
                  explanation: 'The disc has smaller $I/MR^2$ ($\\tfrac12$ vs $1$), so it accelerates faster.',
                },
              },
            ],
          },
          {
            id: 'phys-sub-angular-momentum',
            title: 'Angular Momentum Conservation',
            description: 'Why a spinning skater speeds up and how this governs orbits and collisions.',
            concepts: [
              {
                id: 'concept-angular-momentum',
                title: 'Angular Momentum & Its Conservation',
                summary: 'When no external torque acts, L stays constant — so reducing I must increase ω.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 27,
                formalDefinition:
                  '$L = I\\omega$ for a rigid body, and $L = r \\times p$ for a particle. If $\\tau_{ext} = 0$, then $L$ is conserved: $I_1\\omega_1 = I_2\\omega_2$.',
                intuitiveExplanation:
                  'A skater pulling their arms in moves mass closer to the axis, shrinking I. Since L cannot change without external torque, ω must rise — the same reason divers tuck to spin faster.',
                keyFormulas: [
                  {
                    label: 'Angular Momentum',
                    latex: 'L = I\\omega',
                    explanation: 'The rotational analogue of $p = mv$.',
                  },
                  {
                    label: 'Conservation',
                    latex: 'I_1\\omega_1 = I_2\\omega_2',
                    explanation: 'Valid only when the net external torque is zero.',
                  },
                ],
                keyObservations: [
                  'Conservation is about external torque, not external force — a central force exerts no torque.',
                  'Kepler\'s second law (equal areas in equal times) is exactly angular momentum conservation.',
                  'Rotational kinetic energy is NOT conserved while I changes, because work is done in pulling the arms in.',
                ],
                workedExamples: [
                  {
                    id: 'we-ang-01',
                    title: 'A Skater Pulling Arms In',
                    problemStatement:
                      'A skater with $I_1 = 4.0\\,\\text{kg·m}^2$ spins at $2.0\\,\\text{rev/s}$. Pulling her arms in reduces $I$ to $1.6\\,\\text{kg·m}^2$. Find the new spin rate.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'No external torque acts about the vertical axis, so $L$ is conserved.',
                      'Apply $I_1\\omega_1 = I_2\\omega_2$.',
                      'Substitute: $(4.0)(2.0) = (1.6)\\omega_2$.',
                      'Solve: $\\omega_2 = 8.0/1.6 = 5.0\\,\\text{rev/s}$.',
                    ],
                    finalAnswer: '$5.0\\,\\text{rev/s}$',
                    keyTakeaway:
                      'Angular velocity scales inversely with moment of inertia; halving the spread more than doubles the spin.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ang-01',
                    trapTitle: 'Assuming rotational kinetic energy is conserved too',
                    flawedReasoning: 'The system is isolated, so both L and rotational energy must stay constant.',
                    correctConcept:
                      'Only $L$ is conserved. Pulling mass inward does work against the outward "centrifugal" tendency, and $\\tfrac12 I\\omega^2$ rises.',
                    counterExample:
                      'In the skater example, energy goes from $\\tfrac12(4)(2)^2 = 8$ to $\\tfrac12(1.6)(5)^2 = 20$ units.',
                  },
                ],
                prerequisites: [{ id: 'concept-torque-moment-inertia', title: 'Torque & Rotational Inertia', subjectId: 'physics' }],
                relatedConcepts: [{ id: 'phys-sub-vis-viva', title: 'Vis-Viva Equation & Angular Momentum Conservation', subjectId: 'physics' }],
                miniCheckQuestion: {
                  prompt: 'If I is halved with no external torque, what happens to ω?',
                  options: ['Halves', 'Stays the same', 'Doubles', 'Quadruples'],
                  correctIndex: 2,
                  explanation: '$I\\omega$ constant means $\\omega$ doubles when $I$ halves.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'phys-topic-oscillations',
        title: 'Simple Harmonic Motion & Waves',
        description:
          'Restoring-force motion, energy exchange and the wave properties that later chapters on optics and quantum mechanics build on.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'phys-sub-shm-basics',
            title: 'SHM Kinematics & Energy',
            description: 'Displacement, velocity and acceleration relationships, plus the energy exchange.',
            concepts: [
              {
                id: 'concept-shm-kinematics',
                title: 'Simple Harmonic Motion & the Restoring Force',
                summary: 'Any system with a linear restoring force oscillates sinusoidally at a fixed, mass-dependent frequency.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'SHM satisfies $a = -\\omega^2 x$, i.e. $\\ddot{x} + \\omega^2 x = 0$, with solution $x = A\\cos(\\omega t + \\phi)$. For a spring, $\\omega = \\sqrt{k/m}$ and $T = 2\\pi\\sqrt{m/k}$.',
                intuitiveExplanation:
                  'The further the system is displaced, the harder it is pulled back — and the pull points opposite the displacement. That single rule produces a sine wave, which is why so many unrelated systems (springs, pendulums, atoms) share identical mathematics.',
                keyFormulas: [
                  {
                    label: 'SHM Differential Equation',
                    latex: '\\ddot{x} + \\omega^2 x = 0',
                    explanation: 'Acceleration is proportional and opposite to displacement.',
                  },
                  {
                    label: 'Spring Period',
                    latex: 'T = 2\\pi\\sqrt{m/k}',
                    explanation: 'Period grows with mass and shrinks with stiffness; amplitude does not appear.',
                  },
                ],
                keyObservations: [
                  'Period is independent of amplitude for SHM — a defining property called isochronism.',
                  'At maximum displacement, velocity is zero and acceleration is maximum, and vice versa at the centre.',
                  'Kinetic and potential energy trade places twice per cycle but their sum stays constant.',
                ],
                workedExamples: [
                  {
                    id: 'we-shm-01',
                    title: 'Period of a Spring-Mass System',
                    problemStatement:
                      'A $0.5\\,\\text{kg}$ mass hangs from a spring of stiffness $k = 200\\,\\text{N/m}$. Find the oscillation period.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Identify the model: a mass on a linear spring is SHM with $\\omega = \\sqrt{k/m}$.',
                      'Compute $\\omega = \\sqrt{200/0.5} = \\sqrt{400} = 20\\,\\text{rad/s}$.',
                      'Convert to period: $T = 2\\pi/\\omega$.',
                      'Evaluate: $T = 2\\pi/20 = \\pi/10 \\approx 0.314\\,\\text{s}$.',
                    ],
                    finalAnswer: '$\\approx 0.314\\,\\text{s}$',
                    keyTakeaway: 'Amplitude never enters the period formula — a common source of wasted calculation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-shm-01',
                    trapTitle: 'Believing larger amplitude means longer period',
                    flawedReasoning: 'A bigger swing covers more distance, so it must take more time.',
                    correctConcept:
                      'In SHM the restoring force is stronger at larger displacement, so the object speeds up proportionally and the period is unchanged.',
                    counterExample:
                      'A pendulum\'s period is $2\\pi\\sqrt{L/g}$ for small swings, regardless of a $2^\\circ$ or $10^\\circ$ amplitude.',
                  },
                ],
                prerequisites: [{ id: 'concept-newton-second-law', title: "Newton's Second Law & Free-Body Diagrams", subjectId: 'physics' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What is the acceleration when a SHM oscillator is at maximum displacement?',
                  options: ['Zero', 'Maximum', 'Equal to its velocity', 'It is undefined'],
                  correctIndex: 1,
                  explanation: 'Since $a = -\\omega^2 x$, acceleration is largest where |x| is largest.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ===================================================================
  // CHEMISTRY — equilibrium, thermochemistry, acids and bases
  // ===================================================================
  {
    subjectId: 'chemistry',
    examTracks: ALL,
    chapterId: 'chem-ch-kinetics-thermo',
    topics: [
      {
        id: 'chem-topic-chemical-equilibrium',
        title: 'Chemical Equilibrium & Le Chatelier\'s Principle',
        description:
          'Dynamic balance in reversible reactions, the equilibrium constant, and how systems respond to stress.',
        estimatedHours: 5,
        subtopics: [
          {
            id: 'chem-sub-equilibrium-constant',
            title: 'The Equilibrium Constant & Reaction Quotient',
            description: 'Quantifying where a reaction settles and predicting which way it must shift.',
            concepts: [
              {
                id: 'concept-equilibrium-constant',
                title: 'Equilibrium Constant K and Reaction Quotient Q',
                summary:
                  'Compare Q with K to predict the direction of shift without solving the full kinetics.',
                difficulty: 'medium',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'For $aA + bB \\rightleftharpoons cC + dD$, $K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}$ at equilibrium. The reaction quotient $Q$ has the same form but uses current concentrations. If $Q < K$ the reaction proceeds forward; if $Q > K$ it reverses; if $Q = K$ it is at equilibrium.',
                intuitiveExplanation:
                  'K is the ratio the system "wants" at a given temperature. Q is the ratio it currently has. Comparing the two tells you which way it must move, like comparing your current speed with a target speed.',
                keyFormulas: [
                  {
                    label: 'Equilibrium Constant',
                    latex: 'K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}',
                    explanation: 'Pure solids and liquids are omitted — their activity is 1.',
                  },
                  {
                    label: 'Free Energy Link',
                    latex: '\\Delta G^{\\circ} = -RT\\ln K',
                    explanation: 'A large K means a strongly negative standard free energy change.',
                  },
                ],
                keyObservations: [
                  'K depends only on temperature — not on initial concentrations or pressure.',
                  'A catalyst speeds up both directions equally and never changes K.',
                  'Reversing a reaction inverts K; multiplying the equation by n raises K to the n-th power.',
                ],
                workedExamples: [
                  {
                    id: 'we-eq-01',
                    title: 'Predicting the Shift with Q',
                    problemStatement:
                      'For $\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3$ with $K_c = 0.50$, a mixture has $[\\text{N}_2] = 1.0$, $[\\text{H}_2] = 1.0$ and $[\\text{NH}_3] = 0.20$. Which way does it shift?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Write $Q_c = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2][\\text{H}_2]^3}$.',
                      'Substitute: $Q_c = \\frac{(0.20)^2}{(1.0)(1.0)^3} = 0.040$.',
                      'Compare with $K_c = 0.50$: here $Q < K$.',
                      'The reaction therefore proceeds forward, producing more ammonia.',
                    ],
                    finalAnswer: 'Shift right (towards products).',
                    keyTakeaway:
                      'Always compute Q with the balanced stoichiometric exponents — a missing cube is the classic error.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eq-01',
                    trapTitle: 'Including solids in the equilibrium expression',
                    flawedReasoning: 'Write every species in the reaction into the K expression.',
                    correctConcept:
                      'Pure solids and pure liquids have constant activity equal to 1, so they never appear. Only gases and dissolved species contribute.',
                    counterExample:
                      'For $\\text{CaCO}_3(s) \\rightleftharpoons \\text{CaO}(s) + \\text{CO}_2(g)$, $K_p = p_{\\text{CO}_2}$ alone.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-le-chatelier', title: "Le Chatelier's Principle & Stress Response", subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'What happens to K when a catalyst is added?',
                  options: ['Increases', 'Decreases', 'Unchanged', 'Depends on pressure'],
                  correctIndex: 2,
                  explanation: 'A catalyst lowers activation energy for both directions equally; equilibrium position is untouched.',
                },
              },
              {
                id: 'concept-le-chatelier',
                title: "Le Chatelier's Principle & Stress Response",
                summary: 'Predict the direction of shift from changes in concentration, pressure or temperature.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 25,
                formalDefinition:
                  'A system at equilibrium subjected to a change in concentration, pressure or temperature shifts in the direction that partially counteracts the change. Temperature is the only stress that alters the value of K itself.',
                intuitiveExplanation:
                  'The system behaves like a stubborn negotiator: push more reactant in and it consumes some; squeeze the volume and it shifts toward the side with fewer gas molecules to relieve pressure.',
                keyFormulas: [
                  {
                    label: 'Pressure–Mole Relation',
                    latex: '\\Delta n_{gas} < 0 \\implies \\text{high pressure favours products}',
                    explanation: 'Increasing pressure favours the side with fewer gaseous moles.',
                  },
                  {
                    label: 'Van\'t Hoff Form',
                    latex: '\\ln\\frac{K_2}{K_1} = \\frac{\\Delta H^{\\circ}}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
                    explanation: 'Exothermic reactions have K fall as temperature rises.',
                  },
                ],
                keyObservations: [
                  'Adding an inert gas at constant volume changes nothing — partial pressures are unaffected.',
                  'Only temperature changes K; concentration and pressure changes merely move the position.',
                  'In the Haber process, high pressure helps but a compromise temperature is used for rate.',
                ],
                workedExamples: [
                  {
                    id: 'we-eq-02',
                    title: 'Effect of Compressing the Haber System',
                    problemStatement:
                      'For $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$, what happens when the volume is halved?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Count gaseous moles: 4 on the left, 2 on the right.',
                      'Halving volume doubles all partial pressures, so Q increases by a factor of $2^{2-4} = 2^{-2}$.',
                      'Because the product side has fewer gas moles, the forward direction relieves pressure.',
                      'The equilibrium therefore shifts right, increasing ammonia yield.',
                    ],
                    finalAnswer: 'Shift right; ammonia yield rises.',
                    keyTakeaway: 'Compare gaseous mole counts to predict pressure effects, not the total stoichiometric coefficients.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-eq-02',
                    trapTitle: 'Assuming a temperature change behaves like a concentration change',
                    flawedReasoning: 'Heating just pushes the reaction one way, exactly as adding reactant would.',
                    correctConcept:
                      'Temperature changes the value of K itself, because it alters the ratio of forward and reverse rate constants. Concentration changes only move the position.',
                    counterExample:
                      'For an exothermic reaction, raising T lowers K permanently; diluting a species leaves K intact.',
                  },
                ],
                prerequisites: [{ id: 'concept-equilibrium-constant', title: 'Equilibrium Constant K and Reaction Quotient Q', subjectId: 'chemistry' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'For an exothermic reaction at equilibrium, what does raising the temperature do?',
                  options: ['Shifts right, K rises', 'Shifts left, K falls', 'No effect', 'Shifts right, K unchanged'],
                  correctIndex: 1,
                  explanation: 'Heat is a product for an exothermic reaction, so adding it drives the reverse direction and lowers K.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-thermochemistry',
        title: 'Thermochemistry & Enthalpy',
        description:
          'Measuring and predicting heat flow, and using Hess\'s law to find energies that cannot be measured directly.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-enthalpy-hess',
            title: 'Enthalpy, Calorimetry & Hess\'s Law',
            description: 'Energy bookkeeping for reactions that cannot be run in a calorimeter.',
            concepts: [
              {
                id: 'concept-enthalpy-hess',
                title: "Hess's Law & Enthalpy Cycles",
                summary: 'Enthalpy is a state function, so a reaction\'s ΔH is the same regardless of the route taken.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'Enthalpy is a state function: $\\Delta H$ depends only on initial and final states. Hence $\\Delta H_{reaction} = \\sum \\Delta H_f^{\\circ}(\\text{products}) - \\sum \\Delta H_f^{\\circ}(\\text{reactants})$, and any sequence of steps summing to the overall reaction may be added.',
                intuitiveExplanation:
                  'Hiking from base camp to a summit takes the same total elevation change whether you take the ridge or the valley — only the endpoint matters. Hess\'s law is that idea applied to energy.',
                keyFormulas: [
                  {
                    label: 'Standard Enthalpy of Reaction',
                    latex: '\\Delta H^{\\circ}_{rxn} = \\sum \\Delta H_f^{\\circ}(\\text{products}) - \\sum \\Delta H_f^{\\circ}(\\text{reactants})',
                    explanation: 'Elements in their standard states have $\\Delta H_f^{\\circ} = 0$.',
                  },
                  {
                    label: 'Calorimetry',
                    latex: 'q = mc\\Delta T',
                    explanation: 'Relates measured temperature change to heat absorbed by the surroundings.',
                  },
                ],
                keyObservations: [
                  'Reversing a reaction flips the sign of ΔH; scaling the equation scales ΔH.',
                  'Exothermic means ΔH < 0 (system releases heat); endothermic means ΔH > 0.',
                  'Bond breaking requires energy; bond formation releases it.',
                ],
                workedExamples: [
                  {
                    id: 'we-thermo-01',
                    title: 'Combustion Enthalpy from Formation Data',
                    problemStatement:
                      'Find $\\Delta H^{\\circ}$ for $\\text{CH}_4 + 2\\text{O}_2 \\to \\text{CO}_2 + 2\\text{H}_2\\text{O}(l)$ given $\\Delta H_f^{\\circ}$: $\\text{CH}_4 = -74.8$, $\\text{CO}_2 = -393.5$, $\\text{H}_2\\text{O} = -285.8\\,\\text{kJ/mol}$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Apply the formation-enthalpy formula.',
                      'Products: $(-393.5) + 2(-285.8) = -965.1\\,\\text{kJ}$.',
                      'Reactants: $(-74.8) + 2(0) = -74.8\\,\\text{kJ}$ (O₂ is an element).',
                      'Subtract: $-965.1 - (-74.8) = -890.3\\,\\text{kJ/mol}$.',
                    ],
                    finalAnswer: '$-890.3\\,\\text{kJ/mol}$ (exothermic)',
                    keyTakeaway:
                      'Elements in their standard states contribute exactly zero — forgetting this is the most common arithmetic slip.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-thermo-01',
                    trapTitle: 'Adding enthalpies instead of subtracting reactants',
                    flawedReasoning: 'Sum all the formation enthalpies in the equation.',
                    correctConcept:
                      'Products minus reactants. Adding everything gives a meaningless number, since formation enthalpies are signed.',
                    counterExample:
                      'In the methane example, summing all values gives $-1039.9$, not $-890.3\\,\\text{kJ/mol}$.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'chem-sub-carnot-eff', title: 'Carnot Efficiency', subjectId: 'chemistry' }],
                miniCheckQuestion: {
                  prompt: 'What is $\\Delta H_f^{\\circ}$ for $\\text{O}_2(g)$ in its standard state?',
                  options: ['$-285.8\\,\\text{kJ/mol}$', '$0$', '$-393.5\\,\\text{kJ/mol}$', 'It cannot be determined'],
                  correctIndex: 1,
                  explanation: 'Formation enthalpy of an element in its standard state is defined as zero.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'chem-topic-acids-bases',
        title: 'Acid-Base Equilibria & pH',
        description:
          'Proton transfer, buffer systems and titration curves — the quantitative side of aqueous chemistry.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'chem-sub-ph-buffers',
            title: 'pH, Ka & Buffer Capacity',
            description: 'Calculating hydrogen ion concentration and designing solutions that resist pH change.',
            concepts: [
              {
                id: 'concept-ph-ka',
                title: 'pH, pKa & Strengths of Acids',
                summary: 'Convert between hydrogen ion concentration and the logarithmic pH scale, and rank acids by Ka.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 24,
                formalDefinition:
                  '$\\text{pH} = -\\log_{10}[\\text{H}^+]$, $\\text{pOH} = -\\log[\\text{OH}^-]$, and at $25^\\circ\\text{C}$ $\\text{pH} + \\text{pOH} = 14$. For a weak acid, $K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}]}$ and $\\text{p}K_a = -\\log K_a$.',
                intuitiveExplanation:
                  'pH compresses a huge range of concentrations (from 1 M to $10^{-14}$ M) onto a 0–14 scale. Each unit is a tenfold change, so a pH of 3 is not "slightly" more acidic than pH 5 — it is 100 times more acidic.',
                keyFormulas: [
                  {
                    label: 'pH Definition',
                    latex: '\\text{pH} = -\\log_{10}[\\text{H}^+]',
                    explanation: 'A tenfold concentration change moves pH by exactly one unit.',
                  },
                  {
                    label: 'Weak Acid Approximation',
                    latex: '[\\text{H}^+] \\approx \\sqrt{K_a C}',
                    explanation: 'Valid when the acid is weak and only slightly dissociated.',
                  },
                ],
                keyObservations: [
                  'A lower pKa means a stronger acid, since Ka is larger.',
                  'Strong acids dissociate completely, so pH follows directly from concentration.',
                  'pH is temperature dependent because Kw changes with temperature.',
                ],
                workedExamples: [
                  {
                    id: 'we-ph-01',
                    title: 'pH of a Weak Acid',
                    problemStatement:
                      'Find the pH of $0.10\\,\\text{M}$ acetic acid with $K_a = 1.8 \\times 10^{-5}$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Set up the equilibrium: $[\\text{H}^+] = [\\text{A}^-] = x$, and $[\\text{HA}] \\approx 0.10 - x$.',
                      'Use the approximation $x \\approx \\sqrt{K_a C} = \\sqrt{(1.8\\times10^{-5})(0.10)}$.',
                      'Compute: $\\sqrt{1.8 \\times 10^{-6}} \\approx 1.34 \\times 10^{-3}$.',
                      'Take the negative log: $\\text{pH} = -\\log(1.34 \\times 10^{-3}) \\approx 2.87$.',
                    ],
                    finalAnswer: '$\\text{pH} \\approx 2.87$',
                    keyTakeaway:
                      'The $\\sqrt{K_a C}$ shortcut is valid only when dissociation is under about 5% of C.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ph-01',
                    trapTitle: 'Using the strong-acid formula for a weak acid',
                    flawedReasoning: 'A 0.10 M acid has pH 1, regardless of strength.',
                    correctConcept:
                      'Only strong acids dissociate fully. A weak acid releases far fewer protons, so its pH is much higher than $-\\log C$.',
                    counterExample:
                      '0.10 M HCl has pH 1.00, while 0.10 M acetic acid has pH 2.87.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'A solution has $[\\text{H}^+] = 10^{-4}\\,\\text{M}$. What is its pH?',
                  options: ['$4$', '$10$', '$-4$', '$14$'],
                  correctIndex: 0,
                  explanation: '$\\text{pH} = -\\log(10^{-4}) = 4$.',
                },
              },
              {
                id: 'concept-buffer-systems',
                title: 'Buffer Solutions & the Henderson-Hasselbalch Equation',
                summary: 'Design a solution whose pH barely moves when acid or base is added.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'A buffer is a weak acid with its conjugate base (or weak base with conjugate acid). Its pH obeys $\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}$, and it resists change best within roughly $\\text{p}K_a \\pm 1$.',
                intuitiveExplanation:
                  'The two components absorb attacks from both directions: added acid is neutralised by the conjugate base, added base by the weak acid. The pair acts like a shock absorber for pH.',
                keyFormulas: [
                  {
                    label: 'Henderson-Hasselbalch',
                    latex: '\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]}',
                    explanation: 'Equal concentrations give pH exactly equal to pKa.',
                  },
                ],
                keyObservations: [
                  'Buffer capacity peaks when the ratio is 1:1.',
                  'Beyond a 10:1 ratio the buffer is essentially spent.',
                  'Blood is buffered near pH 7.4 mainly by the $\\text{H}_2\\text{CO}_3/\\text{HCO}_3^-$ pair.',
                ],
                workedExamples: [
                  {
                    id: 'we-ph-02',
                    title: 'pH of an Acetate Buffer',
                    problemStatement:
                      'A buffer contains $0.10\\,\\text{M}$ acetic acid and $0.10\\,\\text{M}$ sodium acetate ($\\text{p}K_a = 4.76$). Find its pH.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Apply Henderson-Hasselbalch with the given concentrations.',
                      'The ratio $[\\text{A}^-]/[\\text{HA}] = 0.10/0.10 = 1$.',
                      'Therefore $\\log(1) = 0$.',
                      'So $\\text{pH} = 4.76 + 0 = 4.76$.',
                    ],
                    finalAnswer: '$\\text{pH} = 4.76$',
                    keyTakeaway:
                      'At a 1:1 ratio the buffer pH equals pKa exactly — a useful design shortcut.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ph-02',
                    trapTitle: 'Inverting the buffer ratio',
                    flawedReasoning: 'Put acid over base because acids are conventionally written first.',
                    correctConcept:
                      'The conjugate base concentration belongs in the numerator. Inverting the ratio mirrors the pH about pKa.',
                    counterExample:
                      'With $[\\text{A}^-]/[\\text{HA}] = 10$, pH is $5.76$, not $3.76$.',
                  },
                ],
                prerequisites: [{ id: 'concept-ph-ka', title: 'pH, pKa & Strengths of Acids', subjectId: 'chemistry' }],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'At what concentration ratio is a buffer most effective?',
                  options: ['1:100', '1:10', '1:1', '10:1'],
                  correctIndex: 2,
                  explanation: 'A 1:1 ratio gives maximum capacity to absorb both acid and base.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ===================================================================
  // BIOLOGY — photosynthesis, Mendelian genetics, enzymes
  // ===================================================================
  {
    subjectId: 'biology',
    examTracks: ALL,
    chapterId: 'bio-ch-cell-bio',
    topics: [
      {
        id: 'bio-topic-photosynthesis',
        title: 'Photosynthesis & Energy Conversion',
        description:
          'How light energy becomes chemical bonds, and why this is the reverse of respiration.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-light-dark-reactions',
            title: 'Light Reactions & the Calvin Cycle',
            description: 'Two coupled stages: energy capture in the thylakoid, carbon fixation in the stroma.',
            concepts: [
              {
                id: 'concept-photosynthesis-stages',
                title: 'Light Reactions & the Calvin Cycle',
                summary:
                  'Split photosynthesis into an energy-capturing stage and a carbon-fixing stage, linked by ATP and NADPH.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 26,
                formalDefinition:
                  'Overall: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light} \\to \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$. The light reactions in thylakoid membranes split water (releasing $\\text{O}_2$) and produce ATP and NADPH. The Calvin cycle in the stroma uses those to fix $\\text{CO}_2$ via RuBisCO.',
                intuitiveExplanation:
                  'The light reactions are a solar-powered battery charger, producing ATP and NADPH. The Calvin cycle is the factory that spends that charge to assemble sugar from carbon dioxide.',
                keyFormulas: [
                  {
                    label: 'Overall Equation',
                    latex: '6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2',
                    explanation: 'The oxygen released comes from water, not from carbon dioxide.',
                  },
                ],
                keyObservations: [
                  'The O₂ produced originates from the photolysis of water, proven by isotope labelling.',
                  'The Calvin cycle does not require light directly — it requires ATP and NADPH.',
                  'RuBisCO is the most abundant enzyme on Earth and also accepts O₂ (photorespiration).',
                ],
                workedExamples: [
                  {
                    id: 'we-photo-01',
                    title: 'Tracing the Oxygen Source',
                    problemStatement:
                      'If a plant is supplied with $\\text{H}_2^{18}\\text{O}$ and unlabelled $\\text{CO}_2$, where does the $^{18}\\text{O}$ label appear?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Identify which stage consumes water: the light reactions, via photolysis.',
                      'Photolysis splits water into protons, electrons and oxygen gas.',
                      'The oxygen atom from water is released directly as $\\text{O}_2$.',
                      'Therefore the released gas carries the $^{18}\\text{O}$ label.',
                    ],
                    finalAnswer: 'In the released $\\text{O}_2$ gas.',
                    keyTakeaway:
                      'The source of a product is determined by which reactant the reaction actually splits — not by the overall equation\'s appearance.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-photo-01',
                    trapTitle: 'Claiming the Calvin cycle runs only in darkness',
                    flawedReasoning: 'It is traditionally called the "dark reaction", so it must happen at night.',
                    correctConcept:
                      'The cycle needs no light directly but depends on ATP and NADPH, which only light reactions produce. In darkness it stops within minutes.',
                    counterExample:
                      'A plant kept in sustained darkness cannot fix carbon despite having all the Calvin cycle enzymes.',
                  },
                ],
                prerequisites: [{ id: 'concept-membrane-transport', title: 'Passive vs Active Membrane Transport', subjectId: 'biology' }],
                relatedConcepts: [{ id: 'bio-sub-atp-synthase', title: 'Chemiosmotic Coupling', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'Where does the oxygen released during photosynthesis come from?',
                  options: ['Carbon dioxide', 'Glucose', 'Water', 'Atmospheric O₂'],
                  correctIndex: 2,
                  explanation: 'Photolysis of water in the light reactions releases O₂.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-enzymes',
        title: 'Enzyme Kinetics & Metabolic Regulation',
        description:
          'How catalysts accelerate reactions, the Michaelis-Menten model, and inhibition mechanisms.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-michaelis-menten',
            title: 'Michaelis-Menten Kinetics & Inhibition',
            description: 'Rate behaviour at low and high substrate, and how inhibitors change the curve.',
            concepts: [
              {
                id: 'concept-enzyme-kinetics',
                title: 'Michaelis-Menten Kinetics & Inhibition',
                summary:
                  'Enzyme rate saturates with substrate; competitive and non-competitive inhibitors change the curve in different places.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  '$v = \\frac{V_{max}[S]}{K_m + [S]}$, where $K_m$ is the substrate concentration at half-maximal velocity. A competitive inhibitor raises $K_m$ but leaves $V_{max}$ unchanged; a non-competitive inhibitor lowers $V_{max}$ without changing $K_m$.',
                intuitiveExplanation:
                  'Enzymes are cashiers and substrate molecules are customers. With few customers the queue moves proportionally faster as more arrive; with many, every till is busy and adding customers cannot increase throughput. Km is the queue length at which service is half its maximum.',
                keyFormulas: [
                  {
                    label: 'Michaelis-Menten',
                    latex: 'v = \\frac{V_{max}[S]}{K_m + [S]}',
                    explanation: 'As $[S] \\to \\infty$, $v \\to V_{max}$; when $[S] = K_m$, $v = V_{max}/2$.',
                  },
                  {
                    label: 'Lineweaver-Burk Linearisation',
                    latex: '\\frac{1}{v} = \\frac{K_m}{V_{max}}\\frac{1}{[S]} + \\frac{1}{V_{max}}',
                    explanation: 'A straight line whose intercepts reveal $K_m$ and $V_{max}$.',
                  },
                ],
                keyObservations: [
                  'A low Km means high affinity — the enzyme reaches half-speed at little substrate.',
                  'Competitive inhibition is overcome by raising substrate concentration.',
                  'Non-competitive inhibition cannot be overcome by more substrate.',
                ],
                workedExamples: [
                  {
                    id: 'we-enzyme-01',
                    title: 'Finding Km from a Half-Maximal Rate',
                    problemStatement:
                      'An enzyme has $V_{max} = 100\\,\\mu\\text{mol/min}$. At what substrate concentration does it achieve $50\\,\\mu\\text{mol/min}$ if $K_m = 4\\,\\text{mM}$?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Half of $V_{max}$ is $50\\,\\mu\\text{mol/min}$, which is the definition of the Km point.',
                      'By definition, $v = V_{max}/2$ exactly when $[S] = K_m$.',
                      'Therefore no rearrangement is needed.',
                      'The required concentration is $4\\,\\text{mM}$.',
                    ],
                    finalAnswer: '$4\\,\\text{mM}$',
                    keyTakeaway: 'Km is defined as the half-saturation concentration — recognise the definition and skip the algebra.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-enzyme-01',
                    trapTitle: 'Confusing Km with the maximum rate',
                    flawedReasoning: 'Km is a constant describing the enzyme, so it must be the maximum velocity.',
                    correctConcept:
                      'Km has units of concentration, not rate. It measures affinity: smaller Km means tighter binding.',
                    counterExample:
                      'Hexokinase has a much lower Km for glucose than glucokinase, meaning higher affinity — despite both having similar Vmax.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'bio-sub-osmosis-water-potential', title: 'Water Potential & Osmotic Equilibrium', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'What does a competitive inhibitor do to Km and Vmax?',
                  options: ['Km rises, Vmax unchanged', 'Km unchanged, Vmax falls', 'Both fall', 'Both unchanged'],
                  correctIndex: 0,
                  explanation: 'It competes for the active site, so more substrate is needed (higher Km), but saturating substrate restores Vmax.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'bio-topic-mendelian-genetics',
        title: 'Mendelian Genetics & Inheritance Patterns',
        description:
          'Segregation, independent assortment and the probability rules that predict offspring ratios.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'bio-sub-mendel-ratios',
            title: 'Mendel\'s Laws & Dihybrid Crosses',
            description: 'Predicting genotype and phenotype ratios from parental genotypes.',
            concepts: [
              {
                id: 'concept-mendel-laws',
                title: 'Segregation, Independent Assortment & Test Crosses',
                summary:
                  'Predict offspring ratios using probability, and use a test cross to reveal an unknown genotype.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'The law of segregation states that the two alleles of a gene separate during gamete formation, so each gamete carries one. Independent assortment states alleles of different genes on different chromosomes are distributed independently, giving a $9:3:3:1$ phenotype ratio in a dihybrid cross of heterozygotes.',
                intuitiveExplanation:
                  'Each parent donates one allele per gene at random. Because genes assert independently, probabilities multiply — exactly like flipping two independent coins.',
                keyFormulas: [
                  {
                    label: 'Monohybrid Ratio',
                    latex: 'Aa \\times Aa \\to 3:1 \\text{ dominant : recessive}',
                    explanation: 'Roughly 75% of offspring show the dominant phenotype.',
                  },
                  {
                    label: 'Dihybrid Ratio',
                    latex: 'AaBb \\times AaBb \\to 9:3:3:1',
                    explanation: 'The product of two independent 3:1 ratios.',
                  },
                ],
                keyObservations: [
                  'A test cross with a homozygous recessive reveals whether the unknown is AA or Aa.',
                  'Independent assortment fails for genes on the same chromosome (linkage).',
                  'Genotype ratios differ from phenotype ratios whenever dominance is incomplete.',
                ],
                workedExamples: [
                  {
                    id: 'we-mendel-01',
                    title: 'Probability in a Dihybrid Cross',
                    problemStatement:
                      'In $AaBb \\times AaBb$, what fraction of offspring are phenotypically dominant for both traits?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Handle each gene separately: $Aa \\times Aa$ gives dominant phenotype 3/4 of the time.',
                      'The second gene behaves identically, also giving 3/4 dominant.',
                      'Independent assortment means the probabilities multiply.',
                      'Multiply: $\\tfrac{3}{4} \\times \\tfrac{3}{4} = \\tfrac{9}{16}$.',
                    ],
                    finalAnswer: '$\\frac{9}{16}$',
                    keyTakeaway:
                      'Never draw a 16-square Punnett square for independent genes — multiply the single-gene probabilities instead.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-mendel-01',
                    trapTitle: 'Assuming a dominant phenotype means homozygous',
                    flawedReasoning: 'A plant showing the dominant trait must carry two dominant alleles.',
                    correctConcept:
                      'A dominant phenotype can be heterozygous. Only a test cross (or genotyping) distinguishes AA from Aa.',
                    counterExample:
                      'Crossing an Aa plant with aa yields roughly half recessive offspring, which an AA parent could never produce.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'bio-sub-allele-freq', title: 'Hardy-Weinberg Equation', subjectId: 'biology' }],
                miniCheckQuestion: {
                  prompt: 'In $Aa \\times Aa$, what fraction of offspring are homozygous recessive?',
                  options: ['$\\tfrac{1}{2}$', '$\\tfrac{1}{4}$', '$\\tfrac{3}{4}$', '$\\tfrac{1}{8}$'],
                  correctIndex: 1,
                  explanation: 'Only the aa combination is homozygous recessive, appearing $\\tfrac14$ of the time.',
                },
              },
            ],
          },
        ],
      },
    ],
  },

  // ===================================================================
  // COMPUTER SCIENCE — algorithmic thinking between Big-O and ML
  // ===================================================================
  {
    subjectId: 'cs',
    examTracks: ALL,
    chapterId: 'cs-ch-python-dsa',
    topics: [
      {
        id: 'cs-topic-recursion-dp',
        title: 'Recursion, Memoisation & Dynamic Programming',
        description:
          'The bridge from brute-force recursion to efficient solutions: recognising overlapping subproblems.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'cs-sub-recursion-trees',
            title: 'Recursion & Recurrence Analysis',
            description: 'Writing base cases correctly and costing recursive algorithms.',
            concepts: [
              {
                id: 'concept-recursion-basics',
                title: 'Recursion & the Call Stack',
                summary: 'Solve a problem by delegating a strictly smaller instance of itself, with a base case that stops.',
                difficulty: 'medium',
                estimatedMinutes: 15,
                xpReward: 25,
                formalDefinition:
                  'A recursive function calls itself on a strictly smaller input and terminates at a base case. Each call consumes a stack frame, so recursion depth is bounded by memory; Python\'s default limit is 1000 frames.',
                intuitiveExplanation:
                  'Like Russian dolls: each opens to reveal a smaller doll, and the process ends when one does not open. You must know the smallest doll exists, or you open forever.',
                keyFormulas: [
                  {
                    label: 'Fibonacci Recurrence',
                    latex: 'T(n) = T(n-1) + T(n-2) + O(1) \\implies O(2^n)',
                    explanation: 'Exponential because the same subproblems are recomputed.',
                  },
                ],
                keyObservations: [
                  'Every recursion needs a base case, or it overflows the stack.',
                  'Two or more recursive calls usually produce a tree, not a line.',
                  'Any recursion can be rewritten with an explicit stack or a loop.',
                ],
                workedExamples: [
                  {
                    id: 'we-rec-01',
                    title: 'Why Naive Fibonacci Explodes',
                    problemStatement: 'Explain why recursive Fibonacci is $O(2^n)$ rather than $O(n)$.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      '`fib(n)` calls `fib(n-1)` and `fib(n-2)`.',
                      'The `fib(n-2)` branch recomputes work already done by `fib(n-1)`.',
                      'Each level roughly doubles the number of calls, forming a binary tree of depth n.',
                      'That gives $\\approx 2^n$ calls, while there are only n distinct subproblems.',
                    ],
                    finalAnswer: '$O(2^n)$ time, $O(n)$ space, with only $n$ unique subproblems — the redundancy is pure waste.',
                    keyTakeaway:
                      'Count distinct subproblems, not calls: the gap between the two is the opportunity for memoisation.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-rec-01',
                    trapTitle: 'Reaching for recursion on deeply linear problems',
                    flawedReasoning: 'Recursion is more elegant, so use it for summing a million elements.',
                    correctConcept:
                      'A million-deep recursion exceeds the stack limit and raises RecursionError. Prefer iteration for linear depth.',
                    counterExample:
                      '`sum_list` on a 10,000-element nested structure overflows Python\'s default recursion limit of 1000.',
                  },
                ],
                prerequisites: [{ id: 'concept-python-mutability', title: 'Mutability & Object Identity in Python', subjectId: 'cs' }],
                relatedConcepts: [{ id: 'concept-memoization-dp', title: 'Memoisation & Dynamic Programming', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'What happens if a recursive function never reaches its base case?',
                  options: ['It returns None', 'It loops forever silently', 'RecursionError / stack overflow', 'Python optimises it'],
                  correctIndex: 2,
                  explanation: 'Each call adds a frame until the interpreter raises RecursionError.',
                },
              },
              {
                id: 'concept-memoization-dp',
                title: 'Memoisation & Dynamic Programming',
                summary:
                  'Collapse exponential recursion to polynomial time by storing answers to subproblems you have already solved.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 30,
                formalDefinition:
                  'Dynamic programming applies when a problem has (i) optimal substructure and (ii) overlapping subproblems. Memoisation caches results top-down; tabulation builds them bottom-up. Both reduce naive Fibonacci from $O(2^n)$ to $O(n)$.',
                intuitiveExplanation:
                  'Memoisation is writing answers on a whiteboard so you never redo a calculation. Tabulation fills the whiteboard from the smallest case upward and never looks back.',
                keyFormulas: [
                  {
                    label: 'Memoised Recurrence',
                    latex: 'T(n) = O(n) \\quad \\text{with a cache of size } n',
                    explanation: 'Each distinct subproblem is computed exactly once.',
                  },
                ],
                keyObservations: [
                  'Memoisation trades $O(n)$ memory for an exponential speedup.',
                  'Tabulation usually has better constants and no recursion depth risk.',
                  'Greedy fails when a locally optimal choice blocks a better global solution; DP explores all subproblems.',
                ],
                workedExamples: [
                  {
                    id: 'we-dp-01',
                    title: 'Memoising Fibonacci',
                    problemStatement: 'Compute $\\text{fib}(50)$ efficiently.',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Naive recursion needs about $2^{50}$ calls and is infeasible.',
                      'But there are only 51 distinct values of interest: $\\text{fib}(0)$ to $\\text{fib}(50)$.',
                      'Store each computed value in a dict or list before returning it.',
                      'Each subsequent call hits the cache in $O(1)$.',
                    ],
                    finalAnswer: '$O(n)$ time and $O(n)$ space — $\\text{fib}(50)$ computes instantly.',
                    keyTakeaway:
                      'Spot the repeated subproblem first; the caching strategy is secondary.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-dp-01',
                    trapTitle: 'Caching an unhashable or mutated input',
                    flawedReasoning: 'Cache on a list argument directly since caching works for any input.',
                    correctConcept:
                      'Cache keys must be hashable and must represent the full subproblem state. Lists cannot be keys, and mutable state silently breaks the cache.',
                    counterExample:
                      'Passing a list as a memo key raises TypeError; mutating it in place can return wrong answers.',
                  },
                ],
                prerequisites: [{ id: 'concept-recursion-basics', title: 'Recursion & the Call Stack', subjectId: 'cs' }],
                relatedConcepts: [{ id: 'concept-big-o', title: 'Asymptotic Notation & Big-O Analysis', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'Which two properties must a problem have for DP to apply?',
                  options: [
                    'Sorted input and no duplicates',
                    'Overlapping subproblems and optimal substructure',
                    'Constant memory and no recursion',
                    'Deterministic input and small n',
                  ],
                  correctIndex: 1,
                  explanation: 'DP requires subproblems that repeat and an optimal solution built from optimal sub-solutions.',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'cs-topic-ml-foundations',
        title: 'Supervised Learning Foundations',
        description:
          'The workflow behind every ML system: features, loss functions, overfitting and honest evaluation.',
        estimatedHours: 6,
        subtopics: [
          {
            id: 'cs-sub-bias-variance',
            title: 'Overfitting, Regularisation & Validation',
            description: 'Diagnosing why a model fails on unseen data and the standard remedies.',
            concepts: [
              {
                id: 'concept-bias-variance',
                title: 'The Bias-Variance Trade-off',
                summary: 'Decompose generalisation error into underfitting and overfitting, then fix the dominant one.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 28,
                formalDefinition:
                  'Expected squared error decomposes as $\\mathbb{E}[(y - \\hat{f})^2] = \\text{Bias}^2 + \\text{Variance} + \\sigma^2$. High bias underfits (both train and test error high); high variance overfits (train error low, test error high).',
                intuitiveExplanation:
                  'A biased model is an archer aiming consistently at the wrong spot. A high-variance model is an archer whose arrows scatter widely — sometimes on target, never reliably.',
                keyFormulas: [
                  {
                    label: 'Error Decomposition',
                    latex: '\\text{Error} = \\text{Bias}^2 + \\text{Variance} + \\text{Irreducible noise}',
                    explanation: 'Reducing one usually raises the other; the goal is the minimum of the sum.',
                  },
                ],
                keyObservations: [
                  'A large gap between training and validation error signals variance.',
                  'Both errors high and close together signals bias.',
                  'More data reduces variance but does nothing for bias.',
                ],
                workedExamples: [
                  {
                    id: 'we-ml-01',
                    title: 'Diagnosing from Two Numbers',
                    problemStatement:
                      'A model achieves 99% training accuracy and 71% validation accuracy. Which problem is it, and what are two fixes?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Compare the two errors: training error 1%, validation error 29%.',
                      'A large gap means the model memorised the training set — high variance, i.e. overfitting.',
                      'Fix 1: add regularisation (L2 penalty) to constrain weight magnitude.',
                      'Fix 2: gather more data or reduce model capacity (fewer parameters, early stopping).',
                    ],
                    finalAnswer: 'Overfitting (high variance); apply regularisation and increase data or reduce capacity.',
                    keyTakeaway:
                      'Always compare training and validation error together — a single number cannot distinguish the two failure modes.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ml-01',
                    trapTitle: 'Tuning on the test set',
                    flawedReasoning: 'Keep improving the model against test accuracy until it is high.',
                    correctConcept:
                      'Repeatedly scoring on the test set leaks it into model selection, so reported accuracy no longer estimates generalisation. Use a validation split and touch the test set once.',
                    counterExample:
                      'A model tuned over 200 test-set iterations can show near-perfect test accuracy yet fail in production.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-gradient-descent', title: 'Gradient Descent & the Learning Rate', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'A model has 60% training accuracy and 58% validation accuracy. What is the problem?',
                  options: ['Overfitting', 'Underfitting', 'Neither — this is optimal', 'Data leakage'],
                  correctIndex: 1,
                  explanation: 'Both errors are high and close together, which indicates high bias, i.e. underfitting.',
                },
              },
              {
                id: 'concept-gradient-descent',
                title: 'Gradient Descent & the Learning Rate',
                summary: 'Minimise a loss surface by repeatedly stepping in the steepest downhill direction.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 27,
                formalDefinition:
                  'Gradient descent updates parameters by $\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta L(\\theta_t)$, where $\\eta$ is the learning rate. Convergence for a smooth convex loss requires $\\eta$ below roughly $2/L$, where $L$ is the Lipschitz constant of the gradient.',
                intuitiveExplanation:
                  'In thick fog on a hillside, you cannot see the valley but you can feel which way is downhill. Step that way, repeat. The step size decides whether you arrive, oscillate, or shoot past the valley.',
                keyFormulas: [
                  {
                    label: 'Update Rule',
                    latex: '\\theta_{t+1} = \\theta_t - \\eta\\nabla_\\theta L(\\theta_t)',
                    explanation: 'Subtracting the gradient moves against the direction of steepest increase.',
                  },
                ],
                keyObservations: [
                  'A learning rate too large causes divergence or oscillation; too small makes training impractically slow.',
                  'Stochastic gradient descent uses mini-batches, trading gradient accuracy for speed.',
                  'Learning-rate schedules (decay, warmup) are standard in practice.',
                ],
                workedExamples: [
                  {
                    id: 'we-ml-02',
                    title: 'One Step of Gradient Descent',
                    problemStatement:
                      'Minimise $L(\\theta) = \\theta^2$ starting at $\\theta_0 = 4$ with $\\eta = 0.25$. Find $\\theta_1$ and $\\theta_2$.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Compute the gradient: $\\nabla L = 2\\theta$.',
                      'At $\\theta_0 = 4$, the gradient is $8$.',
                      'Update: $\\theta_1 = 4 - 0.25(8) = 2$.',
                      'Repeat: gradient is $4$, so $\\theta_2 = 2 - 0.25(4) = 1$.',
                    ],
                    finalAnswer: '$\\theta_1 = 2$, $\\theta_2 = 1$ — halving each step toward the minimum at $0$.',
                    keyTakeaway:
                      'With $\\eta = 1/L$ the step lands exactly halfway to the optimum, which is a useful sanity check.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-ml-02',
                    trapTitle: 'Adding the gradient instead of subtracting',
                    flawedReasoning: 'The gradient points where loss increases quickly, so follow it to learn faster.',
                    correctConcept:
                      'Minimisation moves opposite the gradient. Adding it performs gradient *ascent*, maximising the loss.',
                    counterExample:
                      'Starting at $\\theta_0 = 4$ with $\\eta = 0.25$, adding gives $\\theta_1 = 12$ — moving away from the minimum.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [{ id: 'concept-bias-variance', title: 'The Bias-Variance Trade-off', subjectId: 'cs' }],
                miniCheckQuestion: {
                  prompt: 'What typically happens if the learning rate is far too large?',
                  options: ['Training converges faster', 'The loss diverges or oscillates', 'Nothing changes', 'The model underfits immediately'],
                  correctIndex: 1,
                  explanation: 'Oversized steps overshoot the minimum and can increase the loss each iteration.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
