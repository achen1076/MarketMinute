import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Teal/Cyan as brand color
        teal: {
          500: "#14B8A6", // accent.primary
          600: "#14B8A6",
        },
        cyan: {
          400: "#22D3EE", // accent.primarySoft
        },
        // Override emerald with semantic green
        emerald: {
          400: "#34D399", // semantic.up
          500: "#34D399",
        },
        // Override rose with semantic red
        rose: {
          400: "#F87171", // semantic.down
        },
        // Indigo for secondary accent
        indigo: {
          500: "#6366F1", // accent.secondary
        },
        // Override slate with charcoal grays
        slate: {
          100: "#F3F4F6", // text.main
          200: "#F3F4F6", // text.main
          300: "#9CA3AF", // text.muted
          400: "#9CA3AF", // text.muted
          500: "#6B7280", // text.soft
          600: "#334155", // border.strong
          700: "#334155", // border.strong
          800: "#1E293B", // border.subtle
          900: "#111827", // bg.subtle
          950: "#050709", // bg.body
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
