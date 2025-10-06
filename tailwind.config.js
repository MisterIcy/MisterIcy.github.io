/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.hbs",
    "./content/**/*.md",
    "./src/**/*.ts"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-01': '#0b1220',
        'bg-02': '#0f1724', 
        'card': '#071129',
        'accent': '#06b6d4',
        'muted': '#64748b'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular']
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
