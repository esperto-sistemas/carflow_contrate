/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#225E77",
          50: "#eef5f7",
          100: "#d4e6ec",
          200: "#a9ccd9",
          300: "#7eb3c6",
          400: "#5399b3",
          500: "#2f7f97",
          600: "#225E77",
          700: "#1c4f64",
          800: "#163f50",
          900: "#102f3c",
        },
      },
    },
  },
  plugins: [],
};
