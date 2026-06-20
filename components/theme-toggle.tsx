'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-full h-10 bg-gray-100 dark:bg-navy-800 rounded-lg animate-pulse" />
  }

  return (
    <div className="flex bg-gray-100 dark:bg-navy-800 p-1 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-navy-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        라이트
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-navy-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        다크
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-navy-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        시스템
      </button>
    </div>
  )
}
