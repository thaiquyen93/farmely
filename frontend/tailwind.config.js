/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#294C3B',      // --green-dark
          green: '#426B4F',     // --green
          light: '#718D63',     // --green-light
          yellow: '#F5CF62',    // --yellow accent
          cream: '#F5F2E9',     // --cream
          text: '#25352C',      // --text-dark
          muted: '#718078',     // --muted
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(41, 76, 59, 0.14)',
        brand: 'rgba(41, 76, 59, 0.14)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(41, 76, 59, 0.08)',
        'elevated': '0 12px 32px -4px rgba(41, 76, 59, 0.12)',
        'yellow-glow': '0 4px 20px rgba(245, 207, 98, 0.35)',
      }
    },
  },
  plugins: [],
}

