import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spectr: {
          canvas: "#0D0D0D",
          surface: "#171717",
          "surface-raised": "#262626",
          hairline: "#2E2E2E",
          border: "#2E2E2E",
          primary: "#894DEF",
          "primary-hover": "#A273F2",
          ink: "#FAFAFA",
          body: "#B8B8B8",
          muted: "#737373",
          success: "#4ADE80",
          warning: "#FBBF24",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};

export default config;
