import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        crimson: {
          DEFAULT: "var(--crimson)",
          dark: "var(--crimson-dark)",
        },
        paper: "var(--paper)",
        cream: "var(--cream)",
        "cyan-shadow": "var(--cyan-shadow)",
        gold: "var(--gold)",
        danger: "var(--danger)",
        success: "var(--success)",
        muted: "var(--muted)",
      },
      fontFamily: {
        display: ["var(--font-graduate)", "Impact", "'Arial Narrow Bold'", "sans-serif"],
        script: ["var(--font-pacifico)", "'Brush Script MT'", "cursive"],
        mono: ["var(--font-courier-prime)", "'Courier New'", "monospace"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      boxShadow: {
        "hard-sm": "var(--shadow-hard-sm)",
        hard: "var(--shadow-hard)",
        "hard-lg": "var(--shadow-hard-lg)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      maxWidth: {
        content: "var(--content-max)",
      },
    },
  },
  plugins: [],
};

export default config;
