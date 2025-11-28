// Deep Navy + Emerald color scheme

export const COLORS = {
  // Core backgrounds
  bg: {
    body: "#020617",
    elevated: "#050B1B",
    subtle: "#0B1220",
  },

  // Borders
  border: {
    subtle: "#111827",
    strong: "#1F2937",
  },

  // Text
  text: {
    main: "#F9FAFB",
    muted: "#9CA3AF",
    soft: "#6B7280",
  },

  // Accents
  accent: {
    primary: "#16A34A",
    primarySoft: "#22C55E",
    secondary: "#A855F7",
  },

  // Semantic (market indicators)
  semantic: {
    up: "#22C55E",
    down: "#FB7185",
    neutral: "#9CA3AF",
  },

  // Badge
  badge: {
    neutralBg: "rgba(148, 163, 184, 0.08)",
  },
} as const;

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
