import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom colors if needed
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        // Custom keyframes if needed
      },
    },
  },
  plugins: [],
}

export default config 