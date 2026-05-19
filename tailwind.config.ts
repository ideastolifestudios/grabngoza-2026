import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1a472a',
        'brand-secondary': '#2d5a3d',
        'brand-accent': '#3d7a4f',
      },
    },
  },
  plugins: [],
};

export default config;
