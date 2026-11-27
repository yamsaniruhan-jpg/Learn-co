import {
  CreatorResource,
  CreatorResourceType,
  GenerateResourceRequest,
} from '../types/creator';
import {
  PracticeSessionConfig,
  QuestionBankItem,
  SubjectId,
} from '../types/curriculum';
import { loadSubjectCurriculum } from '../data/curriculumLoader';
import { AuthClient } from '../services/authClient';

export const GUEST_MODE_STORAGE_KEY = 'learnco_guest_mode';
export const GUEST_QUOTA_SESSION_KEY = 'learnco_guest_ephemeral_quota_v1';
export const GUEST_QUOTA_UPDATED_EVENT = 'learnco_guest_quota_updated';

export const GUEST_LIMITS = {
  practiceQuestions: 5,
  doubts: 3,
  creations: 2,
} as const;

export type GuestQuotaKind = keyof typeof GUEST_LIMITS;

export interface GuestQuotaState {
  practiceQuestionsUsed: number;
  doubtsUsed: number;
  creationsUsed: number;
}

const DEFAULT_QUOTA_STATE: GuestQuotaState = {
  practiceQuestionsUsed: 0,
  doubtsUsed: 0,
  creationsUsed: 0,
};

export function isGuestExplorationActive(): boolean {
  try {
    return !AuthClient.hasSession() && localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getGuestQuotaState(): GuestQuotaState {
  try {
    const raw = sessionStorage.getItem(GUEST_QUOTA_SESSION_KEY);
    if (!raw) return { ...DEFAULT_QUOTA_STATE };
    const parsed = JSON.parse(raw);
    return {
      practiceQuestionsUsed: Number.isFinite(parsed?.practiceQuestionsUsed)
        ? Math.max(0, parsed.practiceQuestionsUsed)
        : 0,
      doubtsUsed: Number.isFinite(parsed?.doubtsUsed) ? Math.max(0, parsed.doubtsUsed) : 0,
      creationsUsed: Number.isFinite(parsed?.creationsUsed) ? Math.max(0, parsed.creationsUsed) : 0,
    };
  } catch {
    return { ...DEFAULT_QUOTA_STATE };
  }
}

export function getGuestQuotaRemaining(): {
  practiceRemaining: number;
  doubtsRemaining: number;
  creationsRemaining: number;
  state: GuestQuotaState;
} {
  const state = getGuestQuotaState();
  return {
    practiceRemaining: Math.max(0, GUEST_LIMITS.practiceQuestions - state.practiceQuestionsUsed),
    doubtsRemaining: Math.max(0, GUEST_LIMITS.doubts - state.doubtsUsed),
    creationsRemaining: Math.max(0, GUEST_LIMITS.creations - state.creationsUsed),
    state,
  };
}

export function canConsumeGuestQuota(kind: GuestQuotaKind, amount = 1): boolean {
  const rem = getGuestQuotaRemaining();
  if (kind === 'practiceQuestions') return rem.practiceRemaining >= amount;
  if (kind === 'doubts') return rem.doubtsRemaining >= amount;
  return rem.creationsRemaining >= amount;
}

export function consumeGuestQuota(kind: GuestQuotaKind, amount = 1): GuestQuotaState {
  const state = getGuestQuotaState();
  const next: GuestQuotaState = {
    ...state,
    practiceQuestionsUsed:
      kind === 'practiceQuestions'
        ? Math.min(GUEST_LIMITS.practiceQuestions, state.practiceQuestionsUsed + amount)
        : state.practiceQuestionsUsed,
    doubtsUsed:
      kind === 'doubts' ? Math.min(GUEST_LIMITS.doubts, state.doubtsUsed + amount) : state.doubtsUsed,
    creationsUsed:
      kind === 'creations'
        ? Math.min(GUEST_LIMITS.creations, state.creationsUsed + amount)
        : state.creationsUsed,
  };
  try {
    sessionStorage.setItem(GUEST_QUOTA_SESSION_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(GUEST_QUOTA_UPDATED_EVENT, { detail: next }));
  } catch {
    // Ignore storage access errors in SSR/locked tabs
  }
  return next;
}

export function clearGuestSessionData(): void {
  try {
    localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    sessionStorage.removeItem(GUEST_QUOTA_SESSION_KEY);
    window.dispatchEvent(new CustomEvent(GUEST_QUOTA_UPDATED_EVENT, { detail: DEFAULT_QUOTA_STATE }));
  } catch {
    // Ignore
  }
}

const FALLBACK_SUBJECT_BANK: Record<SubjectId, QuestionBankItem[]> = {
  math: [
    {
      id: 'guest-math-1',
      subjectId: 'math',
      chapterId: 'ch-calculus',
      topicId: 'Limits & Derivatives',
      conceptId: 'concept-chain-rule',
      questionType: 'single_choice',
      difficulty: 'easy',
      questionText: 'What is the derivative $\\frac{d}{dx}(\\sin(3x^2))$ with respect to $x$?',
      options: ['$6x\\cos(3x^2)$', '$3x\\cos(3x^2)$', '$\\cos(6x)$', '$-6x\\cos(3x^2)$'],
      correctAnswer: '$6x\\cos(3x^2)$',
      explanation: 'By the Chain Rule, $\\frac{d}{dx}[f(g(x))] = f\'(g(x))g\'(x) = \\cos(3x^2) \\cdot 6x$.',
      stepByStepSolution: [
        'Let $u = 3x^2$, so $y = \\sin(u)$.',
        'Differentiate outer function: $\\frac{dy}{du} = \\cos(u)$.',
        'Differentiate inner function: $\\frac{du}{dx} = 6x$.',
        'Multiply: $6x\\cos(3x^2)$.',
      ],
      hints: ['Apply the Chain Rule: outer derivative times inner derivative.'],
      examTracks: ['all', 'jee_main', 'ap_stem'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
    {
      id: 'guest-math-2',
      subjectId: 'math',
      chapterId: 'ch-calculus',
      topicId: 'L’Hôpital’s Rule',
      conceptId: 'concept-limits-continuity',
      questionType: 'single_choice',
      difficulty: 'medium',
      questionText: 'Evaluate $\\lim_{x \\to 0} \\frac{e^{2x} - 1}{x}$.',
      options: ['$2$', '$1$', '$0$', '$e^2$'],
      correctAnswer: '$2$',
      explanation: 'Since substituting $x=0$ gives $0/0$, apply L’Hôpital’s rule: $\\frac{2e^{2x}}{1}$ at $x=0$ is $2$.',
      stepByStepSolution: [
        'Confirm indeterminate form $0/0$ at $x=0$.',
        'Differentiate numerator: $2e^{2x}$; denominator: $1$.',
        'Evaluate at $x=0$: $2e^0 = 2$.',
      ],
      hints: ['Check whether direct substitution produces $0/0$.'],
      examTracks: ['all', 'jee_main', 'ap_stem'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  physics: [
    {
      id: 'guest-phys-1',
      subjectId: 'physics',
      chapterId: 'ch-mechanics',
      topicId: 'Work & Energy',
      conceptId: 'concept-newtons-laws-dynamics',
      questionType: 'single_choice',
      difficulty: 'easy',
      questionText: 'A $2\\,\\text{kg}$ block slides down a frictionless incline of height $5\\,\\text{m}$ from rest ($g = 10\\,\\text{m/s}^2$). What is its speed at the bottom?',
      options: ['$10\\,\\text{m/s}$', '$5\\,\\text{m/s}$', '$20\\,\\text{m/s}$', '$50\\,\\text{m/s}$'],
      correctAnswer: '$10\\,\\text{m/s}$',
      explanation: 'By conservation of mechanical energy, $mgh = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh} = \\sqrt{2 \\cdot 10 \\cdot 5} = 10\\,\\text{m/s}$.',
      stepByStepSolution: [
        'Potential energy lost: $\\Delta U = mgh$.',
        'Kinetic energy gained: $K = \\frac{1}{2}mv^2$.',
        'Solve $v = \\sqrt{2gh} = \\sqrt{100} = 10\\,\\text{m/s}$.',
      ],
      hints: ['Mass cancels out when conserving mechanical energy.'],
      examTracks: ['all', 'jee_main', 'ap_stem'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  chemistry: [
    {
      id: 'guest-chem-1',
      subjectId: 'chemistry',
      chapterId: 'ch-organic',
      topicId: 'SN2 Reaction Mechanism',
      conceptId: 'concept-sn2-mechanism',
      questionType: 'single_choice',
      difficulty: 'medium',
      questionText: 'Which stereochemical outcome characterizes a bimolecular nucleophilic substitution ($S_N2$) at a single chiral carbon center?',
      options: [
        '100% Walden inversion of configuration',
        'Complete racemization (50:50 mixture)',
        'Strict retention of configuration',
        'Formation of a planar carbocation intermediate',
      ],
      correctAnswer: '100% Walden inversion of configuration',
      explanation: 'In an $S_N2$ concerted step, the nucleophile attacks $180^\\circ$ opposite the leaving group, inverting tetrahedral stereochemistry.',
      stepByStepSolution: [
        'The nucleophile approaches from the backside to overlap the $\\sigma^*$ antibonding orbital.',
        'Transition state is trigonal bipyramidal.',
        'Leaving group departs, flipping stereochemical configuration.',
      ],
      hints: ['Backside attack minimizes steric hindrance and aligns with $\\sigma^*$.'],
      examTracks: ['all', 'jee_main'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  cs: [
    {
      id: 'guest-cs-1',
      subjectId: 'cs',
      chapterId: 'ch-algorithms',
      topicId: 'Dynamic Programming & Complexity',
      conceptId: 'concept-dynamic-programming',
      questionType: 'single_choice',
      difficulty: 'medium',
      questionText: 'What is the worst-case time complexity of binary search on a sorted array of $n$ elements?',
      options: ['$O(\\log n)$', '$O(n)$', '$O(n \\log n)$', '$O(1)$'],
      correctAnswer: '$O(\\log n)$',
      explanation: 'Each comparison eliminates half of the remaining search interval, giving at most $\\lceil \\log_2 n \\rceil$ steps.',
      stepByStepSolution: [
        'Initial search range length is $n$.',
        'After $k$ steps, remaining size is $n / 2^k$.',
        'Stop when $n / 2^k = 1 \\Rightarrow k = \\log_2 n$.',
      ],
      hints: ['Count how many times you can halve $n$ before reaching $1$.'],
      examTracks: ['all', 'ict_hackathon', 'ai_ml_foundations'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  biology: [
    {
      id: 'guest-bio-1',
      subjectId: 'biology',
      chapterId: 'ch-genetics',
      topicId: 'CRISPR-Cas9 Gene Editing',
      conceptId: 'concept-crispr-cas9',
      questionType: 'single_choice',
      difficulty: 'medium',
      questionText: 'What sequence motif must immediately flank the target DNA for *Streptococcus pyogenes* Cas9 to bind and cleave?',
      options: ['PAM ($5\'-NGG-3\'$)', 'TATA box', 'Poly-A tail', 'Shine-Dalgarno sequence'],
      correctAnswer: 'PAM ($5\'-NGG-3\'$)',
      explanation: 'Cas9 requires the Protospacer Adjacent Motif (PAM) $5\'-NGG-3\'$ before unwinding the DNA duplex to check sgRNA complementarity.',
      stepByStepSolution: [
        'Cas9 scans double-stranded DNA for PAM sequences.',
        'Upon finding $5\'-NGG-3\'$, R-loop formation tests sgRNA pairing.',
        'HNH and RuvC domains create a double-strand break.',
      ],
      hints: ['It prevents Cas9 from cleaving its own CRISPR locus in bacteria.'],
      examTracks: ['all', 'ap_stem'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  english: [
    {
      id: 'guest-eng-1',
      subjectId: 'english',
      chapterId: 'ch-rhetoric',
      topicId: 'Syntactic Parallelism',
      conceptId: 'concept-parallelism',
      questionType: 'single_choice',
      difficulty: 'easy',
      questionText: 'Which sentence maintains strict grammatical parallelism?',
      options: [
        'She likes reading proofs, deriving theorems, and writing code.',
        'She likes reading proofs, to derive theorems, and writing code.',
        'She likes to read proofs, deriving theorems, and writes code.',
        'She likes reading proofs, theorems derived, and coding.',
      ],
      correctAnswer: 'She likes reading proofs, deriving theorems, and writing code.',
      explanation: 'All three coordinated items use gerund phrases (`reading...`, `deriving...`, `writing...`).',
      stepByStepSolution: [
        'Identify the coordinate conjunction connecting series elements.',
        'Match grammatical form across every item in the list.',
      ],
      hints: ['Check that every item after "likes" has the exact same verb form.'],
      examTracks: ['all'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
  data_science: [
    {
      id: 'guest-ds-1',
      subjectId: 'data_science',
      chapterId: 'ch-ml',
      topicId: 'Bias-Variance & Regularization',
      conceptId: 'concept-regularization',
      questionType: 'single_choice',
      difficulty: 'medium',
      questionText: 'Which property uniquely distinguishes L1 (Lasso) regularization from L2 (Ridge) regularization?',
      options: [
        'L1 drives irrelevant weights strictly to zero (sparse feature selection)',
        'L1 always increases model variance',
        'L2 eliminates all correlated features completely',
        'L1 requires closed-form matrix inversion without optimization',
      ],
      correctAnswer: 'L1 drives irrelevant weights strictly to zero (sparse feature selection)',
      explanation: 'The L1 diamond constraint region has corners on coordinate axes, promoting exact zero coefficients.',
      stepByStepSolution: [
        'L1 penalty adds $\\lambda \\sum |w_i|$ to the loss.',
        'Subgradient behavior at zero snaps small weights to $0$.',
      ],
      hints: ['Compare the geometry of $|w_1| + |w_2| \\le c$ vs $w_1^2 + w_2^2 \\le c$.'],
      examTracks: ['all', 'ai_ml_foundations'],
      tags: ['guest-preview'],
      source: 'guest_preview',
      verificationStatus: 'verified',
      version: 1,
    },
  ],
};

export async function generateGuestPracticeQuestions(
  config: PracticeSessionConfig,
  maxQuestions: number = GUEST_LIMITS.practiceQuestions
): Promise<QuestionBankItem[]> {
  const remaining = Math.min(
    Math.max(1, maxQuestions),
    Math.max(1, config.questionCount || GUEST_LIMITS.practiceQuestions),
    GUEST_LIMITS.practiceQuestions
  );
  const excludeSet = new Set(config.excludeQuestionIds || []);
  const subjectId = (config.subjectId || 'math') as SubjectId;
  const generated: QuestionBankItem[] = [];

  try {
    const curriculum = await loadSubjectCurriculum(subjectId, config.examTrack || 'all');
    if (curriculum) {
      const chapters = curriculum.chapters || [];
      for (const ch of chapters) {
        for (const topic of ch.topics || []) {
          if (config.topicId && topic.id !== config.topicId) continue;
          for (const sub of topic.subtopics || []) {
            if (config.subtopicId && sub.id !== config.subtopicId) continue;
            for (const c of sub.concepts || []) {
              if (config.conceptId && c.id !== config.conceptId) continue;
              const qId = `guest-curr-${c.id}`;
              if (excludeSet.has(qId)) continue;
              const summaryText = c.summary || c.formalDefinition || c.title;
              const wrongChoices = [
                'It applies strictly to discrete constants with zero rate of change.',
                'It violates conservation laws under linear coordinate transformations.',
                'None of the first-principles conditions hold outside trivial boundaries.',
              ];
              generated.push({
                id: qId,
                subjectId,
                chapterId: ch.id,
                topicId: topic.title || topic.id,
                conceptId: c.id,
                questionType: 'single_choice',
                difficulty:
                  config.difficultyMode === 'hard'
                    ? 'hard'
                    : config.difficultyMode === 'easy'
                    ? 'easy'
                    : 'medium',
                questionText: `Concept Check (${c.title}): Which statement accurately captures this principle?`,
                options: [summaryText, ...wrongChoices],
                correctAnswer: summaryText,
                explanation: `${c.title}: ${c.intuitiveExplanation || summaryText}`,
                stepByStepSolution: c.keyFormulas?.[0]
                  ? [`Key formula (${c.keyFormulas[0].label}): $${c.keyFormulas[0].latex}$`]
                  : [`Review the core definition of ${c.title}.`],
                hints: c.commonPitfalls?.[0]
                  ? [`Watch out for: ${c.commonPitfalls[0].trapTitle}`]
                  : [`Focus on the core invariant defining ${c.title}.`],
                examTracks: ch.examTracks || ['all'],
                tags: ['guest-preview', subjectId],
                source: 'guest_preview',
                verificationStatus: 'verified',
                version: 1,
              });
              if (generated.length >= remaining) return generated;
            }
          }
        }
      }
    }
  } catch {
    // Fallback to static STEM bank below
  }

  const fallbackList = FALLBACK_SUBJECT_BANK[subjectId] || FALLBACK_SUBJECT_BANK.math;
  const allFallbacks = [
    ...fallbackList,
    ...Object.values(FALLBACK_SUBJECT_BANK).flat().filter((q) => q.subjectId !== subjectId),
  ];

  for (const item of allFallbacks) {
    if (generated.length >= remaining) break;
    if (!excludeSet.has(item.id) && !generated.some((g) => g.id === item.id)) {
      generated.push(item);
    }
  }

  return generated.slice(0, remaining);
}

export function generateGuestDoubtReply(
  prompt: string,
  options?: {
    mode?: string;
    hintFirst?: boolean;
    revealFullSolution?: boolean;
    hasImage?: boolean;
  }
): string {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const hintFirst = Boolean(options?.hintFirst) && !options?.revealFullSolution;

  let domainTitle = 'STEM First-Principles Breakdown';
  let keyHint = 'Identify the conserved invariant, governing definition, or boundary condition first before substituting numbers.';
  let answer = 'Isolate the governing relationship for the system, express unknowns cleanly in terms of knowns, and check units/domain limits.';
  let steps = [
    `1. Parse the problem statement cleanly${options?.hasImage ? ' (note: Guest Mode does not send image pixels to cloud Gemini Vision — describe key numbers/equations in text for exact step verification)' : ''}: "${cleanPrompt.slice(0, 120)}${cleanPrompt.length > 120 ? '…' : ''}".`,
    '2. Write down the primary law, theorem, or identity connecting your given variables.',
    '3. Simplify algebraically before evaluating edge cases or signs.',
  ];
  let checkQ = 'What happens to your result when the main variable approaches $0$ or $\\infty$? Does it stay physically/mathematically consistent?';

  if (/sn2|nucleophil|walden|organic|stereochem/.test(lower)) {
    domainTitle = 'Organic Mechanism ($S_N2$)';
    keyHint = 'Check substrate steric crowding and solvent polarity: $S_N2$ prefers unhindered primary centers and polar aprotic solvents.';
    answer = '$S_N2$ proceeds in one concerted step via $180^\\circ$ backside nucleophilic attack, producing Walden inversion.';
    steps = [
      '1. Overlap occurs between the nucleophile HOMO and carbon–leaving-group $\\sigma^*$ antibonding orbital.',
      '2. Carbon passes through a pentacoordinate trigonal bipyramidal transition state (rate $= k[\\text{Sub}][\\text{Nu}]$).',
      '3. As the leaving group departs opposite the incoming bond, tetrahedral stereochemistry inverts.',
    ];
    checkQ = 'Why is a tertiary alkyl halide practically unreactive under pure $S_N2$ conditions?';
  } else if (/extrema|derivative|limit|calculus|integral|chain rule|gradient/.test(lower)) {
    domainTitle = 'Calculus & Optimization';
    keyHint = 'Examine how the sign of the derivative $f\'(x)$ changes across the critical point or check higher-order derivatives.';
    answer = 'When $f\'(c)=0$ and $f\'\'(c)=0$, the First Derivative Sign Test or higher-order Taylor terms classify the critical point.';
    steps = [
      '1. Expand $f(c+h) - f(c) \\approx \\frac{f^{(n)}(c)}{n!} h^n$ up to the first non-zero derivative order $n$.',
      '2. If $n$ is **even**, $h^n \\ge 0$, giving a local minimum ($f^{(n)}(c) > 0$) or maximum ($f^{(n)}(c) < 0$).',
      '3. If $n$ is **odd**, $h^n$ flips sign around $h=0$, so $c$ is an inflection point (saddle in higher dimensions).',
    ];
    checkQ = 'Classify $x=0$ for both $f(x)=x^4$ and $g(x)=x^3$ using the rule above.';
  } else if (/newton|force|energy|momentum|physics|kinematic/.test(lower)) {
    domainTitle = 'Classical Mechanics';
    keyHint = 'Draw a Free Body Diagram in an inertial frame (or include pseudo-forces $-ma_{\\text{frame}}$ in non-inertial frames).';
    answer = 'Resolve net force components along orthogonal axes ($\\sum \\vec{F} = m\\vec{a}$) or equate work done to $\\Delta K$.';
    steps = [
      '1. Choose coordinate axes aligned with known acceleration or incline geometry.',
      '2. Balance constraint forces and compute net tangential driving force.',
      '3. Integrate or apply $v^2 = u^2 + 2as$ / conservation of energy.',
    ];
    checkQ = 'Did you verify dimensions ($\\text{kg}\\cdot\\text{m}/\\text{s}^2$) and limiting cases like friction $\\mu \\to 0$?';
  } else if (/dp|dynamic programming|binary search|algorithm|complexity|tree|graph/.test(lower)) {
    domainTitle = 'Algorithms & Complexity';
    keyHint = 'Define the minimal subproblem state $dp[i]$ and recurrence before worrying about space compression.';
    answer = 'An optimal algorithm exploits optimal substructure and tight state transitions to avoid redundant recomputation.';
    steps = [
      '1. Define state variables uniquely capturing all history needed for future choices.',
      '2. Write recurrence relation + base cases explicitly.',
      '3. Verify total time = $(\\text{\\# states}) \\times (\\text{transition cost})$. ',
    ];
    checkQ = 'Can your DP state space be compressed to a rolling 1D array without violating transition dependencies?';
  }

  if (hintFirst) {
    return `**Hint:** (${domainTitle} · Guest Preview)\n${keyHint}\n\n**Check yourself:** ${checkQ}`;
  }

  return `**Answer:** (${domainTitle} · Guest Preview)\n${answer}\n\n**Step-by-step:**\n${steps.join('\n')}\n\n**Check yourself:** ${checkQ}`;
}

export async function extractTextFromFileClient(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.pdf')) {
    if (typeof file.text === 'function') {
      const txt = await file.text();
      return txt.trim();
    }
    return '';
  }
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let raw = '';
    const cap = Math.min(bytes.length, 512_000);
    for (let i = 0; i < cap; i++) {
      const code = bytes[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
        raw += String.fromCharCode(code);
      } else {
        raw += ' ';
      }
    }
    // Extract literal strings inside PDF (...) operators or readable prose blocks
    const pdfLiterals = Array.from(raw.matchAll(/\(([^()\\]{4,200})\)/g))
      .map((m) => m[1].trim())
      .filter((s) => /[A-Za-z]{2,}/.test(s));
    if (pdfLiterals.length > 0) {
      return pdfLiterals.join(' ').replace(/\s+/g, ' ').slice(0, 4000);
    }
  } catch {
    // Fallback below
  }
  return `PDF document "${file.name}" (${Math.max(1, Math.round(file.size / 1024))} KB) uploaded in Guest Mode.`;
}

function splitKeywordsAndSentences(rawText: string, title: string): string[] {
  const cleaned = (rawText || '')
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

  if (cleaned.length >= 3) return cleaned.slice(0, 6);
  return [
    `${title}: Foundational definitions, governing invariants, and structural assumptions.`,
    `Core relationship linking variables, boundary constraints, and equilibrium conditions in ${title}.`,
    `Common misconception check: verify units, sign conventions, and domain restrictions before concluding.`,
    `Worked example walkthrough and active-recall check for ${title}.`,
  ];
}

export function generateGuestCreatorResource(req: GenerateResourceRequest): CreatorResource {
  const now = new Date().toISOString();
  const title = (req.title || `${req.subjectId.toUpperCase()} Guest Study Pack`).trim();
  const sourceBody = req.sourceText?.trim() || (req.sourceUrl ? `Source reference: ${req.sourceUrl}` : '');
  const points = splitKeywordsAndSentences(sourceBody, title);
  const type: CreatorResourceType = req.resourceType;

  const content: any = {};

  if (type === 'flashcards') {
    content.flashcards = points.map((pt, i) => ({
      id: `guest-fc-${i + 1}`,
      front: `Key Concept #${i + 1} (${title}): Explain the principle behind "${pt.slice(0, 72)}${pt.length > 72 ? '…' : ''}"`,
      back: pt,
      hint: `Connect concept #${i + 1} back to the governing law in ${req.subjectId.toUpperCase()}.`,
    }));
  } else if (type === 'quiz') {
    content.quiz = points.slice(0, 4).map((pt, i) => ({
      id: `guest-qz-${i + 1}`,
      question: `Question ${i + 1} (${title}): Which statement accurately reflects the source concept?`,
      options: [
        pt,
        'The relationship breaks down whenever independent variables remain finite.',
        'Order of operations does not matter regardless of domain bounds.',
        'No boundary check is required under this model.',
      ],
      correctIndex: 0,
      explanation: pt,
      bloomLevel: 'Understand',
    }));
  } else if (type === 'summary') {
    content.summary = {
      executiveSummary: `${title} (${req.subjectId.toUpperCase()} · ${req.difficulty}):\n\n${points.join(' ')}`,
      theoremsAndPrinciples: points.slice(0, 3).map((pt, i) => ({
        name: `Principle ${i + 1}`,
        statement: pt,
      })),
      misconceptions: [
        {
          myth: 'Applying formulas without verifying underlying domain assumptions',
          truth: 'Always confirm continuity, frame of reference, or unit dimensions first.',
        },
      ],
      actionableTakeaways: points.slice(0, 3),
    };
  } else if (type === 'notes') {
    content.notes = {
      title,
      overview: `Structured Guest Mode study notes synthesized for ${title}.`,
      sections: points.map((pt, i) => ({
        heading: `Section ${i + 1}: Core Derivation & Analysis`,
        content: pt,
        bullets: [pt, `Verify limiting cases for Section ${i + 1}.`],
      })),
    };
  } else if (type === 'slides') {
    content.slides = points.map((pt, i) => ({
      title: `Slide ${i + 1}: ${title}`,
      subtitle: `${req.subjectId.toUpperCase()} · Key Takeaway #${i + 1}`,
      bullets: [pt, 'Verify assumptions & unit consistency'],
      speakerNotes: `Emphasize why this step holds from first principles: ${pt}`,
    }));
  } else if (type === 'worksheet') {
    content.worksheet = {
      title,
      instructions: 'Work through each problem step-by-step before expanding the rubric.',
      difficulty: req.difficulty,
      problems: points.slice(0, 3).map((pt, i) => ({
        id: `guest-ws-${i + 1}`,
        prompt: `Problem ${i + 1}: Explain and verify — ${pt}`,
        hint: 'Identify the primary invariant governing this statement.',
        solution: pt,
      })),
    };
  } else if (type === 'mindmap') {
    content.mindmap = {
      rootTopic: title,
      nodes: points.map((pt, i) => ({
        id: `node-${i + 1}`,
        label: `Concept ${i + 1}`,
        summary: pt,
        children: [],
      })),
    };
  } else {
    content.keyConcepts = points.map((pt, i) => ({
      term: `${title} · Term ${i + 1}`,
      definition: pt,
      formulaOrLaw: '',
    }));
  }

  return {
    id: `res-guest-${Date.now()}`,
    userId: 'guest_scholar_id',
    title,
    resourceType: type,
    subjectId: req.subjectId,
    difficulty: req.difficulty,
    version: 1,
    status: 'ready',
    isPublic: false,
    tags: ['guest-preview', req.subjectId],
    content,
    createdAt: now,
    updatedAt: now,
  };
}
