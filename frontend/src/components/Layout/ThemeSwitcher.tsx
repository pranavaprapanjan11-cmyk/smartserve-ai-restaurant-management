import React, { useState, useRef, useEffect } from 'react'
import { useTheme, themeOptions } from '../../context/ThemeContext'

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle theme mode"
        title={`Current Theme: ${isDark ? 'Enterprise Dark' : 'Enterprise Light'}`}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition hover:bg-[var(--card-hover-bg)]"
      >
        <span className="text-sm">{isDark ? '🌙' : '☀'}</span>
        <span className="hidden md:inline font-bold">
          {isDark ? 'Dark' : 'Light'}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1.5 shadow-xl">
          <div className="px-2 py-1 border-b border-[var(--card-border)] mb-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Appearance
            </p>
          </div>
          <div className="space-y-0.5">
            {themeOptions.map((option) => {
              const active = option.key === theme
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setTheme(option.key)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#0F6B4B] text-white shadow-xs'
                      : 'text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                  {active && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
