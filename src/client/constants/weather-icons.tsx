import type { WeatherCondition } from '@shared/types/index'

/** Icônes météo du set Estuaire (viewBox 0 0 24 24, stroke-width 1.9, extrémités/
 * jonctions arrondies) — remplacent les emoji fonctionnels (☀️☁️🌧️❄️⛈️), interdits
 * par SKILL.md § Interdictions formelles ("aucun emoji comme icône fonctionnelle"). */
export const WEATHER_ICON_PATH_BASE: Record<WeatherCondition['condition'], React.ReactNode> = {
  clear: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </>
  ),
  clouds: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
  rain: (
    <>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      <path d="M16 13v8M8 13v8M12 15v8" />
    </>
  ),
  snow: (
    <>
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
      <path d="M8 16v.01M8 20v.01M12 18v.01M12 22v.01M16 16v.01M16 20v.01" />
    </>
  ),
  thunderstorm: (
    <>
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
      <path d="M13 11l-4 6h4l-2 6" />
    </>
  ),
}
