/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#0a0a0f',
        'cyber-gray': '#1a1a24',
        'neon-pink': '#ff00ff',
        'neon-blue': '#00ffff',
        'neon-green': '#00ff00',
        'neon-purple': '#bf00ff',
      },
      fontFamily: {
        'mono': ['"Courier New"', 'Courier', 'monospace'],
        'cyber': ['"Orbitron"', 'sans-serif'], // We might need to import this font
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00ffff, 0 0 10px #00ffff',
        'neon-pink': '0 0 5px #ff00ff, 0 0 10px #ff00ff',
      }
    },
  },
  plugins: [],
}
