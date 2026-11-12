/**
 * Owoda design tokens
 * Premium financial education — Africa
 */
export const colors = {
  // Backgrounds
  bg:          '#FAFAF8',   // off-white canvas
  card:        '#FFFFFF',   // pure white card
  cardAlt:     '#F9FAFB',   // light neutral

  // Brand
  primary:     '#93401F',   // terre cuite
  primaryDark: '#B4532F',   // terre cuite claire (pressed)
  primaryTint: '#F6EDE3',   // crème (encadrés)
  night:       '#2B1710',   // brun nuit (fonds sombres Premium)
  cream:       '#F6EDE3',   // crème (texte sur fonds sombres)
  accent:      '#D4AF37',   // or
  gold:        '#D4AF37',   // or (alias pour usages directs)
  accentDark:  '#A88A20',   // or pressed
  accentTint:  '#FAF5E0',   // or light bg

  // Text
  textDark:    '#111827',   // near-black
  textMid:     '#4B5563',   // medium gray
  textMuted:   '#6B7280',   // muted

  // Borders / dividers
  border:      '#E5E7EB',
  divider:     '#F3F4F6',

  // Status
  danger:      '#D93025',
  warning:     '#F59E0B',
} as const;

export const fonts = {
  regular:   'Inter-Regular',
  medium:    'Inter-Medium',
  semiBold:  'Inter-SemiBold',
  bold:      'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  black:     'Inter-Black',
} as const;
