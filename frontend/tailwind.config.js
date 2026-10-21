/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#07090e',
          card: 'rgba(14, 20, 32, 0.75)',
          elevated: '#161e31',
          cyan: '#00f5d4',
          blue: '#3b82f6',
          violet: '#7928ca',
          emerald: '#10b981',
          amber: '#f59e0b',
          crimson: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
