import { ExamTrack, SubjectId } from '../types/curriculum';

export const EXAM_TRACKS: ExamTrack[] = [
  {
    id: 'all',
    name: 'All Curricula & Tracks',
    shortName: 'All Tracks',
    description: 'Comprehensive universal STEM curriculum covering all concepts and levels.',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    subjects: ['math', 'cs', 'physics', 'chemistry', 'biology', 'english', 'data_science'],
  },
  {
    id: 'jee_advanced',
    name: 'JEE Advanced & Top-Tier Engineering',
    shortName: 'JEE Advanced',
    description: 'Extreme analytical rigor, multi-concept problems, calculus derivations, and deep physics invariants.',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    subjects: ['math', 'physics', 'chemistry'],
  },
  {
    id: 'jee_main',
    name: 'JEE Main & National Engineering Entrance',
    shortName: 'JEE Main',
    description: 'High-speed conceptual mastery, standard problem archetypes, and formula accuracy.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    subjects: ['math', 'physics', 'chemistry'],
  },
  {
    id: 'nsejs',
    name: 'IJSO & NSEJS Junior Science Olympiad',
    shortName: 'IJSO / NSEJS',
    description: 'International Junior Science Olympiad (IJSO) & NSEJS integrated physics, chemistry, biology, and math foundations.',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    subjects: ['physics', 'chemistry', 'biology', 'math'],
  },
  {
    id: 'iapt_exams',
    name: 'IPhO / IChO / IBHO & IAPT National Qualifiers',
    shortName: 'IPhO · IChO · IBHO',
    description: 'International Physics (IPhO), Chemistry (IChO), and Biology (IBHO/IBO) Olympiad preparation alongside NSEP, NSEC, and NSEB stages.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    subjects: ['physics', 'chemistry', 'biology', 'math'],
  },
  {
    id: 'ict_hackathon',
    name: 'ICT International Coding Test & Competitive Systems',
    shortName: 'ICT Coding Test',
    description: 'ICT International Coding Test algorithms, segment trees, graph shortest paths, dynamic programming, and production systems.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    subjects: ['cs', 'math', 'data_science'],
  },
  {
    id: 'ai_ml_foundations',
    name: 'AI, Data Science Olympiad & Computational STEM',
    shortName: 'AI & Data Science',
    description: 'Matrix calculus, Bayesian inference, KL divergence, gradient boosting, neural architectures, and algorithmic complexity.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    subjects: ['cs', 'math', 'data_science'],
  },
  {
    id: 'stem_olympiad',
    name: 'International & National Olympiad (IPhO, IChO, IBHO, IJSO, INMO)',
    shortName: 'Olympiad Zone',
    description: 'Proof-based INMO mathematics, IPhO optics/Lagrangian mechanics, IChO equilibria, and IBHO/IJSO molecular genetics.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    subjects: ['math', 'physics', 'chemistry', 'biology'],
  },
  {
    id: 'ap_stem',
    name: 'Advanced Placement (AP Calculus / Physics / Chem / CS)',
    shortName: 'AP STEM',
    description: 'College-level foundational calculus, mechanics, organic reactions, algorithms, and cellular biology.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    subjects: ['math', 'physics', 'chemistry', 'biology', 'cs'],
  },
];

export interface SubjectSummary {
  id: SubjectId;
  name: string;
  tagline: string;
  iconName: string;
  color: string;
  chapterCount: number;
  conceptCount: number;
}

export const SUBJECT_SUMMARIES: SubjectSummary[] = [
  {
    id: 'math',
    name: 'Mathematics',
    tagline: 'Differential calculus, linear algebra, multivariable optimization, and probability.',
    iconName: 'Calculator',
    color: '#4f46e5',
    chapterCount: 15,
    conceptCount: 61,
  },
  {
    id: 'cs',
    name: 'Computer Science & AI',
    tagline: 'Gradient descent, neural architectures, data structures, and algorithmic complexity.',
    iconName: 'Terminal',
    color: '#f59e0b',
    chapterCount: 10,
    conceptCount: 31,
  },
  {
    id: 'physics',
    name: 'Physics',
    tagline: 'Classical mechanics, thermodynamics, electromagnetism, and wave dynamics.',
    iconName: 'Atom',
    color: '#0284c7',
    chapterCount: 12,
    conceptCount: 34,
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    tagline: 'Organic reaction mechanisms, kinetics, thermodynamics, and molecular orbitals.',
    iconName: 'FlaskConical',
    color: '#059669',
    chapterCount: 12,
    conceptCount: 34,
  },
  {
    id: 'biology',
    name: 'Biology',
    tagline: 'Cellular pathways, genetics, molecular biology, and evolutionary dynamics.',
    iconName: 'Dna',
    color: '#e11d48',
    chapterCount: 11,
    conceptCount: 30,
  },
  {
    id: 'english',
    name: 'English & Linguistics',
    tagline: 'Critical reading comprehension, syntactic grammar, rhetorical analysis, vocabulary etymology, and literary logic.',
    iconName: 'BookMarked',
    color: '#8b5cf6',
    chapterCount: 6,
    conceptCount: 21,
  },
  {
    id: 'data_science',
    name: 'Data Science & Applied AI',
    tagline: 'Statistical inference, exploratory data analysis, machine learning algorithms, deep neural representations, and predictive analytics.',
    iconName: 'BrainCircuit',
    color: '#06b6d4',
    chapterCount: 5,
    conceptCount: 17,
  },
];

export const STARTER_CONCEPTS: Array<{ id: string; title: string; subjectId: SubjectId }> = [
  { id: 'concept-chain-rule', title: 'Multivariable Chain Rule & Composite Jacobians', subjectId: 'math' },
  { id: 'concept-limits-continuity', title: 'Limits, L’Hôpital & ε-δ Continuity', subjectId: 'math' },
  { id: 'concept-newtons-laws-dynamics', title: 'Newtonian Dynamics & Non-Inertial Frames', subjectId: 'physics' },
  { id: 'concept-sn2-mechanism', title: 'SN2 Backside Attack & Walden Inversion', subjectId: 'chemistry' },
  { id: 'concept-dynamic-programming', title: 'Dynamic Programming & Optimal Substructure', subjectId: 'cs' },
  { id: 'concept-crispr-cas9', title: 'CRISPR-Cas9 Gene Editing & PAM Specificity', subjectId: 'biology' },
];
