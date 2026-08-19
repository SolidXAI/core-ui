/** @type {import('tailwindcss').Config} */
const metadataLayoutSafelist = [
  // Metadata-driven form layouts resolve classes at runtime, so keep the exact
  // percentage basis utilities that our PrimeFlex-style `col-*` mapping emits.
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

const broadUtilitySafelist = [
  // Keep this broad enough for metadata-driven layout utilities, but narrow
  // enough that the normal library build still completes quickly.
  {
    pattern:
      /^(basis|w|min-w|max-w|h|min-h|max-h|m|mx|my|mt|mb|ml|mr|p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y)-.+$/,
    variants: ["sm", "md", "lg", "xl"],
  },
  {
    pattern:
      /^(flex|grid|block|inline-block|inline|hidden|contents|table|items-.+|justify-.+|content-.+|self-.+|overflow-.+|whitespace-.+|truncate)$/,
    variants: ["sm", "md", "lg", "xl"],
  },
  {
    pattern:
      /^(container|visible|collapse|static|min-w-0|min-w-full|max-w-none|w-full|h-full|flex-wrap|flex-row|flex-col|flex-col-reverse|grow|shrink-0|border-collapse|overflow-auto|overflow-hidden|overflow-visible|overflow-x-auto|overflow-y-auto|whitespace-nowrap|m-0|mx-auto|my-1|my-4|my-6|mb-0|mb-2|mb-3|mb-4|mb-6|ml-1|ml-2|ml-4|mr-2|mr-4|mt-0|mt-1|mt-2|mt-3|mt-4|mt-5|mt-6|mt-8|p-0|p-1|p-2|p-3|p-4|p-6|px-0|px-2|px-3|px-4|py-1|py-2|py-3|pt-0|pt-2|pb-0|pb-2|pb-3)$/,
    variants: ["sm", "md", "lg", "xl"],
  },
];

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    ...metadataLayoutSafelist,
    ...metadataResponsiveSafelist,
    ...broadUtilitySafelist,
  ],
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
