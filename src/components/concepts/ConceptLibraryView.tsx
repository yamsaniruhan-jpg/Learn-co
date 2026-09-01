import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Library,
  Sparkles,
  BookMarked,
  FileText,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Atom,
  Binary,
  Calculator,
  FlaskConical,
  Compass,
  Bot,
  Play,
  Bookmark,
  Check,
  Filter,
  Zap,
  Flame,
  ArrowRight,
  Share2,
  Download,
  Eye,
  ListOrdered,
  Lightbulb,
  Award,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface ConceptBookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  readingTimeMinutes: number;
  summary: string;
  sections: {
    heading: string;
    content: string;
    formula?: string;
    keyPoints?: string[];
  }[];
  workedExample?: {
    problem: string;
    solutionSteps: string[];
    finalAnswer: string;
  };
  quizCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface ConceptBook {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  subject: 'math' | 'cs' | 'physics' | 'chemistry';
  subjectLabel: string;
  edition: string;
  pagesOrChaptersCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  chapters: ConceptBookChapter[];
}

export interface AIDeepDiveDocument {
  id: string;
  title: string;
  subject: 'math' | 'cs' | 'physics' | 'chemistry';
  category: string;
  readTime: string;
  abstract: string;
  intuition: string;
  rigorAndFormulas: {
    title: string;
    latexOrEquation: string;
    explanation: string;
  }[];
  stepByStepDerivation: string[];
  commonPitfalls: string[];
  realWorldApplication: string;
  recommendedPractice: string;
}

const STEM_BOOKS: ConceptBook[] = [
  {
    id: 'book-calc-01',
    title: 'Advanced Calculus & Mathematical Analysis',
    subtitle: 'Rigorous Foundations: Limits, Derivatives, Differential Forms & Multivariable Integrals',
    author: 'Prof. J. Stewart & M. Spivak (Curated Edition)',
    subject: 'math',
    subjectLabel: 'Mathematics',
    edition: '9th International Rigor Edition',
    pagesOrChaptersCount: 6,
    difficulty: 'Advanced',
    color: 'from-blue-600 to-indigo-700',
    icon: Calculator,
    description: 'A comprehensive theoretical and practical treatise on differential calculus, limits via epsilon-delta formalism, series convergence, and multivariable vector fields.',
    chapters: [
      {
        id: 'calc-ch-1',
        chapterNumber: 1,
        title: 'Rigorous Epsilon-Delta Formalism & Topological Limits',
        readingTimeMinutes: 12,
        summary: 'Transitioning from intuitive limits to strict Weierstrass epsilon-delta bounds and topological continuity on Metric Spaces.',
        sections: [
          {
            heading: '1.1 The Classical Limit Definition',
            content: 'In rigorous real analysis, we assert that the limit of f(x) as x approaches c equals L if and only if for every arbitrarily small positive real number ε > 0, there exists a corresponding δ > 0 such that whenever 0 < |x - c| < δ, the absolute distance |f(x) - L| < ε.',
            formula: '∀ ε > 0, ∃ δ > 0 : 0 < |x - c| < δ ⟹ |f(x) - L| < ε',
            keyPoints: [
              'Epsilon (ε) dictates the vertical error tolerance around the limit value L.',
              'Delta (δ) specifies the horizontal neighborhood radius around the input point c.',
              'The bound must hold for ALL chosen ε > 0, no matter how infinitesimal.',
            ],
          },
          {
            heading: '1.2 Algebraic Limit Theorems & Squeeze Sieve',
            content: 'If both lim f(x) and lim g(x) exist at c, the limit operator is strictly linear: lim [a·f(x) + b·g(x)] = a·lim f(x) + b·lim g(x). Furthermore, if g(x) ≤ f(x) ≤ h(x) on an open neighborhood around c, and lim g(x) = lim h(x) = L, then f(x) is squeezed to L.',
            formula: 'lim_{x→0} (sin x / x) = 1  via Squeeze Theorem on Sector Geometry',
          },
        ],
        workedExample: {
          problem: 'Prove rigorously using ε-δ that lim_{x→3} (4x - 5) = 7.',
          solutionSteps: [
            '1. Let ε > 0 be arbitrary.',
            '2. We seek δ > 0 such that 0 < |x - 3| < δ implies |(4x - 5) - 7| < ε.',
            '3. Simplify the error term: |(4x - 5) - 7| = |4x - 12| = 4|x - 3|.',
            '4. We require 4|x - 3| < ε, which translates to |x - 3| < ε / 4.',
            '5. Set δ = ε / 4. Whenever 0 < |x - 3| < δ, we have |(4x - 5) - 7| = 4|x - 3| < 4(ε/4) = ε.',
          ],
          finalAnswer: 'Q.E.D. The limit is rigorously verified by setting δ = ε / 4.',
        },
        quizCheck: {
          question: 'If you are proving lim_{x→2} (3x + 1) = 7 with ε = 0.06, what is the maximum valid value of δ?',
          options: ['0.06', '0.02', '0.18', '0.03'],
          correctIndex: 1,
          explanation: 'Since |(3x + 1) - 7| = |3x - 6| = 3|x - 2| < ε, we need |x - 2| < ε/3. With ε = 0.06, δ = 0.06 / 3 = 0.02.',
        },
      },
      {
        id: 'calc-ch-2',
        chapterNumber: 2,
        title: 'Mean Value Theorem, Taylor Series & Higher Derivations',
        readingTimeMinutes: 15,
        summary: 'Explore Rolle’s theorem, the Mean Value Theorem (MVT), and infinite power series expansions using Taylor and Maclaurin polynomials with Lagrange remainder bounds.',
        sections: [
          {
            heading: '2.1 The Mean Value Theorem (MVT)',
            content: 'Let f: [a, b] → ℝ be continuous on [a, b] and differentiable on (a, b). Then there exists at least one point c ∈ (a, b) where the instantaneous rate of change equals the average secant slope.',
            formula: "f'(c) = [f(b) - f(a)] / (b - a)",
            keyPoints: [
              'Guarantees tangent parallelism to the chord connecting boundary points.',
              'Fundamental prerequisite for proving the Fundamental Theorem of Calculus.',
              'Extends directly to Cauchy Mean Value Theorem for ratio of two derivatives.',
            ],
          },
          {
            heading: '2.2 Taylor Series Expansions with Lagrange Remainder',
            content: 'Any infinitely differentiable function f(x) can be approximated around x = a by its polynomial series. The Lagrange remainder term R_n(x) quantifies the exact truncation error.',
            formula: "f(x) = ∑_{k=0}^{n} [f^(k)(a) / k!] · (x - a)^k + R_n(x)",
          },
        ],
      },
    ],
  },
  {
    id: 'book-cs-01',
    title: 'Algorithms, Data Structures & Asymptotics',
    subtitle: 'From Big-O Asymptotic Complexity to Dynamic Programming & Graph Flows',
    author: 'T. Cormen, C. Leiserson, R. Rivest (CLRS Paradigm)',
    subject: 'cs',
    subjectLabel: 'Computer Science',
    edition: '4th Comprehensive Edition',
    pagesOrChaptersCount: 5,
    difficulty: 'Advanced',
    color: 'from-emerald-600 to-teal-800',
    icon: Binary,
    description: 'The master standard text covering divide-and-conquer algorithms, AVL and Red-Black Trees, Greedy invariants, Dijkstra / Floyd-Warshall graph networks, and NP-Completeness.',
    chapters: [
      {
        id: 'cs-ch-1',
        chapterNumber: 1,
        title: 'Asymptotic Analysis & The Master Recurrence Theorem',
        readingTimeMinutes: 10,
        summary: 'Mathematical rigor of Big-O, Big-Omega, Big-Theta, and the three canonical branches of the Master Recurrence Theorem.',
        sections: [
          {
            heading: '1.1 Formal Asymptotic Notations',
            content: 'We say f(n) = O(g(n)) if there exist positive constants c and n₀ such that 0 ≤ f(n) ≤ c·g(n) for all n ≥ n₀. Big-Omega (Ω) bounds from below, while Big-Theta (Θ) asserts tight asymptotically matching bounds.',
            formula: 'f(n) = Θ(g(n)) ⟺ f(n) = O(g(n)) ∧ f(n) = Ω(g(n))',
            keyPoints: [
              'Ignores low-order terms and multiplicative machine constants.',
              'Master Theorem solves divide-and-conquer recurrences: T(n) = a·T(n/b) + f(n).',
              'Compares f(n) against n^(log_b a) critical exponent.',
            ],
          },
        ],
        workedExample: {
          problem: 'Solve the recurrence T(n) = 2T(n/2) + n using Master Theorem.',
          solutionSteps: [
            '1. Identify parameters: a = 2, b = 2, f(n) = n.',
            '2. Compute critical exponent: log_b(a) = log_2(2) = 1. So n^(log_b a) = n¹ = n.',
            '3. Compare f(n) = n with n¹: They are asymptotically identical (f(n) = Θ(n¹)).',
            '4. By Case 2 of the Master Theorem, T(n) = Θ(n^(log_b a) · log n) = Θ(n log n).',
          ],
          finalAnswer: 'T(n) = Θ(n log n) (The classic MergeSort complexity).',
        },
        quizCheck: {
          question: 'What is the asymptotic complexity of T(n) = 4T(n/2) + n?',
          options: ['Θ(n log n)', 'Θ(n²)', 'Θ(n³)', 'Θ(log n)'],
          correctIndex: 1,
          explanation: 'log_b(a) = log_2(4) = 2. Since f(n) = n = O(n^(2 - ε)) with ε = 1, Case 1 applies, yielding Θ(n²).',
        },
      },
    ],
  },
  {
    id: 'book-phys-01',
    title: 'University Physics: Mechanics & Electrodynamics',
    subtitle: 'Newtonian Vector Mechanics, Energy Conservation, Maxwell Equations & Relativity',
    author: 'H. Young & R. Freedman (University Physics Foundation)',
    subject: 'physics',
    subjectLabel: 'Physics',
    edition: '15th Global STEM Edition',
    pagesOrChaptersCount: 5,
    difficulty: 'Intermediate',
    color: 'from-amber-600 to-orange-700',
    icon: Atom,
    description: 'Systematic derivations of classical vector mechanics, rotational inertia tensors, fluid mechanics, wave equations, and electromagnetic vector calculus.',
    chapters: [
      {
        id: 'phys-ch-1',
        chapterNumber: 1,
        title: 'Rotational Inertia Tensors & Angular Momentum Conservation',
        readingTimeMinutes: 14,
        summary: 'Translating linear kinematics to rotational rigid-body dynamics via moment of inertia integration and torque cross products.',
        sections: [
          {
            heading: '1.1 Moment of Inertia Integration',
            content: 'For continuous mass distributions, the moment of inertia I about an axis is defined by volume integral I = ∫ r² dm = ∫ r² ρ(r) dV. The Parallel Axis Theorem states I = I_cm + M·d².',
            formula: 'I = ∫ r² dm  |  I_{parallel} = I_{cm} + M·d²',
          },
        ],
      },
    ],
  },
  {
    id: 'book-chem-01',
    title: 'Organic Chemistry: Mechanism, Orbitals & Synthesis',
    subtitle: 'Reaction Energetics, SN1/SN2 Stereochemistry, Aromaticity & Spectroscopy',
    author: 'D. Klein & P. Vollhardt (Mechanistic Synthesis)',
    subject: 'chemistry',
    subjectLabel: 'Chemistry',
    edition: '8th Molecular Edition',
    pagesOrChaptersCount: 4,
    difficulty: 'Advanced',
    color: 'from-purple-600 to-pink-700',
    icon: FlaskConical,
    description: 'Deep dive into frontier molecular orbital theory (HOMO/LUMO), nucleophilic substitutions, elimination kinetics, and retrosynthetic analysis.',
    chapters: [
      {
        id: 'chem-ch-1',
        chapterNumber: 1,
        title: 'SN1 vs SN2 Nucleophilic Substitution Kinetics & Stereochemistry',
        readingTimeMinutes: 11,
        summary: 'Mechanistic bifurcation between bimolecular backside attack (inversion of configuration) vs unimolecular carbocation intermediate (racemization).',
        sections: [
          {
            heading: '1.1 SN2 Mechanism and Walden Inversion',
            content: 'SN2 proceeds in a single concerted step where the nucleophile attacks the electrophilic carbon from the backside (180° away from leaving group), causing inversion of chiral stereocenter geometry.',
            formula: 'Rate = k · [Substrate] · [Nucleophile] (Second Order Kinetics)',
          },
        ],
      },
    ],
  },
];

const AI_GENERATED_DOCUMENTS: AIDeepDiveDocument[] = [
  {
    id: 'doc-ai-01',
    title: 'Backpropagation & Gradient Descent via Matrix Calculus',
    subject: 'cs',
    category: 'Deep Learning & Optimization',
    readTime: '8 min read',
    abstract: 'A first-principles mathematical breakdown of reverse-mode automatic differentiation in deep neural networks using Jacobians and tensor contractions.',
    intuition: 'Imagine adjusting dials on a massive machine to minimize sound distortion. Backpropagation calculates exactly how much twisting each dial to the left or right reduces the output error, propagated backwards from output layer to inputs.',
    rigorAndFormulas: [
      {
        title: 'Chain Rule for Multi-Layer Perceptron',
        latexOrEquation: '∂L / ∂W^(l) = δ^(l) · (a^(l-1))^T',
        explanation: 'The weight gradient is the outer product of the downstream error delta vector δ and the upstream layer activation transpose.',
      },
      {
        title: 'Backpropagated Error Delta Recursion',
        latexOrEquation: 'δ^(l) = [(W^(l+1))^T · δ^(l+1)] ⊙ σ\'(z^(l))',
        explanation: 'Error signals flow backward through the transpose weight matrix scaled element-wise by the activation function derivative.',
      },
    ],
    stepByStepDerivation: [
      '1. Define the scalar objective loss L = (1/2) ||y_true - a^(L)||².',
      '2. Compute initial error at the final output layer: δ^(L) = ∇_a L ⊙ σ\'(z^(L)).',
      '3. Formulate the recurrent step: derive ∂L / ∂z^(l) using total derivative chain rule over layer l+1.',
      '4. Express weight update: W^(l) ← W^(l) - η · (∂L / ∂W^(l)).',
    ],
    commonPitfalls: [
      'Vanishing / Exploding Gradients: Repeated multiplication by weights with singular values < 1 or > 1 causes exponential decay or blowup.',
      'Incorrect Matrix Transposition in tensor implementations leading to broadcast dimension mismatches.',
    ],
    realWorldApplication: 'Powers modern LLMs, Transformers, computer vision convolutional networks, and reinforcement learning policy gradients.',
    recommendedPractice: 'Try implementing a 2-layer neural network from scratch in NumPy without PyTorch autograd.',
  },
  {
    id: 'doc-ai-02',
    title: 'Eigenvalues, Eigenvectors & Spectral Decomposition',
    subject: 'math',
    category: 'Linear Algebra & Dimensionality',
    readTime: '7 min read',
    abstract: 'Rigorous derivation of characteristic equations, diagonalizability, orthogonal matrices, and Principal Component Analysis (PCA).',
    intuition: 'When a matrix transforms space by stretching, rotating, and shearing, eigenvectors are the rare special axes that do NOT change direction—they only stretch or shrink by a factor equal to their eigenvalue λ.',
    rigorAndFormulas: [
      {
        title: 'Characteristic Equation',
        latexOrEquation: 'det(A - λ·I) = 0',
        explanation: 'For a non-zero vector v to satisfy A·v = λ·v, the matrix (A - λI) must have a non-trivial null space, which occurs if and only if its determinant is zero.',
      },
      {
        title: 'Spectral Theorem for Symmetric Matrices',
        latexOrEquation: 'A = Q · Λ · Q^T  (where Q is orthogonal, Q^T Q = I)',
        explanation: 'Every real symmetric matrix can be factored into orthogonal eigenvector columns Q and diagonal eigenvalue matrix Λ.',
      },
    ],
    stepByStepDerivation: [
      '1. Start with the eigenvalue definition: A·v = λ·v for v ≠ 0.',
      '2. Rearrange to standard linear system: (A - λ·I)·v = 0.',
      '3. Since v is non-zero, (A - λI) is singular, hence det(A - λI) = 0.',
      '4. Solve the degree-n polynomial roots to find all eigenvalues {λ₁, λ₂, ..., λ_n}.',
      '5. Substitute each λ_i back into (A - λ_i·I)·v = 0 to solve for the eigenspace basis vectors.',
    ],
    commonPitfalls: [
      'Assuming all matrices are diagonalizable: defective matrices with repeated eigenvalues may lack a full set of linearly independent eigenvectors.',
      'Confusing algebraic multiplicity with geometric multiplicity.',
    ],
    realWorldApplication: 'Google PageRank algorithm, Quantum Mechanics state observables, Image Compression via SVD, and Vibration Modal Analysis.',
    recommendedPractice: 'Compute the eigenvalues and verify orthogonality for a 3x3 symmetric covariance matrix.',
  },
  {
    id: 'doc-ai-03',
    title: 'Thermodynamic Entropy, Microstates & The Second Law',
    subject: 'physics',
    category: 'Statistical Mechanics & Thermodynamics',
    readTime: '9 min read',
    abstract: 'Bridging macroscopic Clausius entropy dS = dQ_rev/T with Ludwig Boltzmann statistical microstate multiplicity S = k_B ln Ω.',
    intuition: 'Entropy is not merely "disorder"—it is a direct logarithmic count of the number of microscopic arrangements (microstates) that correspond to the exact same macroscopic state.',
    rigorAndFormulas: [
      {
        title: 'Boltzmann Entropy Formula',
        latexOrEquation: 'S = k_B · ln(Ω)',
        explanation: 'The fundamental bridge between microstate multiplicity Ω and thermodynamic entropy S, where k_B = 1.380649 × 10⁻²³ J/K.',
      },
      {
        title: 'Carnot Maximum Efficiency Limit',
        latexOrEquation: 'η_max = 1 - (T_cold / T_hot)',
        explanation: 'No heat engine operating between two thermal reservoirs can exceed the reversible Carnot cycle efficiency.',
      },
    ],
    stepByStepDerivation: [
      '1. Consider two isolated subsystems with multiplicities Ω₁(E₁) and Ω₂(E₂).',
      '2. Total combined multiplicity is multiplicative: Ω_total = Ω₁ × Ω₂.',
      '3. To make entropy additive (S_total = S₁ + S₂), the relation must be logarithmic: S ∝ ln Ω.',
      '4. Multiplying by Boltzmann constant k_B establishes energetic dimensions of Joules/Kelvin.',
    ],
    commonPitfalls: [
      'Confusing reversible heat transfer dQ_rev with irreversible path heat.',
      'Assuming entropy cannot decrease locally (it can, provided environmental entropy increases by a greater amount).',
    ],
    realWorldApplication: 'Heat engines, refrigerators, information theory (Shannon entropy), and chemical equilibrium Gibbs free energy (ΔG = ΔH - TΔS).',
    recommendedPractice: 'Derive the entropy change for the isothermal expansion of an ideal gas.',
  },
];

interface ConceptLibraryViewProps {
  onOpenCopilotWithContext?: (prompt: string) => void;
  onNavigateToPractice?: () => void;
}

export const ConceptLibraryView: React.FC<ConceptLibraryViewProps> = ({
  onOpenCopilotWithContext,
  onNavigateToPractice,
}) => {
  const { gamification } = useAuth();
  const [activeTab, setActiveTab] = useState<'books' | 'ai-docs' | 'cheatsheets'>('books');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected items for modal/reader
  const [selectedBook, setSelectedBook] = useState<ConceptBook | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [selectedAIDoc, setSelectedAIDoc] = useState<AIDeepDiveDocument | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Record<string, boolean>>({});

  const toggleBookmark = (id: string) => {
    setBookmarkedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredBooks = useMemo(() => {
    return STEM_BOOKS.filter((b) => {
      const matchSubject = selectedSubject === 'all' || b.subject === selectedSubject;
      const matchQuery =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.chapters.some((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSubject && matchQuery;
    });
  }, [selectedSubject, searchQuery]);

  const filteredAIDocs = useMemo(() => {
    return AI_GENERATED_DOCUMENTS.filter((d) => {
      const matchSubject = selectedSubject === 'all' || d.subject === selectedSubject;
      const matchQuery =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchQuery;
    });
  }, [selectedSubject, searchQuery]);

  const activeChapter = selectedBook ? selectedBook.chapters[selectedChapterIndex] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <Library className="w-3.5 h-3.5" />
              <span>STEM Concept Library & Interactive Textbooks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
              Master Foundational & Advanced Concepts
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Read curated STEM textbooks, explore AI-generated deep-dive concept synthesis documents, and practice step-by-step mathematical proofs.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-indigo-200 block">Available Resources</span>
              <span className="text-sm font-bold text-white">
                {STEM_BOOKS.length} Textbooks • {AI_GENERATED_DOCUMENTS.length} AI Synthesis Guides
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar & Search Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveTab('books');
              setSelectedBook(null);
              setSelectedAIDoc(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'books'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curated Textbooks</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai-docs');
              setSelectedBook(null);
              setSelectedAIDoc(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ai-docs'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Concept Synthesis</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, formulas, or chapters..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'All Disciplines', icon: Library },
          { id: 'math', label: 'Mathematics & Calculus', icon: Calculator },
          { id: 'cs', label: 'Algorithms & Systems', icon: Binary },
          { id: 'physics', label: 'Physics & Mechanics', icon: Atom },
          { id: 'chemistry', label: 'Chemistry & Molecular', icon: FlaskConical },
        ].map((subject) => {
          const Icon = subject.icon;
          const isSelected = selectedSubject === subject.id;
          return (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{subject.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================== VIEW 1: TEXTBOOK READER VIEW ===================== */}
      {selectedBook ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedBook(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Textbook Library</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBookmark(selectedBook.id)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                title="Bookmark textbook"
              >
                <Bookmark
                  className={`w-4 h-4 ${bookmarkedItems[selectedBook.id] ? 'fill-indigo-600 text-indigo-600' : ''}`}
                />
              </button>
              {onOpenCopilotWithContext && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Bot className="w-4 h-4 text-indigo-600" />}
                  onClick={() =>
                    onOpenCopilotWithContext(
                      `Explain the key concept from chapter "${activeChapter?.title}" in "${selectedBook.title}" with intuitive analogies and rigorous derivation.`
                    )
                  }
                >
                  Ask Socratic Copilot
                </Button>
              )}
            </div>
          </div>

          {/* Reader Main Layout: Left TOC vs Right Chapter Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Table of Contents */}
            <Card variant="elevated" padding="md" className="lg:col-span-4 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {selectedBook.subjectLabel}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedBook.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{selectedBook.author}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-2 pb-1">
                  Chapters
                </span>
                {selectedBook.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChapterIndex(idx);
                      setQuizAnswer(null);
                      setQuizSubmitted(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      selectedChapterIndex === idx
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center shrink-0">
                      {ch.chapterNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs line-clamp-1">{ch.title}</span>
                      <span className="text-[10px] text-slate-400 block">{ch.readingTimeMinutes} min read</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Right Column: Chapter Content Reader */}
            <div className="lg:col-span-8 space-y-6">
              {activeChapter ? (
                <Card variant="elevated" padding="lg" className="space-y-6">
                  {/* Chapter Header */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        Chapter {activeChapter.chapterNumber}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Estimated {activeChapter.readingTimeMinutes} mins
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
                      {activeChapter.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-slate-100">Overview: </span>
                      {activeChapter.summary}
                    </p>
                  </div>

                  {/* Chapter Sections */}
                  <div className="space-y-6">
                    {activeChapter.sections.map((sec, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {sec.heading}
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {sec.content}
                        </p>

                        {/* LaTeX Formula Highlight Box */}
                        {sec.formula && (
                          <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner border border-slate-800">
                            <code>{sec.formula}</code>
                          </div>
                        )}

                        {/* Key points bullets */}
                        {sec.keyPoints && sec.keyPoints.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>Key Invariants:</span>
                            </span>
                            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1 pl-1">
                              {sec.keyPoints.map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Worked Example */}
                  {activeChapter.workedExample && (
                    <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                        <Calculator className="w-4 h-4" />
                        <span>Worked Canonical Example:</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {activeChapter.workedExample.problem}
                      </p>
                      <div className="space-y-1.5 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                        {activeChapter.workedExample.solutionSteps.map((step, sIdx) => (
                          <p key={sIdx} className="text-xs text-slate-700 dark:text-slate-300">
                            {step}
                          </p>
                        ))}
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {activeChapter.workedExample.finalAnswer}
                      </div>
                    </div>
                  )}

                  {/* Chapter Checkup Quiz */}
                  {activeChapter.quizCheck && (
                    <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-800/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          <span>Concept Checkup Quiz (+5 XP)</span>
                        </div>
                        <Badge variant="primary" size="sm">
                          Instant Verification
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {activeChapter.quizCheck.question}
                      </p>

                      <div className="space-y-2">
                        {activeChapter.quizCheck.options.map((opt, oIdx) => {
                          const isSelected = quizAnswer === oIdx;
                          const isCorrect = oIdx === activeChapter.quizCheck!.correctIndex;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                setQuizAnswer(oIdx);
                                setQuizSubmitted(true);
                              }}
                              className={`w-full p-3 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                                quizSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : isSelected
                                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60'
                                  : isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-900 font-bold'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="font-bold text-slate-900 dark:text-slate-100">Explanation: </span>
                          {activeChapter.quizCheck.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chapter Footer Navigation */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      disabled={selectedChapterIndex === 0}
                      onClick={() => {
                        setSelectedChapterIndex((prev) => Math.max(0, prev - 1));
                        setQuizAnswer(null);
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous Chapter</span>
                    </button>

                    {onNavigateToPractice && (
                      <Button
                        size="sm"
                        variant="xp"
                        leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                        onClick={onNavigateToPractice}
                      >
                        Practice Questions
                      </Button>
                    )}

                    <button
                      disabled={selectedChapterIndex >= selectedBook.chapters.length - 1}
                      onClick={() => {
                        setSelectedChapterIndex((prev) =>
                          Math.min(selectedBook.chapters.length - 1, prev + 1)
                        );
                        setQuizAnswer(null);
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Chapter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      ) : selectedAIDoc ? (
        /* ===================== VIEW 2: AI DEEP-DIVE DOCUMENT VIEWER ===================== */
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedAIDoc(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to AI Concept Guides</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBookmark(selectedAIDoc.id)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                title="Bookmark document"
              >
                <Bookmark
                  className={`w-4 h-4 ${bookmarkedItems[selectedAIDoc.id] ? 'fill-indigo-600 text-indigo-600' : ''}`}
                />
              </button>
              {onOpenCopilotWithContext && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Bot className="w-4 h-4" />}
                  onClick={() =>
                    onOpenCopilotWithContext(
                      `Let's explore "${selectedAIDoc.title}". Can you walk me through the hardest edge case step-by-step?`
                    )
                  }
                >
                  Discuss with Copilot
                </Button>
              )}
            </div>
          </div>

          {/* Document Content Card */}
          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Synthesis Document
                </Badge>
                <span className="text-xs text-slate-400">{selectedAIDoc.category}</span>
                <span className="text-xs text-slate-400">• {selectedAIDoc.readTime}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
                {selectedAIDoc.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">Abstract: </span>
                {selectedAIDoc.abstract}
              </p>
            </div>

            {/* Intuition Section */}
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Conceptual Intuition & Mental Model</span>
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                {selectedAIDoc.intuition}
              </p>
            </div>

            {/* Rigor & Mathematical Formulas */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Mathematical Formulations & Governing Equations</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedAIDoc.rigorAndFormulas.map((item, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {item.title}
                    </span>
                    <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                      <code>{item.latexOrEquation}</code>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Derivation */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                <span>Step-by-Step Derivation Roadmap</span>
              </h2>
              <div className="space-y-2">
                {selectedAIDoc.stepByStepDerivation.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {sIdx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Pitfalls & Real World Applications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                  Common Traps & Conceptual Pitfalls:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {selectedAIDoc.commonPitfalls.map((pitfall, pIdx) => (
                    <li key={pIdx}>{pitfall}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Real-World Engineering Application:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedAIDoc.realWorldApplication}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Recommended Practice: {selectedAIDoc.recommendedPractice}
              </span>
              {onNavigateToPractice && (
                <Button
                  size="sm"
                  variant="xp"
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                  onClick={onNavigateToPractice}
                >
                  Start Diagnostic Questions
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : activeTab === 'books' ? (
        /* ===================== LIST 1: TEXTBOOK CATALOG ===================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const Icon = book.icon;
            return (
              <Card
                key={book.id}
                variant="elevated"
                padding="none"
                className="overflow-hidden group hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Banner */}
                  <div className={`p-6 bg-gradient-to-r ${book.color} text-white space-y-3 relative`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                        {book.subjectLabel}
                      </span>
                      <span className="text-[10px] text-white/80 font-semibold">{book.edition}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white font-display line-clamp-1">
                        {book.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-400">{book.author}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                      <span>{book.chapters.length} Interactive Chapters</span>
                      <Badge variant="outline" size="sm">
                        {book.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedBook(book);
                      setSelectedChapterIndex(0);
                    }}
                  >
                    Open Textbook Reader
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ===================== LIST 2: AI CONCEPT SYNTHESIS GUIDES ===================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAIDocs.map((doc) => (
            <Card
              key={doc.id}
              variant="elevated"
              padding="lg"
              className="group hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Guide
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-medium">{doc.readTime}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {doc.abstract}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  <code>{doc.rigorAndFormulas[0]?.latexOrEquation}</code>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{doc.category}</span>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setSelectedAIDoc(doc)}
                >
                  Read Synthesis
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
