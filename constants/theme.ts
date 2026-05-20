// ─── RoutinMate Design System v2 — Green Nature Palette ──────────────────────

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: '#FCF7F0',              // Light cream  — ana ekran zemini
  surface:    '#FFFFFF',              // Saf beyaz    — kart / liste / istatistik bloğu
  surface2:   '#F5EDE0',              // Orta cream   — nested / ikincil yüzey
  overlay:    'rgba(252,247,240,0.96)',

  // ── Cards ────────────────────────────────────────────────────────────────
  card:       '#FFFFFF',
  cardBorder: 'transparent',

  // ── Primary — aktif elemanlar, FAB, takvim seçili gün, tik butonları ────
  primary:     '#2A6151',             // Moderate green
  primarySoft: 'rgba(42,97,81,0.10)',

  // ── Text / Dark — başlıklar, kart metinleri, aktif navbar ikonları ───────
  text:          '#0A3B25',           // Deep bluish green
  textSecondary: '#3D6B58',           // Orta ton — ikincil kart metni
  textMuted:     '#B2B7AA',           // Laurel green — alt metin, separator
  textInverse:   '#FFFFFF',

  // ── Muted — pasif günler, boş yuvarlak kontür, border/separator ──────────
  muted:       '#B2B7AA',             // Laurel green
  mutedSoft:   'rgba(178,183,170,0.20)',
  border:      '#B2B7AA',

  // ── Accent — özel rutin yıldız ikonları, ikon arka planları (fuşya) ──────
  accent:     '#E91E63',              // Canlı pembe / fuşya — AYNEN KORUNDU
  accentSoft: 'rgba(233,30,99,0.10)',

  // ── Tuscan Gold — Premium buton, başarı rozeti, uyum skoru ───────────────
  tuscanGold:     '#D8C2A4',
  tuscanGoldSoft: 'rgba(216,194,164,0.18)',
  tuscanGoldDark: '#B89B76',          // pressed / darker variant

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:     '#2A6151',
  successSoft: 'rgba(42,97,81,0.10)',
  danger:      '#C0392B',
  dangerSoft:  'rgba(192,57,43,0.10)',

  // ── Legacy aliases — geriye dönük uyumluluk (kademeli geçiş için) ─────────
  brand:        '#2A6151',            // eski brand → primary
  brandSoft:    'rgba(42,97,81,0.08)',
  male:         '#3498DB',
  female:       '#E91E63',            // accent ile aynı
  proGold:      '#D8C2A4',            // tuscanGold ile aynı
  proGoldSoft:  'rgba(216,194,164,0.18)',
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
  daily:   { bg: 'rgba(42,97,81,0.10)',  border: 'rgba(42,97,81,0.25)',  text: '#2A6151' },
  weekly:  { bg: 'rgba(10,59,37,0.08)',  border: 'rgba(10,59,37,0.20)',  text: '#0A3B25' },
  monthly: { bg: 'rgba(216,194,164,0.20)', border: 'rgba(216,194,164,0.50)', text: '#B89B76' },
};
