export const COLOR_THEMES = [
  {
    id: 'sky',
    label: 'Sky',
    description: 'Azul padrão',
    lightColor: '#0ea5e9',
    darkColor: '#38bdf8',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    description: 'Verde esmeralda',
    lightColor: '#10b981',
    darkColor: '#34d399',
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Roxo intenso',
    lightColor: '#7c3aed',
    darkColor: '#a78bfa',
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Rosa vibrante',
    lightColor: '#e11d48',
    darkColor: '#fb7185',
  },
  {
    id: 'amber',
    label: 'Amber',
    description: 'Âmbar quente',
    lightColor: '#d97706',
    darkColor: '#fbbf24',
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Cinza neutro',
    lightColor: '#475569',
    darkColor: '#94a3b8',
  },
] as const

export type ColorThemeId = (typeof COLOR_THEMES)[number]['id']
