import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Cinzel', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: "#030712",
        foreground: "#f3f4f6",
        navy: {
          950: "#02050f",
          900: "#030712",
          850: "#050d22",
          800: "#091332",
          700: "#0f1f4d",
        },
        card: "#060d22",
        "card-border": "rgba(56, 189, 248, 0.2)",
        "cyan-glow": "#00f0ff",
        "magenta-glow": "#ec4899",
        "gold-glow": "#fbbf24",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
        "cyan-bloom": "0 0 25px rgba(0, 240, 255, 0.35)",
        "gold-bloom": "0 0 25px rgba(251, 191, 36, 0.4)",
        "magenta-bloom": "0 0 25px rgba(236, 72, 153, 0.35)",
      },
      animation: {
        "spin-slow": "spin 25s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
