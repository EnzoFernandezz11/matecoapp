import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      colors: {
        mateco: {
          primary: "var(--mateco-primary)",
          primaryHover: "var(--mateco-primary-hover)",
          primaryLight: "var(--mateco-primary-light)",
          bg: "var(--mateco-bg)",
          bgLight: "var(--mateco-bg-light)",
          bgDark: "var(--mateco-bg-dark)",
          surface: "var(--mateco-surface)",
          surfaceAlt: "var(--mateco-surface-alt)",
          text: "var(--mateco-text)",
          textMuted: "var(--mateco-text-muted)",
          border: "var(--mateco-border)",
          success: "var(--mateco-success)",
          warning: "var(--mateco-warning)",
          error: "var(--mateco-error)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
