/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#DDE6ED',
          main: '#27374D',
          subtext: '#3B7BA3',
        },
      },
    },
  },
  plugins: [],
};
