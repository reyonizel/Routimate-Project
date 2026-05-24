// ─── RoutinMate Design System v3 — Lime × Lavender Palette ──────────────────

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: '#EEE3D0',              // Warm near-white — ana ekran zemini
  surface:    '#F5EDE0',              // Soft warm — ikincil yüzey
  surface2:   '#EEEDC8',              // Daha doygun — nested yüzey
  overlay:    'rgba(255,254,236,0.96)',

  // ── Cards ────────────────────────────────────────────────────────────────
  card:       '#FFFFFF',
  cardBorder: 'transparent',

  // ── Primary — lavender — aktif elemanlar, FAB, butonlar ─────────────────
  primary:     '#2A6151',             // Soft lavender
  primarySoft: 'rgba(168,138,237,0.12)',

  // ── Accent — lime — vurgu, tamamlama noktaları, highlight ───────────────
  accent:      '#D8C2A4',             // Lime / chartreuse
  accentSoft:  'rgba(203,216,59,0.15)',
  accentDark:  '#B89B76',             // Koyu lime (pressed)

  // ── Text ─────────────────────────────────────────────────────────────────
  text:          '#0A3B25',           // Dark charcoal
  textSecondary: '#3D6B58',           // Medium gray
  textMuted:     '#B2B7AA',           // Muted
  textInverse:   '#FFFFFF',

  // ── Muted / Border ───────────────────────────────────────────────────────
  muted:       '#B2B7AA',
  mutedSoft:   'rgba(171,171,171,0.20)',
  border:      '#B2B7AA',

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:     '#D8C2A4',
  successSoft: 'rgba(203,216,59,0.15)',
  danger:      '#EF4444',
  dangerSoft:  'rgba(239,68,68,0.10)',

  // ── Legacy aliases ────────────────────────────────────────────────────────
  brand:        '#2A6151',
  brandSoft:    'rgba(168,138,237,0.12)',
  male:         '#3498DB',
  female:       '#E91E63',
  proGold:      '#D8C2A4',
  proGoldSoft:  'rgba(203,216,59,0.15)',
  tuscanGold:     '#D8C2A4',
  tuscanGoldSoft: 'rgba(203,216,59,0.15)',
  tuscanGoldDark: '#B89B76',
};

// ─── Shadows — kart derinliği (#0A3B25 temelli, cream zemin uyumlu) ──────────
export const Shadow = {
  // Liste elemanları, küçük chip'ler
  sm: {
    shadowColor:   '#0A3B25',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius:  4,
    elevation:     2,
  },
  // Rutin kartları, istatistik blokları — ana kart gölgesi
  md: {
    shadowColor:   '#0A3B25',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius:  10,
    elevation:     5,
  },
  // FAB, modal, bottom sheet
  lg: {
    shadowColor:   '#0A3B25',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius:  18,
    elevation:     10,
  },
  // Takvim şeridi kartı
  calendar: {
    shadowColor:   '#0A3B25',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     3,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 9999,
};

// ─── Font Size ────────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36,
};

// ─── Font Weight ──────────────────────────────────────────────────────────────
export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
};

// ─── Frequency Badges — günlük/haftalık/aylık rutin etiketleri ───────────────
export const FrequencyColor = {
  daily:   { bg: 'rgba(168,138,237,0.10)', border: 'rgba(168,138,237,0.25)', text: '#2A6151' },
  weekly:  { bg: 'rgba(139,111,232,0.08)', border: 'rgba(139,111,232,0.20)', text: '#1A4F3A' },
  monthly: { bg: 'rgba(203,216,59,0.15)',  border: 'rgba(203,216,59,0.35)',  text: '#B89B76' },
};
