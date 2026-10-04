/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: { extend: { colors: { university: { 50: '#eef4fb', 500: '#123B6D', 600: '#0e315d' }, gold: '#D9A441', ink: '#172033', muted: '#667085', canvas: '#F7F9FC' }, boxShadow: { card: '0 10px 30px rgba(18, 59, 109, .08)' } } },
  plugins: []
};
