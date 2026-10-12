/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          0: '#06090F',
          1: '#0B0F19',
          2: '#101626',
          3: '#172036',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        soc: {
          dark: '#0B0F19',
          card: '#101626',
          cardBorder: '#1F2937',
          accent: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          purple: '#8B5CF6'
        }
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      boxShadow: {
        bezel: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 36px -4px rgba(0, 0, 0, 0.5)',
        'bezel-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }
        }
      }
    },
  },
  plugins: [],
}
