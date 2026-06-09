/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      screens: {
        sm: "576px",
        md: "768px",
        lg: "992px",
        xl: "1200px",
      },
      spacing: {
        "2rem": "2rem",
        "4rem": "4rem",
        "20rem": "20rem",
        "25rem": "25rem",
        "35rem": "35rem",
      },
      width: {
        "2rem": "2rem",
        "4rem": "4rem",
        "20rem": "20rem",
        "25rem": "25rem",
        "35rem": "35rem",
      },
      height: {
        "2rem": "2rem",
        "4rem": "4rem",
      },
      maxWidth: {
        "2rem": "2rem",
      },
      maxHeight: {
        "2rem": "2rem",
      },
    },
  },
  plugins: [],
};
