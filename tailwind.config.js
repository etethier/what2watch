/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'inspired-gradient-text',
    'gradient-text',
    'button-gradient',
    'from-pink-500',
    'via-red-400',
    'to-orange-400',
    'bg-gradient-to-r'
  ],
  theme: {
    extend: {
      colors: {
        'pink-start': '#ec4899',
        'red-middle': '#f87171',
        'orange-end': '#f97316',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}; 