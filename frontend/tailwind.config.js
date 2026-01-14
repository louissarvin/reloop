/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F5F7", // Surface
        foreground: "#0F0F0F", // Primary
        primary: {
          DEFAULT: "#0F0F0F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#232D3F",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#005B41",
          foreground: "#FFFFFF",
        },
        highlight: {
          DEFAULT: "#008170",
          foreground: "#FFFFFF",
        },
        surface: "#FFFFFF",
        muted: "#9CA3AF",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
