import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0E14",
        surface: "#12161F",
        card: "rgba(255,255,255,0.035)",
        border: "rgba(255,255,255,0.08)",
        teal: "#22D3EE",
        violet: "#3B82F6",
        amber: "#F59E0B",
        rose: "#F43F5E",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(59,130,246,0.35)",
        "glow-sm": "0 0 20px -6px rgba(59,130,246,0.30)",
        "glow-teal": "0 0 30px -8px rgba(34,211,238,0.35)",
        "glow-violet": "0 0 30px -8px rgba(59,130,246,0.35)",
        "card-lift": "0 20px 40px -16px rgba(0,0,0,0.55)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { backgroundPosition: "15% 0%, 85% 10%, 50% 100%" },
          "50%": { backgroundPosition: "20% 5%, 80% 15%, 45% 95%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-up": "fade-up 0.35s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;