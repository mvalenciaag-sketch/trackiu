import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:     "var(--background)",
        frame:          "var(--frame)",
        foreground:     "var(--foreground)",
        "foreground-2": "var(--foreground-2)",
        surface:        "var(--surface)",
        "surface-2":    "var(--surface-2)",
        "surface-3":    "var(--surface-3)",
        border:         "var(--border)",
        muted:          "var(--muted)",
        "on-accent":    "var(--on-accent)",
        accent: {
          DEFAULT:   "var(--accent)",
          soft:      "var(--accent-soft)",
          "soft-ink":"var(--accent-soft-ink)",
          strong:    "var(--accent-strong)",
          press:     "var(--accent-press)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-manrope)", "sans-serif"],
        mono:    ["var(--font-space-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
