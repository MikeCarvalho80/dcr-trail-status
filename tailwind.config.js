
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d0c0a',
        'bg-secondary': '#12110e',
        'bg-elevated': '#1a1915',
        'text-primary': '#e8e6e1',
        'text-secondary': '#908a7e',
        'text-muted': '#78736a',
        'status-open': '#2ecc71',
        'status-open-bg': '#0a2e1a',
        'status-caution': '#f1c40f',
        'status-caution-bg': '#2e2a0a',
        'status-closed': '#f25c4d',
        'status-closed-bg': '#2e0a0a',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', '"Cascadia Code"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
}
