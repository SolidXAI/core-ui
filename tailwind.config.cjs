/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color, var(--primary))",
        foreground: "var(--foreground, var(--text-color))",
        background: "var(--background, var(--surface-0))",
        card: "var(--card, var(--surface-card, var(--surface-0)))",
        border: "var(--border, var(--surface-border))",
        muted: "var(--muted, var(--surface-500))",
        "muted-foreground": "var(--muted-foreground, var(--text-color-secondary))",
        color: "var(--text-color)",
        "color-secondary": "var(--text-color-secondary)",
        "surface-0": "var(--surface-0)",
        "surface-50": "var(--surface-50)",
        "surface-100": "var(--surface-100)",
        "surface-200": "var(--surface-200)",
        "surface-300": "var(--surface-300)",
        "surface-400": "var(--surface-400)",
        "surface-500": "var(--surface-500)",
        "surface-600": "var(--surface-600)",
        "surface-700": "var(--surface-700)",
        "surface-800": "var(--surface-800)",
        "surface-900": "var(--surface-900)",
      },
      minWidth: {
        "0": "0",
      },
    },
  },
};
