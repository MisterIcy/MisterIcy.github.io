/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg-01': '#0b1220',   // page background
        'bg-02': '#0f1724',   // raised surfaces (header, footer, sidebar)
        'card':  '#071129',   // cards, code blocks — same WCAG luminance as bg-01; always pair with border-line
        'line':  '#1e293b',   // hairline borders (1px only)
        // Brand signal — never use as large fill
        'accent':  '#06b6d4', // 7.71:1 AAA on bg-01
        'accent2': '#22d3ee', // 10.36:1 AAA on bg-01 — hover states, commit hashes
        // Text hierarchy
        'ink':  '#f1f5f9',    // 17.08:1 AAA — headings
        'body': '#cbd5e1',    // 12.61:1 AAA — running prose
        'muted': '#94a3b8',   // 7.30:1 AAA — metadata (was #64748b, 3.94:1 — WCAG AA fail)
      },
      fontFamily: {
        // Bricolage Grotesque — display/headings
        display: ['Bricolage Grotesque', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Inter — body prose and UI labels
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // JetBrains Mono — metadata, hashes, code
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
