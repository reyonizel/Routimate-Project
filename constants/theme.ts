// ─── Pinterest WHITE Design System ─────────────────────────────────
export const Colors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F0F0F0',
  surface2: '#E8E8E8',
  overlay: 'rgba(255,255,255,0.92)',

  // Cards / Pins
  card: '#F8F8F8',
  cardBorder: '#E8E8E8',

  // Pinterest brand (use sparingly — CTAs only)
  brand: '#E60023',
  brandSoft: 'rgba(230,0,35,0.08)',

  // Gender accents (spec: profile rings, checkbox, DM frame)
  male: '#3498db',
  female: '#e91e63',

  // Text
  text: '#111111',
  textSecondary: '#767676',
  textMuted: '#ABABAB',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#008800',
  successSoft: 'rgba(0,136,0,0.10)',
  danger: '#E60023',

  // Pro / Gold
  proGold: '#D4860A',
  proGoldSoft: 'rgba(212,134,10,0.10)',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 9999,
};

export const FontSize = {
  xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
};

export const FrequencyColor = {
  daily:   { bg: 'rgba(52,152,219,0.10)', border: 'rgba(52,152,219,0.3)', text: '#2980b9' },
  weekly:  { bg: 'rgba(155,89,182,0.10)', border: 'rgba(155,89,182,0.3)', text: '#8e44ad' },
  monthly: { bg: 'rgba(230,126,34,0.10)', border: 'rgba(230,126,34,0.3)', text: '#d35400' },
};
