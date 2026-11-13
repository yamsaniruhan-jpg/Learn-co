/**
 * LEARN.CO DESIGN SYSTEM TOKENS — VOLUME 2
 *
 * IMPORTANT — read before using these numbers.
 *
 * This file previously described a palette the product does not use: indigo
 * (#6366f1 / #4f46e5) primaries and Inter + Outfit typography. The shipped UI
 * uses #6C5CE7 with Nunito + Poppins. Nobody noticed because **nothing imported
 * this file** — so it was never wrong at runtime, only misleading to anyone who
 * opened it looking for the design system.
 *
 * The authoritative tokens now live in `src/index.css` inside the Tailwind v4
 * `@theme` block, because that is where they have to be for utilities like
 * `bg-brand` / `text-ink` to exist at all. This file re-exports those values for
 * JS consumers (charts, canvas, email templates) that cannot use a CSS class.
 *
 * Keep this in sync with `src/index.css`. `tests/designTokens.test.ts` fails if
 * the two disagree.
 */

export const DESIGN_TOKENS = {
  brand: {
    name: 'LearnCo',
    tagline: 'Immersive, Gamified Mastery',
    version: '2.1.0',
  },
  colors: {
    // Matches `--color-brand*` in src/index.css. The old indigo ramp was wrong.
    primary: {
      DEFAULT: '#6C5CE7',
      soft: '#8577ED',
      deep: '#5B4BC4',
      dark: '#8577ED', // the app lightens the brand colour in dark mode
    },
    // Semantic surfaces, mirroring the CSS custom properties in index.css.
    surface: {
      canvas: '#F7F5FF',
      surface: '#FFFFFF',
      subtle: '#F0EDFA',
      canvasDark: '#1E1B33',
      surfaceDark: '#2A2647',
      subtleDark: '#24203E',
    },
    text: {
      primary: '#2D2A4A',
      secondary: '#6B6890',
      muted: '#8E8BAF',
      primaryDark: '#F1EFFF',
      secondaryDark: '#B4B0D5',
    },
    border: {
      subtle: '#E3DFF5',
      strong: '#CEC8EC',
      dark: '#3D3861',
    },
    status: {
      success: '#4CAF8E',
      error: '#F25F5C',
      warning: '#FFB84D',
      accent: '#00B8A9',
    },
    accent: {
      cyan: '#06b6d4',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
      violet: '#8b5cf6',
      orange: '#f97316',
    },
    gamification: {
      xpGold: '#f59e0b',
      xpGoldLight: '#fef3c7',
      streakFlame: '#f97316',
      streakFlameLight: '#ffedd5',
      masteryEmerald: '#10b981',
      masteryEmeraldLight: '#d1fae5',
    },
    subjects: {
      math: {
        primary: '#4f46e5',
        light: '#eef2ff',
        border: '#c7d2fe',
        label: 'Mathematics',
      },
      cs: {
        primary: '#f59e0b',
        light: '#fffbeb',
        border: '#fde68a',
        label: 'Computer Science',
      },
      physics: {
        primary: '#0284c7',
        light: '#f0f9ff',
        border: '#bae6fd',
        label: 'Physics',
      },
      chemistry: {
        primary: '#059669',
        light: '#ecfdf5',
        border: '#a7f3d0',
        label: 'Chemistry',
      },
      biology: {
        primary: '#e11d48',
        light: '#fff1f2',
        border: '#fecdd3',
        label: 'Biology',
      },
    },
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },
  borderRadius: {
    none: '0px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    full: '9999px',
  },
  typography: {
    // These are the fonts actually loaded in index.html.
    fontFamily: {
      sans: ['Nunito', 'Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Poppins', 'Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    fontSizes: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
    elevated: '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    modal: '0 20px 40px -10px rgb(0 0 0 / 0.16)',
    glow: '0 0 20px -3px rgba(108, 92, 231, 0.35)',
    glowXp: '0 0 20px -3px rgba(245, 158, 11, 0.4)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    standard: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    wide: '1536px',
  },
};
