// Fintech color scheme with light/dark mode support

export const COLORS_DARK = {
  // Core backgrounds
  bg: {
    body: "#020617",
    elevated: "#050B1B",
    subtle: "#0B1220",
    card: "#0F172A",
  },

  // Borders
  border: {
    subtle: "#1E293B",
    strong: "#334155",
  },

  // Text
  text: {
    main: "#F8FAFC",
    muted: "#94A3B8",
    soft: "#64748B",
  },

  // Accents
  accent: {
    primary: "#10B981",
    primarySoft: "#34D399",
    secondary: "#8B5CF6",
  },

  // Semantic (market indicators) - fintech standard
  semantic: {
    up: "#10B981", // Emerald green
    down: "#EF4444", // Red
    neutral: "#94A3B8",
  },

  // Badge
  badge: {
    neutralBg: "rgba(148, 163, 184, 0.08)",
  },
} as const;

export const COLORS_LIGHT = {
  // Core backgrounds - clean white/gray fintech style
  bg: {
    body: "#F8FAFC",
    elevated: "#FFFFFF",
    subtle: "#F1F5F9",
    card: "#FFFFFF",
  },

  // Borders
  border: {
    subtle: "#E2E8F0",
    strong: "#CBD5E1",
  },

  // Text
  text: {
    main: "#0F172A",
    muted: "#475569",
    soft: "#64748B",
  },

  // Accents
  accent: {
    primary: "#059669",
    primarySoft: "#10B981",
    secondary: "#7C3AED",
  },

  // Semantic (market indicators) - fintech standard
  semantic: {
    up: "#059669", // Darker emerald for light mode
    down: "#DC2626", // Darker red for light mode
    neutral: "#64748B",
  },

  // Badge
  badge: {
    neutralBg: "rgba(100, 116, 139, 0.1)",
  },
} as const;

// Default export for backward compatibility (dark mode)
export const COLORS = COLORS_DARK;

// Utility function to get color based on market change
export const getMarketColor = (changePct: number, isFlat = false) => {
  if (isFlat || Math.abs(changePct) < 0.01) {
    return COLORS.semantic.neutral;
  }
  return changePct >= 0 ? COLORS.semantic.up : COLORS.semantic.down;
};

// Tailwind-compatible CSS variables (optional, for use in tailwind.config)
export const CSS_VARS = {
  "--color-bg-body": COLORS.bg.body,
  "--color-bg-elevated": COLORS.bg.elevated,
  "--color-bg-subtle": COLORS.bg.subtle,
  "--color-border-subtle": COLORS.border.subtle,
  "--color-border-strong": COLORS.border.strong,
  "--color-text-main": COLORS.text.main,
  "--color-text-muted": COLORS.text.muted,
  "--color-text-soft": COLORS.text.soft,
  "--color-accent-primary": COLORS.accent.primary,
  "--color-accent-primary-soft": COLORS.accent.primarySoft,
  "--color-accent-secondary": COLORS.accent.secondary,
  "--color-semantic-up": COLORS.semantic.up,
  "--color-semantic-down": COLORS.semantic.down,
} as const;
