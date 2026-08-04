import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeOption {
  key: ThemeMode
  label: string
  icon: string
}

export const themeOptions: ThemeOption[] = [
  { key: 'light', label: 'Enterprise Light', icon: '☀' },
  { key: 'dark', label: 'Enterprise Dark', icon: '🌙' },
]

const STORAGE_KEY = 'smartserve-theme'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  isDark: boolean
  compactMode: boolean
  setCompactMode: (value: boolean) => void
  highContrast: boolean
  setHighContrast: (value: boolean) => void
  animationsEnabled: boolean
  setAnimationsEnabled: (value: boolean) => void
  themes: ThemeOption[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') {
        return stored
      }
    }
    return 'light'
  })

  const [compactMode, setCompactModeState] = useState(false)
  const [highContrast, setHighContrastState] = useState(false)
  const [animationsEnabled, setAnimationsEnabledState] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.compactMode = compactMode ? 'true' : 'false'
    document.documentElement.dataset.highContrast = highContrast ? 'true' : 'false'
    document.documentElement.dataset.animationsEnabled = animationsEnabled ? 'true' : 'false'
  }, [compactMode, highContrast, animationsEnabled])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme,
      isDark: theme === 'dark',
      compactMode,
      setCompactMode: setCompactModeState,
      highContrast,
      setHighContrast: setHighContrastState,
      animationsEnabled,
      setAnimationsEnabled: setAnimationsEnabledState,
      themes: themeOptions,
    }),
    [theme, compactMode, highContrast, animationsEnabled]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
