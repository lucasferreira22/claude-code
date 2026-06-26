import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade Focus Digital: vermelho + preto.
        brand: {
          50: "#fef2f3",
          100: "#fde0e2",
          200: "#fbc7cb",
          300: "#f79aa1",
          400: "#f05b67",
          500: "#e5142b",
          600: "#cc1226",
          700: "#a60f1f",
          800: "#880d1a",
          900: "#73101b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
