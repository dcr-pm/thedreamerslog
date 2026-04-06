/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dreamy-purple': '#8b5cf6',
        'dreamy-indigo': '#4f46e5',
        'dark-bg': '#0a0502',
        'light-bg': 'rgba(255, 255, 255, 0.05)',
        'light-text': '#e2e8f0',
        'medium-text': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'aurora-1': 'aurora1 20s ease-in-out infinite',
        'aurora-2': 'aurora2 25s ease-in-out infinite',
        'float-1': 'floatOrb1 12s ease-in-out infinite',
        'float-2': 'floatOrb2 15s ease-in-out infinite',
        'float-3': 'floatOrb3 10s ease-in-out infinite',
        'float-4': 'floatOrb4 18s ease-in-out infinite',
        'float-5': 'floatOrb5 14s ease-in-out infinite',
        'float-6': 'floatOrb6 16s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        aurora1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.6' },
          '33%': { transform: 'translate(5%, 3%) scale(1.1)', opacity: '0.8' },
          '66%': { transform: 'translate(-3%, -2%) scale(0.95)', opacity: '0.5' },
        },
        aurora2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.5' },
          '40%': { transform: 'translate(-4%, -3%) scale(1.15)', opacity: '0.7' },
          '70%': { transform: 'translate(3%, 2%) scale(0.9)', opacity: '0.4' },
        },
        floatOrb1: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.3' },
          '50%': { transform: 'translate(30px, -40px)', opacity: '0.6' },
        },
        floatOrb2: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.2' },
          '50%': { transform: 'translate(-25px, -35px)', opacity: '0.5' },
        },
        floatOrb3: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.4' },
          '50%': { transform: 'translate(20px, 30px)', opacity: '0.7' },
        },
        floatOrb4: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.15' },
          '50%': { transform: 'translate(-35px, -20px)', opacity: '0.4' },
        },
        floatOrb5: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.3' },
          '50%': { transform: 'translate(15px, -25px)', opacity: '0.6' },
        },
        floatOrb6: {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0.2' },
          '50%': { transform: 'translate(-20px, 25px)', opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
