// Shared color palette for child profiles — keep in sync with the
// `color` values stored in child_profiles.
export const CHILD_COLORS = ['blue', 'violet', 'emerald', 'orange', 'pink'] as const

export const DOT_COLOR: Record<string, string> = {
  blue:    'bg-navy-600',
  orange:  'bg-gold-500',
  emerald: 'bg-emerald-700',
  pink:    'bg-rose-800',
  violet:  'bg-stone-500',
}

export const BADGE_COLOR: Record<string, string> = {
  blue:    'bg-navy-50 text-navy-800 border-navy-200',
  orange:  'bg-gold-50 text-gold-800 border-gold-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pink:    'bg-rose-50 text-rose-800 border-rose-200',
  violet:  'bg-stone-50 text-stone-800 border-stone-200',
}
