import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vortex: {
          primary: '#00d4ff',
          secondary: '#7b2cbf',
          success: '#00ff88',
          warning: '#ffaa00',
          error: '#ff4444',
          bg: {
            DEFAULT: '#0a0a0f',
            secondary: '#1a1a2e',
            tertiary: '#16213e',
          },
          text: {
            DEFAULT: '#ffffff',
            muted: '#a0a0a0',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
