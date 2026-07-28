/**
 * Tidy Roll — mobile design tokens.
 *
 * Mirrors the shared brand identity used by the site and the browser
 * extension: the "sunset swipe" gradient (#FF7A59 → #FF3D81) on deep ink,
 * with green for keep and red for toss. Screens should reference these
 * tokens instead of hardcoding colors so the palette stays in one place.
 */

export const theme = {
  colors: {
    // Surfaces, darkest first.
    bg: '#0F1220',
    card2: '#181D31',
    card: '#212743',

    text: '#F4F5FB',
    textDim: 'rgba(244,245,251,0.72)',
    stroke: 'rgba(255,255,255,0.10)',

    green: '#34D399', // keep
    red: '#FF4D67', // toss
    yellow: '#FFD166',

    brand: '#FF7A59',
    brandAlt: '#FF3D81',
  },

  /**
   * Mode-card gradients. One sunset ramp — gold → coral → pink → violet —
   * so the cards read as a single family while staying distinguishable.
   * "On This Day" carries the signature brand gradient.
   */
  gradients: {
    brand: ['#FF7A59', '#FF3D81'],
    onThisDay: ['#FF7A59', '#FF3D81'],
    recents: ['#FFC46B', '#FF7A59'],
    random: ['#FF3D81', '#9D4EDD'],
    albums: ['#8B5CF6', '#6366F1'],
  },

  radius: {
    lg: 24,
    md: 16,
    sm: 12,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;
