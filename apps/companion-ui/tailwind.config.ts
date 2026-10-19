import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#04060A',
          900: '#06090F',
          800: '#0B101B',
          700: '#0E1424',
          600: '#141D33',
        },
        accent: {
          cyan: '#00D4FF',
          emerald: '#00E599',
          mint: '#10F0B0',
          amber: '#FFB800',
          coral: '#FF4757',
        },
      },
      backgroundImage: {
        'glow-radial':
          'radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.12) 0%, rgba(0, 229, 153, 0.05) 35%, transparent 70%)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
