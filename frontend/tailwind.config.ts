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
          bgLight: "var(--mateco-bg-light)",
          bgDark: "var(--mateco-bg-dark)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
