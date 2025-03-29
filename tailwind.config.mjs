// tailwind.config.mjs
// import { defineConfig } from 'tailwindcss';

export default defineConfig({
    content: [
      './app/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      // Add other paths as needed
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-geist-sans)', 'sans-serif'],
          mono: ['var(--font-geist-mono)', 'monospace'],
        },
        colors: {
          background: 'var(--background)',
          foreground: 'var(--foreground)',
        },
      },
    },
    plugins: [
      require('tailwindcss-animate'), // Include the animation plugin
    ],
  });
  