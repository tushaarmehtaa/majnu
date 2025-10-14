import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "var(--font-shrikhand)", "Bebas Neue", "Shrikhand", "cursive"],
      },
      colors: {
        border: "#1E1E1E",
        input: "#1E1E1E",
        ring: "#C0392B",
        background: "#FDF7E4",
        foreground: "#1E1E1E",
        beige: "#FDF7E4",
        red: "#C0392B",
        success: "#27AE60",
        mustard: "#FAD7A0",
        primary: {
          DEFAULT: "#C0392B",
          foreground: "#FDF7E4",
        },
        secondary: {
          DEFAULT: "#FAD7A0",
          foreground: "#1E1E1E",
        },
        destructive: {
          DEFAULT: "#C0392B",
          foreground: "#FDF7E4",
        },
        muted: {
          DEFAULT: "#FAD7A0",
          foreground: "#1E1E1E",
        },
        accent: {
          DEFAULT: "#C0392B",
          foreground: "#FDF7E4",
        },
        popover: {
          DEFAULT: "#FDF7E4",
          foreground: "#1E1E1E",
        },
        card: {
          DEFAULT: "#FDF7E4",
          foreground: "#1E1E1E",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
