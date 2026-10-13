/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Loại file test khỏi content: chuỗi class trong assertion không được
    // phép rò utility vào CSS production
    "!./src/**/*.{test,spec}.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#294C3B',      // --green-dark
          green: '#426B4F',     // --green
          light: '#718D63',     // --green-light
          yellow: '#F5CF62',    // --yellow accent
          cream: '#F5F2E9',     // --cream
          text: '#25352C',      // --text-dark
          muted: '#718078',     // --muted
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(41, 76, 59, 0.14)',
        brand: 'rgba(41, 76, 59, 0.14)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(41, 76, 59, 0.08)',
        'elevated': '0 12px 32px -4px rgba(41, 76, 59, 0.12)',
        'yellow-glow': '0 4px 20px rgba(245, 207, 98, 0.35)',
        // Ba tầng độ cao (elevation tiers) cho các panel nổi của Marketplace
        'rail': '0 2px 10px -2px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'float': '0 10px 28px -6px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.06)',
        'panel': '0 24px 64px -12px rgba(15, 23, 42, 0.26), 0 6px 16px rgba(15, 23, 42, 0.10)',
      },
      spacing: {
        84: '21rem',
      },
      // QUAN TRỌNG: các keyframe vào sân khấu dùng thuộc tính `translate` / `scale`
      // RIÊNG, KHÔNG dùng `transform`. Với fill-mode `both`, một keyframe `transform`
      // sẽ đè vĩnh viễn mọi transform khác của phần tử:
      //  - marker MapLibre định vị bằng inline transform -> badge rơi về góc trái
      //  - navbar căn giữa bằng -translate-x-1/2 -> navbar lệch sang phải
      //  - hover:-translate-y của card -> mất hiệu ứng nhấc lên
      // `translate` / `scale` được cộng dồn với `transform` nên không xung đột.
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', translate: '0 8px' },
          '100%': { opacity: '1', translate: '0 0' },
        },
        slideInLeft: {
          '0%': { opacity: '0', translate: '-24px 0' },
          '100%': { opacity: '1', translate: '0 0' },
        },
        slideInRight: {
          '0%': { opacity: '0', translate: '24px 0' },
          '100%': { opacity: '1', translate: '0 0' },
        },
        dropInTop: {
          '0%': { opacity: '0', translate: '0 -16px' },
          '100%': { opacity: '1', translate: '0 0' },
        },
        pulseGlow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.45)',
          },
          '50%': {
            opacity: '0.85',
            boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)',
          },
        },
        bracketIn: {
          '0%': { opacity: '0', scale: '0.4' },
          '100%': { opacity: '1', scale: '1' },
        },
        // Ảnh header thửa phóng chậm (Ken Burns) — chỉ chạy khi người dùng không tắt chuyển động
        heroZoom: {
          '0%': { scale: '1.12' },
          '100%': { scale: '1.02' },
        },
        // Sóng lan toả từ tâm thửa đang chọn (áp lên vòng con, KHÔNG lên phần tử marker)
        ripple: {
          '0%': { opacity: '0.75', transform: 'scale(0.35)' },
          '80%': { opacity: '0' },
          '100%': { opacity: '0', transform: 'scale(2.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fadeInUp: 'fadeInUp 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        slideInLeft: 'slideInLeft 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        slideInRight: 'slideInRight 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        dropInTop: 'dropInTop 460ms cubic-bezier(0.22, 1, 0.36, 1) both',
        pulseGlow: 'pulseGlow 1800ms cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bracketIn: 'bracketIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        ripple: 'ripple 2400ms cubic-bezier(0.22, 1, 0.36, 1) infinite',
        heroZoom: 'heroZoom 18s ease-out both',
        shimmer: 'shimmer 1600ms linear infinite',
      },
    },
  },
  plugins: [],
}

