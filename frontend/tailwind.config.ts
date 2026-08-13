import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0a66c2', // LinkedIn-ish blue
          dark: '#004182',
          light: '#eef3f8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
