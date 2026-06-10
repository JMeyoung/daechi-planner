type BadgeVariant = 'blue' | 'green' | 'orange' | 'gray' | 'red'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  blue:   'bg-blue-50 text-blue-700',
  green:  'bg-green-50 text-green-700',
  orange: 'bg-orange-50 text-orange-700',
  gray:   'bg-gray-100 text-gray-600',
  red:    'bg-red-50 text-red-700',
}

const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  briefing:     'blue',
  tip:          'green',
  announcement: 'orange',
  event:        'red',
}

const CATEGORY_LABEL: Record<string, string> = {
  briefing:     '브리프',
  tip:          '학습 팁',
  announcement: '공지',
  event:        '행사',
}

type BadgeProps = {
  children?: React.ReactNode
  variant?: BadgeVariant
  category?: string
  className?: string
}

export default function Badge({ children, variant = 'gray', category, className = '' }: BadgeProps) {
  const resolvedVariant = category ? (CATEGORY_VARIANT[category] ?? 'gray') : variant
  const label = category ? CATEGORY_LABEL[category] : children

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${VARIANT_CLASSES[resolvedVariant]} ${className}`}>
      {label}
    </span>
  )
}
