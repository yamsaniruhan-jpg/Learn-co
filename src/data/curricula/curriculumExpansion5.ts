import { ChapterAddition } from './curriculumExpansion';

/**
 * Curriculum depth expansion, batch 5 (English and data science).
 *
 * Lights up the last single-topic chapters: reading comprehension for
 * informational text, research writing, comparative analysis, and the
 * data-science workflow steps that bracket model fitting.
 */

const ALL: ChapterAddition['examTracks'] = ['all'];

export const CURRICULUM_EXPANSION_5: ChapterAddition[] = [
  {
    subjectId: 'english',
    examTracks: ALL,
    chapterId: 'eng-ch-vocab-etymology',
    topics: [
      {
        id: 'eng-topic-context-clues',
        title: 'Context Clues & Register Awareness',
        description:
          'Inferring meaning from surrounding text and choosing words that match register and connotation.',
        estimatedHours: 3,
        subtopics: [
          {
            id: 'eng-sub-inference-register',
            title: 'Inference Strategies & Connotation',
            description: 'Five context-clue types and the denotation/connotation split.',
            concepts: [
              {
                id: 'concept-context-clues',
                title: 'Context Clues & Connotative Meaning',
                summary:
                  'Work out an unknown word from its sentence rather than guessing, and distinguish its dictionary meaning from its emotional colouring.',
                difficulty: 'medium',
                estimatedMinutes: 13,
                xpReward: 22,
                formalDefinition:
                  'Context clue types are: definition (restated meaning), synonym, antonym, example, and inference (general sense). Denotation is a word\'s literal meaning; connotation is its associated emotional tone.',
                intuitiveExplanation:
                  'A sentence is a small puzzle with the answer embedded in it. Skilled readers do not memorise more words — they extract more from the words surrounding the unknown one.',
                keyFormulas: [
                  {
                    label: 'Contrast Signal',
                    latex: '\\text{though, however, whereas} \\implies \\text{antonym clue}',
                    explanation: 'Contrast markers often reveal meaning by opposition.',
                  },
                ],
                keyObservations: [
                  '"Cheap" and "affordable" denote similar prices but differ sharply in connotation.',
                  'Punctuation often carries the clue: commas and dashes frequently introduce definitions.',
                  'Register mismatches make prose feel wrong even when it is grammatically correct.',
                ],
                workedExamples: [
                  {
                    id: 'we-vocab-01',
                    title: 'Inferring from an Antonym Clue',
                    problemStatement:
                      'In "Though usually loquacious, she fell silent during the interview", what does "loquacious" mean?',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Identify the contrast signal: "though" and the reversal "fell silent".',
                      'The contrasting term tells us loquacious is the opposite of silent.',
                      'Opposite of silent is talkative.',
                      'So loquacious means very talkative.',
                    ],
                    finalAnswer: 'Extremely talkative.',
                    keyTakeaway:
                      'Contrast markers are the fastest route to a meaning you do not know.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-vocab-01',
                    trapTitle: 'Treating connotation as identical to denotation',
                    flawedReasoning: 'If two words mean the same thing, they are interchangeable.',
                    correctConcept:
                      'Words carry emotional associations. "Childlike" and "childish" share a denotation but one is complimentary and the other pejorative.',
                    counterExample:
                      'Replacing "thrifty" with "miserly" preserves literal meaning while turning praise into criticism.',
                  },
                ],
                prerequisites: [],
                relatedConcepts: [
                  { id: 'concept-eng-logical-fallacies', title: 'Informal Logical Fallacies & Argument Flaws', subjectId: 'english' },
                ],
                miniCheckQuestion: {
                  prompt: 'Which clue type does "unlike his taciturn brother, he was quite voluble" provide?',
                  options: ['Definition', 'Synonym', 'Antonym', 'Example'],
                  correctIndex: 2,
                  explanation: '"Unlike" signals an antonym clue: voluble is the opposite of taciturn.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'english',
    examTracks: ALL,
    chapterId: 'eng-ch-academic-composition',
    topics: [
      {
        id: 'eng-topic-evidence-integration',
        title: 'Evidence Integration & Source Evaluation',
        description:
          'Quoting, paraphrasing and judging whether a source actually supports the claim it is attached to.',
        estimatedHours: 3,
        subtopics: [
          {
            id: 'eng-sub-quoting-citation',
            title: 'Quotation, Paraphrase & Source Credibility',
            description: 'Integrating evidence grammatically and screening sources for reliability.',
            concepts: [
              {
                id: 'concept-evidence-integration',
                title: 'Integrating Evidence & Evaluating Sources',
                summary:
                  'Evidence must be cited smoothly enough that the reader never loses the sentence, and credibility must be assessed before it is used.',
                difficulty: 'medium',
                estimatedMinutes: 14,
                xpReward: 23,
                formalDefinition:
                  'Evidence integration requires a signal phrase, accurate quotation or paraphrase, and analysis explaining the link to the claim. Source credibility is assessed by author expertise, publication venue, recency, and cross-corroboration.',
                intuitiveExplanation:
                  'A quotation dropped into a paragraph sits there like a boulder in a stream — the reader has to climb over it. A signal phrase and a follow-up sentence turn it into part of the current.',
                keyFormulas: [
                  {
                    label: 'Integration Pattern',
                    latex: '\\text{Claim} + \\text{Signal phrase} + \\text{Evidence} + \\text{Analysis}',
                    explanation: 'The analysis step is the one most often omitted.',
                  },
                ],
                keyObservations: [
                  'A quotation never speaks for itself; the analysis sentence is what argues.',
                  'Paraphrasing that merely swaps synonyms risks accidental plagiarism.',
                  'Peer review status matters more than how confident a source sounds.',
                ],
                workedExamples: [
                  {
                    id: 'we-evidence-01',
                    title: 'Repairing a Dropped Quotation',
                    problemStatement:
                      'Improve: "The policy failed. "Enrolment dropped 40% in two years." This is bad."',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Identify the problem: the quotation is dropped in with no signal phrase or attribution.',
                      'Add a signal phrase naming the source: "According to the 2024 audit..."',
                      'Trim to the essential words and surround with quotation marks.',
                      'Add analysis linking the figure to the claim: "...which shows the policy discouraged enrolment rather than merely failing to raise it."',
                    ],
                    finalAnswer:
                      'The 2024 audit reported that "enrolment dropped 40% in two years," which shows the policy actively discouraged enrolment rather than simply failing to raise it.',
                    keyTakeaway:
                      'Every quotation needs a speaker, a boundary and an argument it serves.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-evidence-01',
                    trapTitle: 'Treating a confident tone as evidence of credibility',
                    flawedReasoning: 'The source states its conclusion forcefully, so it must be reliable.',
                    correctConcept:
                      'Confidence is a rhetorical choice, not a quality signal. Check expertise, venue, method and whether independent sources corroborate.',
                    counterExample:
                      'Many retracted studies were written with absolute certainty before being disproven.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-eng-logical-fallacies', title: 'Informal Logical Fallacies & Argument Flaws', subjectId: 'english' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which step do students most often omit when integrating evidence?',
                  options: ['The quotation', 'The signal phrase', 'The analysis linking evidence to claim', 'The citation'],
                  correctIndex: 2,
                  explanation: 'Without analysis the reader must guess why the evidence matters.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    subjectId: 'english',
    examTracks: ALL,
    chapterId: 'eng-ch-literary-analysis',
    topics: [
      {
        id: 'eng-topic-comparative-analysis',
        title: 'Comparative Text Analysis & Structural Devices',
        description:
          'Comparing how two texts build meaning, and reading structure as an argument rather than a container.',
        estimatedHours: 3,
        subtopics: [
          {
            id: 'eng-sub-comparison-structure',
            title: 'Comparative Frameworks & Structural Choice',
            description: 'Holding a consistent basis of comparison and interpreting form.',
            concepts: [
              {
                id: 'concept-comparative-analysis',
                title: 'Comparative Analysis & Structural Interpretation',
                summary:
                  'Compare texts on a shared basis, and treat a writer\'s structural choices as deliberate meaning-making.',
                difficulty: 'medium_hard',
                estimatedMinutes: 15,
                xpReward: 24,
                formalDefinition:
                  'A comparative analysis establishes a common basis (theme, technique, perspective), treats both texts symmetrically, and supports each point with evidence. Structural analysis reads ordering, pacing and juxtaposition as rhetorical choices.',
                intuitiveExplanation:
                  'Comparing texts is not summarising two texts side by side. It is posing one question and answering it twice, so the differences themselves become the argument.',
                keyFormulas: [
                  {
                    label: 'Comparison Structure',
                    latex: '\\text{Basis} \\to \\text{Text A} \\to \\text{Text B} \\to \\text{Significance}',
                    explanation: 'Alternating within a shared basis avoids parallel summaries.',
                  },
                ],
                keyObservations: [
                  'Ending a text on a particular image is a structural decision that colours the whole reading.',
                  'Parallel summaries ("Text A is about... Text B is about...") are not analysis.',
                  'The basis of comparison must be held constant across both texts.',
                ],
                workedExamples: [
                  {
                    id: 'we-comp-01',
                    title: 'Building a Basis of Comparison',
                    problemStatement:
                      'Two poems both end with an image of winter. How would you frame a comparative point?',
                    difficulty: 'medium_hard',
                    stepByStepSolution: [
                      'Establish the basis: both use a closing seasonal image.',
                      'Analyse text A: winter functions as closure and acceptance.',
                      'Analyse text B: winter functions as withheld promise, an image placed last to resist resolution.',
                      'Draw significance: the same device yields opposite tonal effects, showing ending imagery is chosen, not incidental.',
                    ],
                    finalAnswer:
                      'Both close on winter, but one uses it to settle meaning and the other to withhold it — evidence that the placement is a deliberate rhetorical act.',
                    keyTakeaway:
                      'The comparison must produce a claim neither text states alone.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-comp-01',
                    trapTitle: 'Writing two separate mini-essays',
                    flawedReasoning: 'Analyse text A thoroughly, then text B thoroughly; the comparison emerges naturally.',
                    correctConcept:
                      'Sequential analysis produces two essays, not a comparison. Organise around shared points so the two texts are in direct dialogue.',
                    counterExample:
                      'A response with one paragraph per text often meets the requirement to "discuss both" while never actually comparing them.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-evidence-integration', title: 'Integrating Evidence & Evaluating Sources', subjectId: 'english' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What must be established before comparing two texts?',
                  options: ['Their publication dates', 'A shared basis of comparison', 'The author biographies', 'Their word counts'],
                  correctIndex: 1,
                  explanation: 'A constant basis is what makes a comparison meaningful rather than two summaries.',
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
    examTracks: ALL,
    chapterId: 'ds-ch-statistical-inference',
    topics: [
      {
        id: 'ds-topic-experiment-design',
        title: 'Experiment Design, Sampling & Confounding',
        description:
          'Before any test is run: what makes a sample representative and a comparison causal.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'ds-sub-sampling-confounding',
            title: 'Sampling Bias & Causal Inference',
            description: 'Recognising selection bias, confounding and the limits of observational data.',
            concepts: [
              {
                id: 'concept-sampling-confounding',
                title: 'Sampling Bias, Confounding & Randomisation',
                summary:
                  'A sample must be representative to generalise, and only random assignment licenses causal claims.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'Selection bias arises when the sampled units differ systematically from the target population. A confounder is a variable associated with both treatment and outcome, creating a spurious association. Randomised assignment breaks that link in expectation.',
                intuitiveExplanation:
                  'Correlation misleads because a third variable can drive both sides. Randomisation does not remove confounders — it makes them, on average, equally distributed across groups, so the only systematic difference left is the treatment.',
                keyFormulas: [
                  {
                    label: 'Confounding Structure',
                    latex: 'X \\leftarrow Z \\rightarrow Y \\ \\text{and} \\ X \\rightarrow Y',
                    explanation: 'A shared cause $Z$ induces a spurious $X$–$Y$ association.',
                  },
                ],
                keyObservations: [
                  'A larger sample does not fix bias — it estimates the wrong quantity more precisely.',
                  'Observational studies can support association, rarely causation.',
                  'Randomisation balances confounders in expectation, not in every draw.',
                ],
                workedExamples: [
                  {
                    id: 'we-design-01',
                    title: 'Identifying a Confounder',
                    problemStatement:
                      'People who drink coffee live longer. Can we conclude coffee extends life?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'The comparison is between coffee drinkers and non-drinkers, not randomly assigned.',
                      'Consider shared causes: coffee drinking correlates with income, education and exercise.',
                      'Those variables also affect longevity, so they satisfy the confounder structure.',
                      'Without randomisation or adjustment, the association cannot be attributed to coffee.',
                    ],
                    finalAnswer: 'No — socioeconomic and lifestyle confounders plausibly explain the association.',
                    keyTakeaway:
                      'Ask what else causes both the exposure and the outcome before trusting an association.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-design-01',
                    trapTitle: 'Assuming significance proves causality',
                    flawedReasoning: 'A p-value below 0.05 means the effect is real and causal.',
                    correctConcept:
                      'Significance only addresses sampling variability. Design determines whether a causal interpretation is available at all.',
                    counterExample:
                      'A huge observational cohort can give $p < 0.001$ for a spurious association with a strongly confounding variable.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-ds-hypothesis-testing', title: 'Null Hypothesis Significance Testing (NHST) & p-Values', subjectId: 'data_science' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'What does randomisation achieve?',
                  options: [
                    'Increases sample size',
                    'Balances confounders across groups in expectation',
                    'Guarantees normality',
                    'Eliminates measurement error',
                  ],
                  correctIndex: 1,
                  explanation: 'Random assignment makes treatment groups comparable by making confounders independent of treatment in expectation.',
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
    examTracks: ALL,
    chapterId: 'ds-ch-ml-algorithms',
    topics: [
      {
        id: 'ds-topic-trees-ensembles',
        title: 'Decision Trees & Ensemble Methods',
        description:
          'Recursive partitioning, its instability, and how bagging and boosting fix it.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'ds-sub-trees-gbdt',
            title: 'Trees, Random Forests & Boosting',
            description: 'Split criteria, variance reduction by averaging and sequential error correction.',
            concepts: [
              {
                id: 'concept-trees-ensembles',
                title: 'Decision Trees, Bagging & Boosting',
                summary:
                  'A single tree splits greedily and overfits; averaging many decorrelated trees cuts variance, while boosting reduces bias sequentially.',
                difficulty: 'medium_hard',
                estimatedMinutes: 17,
                xpReward: 28,
                formalDefinition:
                  'A decision tree greedily selects the split maximising impurity reduction (Gini or entropy). Random forests bag many trees on bootstrap samples with feature subsampling. Gradient boosting fits each new tree to the residual gradient of the loss.',
                intuitiveExplanation:
                  'One tree is a single opinionated expert, easily fooled by noise. A forest averages many experts trained on different slices, cancelling their individual errors. Boosting instead trains each new expert specifically on what the team keeps getting wrong.',
                keyFormulas: [
                  {
                    label: 'Gini Impurity',
                    latex: 'G = 1 - \\sum_{i} p_i^2',
                    explanation: 'Zero for a pure node; larger for mixed classes.',
                  },
                  {
                    label: 'Information Gain',
                    latex: 'IG = H(\\text{parent}) - \\sum \\frac{n_i}{n} H(\\text{child}_i)',
                    explanation: 'Entropy reduction produced by a split.',
                  },
                ],
                keyObservations: [
                  'Trees are scale invariant, so feature standardisation is unnecessary.',
                  'Deep trees have low bias but high variance.',
                  'Boosting is more prone to overfitting noisy labels than bagging.',
                ],
                workedExamples: [
                  {
                    id: 'we-tree-01',
                    title: 'Computing Gini Impurity',
                    problemStatement: 'A node contains 6 positives and 4 negatives. Find its Gini impurity.',
                    difficulty: 'easy_medium',
                    stepByStepSolution: [
                      'Compute proportions: $p_+ = 0.6$ and $p_- = 0.4$.',
                      'Apply $G = 1 - (p_+^2 + p_-^2)$.',
                      'Square: $0.36 + 0.16 = 0.52$.',
                      'Subtract: $G = 1 - 0.52 = 0.48$.',
                    ],
                    finalAnswer: '$G = 0.48$',
                    keyTakeaway:
                      'Gini peaks at 0.5 for a balanced binary node and is 0 for a pure one.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-tree-01',
                    trapTitle: 'Assuming a deeper tree always predicts better',
                    flawedReasoning: 'More splits means the model has learned more detail.',
                    correctConcept:
                      'Extra depth fits noise, raising variance and worsening test performance. Depth and minimum-leaf-size are the primary regularisation levers.',
                    counterExample:
                      'An unpruned tree can reach 100% training accuracy with poor test accuracy — the textbook overfitting case.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-ds-ridge-lasso-sparse', title: 'L1 Lasso vs. L2 Ridge Regularization Geometry', subjectId: 'data_science' },
                ],
                relatedConcepts: [
                  { id: 'concept-bias-variance', title: 'The Bias-Variance Trade-off', subjectId: 'cs' },
                ],
                miniCheckQuestion: {
                  prompt: 'What is the Gini impurity of a perfectly pure node?',
                  options: ['0.5', '1', '0', 'Depends on sample size'],
                  correctIndex: 2,
                  explanation: 'With one class at probability 1, $1 - 1^2 = 0$.',
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
    examTracks: ALL,
    chapterId: 'ds-ch-evaluation-production',
    topics: [
      {
        id: 'ds-topic-deployment-monitoring',
        title: 'Deployment, Drift & Monitoring',
        description:
          'What happens after validation: serving a model, detecting drift and keeping it honest in production.',
        estimatedHours: 4,
        subtopics: [
          {
            id: 'ds-sub-drift-monitoring',
            title: 'Data Drift, Monitoring & Retraining Triggers',
            description: 'Detecting when the world has changed under a deployed model.',
            concepts: [
              {
                id: 'concept-model-drift',
                title: 'Data Drift, Concept Drift & Monitoring',
                summary:
                  'A model validated on yesterday\'s distribution decays silently; monitoring must detect input drift and outcome drift separately.',
                difficulty: 'medium_hard',
                estimatedMinutes: 16,
                xpReward: 27,
                formalDefinition:
                  'Data (covariate) drift is a change in $P(X)$. Concept drift is a change in $P(Y|X)$, where the same inputs now imply different outcomes. Monitoring compares live distributions with the training reference using statistics such as PSI or KS tests.',
                intuitiveExplanation:
                  'Data drift is the world sending different inputs. Concept drift is the world changing the rules. The first can be caught without labels; the second usually needs outcome data to detect.',
                keyFormulas: [
                  {
                    label: 'Population Stability Index',
                    latex: 'PSI = \\sum (A_i - E_i)\\ln\\frac{A_i}{E_i}',
                    explanation: 'Above roughly 0.2 signals a meaningful distribution shift.',
                  },
                ],
                keyObservations: [
                  'Accuracy monitoring is delayed where labels arrive slowly.',
                  'Drift detection should be paired with an automated rollback path.',
                  'A stable metric can hide drift if the mixture of users changes.',
                ],
                workedExamples: [
                  {
                    id: 'we-drift-01',
                    title: 'Classifying a Production Failure',
                    problemStatement:
                      'A fraud model\'s input distributions are unchanged, but its precision collapses. Which kind of drift is this?',
                    difficulty: 'medium',
                    stepByStepSolution: [
                      'Inputs are stable, so $P(X)$ has not changed — this is not data drift.',
                      'Precision depends on the relationship between features and labels.',
                      'A changed relationship means $P(Y|X)$ has moved.',
                      'That is concept drift: fraudsters have changed tactics for the same transaction patterns.',
                    ],
                    finalAnswer: 'Concept drift.',
                    keyTakeaway:
                      'Stable inputs with degraded performance almost always indicates concept drift.',
                  },
                ],
                commonPitfalls: [
                  {
                    id: 'cp-drift-01',
                    trapTitle: 'Relying on accuracy alone as the health signal',
                    flawedReasoning: 'If accuracy is stable, the deployed model is fine.',
                    correctConcept:
                      'Accuracy can stay high while performance on the segment you care about collapses, especially under class imbalance. Monitor segment-level metrics and input distributions.',
                    counterExample:
                      'A model can keep 95% accuracy while missing every fraud case, if fraud is 1% of traffic.',
                  },
                ],
                prerequisites: [
                  { id: 'concept-ds-roc-auc-curve', title: 'ROC-AUC vs. Precision-Recall AUC under Class Imbalance', subjectId: 'data_science' },
                ],
                relatedConcepts: [],
                miniCheckQuestion: {
                  prompt: 'Which drift type changes the meaning of the same input?',
                  options: ['Data drift', 'Concept drift', 'Label noise', 'Sampling error'],
                  correctIndex: 1,
                  explanation: 'Concept drift alters $P(Y|X)$: identical inputs now map to different outcomes.',
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
