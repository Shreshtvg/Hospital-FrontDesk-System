/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",  // ✅ Add this to scan styles folder
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animate'),
  ]
  
}

