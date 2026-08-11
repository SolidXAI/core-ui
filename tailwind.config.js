/** @type {import('tailwindcss').Config} */
const metadataLayoutSafelist = [
  // Form layout classes are assembled from view metadata at runtime, so Tailwind
  // cannot discover these responsive basis utilities by static source scanning.
  "basis-full",
  "basis-1/2",
  "basis-1/3",
  "basis-1/4",
  "basis-3/4",
  "basis-[8.333333%]",
  "basis-[16.666667%]",
  "basis-[41.666667%]",
  "basis-[58.333333%]",
  "basis-[66.666667%]",
  "basis-[83.333333%]",
  "basis-[91.666667%]",
];

const metadataResponsiveSafelist = metadataLayoutSafelist.flatMap((className) => [
  `sm:${className}`,
  `md:${className}`,
  `lg:${className}`,
  `xl:${className}`,
]);

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [...metadataLayoutSafelist, ...metadataResponsiveSafelist],
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
