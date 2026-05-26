import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#104431",
          accent: "#18A374",
          background: "#ffffff",
          text: "#0a0a0a",
          surface: "#f6f6f6",
          border: "#e5e5e5",
          muted: "#999999",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      animation: {
        "marquee": "marquee 30s linear infinite",
        "fadeInUp": "fadeInUp 0.6s ease forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;