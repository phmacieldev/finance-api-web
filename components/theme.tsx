'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('financeiro_theme') as Theme | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored ?? (systemDark ? 'dark' : 'light')
    apply(initial)
  }, [])

  function apply(t: Theme) {
    setTheme(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    localStorage.setItem('financeiro_theme', t)
  }

  function toggleTheme() {
    apply(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
