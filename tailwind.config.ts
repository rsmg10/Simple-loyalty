import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#fffaf0",
        primary: "#0a0a0a",
        "brand-pink": "#ff4d8b",
        "brand-teal": "#1a3a3a",
        "brand-lavender": "#b8a4ed",
        "brand-peach": "#ffb084",
        "brand-ochre": "#e8b94a",
        "brand-mint": "#a4d4c5",
        "brand-coral": "#ff6b5a",
        "surface-soft": "#faf5e8",
        "surface-card": "#f5f0e0",
        "surface-strong": "#ebe6d6",
        "surface-dark": "#0a1a1a",
        "surface-dark-elevated": "#1a2a2a",
        hairline: "#e5e5e5",
        ink: "#0a0a0a",
        "body-strong": "#1a1a1a",
        body: "#3a3a3a",
        muted: "#6a6a6a",
        "muted-soft": "#9a9a9a",
        "on-primary": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        // Darkened from design.md's literal #ef4444 (3.62:1 on canvas, fails
        // WCAG AA for text) to a shade that hits 4.63:1 while staying the
        // same red family — see the UX review's contrast findings.
        error: "#dc2626",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "display-xl": ["72px", { lineHeight: "1.0" }],
        "display-lg": ["56px", { lineHeight: "1.05" }],
        "display-md": ["40px", { lineHeight: "1.1" }],
        "display-sm": ["32px", { lineHeight: "1.15" }],
        "title-lg": ["24px", { lineHeight: "1.3" }],
        "title-md": ["18px", { lineHeight: "1.4" }],
        "title-sm": ["16px", { lineHeight: "1.4" }],
        "body-md": ["16px", { lineHeight: "1.55" }],
        "body-sm": ["14px", { lineHeight: "1.55" }],
        caption: ["13px", { lineHeight: "1.4" }],
        "caption-uppercase": ["12px", { lineHeight: "1.4" }],
        button: ["14px", { lineHeight: "1.0" }],
        "nav-link": ["14px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      letterSpacing: {
        "display-xl": "-2.5px",
        "display-lg": "-2px",
        "display-md": "-1px",
        "display-sm": "-0.5px",
        "title-lg": "-0.3px",
        "caption-uppercase": "1.5px",
      },
    },
  },
  plugins: [],
};

export default config;
