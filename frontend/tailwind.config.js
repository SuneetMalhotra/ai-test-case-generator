/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Match portfolio site color scheme
        primary: {
          400: '#60a5fa', // blue-400 for links
          500: '#3b82f6', // blue-500
        },
      },
    },
  },
  plugins: [],
}


