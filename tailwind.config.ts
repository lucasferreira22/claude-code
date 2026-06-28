import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapeamento dos tokens de design para variáveis CSS
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          elevated: "var(--surface-elevated)",
          hover: "var(--surface-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          primary: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
          "subtle-border": "var(--accent-subtle-border)",
        },
        status: {
          success: "var(--status-success)",
          "success-subtle": "var(--status-success-subtle)",
          "success-subtle-border": "var(--status-success-subtle-border)",
          error: "var(--status-error)",
          "error-subtle": "var(--status-error-subtle)",
          "error-subtle-border": "var(--status-error-subtle-border)",
          "error-border-30": "var(--status-error-border-30)",
          warning: "var(--status-warning)",
          "warning-subtle": "var(--status-warning-subtle)",
          "warning-subtle-border": "var(--status-warning-subtle-border)",
          info: "var(--status-info)",
          "info-subtle": "var(--status-info-subtle)",
          "info-subtle-border": "var(--status-info-subtle-border)",
        },
        border: {
          default: "var(--border-default)",
          subtle: "var(--border-subtle)",
        },
        // Legado (mantido para compatibilidade onde ainda for usado)
        brand: {
          50: "var(--accent-subtle)",
          100: "#fde0e2",
          200: "#fbc7cb",
          300: "#f79aa1",
          400: "#f05b67",
          500: "var(--accent-primary)",
          600: "var(--accent-hover)",
          700: "var(--accent-hover)",
          800: "#880d1a",
          900: "#73101b",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [],
};

export default config;
