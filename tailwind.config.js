/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'Segoe UI Arabic', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        accent: {
          pink: '#ff6b9d',
          purple: '#c44dff',
          teal: '#06d6a0',
          orange: '#ff9f43',
          coral: '#ff6b6b',
        },
        dark: {
          base: '#0f0f1a',
          surface: '#16132b',
          card: '#1a1a2e',
          elevated: '#222244',
          border: '#2a2a4a',
          input: '#12101f',
          hover: '#2e2e52',
        },
        text: {
          primary: '#f0f0ff',
          secondary: '#a8a8c8',
          muted: '#7878a0',
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px -5px rgba(124, 58, 237, 0.4)',
        'glow-teal': '0 0 20px -5px rgba(6, 214, 160, 0.4)',
        'glow-orange': '0 0 20px -5px rgba(255, 159, 67, 0.4)',
        'glow-pink': '0 0 20px -5px rgba(255, 107, 157, 0.4)',
        'glow-coral': '0 0 20px -5px rgba(255, 107, 107, 0.4)',
      },
    },
  },
  plugins: [],
}
