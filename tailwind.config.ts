import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5B6ABF",
          light: "#E8ECF9",
        },
        secondary: "#F5A3A3",
        success: "#8BCB9E",
        text: {
          primary: "#1A1A2E",
          secondary: "#6B6B80",
        },
        bg: "#F9F8FC",
        card: "#FFFFFF",
        border: "#E2E0ED",
      },
      fontFamily: {
        base: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
          '"PingFang SC"', 'sans-serif',
        ],
        serif: ['"Georgia"', '"Songti SC"', 'serif'],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.4" }],
        sm: ["14px", { lineHeight: "1.5" }],
        md: ["16px", { lineHeight: "1.6" }],
        lg: ["20px", { lineHeight: "1.4" }],
        xl: ["24px", { lineHeight: "1.3" }],
        "2xl": ["32px", { lineHeight: "1.2" }],
      },
      lineHeight: {
        relaxed: "1.8",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.06)",
        md: "0 4px 16px rgba(91,106,191,0.12)",
        lg: "0 8px 32px rgba(0,0,0,0.10)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathe": "breathe 2s ease-in-out infinite",
        "star-btn": "star-btn calc(var(--duration, 3s) * 1s) linear infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "star-btn": {
          "0%": { "offset-distance": "0%" },
          "100%": { "offset-distance": "100%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
