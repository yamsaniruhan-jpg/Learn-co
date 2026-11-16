import {
  QuestionBankItem,
  SubjectId,
  ExamTrackId,
  DifficultyLevel,
} from '../../src/types/curriculum';

export type OlympiadDiscipline = 'ipho' | 'icho' | 'ibho' | 'ijso' | 'ict' | 'mixed';

interface ParamTemplate {
  key: string;
  subjectId: SubjectId;
  examTracks: ExamTrackId[];
  olympiadDisciplines: OlympiadDiscipline[];
  chapterId: string;
  topicId: string;
  conceptId: string;
  difficulty: DifficultyLevel;
  build: (seed: number) => Omit<QuestionBankItem, 'id' | 'subjectId' | 'examTracks' | 'chapterId' | 'topicId' | 'conceptId' | 'difficulty' | 'verificationStatus' | 'version'>;
}

function makeUniqueOptions(correct: string, candidates: string[]): string[] {
  const seen = new Set<string>([correct]);
  const out = [correct];
  for (const c of candidates) {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
    if (out.length >= 4) break;
  }
  return out;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = (seed * 1664525 + 1013904223) >>> 0;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TEMPLATES: ParamTemplate[] = [
  // ================= IPhO (PHYSICS) =================
  {
    key: 'ipho_carnot',
    subjectId: 'physics',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_advanced'],
    olympiadDisciplines: ['ipho', 'mixed'],
    chapterId: 'phys-ch-ipho-thermo-optics',
    topicId: 'phys-topic-ipho-thermo',
    conceptId: 'concept-phys-carnot-cycle',
    difficulty: 'medium',
    build: (seed) => {
      const tCold = 250 + (seed % 5) * 25; // 250, 275, 300, 325, 350 K
      const factor = 2 + (seed % 3); // 2, 3, 4
      const tHot = tCold * factor;
      const qHot = (4 + (seed % 6)) * factor * 10; // divisible cleanly
      const work = qHot * (1 - tCold / tHot);
      return {
        questionType: 'numerical',
        questionText: `An ideal Carnot heat engine operates between a hot reservoir at $T_H = ${tHot}\\text{ K}$ and a cold reservoir at $T_C = ${tCold}\\text{ K}$. If the engine absorbs $Q_H = ${qHot}\\text{ J}$ per cycle, calculate the net mechanical work output $W$ per cycle (in Joules).`,
        correctAnswer: work,
        numericalTolerance: 0.05,
        numericalUnit: 'J',
        explanation: `Carnot efficiency $\\eta = 1 - T_C/T_H = 1 - ${tCold}/${tHot} = ${(1 - 1 / factor).toFixed(3)}$. Thus $W = \\eta Q_H = ${work}\\text{ J}$.`,
        stepByStepSolution: [
          `Compute Carnot efficiency $\\eta = 1 - \\frac{T_C}{T_H} = 1 - \\frac{${tCold}}{${tHot}} = \\frac{${factor - 1}}{${factor}}$.`,
          `Multiply by absorbed heat: $W = \\eta Q_H = \\frac{${factor - 1}}{${factor}} \\times ${qHot} = ${work}\\text{ J}$.`,
        ],
        hints: [
          'Use Carnot thermal efficiency $\\eta = 1 - T_C/T_H$ with Kelvin temperatures.',
          'Net work per cycle equals $W = \\eta Q_H$.',
        ],
        tags: ['IPhO', 'Thermodynamics', 'Carnot Engine'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ipho_emf',
    subjectId: 'physics',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_advanced'],
    olympiadDisciplines: ['ipho', 'mixed'],
    chapterId: 'phys-ch-ipho-thermo-optics',
    topicId: 'phys-topic-ipho-em-waves',
    conceptId: 'concept-phys-faraday-disk',
    difficulty: 'medium_hard',
    build: (seed) => {
      const bVal = ((seed % 5) + 1) * 0.2; // 0.2 to 1.0 T
      const omega = ((seed % 6) + 2) * 5; // 10 to 35 rad/s
      const radius = ((seed % 4) + 1) * 0.2; // 0.2 to 0.8 m
      const emf = Number((0.5 * bVal * omega * radius * radius).toFixed(3));
      return {
        questionType: 'numerical',
        questionText: `A solid conducting copper disk of radius $R = ${radius.toFixed(1)}\\text{ m}$ rotates at angular speed $\\omega = ${omega}\\text{ rad/s}$ in a uniform axial magnetic field $B = ${bVal.toFixed(1)}\\text{ T}$. Compute the magnitude of the induced motional EMF between the central axle and outer rim (in Volts).`,
        correctAnswer: emf,
        numericalTolerance: 0.02,
        numericalUnit: 'V',
        explanation: `Integrating $d\\mathcal{E} = (\\omega r) B\\,dr$ from $0$ to $R$ gives $\\mathcal{E} = \\frac{1}{2} B \\omega R^2 = ${emf}\\text{ V}$.`,
        stepByStepSolution: [
          `At radius $r$, tangential speed is $v(r) = \\omega r$.`,
          `Integrate radial motional electric field: $\\mathcal{E} = \\int_0^R B \\omega r\\,dr = \\frac{1}{2} B \\omega R^2$.`,
          `Evaluate: $0.5 \\times ${bVal.toFixed(1)} \\times ${omega} \\times ${(radius * radius).toFixed(2)} = ${emf}\\text{ V}$.`,
        ],
        hints: [
          'Average tangential velocity along a radial spoke is $\\frac{1}{2}\\omega R$.',
          'Apply $\\mathcal{E} = \\int_0^R (\\vec{v} \\times \\vec{B}) \\cdot d\\vec{r}$.',
        ],
        tags: ['IPhO', 'Electromagnetism', 'Motional EMF'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ipho_collision',
    subjectId: 'physics',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_main'],
    olympiadDisciplines: ['ipho', 'mixed'],
    chapterId: 'phys-ch-mechanics-energy',
    topicId: 'phys-topic-conservation-momentum',
    conceptId: 'concept-phys-elastic-collision',
    difficulty: 'easy_medium',
    build: (seed) => {
      const m1 = (seed % 5) + 1;
      const m2 = ((seed % 4) + 1) * m1; // ensures clean fraction
      const v1 = ((seed % 6) + 2) * (m1 + m2) / m1; // clean integer result!
      const v2Final = Number(((2 * m1 * v1) / (m1 + m2)).toFixed(2));
      const correct = `${v2Final} m/s`;
      const options = seededShuffle(
        makeUniqueOptions(correct, [
          `${(v2Final / 2).toFixed(2)} m/s`,
          `${(v1).toFixed(2)} m/s`,
          `${(v2Final + 2).toFixed(2)} m/s`,
        ]),
        seed
      );
      return {
        questionType: 'single_choice',
        questionText: `A sphere of mass $m_1 = ${m1}\\text{ kg}$ moving at $v_1 = ${v1.toFixed(1)}\\text{ m/s}$ collides elastically head-on with a stationary target of mass $m_2 = ${m2}\\text{ kg}$ on a frictionless track. What is the speed of $m_2$ immediately after impact?`,
        options,
        correctAnswer: correct,
        explanation: `Conservation of momentum and kinetic energy gives $v_2' = \\frac{2 m_1}{m_1 + m_2} v_1 = \\frac{2(${m1})}{${m1 + m2}}(${v1.toFixed(1)}) = ${v2Final}\\text{ m/s}$.`,
        stepByStepSolution: [
          'For 1D elastic collision with target initially at rest, $v_2\' = \\frac{2 m_1}{m_1 + m_2} v_1$.',
          `Substitute $m_1=${m1}, m_2=${m2}, v_1=${v1.toFixed(1)}$ to get ${v2Final} m/s.`,
        ],
        hints: [
          'Relative speed of separation equals relative speed of approach ($e = 1$).',
        ],
        tags: ['IPhO', 'Mechanics', 'Collisions'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },

  // ================= IChO (CHEMISTRY) =================
  {
    key: 'icho_latimer',
    subjectId: 'chemistry',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    olympiadDisciplines: ['icho', 'mixed'],
    chapterId: 'chem-ch-icho-equilibria',
    topicId: 'chem-topic-icho-electrochem',
    conceptId: 'concept-chem-latimer-frost',
    difficulty: 'hard',
    build: (seed) => {
      const e1 = Number((0.4 + (seed % 5) * 0.15).toFixed(2));
      const e2 = Number((-0.3 - (seed % 4) * 0.1).toFixed(2));
      const n1 = 1;
      const n2 = 2;
      const e3 = Number(((n1 * e1 + n2 * e2) / (n1 + n2)).toFixed(3));
      return {
        questionType: 'numerical',
        questionText: `Consider two sequential reduction half-reactions: (1) $\\text{M}^{3+} + e^- \\to \\text{M}^{2+}$ with $E_1^\\circ = +${e1.toFixed(2)}\\text{ V}$, and (2) $\\text{M}^{2+} + 2e^- \\to \\text{M}$ with $E_2^\\circ = ${e2.toFixed(2)}\\text{ V}$. Calculate the standard potential $E_3^\\circ$ (in Volts) for the combined 3-electron reduction $\\text{M}^{3+} + 3e^- \\to \\text{M}$.`,
        correctAnswer: e3,
        numericalTolerance: 0.015,
        numericalUnit: 'V',
        explanation: `Using Latimer additivity of $\\Delta G^\\circ = -nFE^\\circ$: $3 E_3^\\circ = 1(${e1.toFixed(2)}) + 2(${e2.toFixed(2)}) \\implies E_3^\\circ = ${e3.toFixed(3)}\\text{ V}$.`,
        stepByStepSolution: [
          'Standard potentials are intensive, so sum extensive Gibbs energies: $n_3 E_3^\\circ = n_1 E_1^\\circ + n_2 E_2^\\circ$.',
          `Compute $E_3^\\circ = \\frac{1(${e1.toFixed(2)}) + 2(${e2.toFixed(2)})}{3} = ${e3.toFixed(3)}\\text{ V}$.`,
        ],
        hints: [
          'Never add $E^\\circ$ values directly when electron counts $n_1 \\neq n_2$ differ.',
          'Weight each $E^\\circ$ by its electron stoichiometric number $n_i$.',
        ],
        tags: ['IChO', 'Electrochemistry', 'Latimer Diagram'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'icho_half_life',
    subjectId: 'chemistry',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad', 'jee_main'],
    olympiadDisciplines: ['icho', 'mixed'],
    chapterId: 'chem-ch-kinetics-thermo',
    topicId: 'chem-topic-chemical-kinetics',
    conceptId: 'concept-chem-first-order-kinetics',
    difficulty: 'easy_medium',
    build: (seed) => {
      const tHalf = 10 + (seed % 4) * 5; // 10, 15, 20, 25 min
      const cycles = 2 + (seed % 4); // 2, 3, 4, 5 half-lives
      const elapsed = tHalf * cycles;
      const initialMass = 32 * ((seed % 3) + 1); // 32, 64, 96 mg
      const remaining = Number((initialMass / Math.pow(2, cycles)).toFixed(3));
      return {
        questionType: 'numerical',
        questionText: `A pharmaceutical radioisotope undergoes first-order decay with a half-life $t_{1/2} = ${tHalf}\\text{ min}$. Starting from an initial sample mass of $${initialMass}\\text{ mg}$, how many milligrams remain undecayed after $t = ${elapsed}\\text{ min}$?`,
        correctAnswer: remaining,
        numericalTolerance: 0.02,
        numericalUnit: 'mg',
        explanation: `Number of half-lives $n = ${elapsed}/${tHalf} = ${cycles}$. Remaining mass $= ${initialMass} / 2^{${cycles}} = ${remaining}\\text{ mg}$.`,
        stepByStepSolution: [
          `Determine number of half-lives: $n = t / t_{1/2} = ${elapsed} / ${tHalf} = ${cycles}$.`,
          `Compute $m(t) = m_0 \\left(\\frac{1}{2}\\right)^n = ${initialMass} / ${Math.pow(2, cycles)} = ${remaining}\\text{ mg}$.`,
        ],
        hints: [
          'Divide total elapsed time by $t_{1/2}$ to find the number of halving intervals.',
        ],
        tags: ['IChO', 'Chemical Kinetics', 'First Order'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'icho_gibbs_crossover',
    subjectId: 'chemistry',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    olympiadDisciplines: ['icho', 'mixed'],
    chapterId: 'chem-ch-icho-equilibria',
    topicId: 'chem-topic-icho-thermo',
    conceptId: 'concept-chem-gibbs-helmholtz',
    difficulty: 'medium',
    build: (seed) => {
      const ds = 40 + (seed % 5) * 20; // 40, 60, 80, 100, 120 J/(mol K)
      const tempK = 350 + (seed % 6) * 50; // 350 to 600 K
      const dhKj = Number(((ds * tempK) / 1000).toFixed(2));
      return {
        questionType: 'numerical',
        questionText: `An endothermic reaction has $\\Delta H^\\circ = +${dhKj}\\text{ kJ/mol}$ and $\\Delta S^\\circ = +${ds}\\text{ J/(mol}\\cdot\\text{K)}$. Above what minimum threshold temperature $T^*$ (in Kelvin) does the reaction become spontaneous under standard conditions ($\\Delta G^\\circ < 0$)?`,
        correctAnswer: tempK,
        numericalTolerance: 0.5,
        numericalUnit: 'K',
        explanation: `Setting $\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = 0$ yields $T^* = \\frac{\\Delta H^\\circ}{\\Delta S^\\circ} = \\frac{${dhKj * 1000}\\text{ J/mol}}{${ds}\\text{ J/(mol}\\cdot\\text{K)}} = ${tempK}\\text{ K}$.`,
        stepByStepSolution: [
          `Convert $\\Delta H^\\circ$ to Joules: $${dhKj} \\times 1000 = ${dhKj * 1000}\\text{ J/mol}$.`,
          `Evaluate $T^* = \\frac{${dhKj * 1000}}{${ds}} = ${tempK}\\text{ K}$.`,
        ],
        hints: [
          'Remember to convert $\\Delta H^\\circ$ from kJ/mol into J/mol to match $\\Delta S^\\circ$ units.',
        ],
        tags: ['IChO', 'Thermodynamics', 'Spontaneity'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },

  // ================= IBHO / IBO (BIOLOGY) =================
  {
    key: 'ibho_michaelis',
    subjectId: 'biology',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    olympiadDisciplines: ['ibho', 'mixed'],
    chapterId: 'bio-ch-ibho-biochem',
    topicId: 'bio-topic-ibho-enzymes',
    conceptId: 'concept-bio-michaelis-menten',
    difficulty: 'medium',
    build: (seed) => {
      const km = 5 * ((seed % 4) + 1); // 5, 10, 15, 20 uM
      const mult = (seed % 4) + 1; // 1, 2, 3, 4
      const s = km * mult;
      const vmax = (1 + mult) * 20 * ((seed % 3) + 1);
      const v0 = Math.round((vmax * s) / (km + s));
      return {
        questionType: 'numerical',
        questionText: `An allosterically uninhibited enzyme follows Michaelis-Menten kinetics with $V_{\\max} = ${vmax}\\,\\mu\\text{M/min}$ and $K_m = ${km}\\,\\mu\\text{M}$. What is the initial reaction velocity $v_0$ (in $\\mu\\text{M/min}$) at substrate concentration $[S] = ${s}\\,\\mu\\text{M}$?`,
        correctAnswer: v0,
        numericalTolerance: 0.1,
        numericalUnit: 'µM/min',
        explanation: `$v_0 = \\frac{V_{\\max}[S]}{K_m + [S]} = \\frac{${vmax} \\times ${s}}{${km} + ${s}} = ${v0}\\,\\mu\\text{M/min}$.`,
        stepByStepSolution: [
          'Apply the Michaelis-Menten rate equation: $v_0 = \\frac{V_{\\max}[S]}{K_m + [S]}$.',
          `Note $[S]/K_m = ${mult}$, so $v_0 = \\frac{${mult}}{${1 + mult}} V_{\\max} = ${v0}\\,\\mu\\text{M/min}$.`,
        ],
        hints: [
          'Notice how $[S]$ is an integer multiple of $K_m$.',
        ],
        tags: ['IBHO', 'Biochemistry', 'Enzyme Kinetics'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ibho_nernst_ion',
    subjectId: 'biology',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    olympiadDisciplines: ['ibho', 'mixed'],
    chapterId: 'bio-ch-immunology-neuro',
    topicId: 'bio-topic-neuro-membrane',
    conceptId: 'concept-bio-nernst-potential',
    difficulty: 'medium_hard',
    build: (seed) => {
      const isCation = seed % 2 === 0;
      const power = (seed % 2) + 1; // 10^1 or 10^2 ratio
      const ratio = Math.pow(10, power);
      const inConc = 10;
      const outConc = inConc * ratio;
      // E = (60 / z) * log10(out/in) at 37 C approximation used in IBO
      const z = isCation ? 1 : 2;
      const potential = Math.round((60 / z) * power);
      const ionName = isCation ? '\\text{X}^+' : '\\text{Y}^{2+}';
      return {
        questionType: 'numerical',
        questionText: `At physiological temperature ($\\frac{RT\\ln 10}{F} \\approx 60\\text{ mV}$), a membrane is selectively permeable only to a cation $${ionName}$ ($z = +${z}$). Given $[${ionName}]_{\\text{out}} = ${outConc}\\text{ mM}$ and $[${ionName}]_{\\text{in}} = ${inConc}\\text{ mM}$, find the Nernst equilibrium potential $E_{\\text{eq}}$ in millivolts (mV).`,
        correctAnswer: potential,
        numericalTolerance: 1,
        numericalUnit: 'mV',
        explanation: `Using $E_{\\text{eq}} = \\frac{60\\text{ mV}}{z} \\log_{10}\\left(\\frac{[\\text{out}]}{[\\text{in}]}\\right) = \\frac{60}{${z}} \\log_{10}(${ratio}) = +${potential}\\text{ mV}$.`,
        stepByStepSolution: [
          `Compute concentration ratio $\\frac{[\\text{out}]}{[\\text{in}]} = \\frac{${outConc}}{${inConc}} = 10^{${power}}$.`,
          `Multiply $\\frac{60}{${z}} \\times ${power} = +${potential}\\text{ mV}$.`,
        ],
        hints: [
          'Remember the valence $z$ in the denominator of $\\frac{60}{z} \\log_{10}([\\text{out}]/[\\text{in}])$.',
        ],
        tags: ['IBHO', 'Neurobiology', 'Nernst Potential'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ibho_hardy_weinberg',
    subjectId: 'biology',
    examTracks: ['all', 'iapt_exams', 'stem_olympiad'],
    olympiadDisciplines: ['ibho', 'mixed'],
    chapterId: 'bio-ch-genetics-ecology',
    topicId: 'bio-topic-population-genetics',
    conceptId: 'concept-bio-hardy-weinberg',
    difficulty: 'easy_medium',
    build: (seed) => {
      const qPercent = [10, 20, 30, 40][seed % 4];
      const q = qPercent / 100;
      const p = 1 - q;
      const hetPct = Math.round(2 * p * q * 100);
      const recPct = Math.round(q * q * 100);
      return {
        questionType: 'numerical',
        questionText: `In a large randomly mating population in Hardy-Weinberg equilibrium, $${recPct}\\%$ of individuals express an autosomal recessive phenotype ($aa$). What percentage ($\\%$) of the entire population are heterozygous carriers ($Aa$)?`,
        correctAnswer: hetPct,
        numericalTolerance: 0.5,
        numericalUnit: '%',
        explanation: `Recessive frequency $q^2 = ${q * q} \\implies q = ${q.toFixed(1)},\\ p = 1 - q = ${p.toFixed(1)}$. Heterozygote frequency $2pq = 2(${p.toFixed(1)})(${q.toFixed(1)}) = ${(2 * p * q).toFixed(2)} = ${hetPct}\\%$.`,
        stepByStepSolution: [
          `Take square root of recessive genotype fraction: $q = \\sqrt{${(q * q).toFixed(2)}} = ${q.toFixed(1)}$.`,
          `Compute dominant allele frequency $p = 1 - ${q.toFixed(1)} = ${p.toFixed(1)}$.`,
          `Calculate $2pq = 2 \\times ${p.toFixed(1)} \\times ${q.toFixed(1)} = ${hetPct}\\%$.`,
        ],
        hints: [
          'Start with $q^2 = \\text{recessive phenotype proportion}$ to solve for $q$.',
        ],
        tags: ['IBHO', 'Genetics', 'Hardy-Weinberg'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },

  // ================= IJSO (JUNIOR SCIENCE OLYMPIAD) =================
  {
    key: 'ijso_calorimetry',
    subjectId: 'physics',
    examTracks: ['all', 'nsejs', 'stem_olympiad'],
    olympiadDisciplines: ['ijso', 'mixed'],
    chapterId: 'phys-ch-thermodynamics',
    topicId: 'phys-topic-calorimetry',
    conceptId: 'concept-phys-heat-exchange',
    difficulty: 'easy_medium',
    build: (seed) => {
      const m1 = ((seed % 4) + 1) * 100; // 100..400 g
      const m2 = ((seed % 3) + 1) * m1; // 1x..3x m1
      const t1 = 20 + (seed % 3) * 10; // 20..40 C
      const diff = (m1 + m2) / m1; // clean factor
      const t2 = t1 + diff * (5 + (seed % 5));
      const tEq = Number(((m1 * t1 + m2 * t2) / (m1 + m2)).toFixed(1));
      return {
        questionType: 'numerical',
        questionText: `[IJSO] Inside a perfectly insulated calorimeter, $${m1}\\text{ g}$ of pure water at $${t1}^\\circ\\text{C}$ is mixed with $${m2}\\text{ g}$ of pure water at $${t2}^\\circ\\text{C}$. What is the final thermal equilibrium temperature in $^\\circ\\text{C}$?`,
        correctAnswer: tEq,
        numericalTolerance: 0.1,
        numericalUnit: '°C',
        explanation: `Conservation of thermal energy gives $T_{\\text{eq}} = \\frac{m_1 T_1 + m_2 T_2}{m_1 + m_2} = \\frac{${m1}(${t1}) + ${m2}(${t2})}{${m1 + m2}} = ${tEq}^\\circ\\text{C}$.`,
        stepByStepSolution: [
          'Set heat gained by cold water equal to heat lost by hot water: $m_1 c (T - T_1) = m_2 c (T_2 - T)$.',
          `Cancel $c$ and evaluate $T = \\frac{${m1 * t1 + m2 * t2}}{${m1 + m2}} = ${tEq}^\\circ\\text{C}$.`,
        ],
        hints: [
          'Specific heat capacity $c$ is identical for both masses of water and cancels out.',
        ],
        tags: ['IJSO', 'Calorimetry', 'Thermodynamics'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ijso_buoyancy',
    subjectId: 'physics',
    examTracks: ['all', 'nsejs', 'stem_olympiad'],
    olympiadDisciplines: ['ijso', 'mixed'],
    chapterId: 'phys-ch-mechanics-energy',
    topicId: 'phys-topic-fluid-buoyancy',
    conceptId: 'concept-phys-archimedes',
    difficulty: 'easy_medium',
    build: (seed) => {
      const rhoObj = 500 + (seed % 5) * 80; // 500, 580, 660, 740, 820 kg/m3
      const rhoFluid = 1000;
      const pctSub = Number(((rhoObj / rhoFluid) * 100).toFixed(1));
      return {
        questionType: 'numerical',
        questionText: `[IJSO] A uniform wooden block of density $\\rho_{\\text{obj}} = ${rhoObj}\\text{ kg/m}^3$ floats upright in freshwater ($\\rho_{\\text{water}} = 1000\\text{ kg/m}^3$). What percentage ($\\%$) of the block's total volume is submerged beneath the waterline?`,
        correctAnswer: pctSub,
        numericalTolerance: 0.2,
        numericalUnit: '%',
        explanation: `At floating equilibrium, weight equals buoyant force: $\\rho_{\\text{obj}} V g = \\rho_{\\text{water}} V_{\\text{sub}} g \\implies \\frac{V_{\\text{sub}}}{V} = \\frac{${rhoObj}}{1000} = ${pctSub}\\%$.`,
        stepByStepSolution: [
          'Balance gravity and Archimedes upward force: $V_{\\text{sub}}/V = \\rho_{\\text{obj}}/\\rho_{\\text{fluid}}$.',
          `Convert to percentage: $(${rhoObj}/1000) \\times 100\\% = ${pctSub}\\%$.`,
        ],
        hints: [
          'By Archimedes\' principle, submerged fraction equals $\\rho_{\\text{obj}} / \\rho_{\\text{fluid}}$.',
        ],
        tags: ['IJSO', 'Fluids', 'Buoyancy'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },

  // ================= ICT (INTERNATIONAL CODING TEST) =================
  {
    key: 'ict_mod_exp',
    subjectId: 'cs',
    examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
    olympiadDisciplines: ['ict', 'mixed'],
    chapterId: 'cs-ch-ict-algorithms',
    topicId: 'cs-topic-ict-number-theory',
    conceptId: 'concept-cs-modular-exponentiation',
    difficulty: 'medium',
    build: (seed) => {
      const bases = [2, 3, 5, 7];
      const mods = [11, 13, 17, 19];
      const base = bases[seed % bases.length];
      const p = mods[(seed >> 1) % mods.length];
      const exp = (p - 1) * ((seed % 5) + 3) + 2; // congruent to 2 mod (p - 1)!
      const ans = (base * base) % p;
      return {
        questionType: 'numerical',
        questionText: `[ICT] Compute the remainder when $${base}^{${exp}}$ is divided by the prime $p = ${p}$ (i.e., evaluate $${base}^{${exp}} \\bmod ${p}$).`,
        correctAnswer: ans,
        numericalTolerance: 0,
        explanation: `By Fermat's Little Theorem, since $\\gcd(${base}, ${p}) = 1$, $${base}^{${p - 1}} \\equiv 1 \\pmod{${p}}$. Writing $${exp} = ${p - 1} \\cdot q + 2$ yields $${base}^2 \\equiv ${base * base} \\equiv ${ans} \\pmod{${p}}$.`,
        stepByStepSolution: [
          `Apply Fermat's Little Theorem with $p = ${p}$: $${base}^{${p - 1}} \\equiv 1 \\pmod{${p}}$.`,
          `Reduce exponent modulo $(p - 1) = ${p - 1}$: $${exp} \\bmod ${p - 1} = 2$.`,
          `Evaluate $${base}^2 \\bmod ${p} = ${ans}$.`,
        ],
        hints: [
          `Use Fermat's Little Theorem: reduce the exponent modulo $(p - 1) = ${p - 1}$.`,
        ],
        tags: ['ICT', 'Number Theory', 'Modular Arithmetic'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ict_knapsack',
    subjectId: 'cs',
    examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
    olympiadDisciplines: ['ict', 'mixed'],
    chapterId: 'cs-ch-ict-algorithms',
    topicId: 'cs-topic-ict-dp',
    conceptId: 'concept-cs-01-knapsack',
    difficulty: 'medium_hard',
    build: (seed) => {
      const k = (seed % 4) + 1;
      const items = [
        { w: 2, v: 6 + k },
        { w: 3, v: 10 + 2 * k },
        { w: 4, v: 13 + 2 * k },
        { w: 5, v: 16 + 3 * k },
      ];
      const cap = 7 + (seed % 2); // 7 or 8
      // Exact 0/1 Knapsack DP solver
      const dp = new Array(cap + 1).fill(0);
      for (const it of items) {
        for (let w = cap; w >= it.w; w--) {
          dp[w] = Math.max(dp[w], dp[w - it.w] + it.v);
        }
      }
      const optimal = dp[cap];
      return {
        questionType: 'numerical',
        questionText: `[ICT] Solve the 0/1 Knapsack problem for capacity $W = ${cap}$ given 4 indivisible items $(w_i, v_i)$: ${items
          .map((it) => `(${it.w}, ${it.v})`)
          .join(', ')}. What is the maximum achievable total value?`,
        correctAnswer: optimal,
        numericalTolerance: 0,
        explanation: `Running 1D 0/1 Knapsack DP backward over weight capacity $0\\dots ${cap}$ yields optimal subset sum ${optimal}.`,
        stepByStepSolution: [
          `Initialize $dp[0\\dots ${cap}] = 0$.`,
          'For each item $(w, v)$, iterate $c$ from $W$ down to $w$: $dp[c] = \\max(dp[c], dp[c-w] + v)$.',
          `Optimal value at $dp[${cap}] = ${optimal}$.`,
        ],
        hints: [
          'Check every valid subset whose weights sum to at most $W$ (there are only 4 items).',
        ],
        tags: ['ICT', 'Dynamic Programming', 'Knapsack'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'ict_dijkstra_graph',
    subjectId: 'cs',
    examTracks: ['all', 'ict_hackathon', 'stem_olympiad'],
    olympiadDisciplines: ['ict', 'mixed'],
    chapterId: 'cs-ch-ict-algorithms',
    topicId: 'cs-topic-ict-graphs',
    conceptId: 'concept-cs-dijkstra',
    difficulty: 'medium',
    build: (seed) => {
      const a = 2 + (seed % 4);
      const b = 3 + ((seed >> 1) % 5);
      const c = 1 + (seed % 3);
      const d = 4 + ((seed >> 2) % 4);
      const path1 = a + d; // S -> A -> T
      const path2 = b + c; // S -> B -> T
      const path3 = a + 1 + c; // S -> A -> B -> T
      const shortest = Math.min(path1, path2, path3);
      return {
        questionType: 'numerical',
        questionText: `[ICT] A directed weighted graph has 4 vertices $\\{S, A, B, T\\}$ with edges: $S\\to A$ (${a}), $S\\to B$ (${b}), $A\\to B$ (1), $A\\to T$ (${d}), and $B\\to T$ (${c}). What is the shortest path distance from $S$ to $T$?`,
        correctAnswer: shortest,
        numericalTolerance: 0,
        explanation: `Comparing paths: $S\\to A\\to T = ${path1}$, $S\\to B\\to T = ${path2}$, $S\\to A\\to B\\to T = ${path3}$. Minimum distance is ${shortest}.`,
        stepByStepSolution: [
          `Relax from $S$: $dist[A]=${a}, dist[B]=${b}$.`,
          `Relax $A$: $dist[B]=\\min(${b}, ${a}+1)=${Math.min(b, a + 1)}, dist[T]=${a + d}$.`,
          `Relax $B$: $dist[T]=\\min(${a + d}, ${Math.min(b, a + 1)}+${c})=${shortest}$.`,
        ],
        hints: [
          'Check whether routing $S \\to A \\to B \\to T$ beats the direct edge $S \\to B \\to T$.',
        ],
        tags: ['ICT', 'Graphs', 'Dijkstra'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },

  // ================= MATHEMATICS =================
  {
    key: 'math_titu',
    subjectId: 'math',
    examTracks: ['all', 'stem_olympiad', 'jee_advanced'],
    olympiadDisciplines: ['mixed'],
    chapterId: 'math-ch-inmo-olympiad',
    topicId: 'math-topic-inmo-inequalities',
    conceptId: 'concept-math-titu-lemma',
    difficulty: 'medium_hard',
    build: (seed) => {
      const p = 1 + (seed % 3);
      const q = 2 + ((seed >> 1) % 3);
      const r = 3 + ((seed >> 2) % 2);
      const sum = p + q + r;
      const factor = 1 + (seed % 3);
      const total = sum * factor;
      const minVal = Number(((sum * sum) / total).toFixed(2));
      return {
        questionType: 'numerical',
        questionText: `For positive reals $x, y, z > 0$ satisfying $x + y + z = ${total}$, find the exact minimum possible value of $\\frac{${p * p}}{x} + \\frac{${q * q}}{y} + \\frac{${r * r}}{z}$.`,
        correctAnswer: minVal,
        numericalTolerance: 0.02,
        explanation: `By Titu's Lemma (Cauchy-Schwarz): $\\frac{${p}^2}{x} + \\frac{${q}^2}{y} + \\frac{${r}^2}{z} \\ge \\frac{(${p}+${q}+${r})^2}{x+y+z} = \\frac{${sum * sum}}{${total}} = ${minVal}$.`,
        stepByStepSolution: [
          `Rewrite numerators as squares: $${p}^2, ${q}^2, ${r}^2$.`,
          `Apply Titu's Lemma: $\\ge \\frac{(${p}+${q}+${r})^2}{${total}} = ${minVal}$.`,
        ],
        hints: [
          'Apply Titu\'s Lemma: $\\sum \\frac{a_i^2}{x_i} \\ge \\frac{(\\sum a_i)^2}{\\sum x_i}$.',
        ],
        tags: ['Olympiad Math', 'Inequalities', 'Titu Lemma'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
  {
    key: 'math_matrix_det',
    subjectId: 'math',
    examTracks: ['all', 'jee_main', 'jee_advanced', 'ai_ml_foundations'],
    olympiadDisciplines: ['mixed'],
    chapterId: 'math-ch-linear-algebra',
    topicId: 'math-topic-eigenvalues',
    conceptId: 'concept-math-eigen-det',
    difficulty: 'easy_medium',
    build: (seed) => {
      const a = 2 + (seed % 6);
      const d = 3 + ((seed >> 1) % 5);
      const b = 1 + (seed % 4);
      const c = 1 + ((seed >> 2) % 3);
      const det = a * d - b * c;
      return {
        questionType: 'numerical',
        questionText: `Compute the determinant $\\det(A)$ of the matrix $A = \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$.`,
        correctAnswer: det,
        numericalTolerance: 0,
        explanation: `$\\det(A) = (${a})(${d}) - (${b})(${c}) = ${a * d} - ${b * c} = ${det}$.`,
        stepByStepSolution: [
          `Compute $a d = ${a} \\cdot ${d} = ${a * d}$ and $b c = ${b} \\cdot ${c} = ${b * c}$.`,
          `Subtract: ${a * d} - ${b * c} = ${det}.`,
        ],
        hints: ['For a $2\\times 2$ matrix, $\\det = ad - bc$.'],
        tags: ['Linear Algebra', 'Determinants'],
        source: 'Learn.co Parameterized Olympiad Engine',
      };
    },
  },
];

const TEMPLATE_BY_KEY = new Map<string, ParamTemplate>(
  TEMPLATES.map((t) => [t.key, t])
);

const DYNAMIC_QUESTION_REGISTRY = new Map<string, QuestionBankItem>();
const MAX_DYNAMIC_REGISTRY = 4000;

function registerDynamicQuestion(item: QuestionBankItem): void {
  if (DYNAMIC_QUESTION_REGISTRY.size >= MAX_DYNAMIC_REGISTRY) {
    const oldestKey = DYNAMIC_QUESTION_REGISTRY.keys().next().value;
    if (oldestKey) DYNAMIC_QUESTION_REGISTRY.delete(oldestKey);
  }
  DYNAMIC_QUESTION_REGISTRY.set(item.id, item);
}

/**
 * Deterministically builds and registers a parameterized question by template key & seed.
 * ID format: `q-param-<templateKey>-<seed>`
 */
export function buildParameterizedQuestion(templateKey: string, seed: number): QuestionBankItem | null {
  const tpl = TEMPLATE_BY_KEY.get(templateKey);
  if (!tpl || !Number.isInteger(seed) || seed < 1) return null;
  const id = `q-param-${templateKey}-${seed}`;
  const built = tpl.build(seed);
  const item: QuestionBankItem = {
    id,
    subjectId: tpl.subjectId,
    examTracks: tpl.examTracks,
    chapterId: tpl.chapterId,
    topicId: tpl.topicId,
    conceptId: tpl.conceptId,
    difficulty: tpl.difficulty,
    verificationStatus: 'verified',
    version: 1,
    ...built,
  };
  registerDynamicQuestion(item);
  return item;
}

/**
 * Reconstructs any parameterized question from its deterministic ID `q-param-<key>-<seed>`,
 * ensuring server-authoritative grading even across server restarts!
 */
export function resolveParameterizedQuestionById(questionId: string): QuestionBankItem | undefined {
  const cached = DYNAMIC_QUESTION_REGISTRY.get(questionId);
  if (cached) return cached;
  const match = /^q-param-([a-z0-9_]+)-(\d+)$/.exec(questionId);
  if (!match) return undefined;
  const [, templateKey, seedStr] = match;
  const seed = Number.parseInt(seedStr, 10);
  if (!Number.isFinite(seed) || seed < 1) return undefined;
  return buildParameterizedQuestion(templateKey, seed) || undefined;
}

/**
 * Generates fresh unseen parameterized variants for any subject, track, or Olympiad discipline.
 */
export function generateFreshParameterizedQuestions(params: {
  count: number;
  subjectId?: SubjectId;
  examTrack?: ExamTrackId;
  olympiadDiscipline?: OlympiadDiscipline;
  excludeIds?: Set<string>;
}): QuestionBankItem[] {
  let pool = TEMPLATES;

  if (params.olympiadDiscipline && params.olympiadDiscipline !== 'mixed') {
    pool = pool.filter((t) => t.olympiadDisciplines.includes(params.olympiadDiscipline!));
  } else if (params.subjectId && params.subjectId !== ('all' as any)) {
    const bySubject = pool.filter((t) => t.subjectId === params.subjectId);
    if (bySubject.length > 0) pool = bySubject;
  }

  if (params.examTrack && params.examTrack !== 'all') {
    const byTrack = pool.filter(
      (t) => t.examTracks.includes(params.examTrack!) || t.examTracks.includes('all')
    );
    if (byTrack.length > 0) pool = byTrack;
  }

  if (pool.length === 0) pool = TEMPLATES;

  const excluded = new Set<string>(params.excludeIds || []);
  const results: QuestionBankItem[] = [];
  let cursor = Math.floor(Math.random() * 9000) + 1000;
  let attempts = 0;

  while (results.length < params.count && attempts < params.count * 25) {
    const tpl = pool[attempts % pool.length];
    const seed = cursor + attempts;
    const candidateId = `q-param-${tpl.key}-${seed}`;
    attempts++;
    if (excluded.has(candidateId)) continue;
    const built = buildParameterizedQuestion(tpl.key, seed);
    if (built) {
      excluded.add(built.id);
      results.push(built);
    }
  }

  return results;
}
