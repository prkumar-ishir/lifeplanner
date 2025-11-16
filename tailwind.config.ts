import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1e3a8a",
          light: "#93c5fd",
          accent: "#fbbf24",
        },
      },
      boxShadow: {
        card: "0 15px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [typography],
};

export default config;
