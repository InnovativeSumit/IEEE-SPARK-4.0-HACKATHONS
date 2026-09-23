/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          950: "#08101c",
          900: "#0b1826",
          800: "#101f30",
          700: "#16293d",
          600: "#1f374e",
          500: "#2c4a66",
        },
        mist: {
          50: "#f5f8fa",
          100: "#eaf0f4",
          200: "#d7e2e9",
          300: "#b6c9d4",
        },
        monsoon: {
          300: "#5fd6c9",
          400: "#2fc0ae",
          500: "#0f9b8e",
          600: "#0c7d73",
          700: "#0a6660",
        },
        indigo: {
          400: "#6d7ff0",
          500: "#4a5cdb",
          600: "#3a49b8",
        },
        risk: {
          critical: "#e1443f",
          high: "#ef8c2b",
          moderate: "#e0b93f",
          low: "#3fb279",
        },
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -14px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "grid-fade": "linear-gradient(to bottom, transparent, rgba(15,155,142,0.06))",
      },
    },
  },
  plugins: [],
};
