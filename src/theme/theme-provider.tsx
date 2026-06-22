import { createContext, useContext, useEffect, useState } from 'react'
import type { ColorThemeId } from './color-themes'

type Theme = 'dark' | 'light' | 'gray' | 'system'

export type OverlayColor = 'green' | 'magenta' | 'blue' | 'cyan'

export const OVERLAY_COLORS: {
  id: OverlayColor
  label: string
  description: string
  hex: string
}[] = [
  { id: 'green',   label: 'Verde',   description: 'Mais comum — Green Screen', hex: '#00FF00' },
  { id: 'magenta', label: 'Magenta', description: 'Alternativa popular',        hex: '#FF00FF' },
  { id: 'blue',    label: 'Azul',    description: 'Blue Screen clássico',       hex: '#0000FF' },
  { id: 'cyan',    label: 'Ciano',   description: 'Variação de tela verde',     hex: '#00FFFF' },
]

const COLOR_CLASS_PREFIX = 'theme-'
const ALL_COLOR_CLASSES = [
  'theme-sky',
  'theme-emerald',
  'theme-violet',
  'theme-rose',
  'theme-amber',
  'theme-slate',
]

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorTheme: ColorThemeId
  setColorTheme: (color: ColorThemeId) => void
  overlayColor: OverlayColor
  setOverlayColor: (color: OverlayColor) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'system',
  setTheme: () => null,
  colorTheme: 'sky',
  setColorTheme: () => null,
  overlayColor: 'green',
  setOverlayColor: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'scoreboard-bt-theme',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(
    () => (localStorage.getItem('scoreboard-bt-color') as ColorThemeId) || 'sky'
  )

  const [overlayColor, setOverlayColorState] = useState<OverlayColor>(
    () => (localStorage.getItem('scoreboard-bt-overlay') as OverlayColor) || 'green'
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark', 'gray')

    if (theme === 'gray') {
      root.classList.add('gray')
    } else {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme
      root.classList.add(resolved)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove(...ALL_COLOR_CLASSES)
    root.classList.add(`${COLOR_CLASS_PREFIX}${colorTheme}`)
  }, [colorTheme])

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme: (t: Theme) => {
          localStorage.setItem(storageKey, t)
          setThemeState(t)
        },
        colorTheme,
        setColorTheme: (c: ColorThemeId) => {
          localStorage.setItem('scoreboard-bt-color', c)
          setColorThemeState(c)
        },
        overlayColor,
        setOverlayColor: (c: OverlayColor) => {
          localStorage.setItem('scoreboard-bt-overlay', c)
          setOverlayColorState(c)
        },
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeProviderContext)
  if (ctx === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
