'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from 'next-themes'

function ThemeSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (resolvedTheme) {
      // Persist the user's theme choice in a cookie so that the server can
      // render the correct theme on the next request and avoid hydration mismatches.
      document.cookie = `theme=${resolvedTheme}; path=/; max-age=${60 * 60 * 24 * 365}`
    }
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
      <ThemeSync />
    </NextThemesProvider>
  )
}
