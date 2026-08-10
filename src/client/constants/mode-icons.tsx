import type { TransportMode } from '@shared/types/index'

/** Libellés FR des modes de transport — source unique, ne pas redéclarer par
 * composant (`ModeChip`, `ModeBreakdownTable`, `JourneyPanel` partageaient trois
 * copies quasi identiques). */
export const MODE_LABELS: Record<TransportMode, string> = {
  walk: 'Marche',
  bike: 'Vélo',
  tramway: 'Tramway',
  bus: 'Bus',
  scooter: 'Trottinette',
  navibus: 'Navibus',
  train: 'Train',
}

/** Nom du token `--color-mode-*` pour ce mode — "tramway" correspond au token
 * historique `--color-mode-tram` (index.css), pas de token `-tramway`. */
export function modeColorToken(mode: TransportMode): string {
  return mode === 'tramway' ? 'tram' : mode
}

/** `var(--color-mode-*)` — à utiliser dans un contexte CSS réel (prop `style`
 * React, règle de feuille de style). Ne pas passer à un attribut de
 * présentation SVG posé via `setAttribute` (ex. `pathOptions.color` Leaflet) :
 * la substitution `var()` n'y est pas fiable — pour ces cas, voir
 * `modeRouteClassName()` ci-dessous. */
export function modeColorVar(mode: TransportMode): string {
  return `var(--color-mode-${modeColorToken(mode)})`
}

/** `modeColorVar()` atténuée à `percent` % d'opacité via `color-mix()` — le
 * halo derrière l'icône de segment actif/inactif. `color-mix()` s'applique à
 * n'importe quelle couleur y compris une `var()`, contrairement à
 * l'ancienne astuce "concaténer un suffixe hex d'alpha" qui exigeait une
 * valeur hex fixe. */
export function modeColorVarAlpha(mode: TransportMode, percent: number): string {
  return `color-mix(in srgb, ${modeColorVar(mode)} ${percent}%, transparent)`
}

/** Classe CSS `.route-*` (définie dans index.css, § Leaflet) posant `stroke:
 * var(--color-mode-*)` — pour les tracés Leaflet (`Polyline`/`CircleMarker`,
 * `pathOptions.className`) : contrairement à `pathOptions.color`, une classe
 * CSS réelle passe par la cascade et résout `var()` correctement, donc suit
 * le thème clair/sombre sans détection JS. */
export function modeRouteClassName(mode: TransportMode): string {
  return `route-${modeColorToken(mode)}`
}

/** Icônes du set Estuaire (viewBox 0 0 24 24, stroke-width 1.9) — source de vérité :
 * `1a Estuaire - Palette.dc.html` (tableau "Couleurs par mode de transport"), tous
 * modes confondus y compris scooter et train. */
export const MODE_ICON_PATH_BASE: Record<TransportMode, React.ReactNode> = {
  walk: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v5l-3 3 1 5M12 11l3 3v5" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M9 17h5l-2-7 3-2M13 8h3" />
    </>
  ),
  tramway: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 11h14M8 21l2-4M16 21l-2-4M3 21h18" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 12h16M7.5 20v-3M16.5 20v-3" />
    </>
  ),
  navibus: (
    <path d="M3.5 16l1.5-5h14l1.5 5M6.5 11V7h11v4M3.5 20c1.4 0 2.4-1 3.8-1s2.4 1 3.8 1 2.4-1 3.8-1 2.4 1 3.8 1" />
  ),
  scooter: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 18h8l2-11h2M14 7h-3" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 10h14M9 16h6M9 20l-2 2M15 20l2 2" />
    </>
  ),
}
