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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface:    "var(--surface)",
        "surface-2":"var(--surface-2)",
        frame:      "var(--frame)",
        border:     "var(--border)",
        muted:      "var(--muted)",
        "on-accent":"var(--on-accent)",
        accent: {
          DEFAULT: "var(--accent)",
          soft:    "var(--accent-soft)",
          strong:  "var(--accent-strong)",
        },
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
