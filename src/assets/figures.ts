import ecosystemArtifactImg from './images/fig_ecosystem_artifact_1795707522796.jpg';
import simulationApparatusImg from './images/fig_simulation_apparatus_1795707524456.jpg';
import studyPavilionImg from './images/fig_study_pavilion_single_1795707539623.jpg';
import stemWorkspaceImg from './images/fig_stem_workspace_1795707524852.jpg';

export interface StudioFigure {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  caption: string;
  src: string;
  alt: string;
  targetTab: string;
  badge: string;
}

export const STUDIO_FIGURES = {
  ecosystem: {
    id: 'ecosystem',
    code: 'Fig. 01',
    title: 'Ecosystem map',
    subtitle: 'Smart content · Study Rooms · Focus tools',
    caption: 'Connected concept graph linking curricula, active drills, and Socratic hints.',
    src: ecosystemArtifactImg,
    alt: 'Translucent smoked glass geometric artifact with glowing volt refraction filaments in a dark studio',
    targetTab: 'concepts',
    badge: 'Live',
  },
  simulation: {
    id: 'simulation',
    code: 'Fig. 02',
    title: 'Simulation engine',
    subtitle: '3D Calculus · Wave & Phase Labs',
    caption: 'Interactive quantitative instrumentation for visualizing fields, oscillations, and manifolds.',
    src: simulationApparatusImg,
    alt: 'Anodized black and crystal glass wave interference apparatus illuminated by a crisp volt harmonic trace',
    targetTab: 'simulations',
    badge: 'WebGL',
  },
  pavilion: {
    id: 'pavilion',
    code: 'Fig. 03',
    title: 'Deep work, by design',
    subtitle: 'Zen Focus · Collaborative Study Rooms',
    caption: 'Quiet distraction-free focus timers paired with live study rooms and weekend mentorship.',
    src: studyPavilionImg,
    alt: 'Minimalist concrete and dark glass study pavilion at dusk illuminated by warm architectural desk lighting',
    targetTab: 'focus',
    badge: 'Studio',
  },
  workspace: {
    id: 'workspace',
    code: 'Fig. 04',
    title: 'Precision STEM workspace',
    subtitle: 'Omni Copilot · Creator Studio · Practice',
    caption: 'Unified headquarters from raw lecture notes to calibrated exam mastery.',
    src: stemWorkspaceImg,
    alt: 'Overhead architectural studio desk with smoked optical glass prism, precision calipers, and dark grid notebook',
    targetTab: 'learn',
    badge: 'Active',
  },
} as const satisfies Record<string, StudioFigure>;

export const DASHBOARD_FIGURE_PLATES: StudioFigure[] = [
  STUDIO_FIGURES.ecosystem,
  STUDIO_FIGURES.simulation,
  STUDIO_FIGURES.pavilion,
];
