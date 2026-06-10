// Shared color palette for child profiles — keep in sync with the
// `color` values stored in child_profiles.
export const CHILD_COLORS = ['blue', 'violet', 'emerald', 'orange', 'pink'] as const

export const DOT_COLOR: Record<string, string> = {
  blue:    'bg-blue-400',
  violet:  'bg-violet-400',
  emerald: 'bg-emerald-400',
  orange:  'bg-orange-400',
  pink:    'bg-pink-400',
}

export const BADGE_COLOR: Record<string, string> = {
  blue:    'bg-blue-100 text-blue-700 border-blue-200',
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orange:  'bg-orange-100 text-orange-700 border-orange-200',
  pink:    'bg-pink-100 text-pink-700 border-pink-200',
}
