/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/nextra/dist/**/*.js',
    './node_modules/nextra-theme-docs/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
