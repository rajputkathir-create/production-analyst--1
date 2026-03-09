export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#edfcf4',
          100: '#d3f8e5',
          200: '#aaf0ce',
          300: '#73e3b0',
          400: '#3bcf8d',
          500: '#17b374',
          600: '#0d935e',
          700: '#0c754d',
          800: '#0d5d3e',
          900: '#0c4d34',
          950: '#052b1e',
        }
      }
    }
  },
  plugins: []
}
