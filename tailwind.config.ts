import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        creamWhite: "#f5f5f5",
        electricPurple: "#8a2be2",
        limeGreen: "#32cd32",
        matteBlack: "#121212",
        brightYellow: "#ffff00",
      },
    },
  },
} satisfies Config;