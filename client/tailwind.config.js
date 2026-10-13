/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#f6f6f3',
        surface: '#ffffff',
        fill: '#f0f1ec',
        line: '#e5e6df',
        ink: {
          DEFAULT: '#171914',
          soft: '#555a52',
          muted: '#8a8f85',
        },
        brand: {
          50: '#ecf5ef',
          100: '#d3e9dc',
          200: '#a7d2ba',
          300: '#74b393',
          400: '#469371',
          500: '#277b59',
          600: '#1a6a4a',
          700: '#15553c',
          800: '#124530',
          900: '#103a29',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
    },
  },
  plugins: [],
};