/**
 * LEARN.CO DESIGN SYSTEM TOKENS — VOLUME 2
 * Centralized design tokens for semantic colors, typography, spacing, radius, elevations, and transitions.
 */

export const DESIGN_TOKENS = {
  brand: {
    name: 'Learn.co',
    tagline: 'Intelligent STEM Learning Operating System',
    version: '2.0.0',
  },
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
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
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Outfit', 'Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
    glow: '0 0 20px -3px rgba(99, 102, 241, 0.35)',
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
