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
        kurly: {
          purple: "#5F0080",
          "purple-dark": "#4A0066",
          "purple-soft": "#F4EEF8",
          "purple-mid": "#D9C4E6",
          "purple-chip": "#F3EDF7",
          ink: "#333333",
          sub: "#666666",
          muted: "#999999",
          faint: "#B5B5B5",
          line: "#F2F2F2",
          "line-strong": "#E5E5E5",
          bg: "#F7F7F7",
          danger: "#FA622F",
          cart: "#FF4B4B",
          gold: "#C8A96A",
        },
      },
      maxWidth: {
        mobile: "430px",
      },
      boxShadow: {
        toast: "0 4px 16px rgba(0,0,0,0.18)",
      },
      fontSize: {
        "2xs": ["11px", "14px"],
      },
    },
  },
  plugins: [],
};
export default config;
