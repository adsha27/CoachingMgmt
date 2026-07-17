import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/emails/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      // Design tokens as Tailwind colors. New key names only — they do not
      // collide with Tailwind's defaults (orange/amber/red still work on the
      // not-yet-restyled auth pages). Each maps to a CSS var so dark mode
      // flips automatically via [data-theme="dark"].
      colors: {
        ink: { DEFAULT: "var(--ink)", soft: "var(--ink-soft)" },
        paper: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", sunken: "var(--surface-sunken)" },
        line: "var(--line)",
        accent: { DEFAULT: "var(--accent)", dark: "var(--accent-dark)", tint: "var(--accent-tint)" },
        warn: { DEFAULT: "var(--amber)", tint: "var(--amber-tint)" },
        danger: { DEFAULT: "var(--red)", tint: "var(--red-tint)" },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
