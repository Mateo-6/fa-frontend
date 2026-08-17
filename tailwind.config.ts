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
        ground: {
          DEFAULT: "var(--ground)",
          deep: "var(--ground-deep)",
          raised: "var(--ground-raised)",
          900: "var(--ground-deep)",
          800: "var(--ground)",
          700: "var(--ground-raised)",
        },
        glass: {
          DEFAULT: "var(--glass)",
          hover: "var(--glass-hover)",
          border: "var(--glass-border)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          glow: "var(--accent-glow)",
          foreground: "var(--accent-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          glow: "var(--danger-glow)",
        },
        income: {
          DEFAULT: "var(--income)",
          muted: "var(--income-muted)",
        },
        expense: {
          DEFAULT: "var(--expense)",
          muted: "var(--expense-muted)",
        },
        credit: {
          DEFAULT: "var(--credit)",
          muted: "var(--credit-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
        "glass-lg": "0 24px 64px rgba(0, 0, 0, 0.16)",
        "accent-glow": "0 0 0 3px var(--accent-glow), 0 0 24px var(--accent-glow)",
        "danger-glow": "0 0 0 3px var(--danger-glow), 0 0 20px var(--danger-glow)",
      },
      animation: {
        shimmer: "shimmer 1.6s infinite linear",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(56, 189, 248, 0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(56, 189, 248, 0.15)" },
        },
      },
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
