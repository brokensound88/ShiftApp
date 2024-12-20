/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#F9F6F1',
          200: '#F5EFE6',
          300: '#EBE3D5',
          400: '#D6CCBC',
          500: '#B8AA98',
        },
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
      },
    },
  },
  plugins: [],
};