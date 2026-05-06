import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/client/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // Primaire — Éco vert
        eco: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // ← PRIMARY ACTION
          700: '#15803d', // ← SUCCESS / DARK
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Transport — Bleu transit
        transit: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // ← TRAMWAY / TC
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Bus — Ambre
        bus: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // ← BUS / ALERTES DOUCES
          700: '#b45309',
        },
        // Couleurs de mode de transport (carte Leaflet)
        mode: {
          walk:    '#94a3b8', // slate-400
          bike:    '#16a34a', // eco-600
          tram:    '#2563eb', // transit-600
          bus:     '#d97706', // bus-600
          navibus: '#0891b2', // cyan-600
          car:     '#dc2626', // red-600 (référence CO2)
        },
        // Surfaces et fonds
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f1f5f9', // slate-100
          card:    '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Échelle typographique UrbanFlow
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1':      ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h2':      ['1.5rem',   { lineHeight: '1.3',  fontWeight: '600' }],
        'h3':      ['1.25rem',  { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.625' }],
        'body':    ['1rem',     { lineHeight: '1.625' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5'   }],
        'caption': ['0.75rem',  { lineHeight: '1.5'   }],
      },
      spacing: {
        '4.5': '1.125rem',  // 18px — entre sm et md
        '13':  '3.25rem',   // 52px
        '15':  '3.75rem',   // 60px
        '18':  '4.5rem',    // 72px
        '22':  '5.5rem',    // 88px

        // Zone tactile minimum WCAG (48px)
        'touch': '3rem',    // 48px
      },
      borderRadius: {
        'card':   '12px',  // Cards itinéraire, panels
        'badge':  '20px',  // Badges gamification, tags
        'button': '8px',   // Boutons
        'input':  '8px',   // Champs de formulaire
        'map':    '16px',  // Container de la carte
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'float':   '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        'inner-sm':'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      transitionDuration: {
        'fast':   '150ms',  // Interactions hover/focus
        'normal': '200ms',  // Apparitions, modales
        'slow':   '300ms',  // Badges débloqués, transitions de page
      },
      transitionTimingFunction: {
        'ui': 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out fluide
      },
      keyframes: {
        // Fade-in simple
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Slide-up pour modales et panels
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Badge débloqué
        'badge-unlock': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '60%':  { transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Score CO2 — compteur
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':     'fade-in 150ms ease-out',
        'slide-up':    'slide-up 200ms ease-out',
        'badge-unlock':'badge-unlock 300ms ease-out',
        'count-up':    'count-up 200ms ease-out',
      },
      screens: {
        // Mobile-first — overrides Tailwind defaults
        'xs':  '375px',  // iPhone SE
        'sm':  '640px',  // Petites tablettes
        'md':  '768px',  // Tablettes
        'lg':  '1024px', // Desktop
        'xl':  '1280px', // Large desktop
        // Breakpoint custom pour carte plein-écran
        'map': '900px',
      },
      height: {
        'map-mobile':  '50vh', // Carte mobile
        'map-desktop': '65vh', // Carte desktop
        'journey-card': '5rem', // Hauteur min carte itinéraire
        'navbar':       '4rem', // 64px
        'bottomnav':    '4.5rem', // 72px — bottom nav mobile
      },
      zIndex: {
        'map':     '0',   // Carte en dessous
        'overlay': '10',  // Overlays carte (légende, zoom)
        'drawer':  '20',  // Panneaux latéraux
        'navbar':  '30',  // Navbar fixe
        'modal':   '40',  // Modales
        'toast':   '50',  // Notifications toast
      },
    },
  },
  plugins: [],
}

export default config