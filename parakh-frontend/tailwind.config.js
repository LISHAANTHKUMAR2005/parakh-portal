/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAE0FD',
          300: '#7CC2FA',
          400: '#36A0F4',
          500: '#0C83DE',
          600: '#0B3C5D', // Government Blue
          700: '#09314D',
          800: '#07273E',
          900: '#051D2E',
          950: '#03121D',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#FEFEFE',
          200: '#FCFCFC',
          300: '#FAFAFA',
          400: '#F7F7F7',
          500: '#F2F2F2',
          600: '#EDEDED',
          700: '#E8E8E8',
          800: '#E3E3E3',
          900: '#DEDEDE',
          950: '#D9D9D9',
        },
        accent: {
          DEFAULT: '#F2F4F7',
          50: '#F9FAFB',
          100: '#F2F4F7', // Requested Accent
          200: '#E4E7EB',
          300: '#D0D5DD',
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1D2939',
          900: '#101828',
        },
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'], // Removed Outfit for stricter look
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'card-hover': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      },
    },
  },
  plugins: [],
}