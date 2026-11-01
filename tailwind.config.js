/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F4EE',
        black: '#2A2420',
        orange: {
          50: '#FFF8F3',
          100: '#FFF1E8',
          200: '#FFDCC6',
          300: '#FFBF98',
          400: '#F79A62',
          500: '#E8743B',
          600: '#CF5C25',
          700: '#A8461A',
          800: '#7C3313',
          900: '#4D200C',
          950: '#2E1307',
        },
        green: {
          50: '#F4FAF5',
          100: '#E9F5EA',
          200: '#CFE8D2',
          300: '#A9D3AE',
          400: '#7CB886',
          500: '#4F9A5E',
          600: '#3D7F4B',
          700: '#2F633B',
          800: '#22472B',
          900: '#162E1C',
          950: '#0E1E12',
        },
        // shifted one step from the theme file so text-gray-500 stays readable as muted text
        gray: {
          50: '#FBF9F5',
          100: '#F1ECE4',
          200: '#E4DED4',
          300: '#CFC7BB',
          400: '#A89F93',
          500: '#635B52',
          600: '#635B52',
          700: '#433D36',
          800: '#2A2420',
          900: '#2A2420',
          950: '#1C1815',
        },
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '25%': { transform: 'scale(1.3)', opacity: '0.6' },
          '50%': { transform: 'scale(0.9)', opacity: '0.8' },
          '75%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
      },
      animation: {
        sparkle: 'sparkle 0.8s ease-in-out',
      },
    },
  },
  plugins: [],
}

