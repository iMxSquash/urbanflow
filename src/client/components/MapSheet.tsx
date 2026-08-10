import { useEffect, useId, useRef, useState } from 'react'
import type {
  Coordinates,
  Journey,
  TransportMode,
  UserPreference,
  WeatherCondition,
} from '@shared/types/index'
import { TRANSPORT_MODES, USER_PREFERENCES } from '@shared/types/index'
import { useAddressAutocomplete } from '../hooks/use-address-autocomplete'
import { useMediaQuery } from '../hooks/use-media-query'
import { AddressSearch } from './AddressSearch'
import { AddressSuggestionsList } from './AddressSuggestionsList'
import { Co2FactorsNote } from './Co2FactorsNote'
import { DatetimePicker } from './DatetimePicker'
import { EmptyResultsPanel } from './EmptyResultsPanel'
import { IconButton } from './IconButton'
import { JourneyPanel, type JourneyTrackingPhase } from './JourneyPanel'
import { JourneyResults } from './JourneyResults'
import { ModeChip } from './ModeChip'
import { Slider } from './Slider'
import { Spinner } from './Spinner'
import { Toggle } from './Toggle'

// ── État du sheet — MAQUETTE.md §5.2 (8 états, le 8e — fin de trajet — est une
// modale gérée séparément par MapPage via JourneySummaryModal) ──────────────

export type SheetState =
  | 'collapsed'
  | 'search'
  | 'mid'
  | 'settings'
  | 'results'
  | 'detail'
  | 'tracking'

export interface SearchOptions {
  preference: UserPreference
  modes: TransportMode[]
  maxWalkMinutes: number
  pmrAccessibility: boolean
  avoidElevation: boolean
  datetime: Date
  datetimeType: 'departure' | 'arrival'
}

interface MapSheetProps {
  state: SheetState
  onStateChange: (s: SheetState) => void

  fromLabel: string | null
  fromCoords: Coordinates | null
  toLabel: string | null
  hasFrom: boolean
  onFromSelect: (c: Coordinates, label: string) => void
  onToSelect: (c: Coordinates, label: string) => void
  onSwap: () => void
  onCancelSearch: () => void
  /** Reporte le rétrécissement manuel mobile au parent — `MapPage` en a besoin
   * pour savoir quand réafficher la nav (MIGRATION-TODO.md étape 6, visible
   * en `collapsed`/`mid` et donc aussi quand le sheet est réduit à une bande). */
  onMobileMinimizedChange?: (minimized: boolean) => void

  options: SearchOptions
  defaultOptions: SearchOptions
  onOptionsChange: (o: SearchOptions) => void

  journeys: Journey[]
  journeyLoading: boolean
  journeyError: string | null

  selectedJourney: Journey | null
  onSelectJourney: (j: Journey) => void
  onClosePanel: () => void

  activeSegmentIdx: number | null
  onSegmentSelect: (i: number | null) => void

  trackingPhase: JourneyTrackingPhase
  weather?: WeatherCondition | null
  onDepartClick: () => void
  onEndTrip: () => void
}

const PREFERENCE_META: Record<UserPreference, { label: string; icon: React.ReactNode }> = {
  eco: {
    label: 'Éco',
    icon: <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />,
  },
  fast: {
    label: 'Rapide',
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  },
  balanced: {
    label: 'Équilibré',
    icon: <path d="M12 3v18M4 8h16M4 16h16" />,
  },
}

// Inverse départ/arrivée — Direction Estuaire (icône + gabarit identiques en
// mobile et desktop, cf. MAQUETTE.md §5.2 état 2 "inverser").
function SwapDirectionButton({ onSwap }: { onSwap: () => void }) {
  return (
    <IconButton
      icon={
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4v14l-3-3M17 20V6l3 3" />
        </svg>
      }
      aria-label="Inverser départ et arrivée"
      onClick={onSwap}
      className="self-center shrink-0"
    />
  )
}

// ── Sous-vues ────────────────────────────────────────────────────────────────

function PreferenceRadioGroup({
  value,
  onChange,
}: {
  value: UserPreference
  onChange: (p: UserPreference) => void
}) {
  return (
    <div role="radiogroup" aria-label="Profil de trajet" className="flex gap-2">
      {USER_PREFERENCES.map((pref) => {
        const meta = PREFERENCE_META[pref]
        const selected = value === pref
        return (
          <button
            key={pref}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(pref)}
            className={[
              'flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-label font-semibold border transition-colors duration-fast',
              selected
                ? 'bg-primary-surface border-primary text-primary'
                : 'bg-surface border-border text-text-muted',
            ].join(' ')}
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {meta.icon}
            </svg>
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}

function CollapsedView({
  onOpenSearch,
  preference,
  onPreferenceChange,
}: {
  onOpenSearch: () => void
  preference: UserPreference
  onPreferenceChange: (p: UserPreference) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onOpenSearch}
        className="input justify-between text-left text-text-subtle"
      >
        <span className="flex items-center gap-3">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4.5-4.5" />
          </svg>
          Où allez-vous ?
        </span>
        <span className="chip-mode" data-size="sm">
          Autour de moi
        </span>
      </button>
      <PreferenceRadioGroup value={preference} onChange={onPreferenceChange} />
    </div>
  )
}

// Champ départ/arrivée du sheet mobile — input nu (pas de popover) : les
// suggestions du champ actif s'affichent dans la zone partagée sous la ligne
// des deux champs (MIGRATION-TODO.md étape 6 : "pas en popup, directement
// dans la partie vide sous les inputs").
function SearchField({
  id,
  listId,
  label,
  placeholder,
  active,
  auto,
  onFocus,
  onBlur,
  onEscape,
}: {
  id: string
  listId: string
  label: string
  placeholder: string
  active: boolean
  auto: ReturnType<typeof useAddressAutocomplete>
  onFocus: () => void
  onBlur: () => void
  onEscape: () => void
}) {
  return (
    <div className="relative flex items-center">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className="absolute left-3 text-text-subtle pointer-events-none" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10 10 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={active}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          active && auto.activeIndex >= 0 ? `${listId}-option-${auto.activeIndex}` : undefined
        }
        value={auto.query}
        onChange={(e) => auto.setQuery(e.target.value)}
        onKeyDown={(e) => auto.handleKeyDown(e, { onEscape })}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="input pl-9 bg-surface shadow-card-md"
      />
      {auto.loading && (
        <span className="absolute right-3 pointer-events-none" aria-label="Recherche en cours">
          <Spinner />
        </span>
      )}
    </div>
  )
}

function SearchView({
  fromLabel,
  fromCoords,
  toLabel,
  onFromSelect,
  onToSelect,
  onSwap,
  onBack,
}: {
  fromLabel: string | null
  fromCoords: Coordinates | null
  toLabel: string | null
  onFromSelect: (c: Coordinates, label: string) => void
  onToSelect: (c: Coordinates, label: string) => void
  onSwap: () => void
  onBack: () => void
}) {
  const fromId = useId()
  const fromListId = useId()
  const toId = useId()
  const toListId = useId()
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null)

  const fromAuto = useAddressAutocomplete(onFromSelect, undefined, fromLabel ?? '')
  const toAuto = useAddressAutocomplete(onToSelect, fromCoords, toLabel ?? '')

  function focusField(field: 'from' | 'to', auto: ReturnType<typeof useAddressAutocomplete>) {
    auto.refreshRecents()
    setActiveField(field)
  }

  function blurField(field: 'from' | 'to') {
    setTimeout(() => setActiveField((f) => (f === field ? null : f)), 150)
  }

  const activeAuto = activeField === 'from' ? fromAuto : activeField === 'to' ? toAuto : null

  // `onSwap` (prop) échange les coordonnées/labels côté `MapPage`, mais les
  // champs affichés ici lisent l'état local de chaque hook (`fromAuto.query`/
  // `toAuto.query`), pas les props `fromLabel`/`toLabel` (seulement utilisées
  // comme valeur initiale au montage) — sans ce échange local explicite, le
  // texte visible dans les deux champs ne bougeait pas au clic. Les valeurs
  // à écrire sont lues dans les props *avant* l'appel à `onSwap`, seule
  // source fiable (le hook local peut être vide si l'adresse a été résolue
  // après le montage, ex. géolocalisation asynchrone).
  function handleSwap() {
    fromAuto.setQuietQuery(toLabel ?? '')
    toAuto.setQuietQuery(fromLabel ?? '')
    onSwap()
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Annuler la saisie"
          className="btn-icon size-10"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-h3 font-bold text-text">Où allez-vous ?</span>
      </div>

      <div className="flex gap-2.5 items-stretch">
        <div className="flex-1 flex flex-col gap-1.5">
          <SearchField
            id={fromId}
            listId={fromListId}
            label="Adresse de départ"
            placeholder={fromLabel ?? 'Départ — ex : Ma position, Commerce...'}
            active={activeField === 'from'}
            auto={fromAuto}
            onFocus={() => focusField('from', fromAuto)}
            onBlur={() => blurField('from')}
            onEscape={() => setActiveField(null)}
          />
          <SearchField
            id={toId}
            listId={toListId}
            label="Adresse d'arrivée"
            placeholder="Arrivée"
            active={activeField === 'to'}
            auto={toAuto}
            onFocus={() => focusField('to', toAuto)}
            onBlur={() => blurField('to')}
            onEscape={() => setActiveField(null)}
          />
        </div>
        <SwapDirectionButton onSwap={handleSwap} />
      </div>

      {activeAuto && (
        <AddressSuggestionsList
          listId={activeField === 'from' ? fromListId : toListId}
          query={activeAuto.query}
          results={activeAuto.results}
          activeIndex={activeAuto.activeIndex}
          recents={activeAuto.recents}
          originCoords={activeField === 'to' ? fromCoords : undefined}
          onSelectResult={(r) => {
            activeAuto.selectResult(r)
            setActiveField(null)
          }}
          onSelectRecent={(r) => {
            activeAuto.selectRecent(r)
            setActiveField(null)
          }}
          className="flex-1 min-h-0 overflow-y-auto"
        />
      )}

      <p className="text-caption text-text-subtle mt-auto pt-2">
        ↑↓ pour parcourir · Entrée pour choisir · Échap pour revenir à la carte
        {toLabel && ' · '}
        {toLabel}
      </p>
    </div>
  )
}

// Vue minimisée mobile — indépendante de `SheetState` (peu importe l'étape en
// cours) : ne montre que la barre de recherche, sans les chips de profil ni
// le contenu de l'état courant (MIGRATION-TODO.md étape 6). Avant une
// recherche, invite générique ; après, résumé départ → arrivée, tap pour
// restaurer le sheet à sa taille précédente.
function MinimizedSearchBar({
  fromLabel,
  toLabel,
  onRestore,
}: {
  fromLabel: string | null
  toLabel: string | null
  onRestore: () => void
}) {
  const hasRoute = !!toLabel

  return (
    <button
      type="button"
      onClick={onRestore}
      aria-label="Agrandir le panneau de recherche"
      className="input justify-between text-left text-text-subtle"
    >
      <span className="flex items-center gap-3 min-w-0">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        <span className="truncate">
          {hasRoute ? (
            <span className="text-text font-medium">
              {fromLabel ?? 'Ma position'} → {toLabel}
            </span>
          ) : (
            'Où allez-vous ?'
          )}
        </span>
      </span>
    </button>
  )
}

// Bande minimisée dédiée à `tracking` — contrairement à `MinimizedSearchBar`
// (route + tap pour restaurer), le bouton "Terminer" doit rester actionnable
// sans réagrandir le panneau, donc deux boutons distincts plutôt qu'un seul
// bouton englobant (imbriquer un <button> dans un <button> est invalide).
function MinimizedTrackingBar({
  onRestore,
  onEndTrip,
}: {
  onRestore: () => void
  onEndTrip: () => void
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        type="button"
        onClick={onRestore}
        aria-label="Agrandir le suivi du trajet"
        className="flex-1 min-w-0 flex items-center gap-2 h-12 px-4 rounded-md border border-transit-100 bg-transit-50 text-left transition-colors duration-normal ease-ui hover:bg-transit-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      >
        {/* Marqueur statique — jamais de pulsation en boucle continue (règle Estuaire) */}
        <span aria-hidden="true" className="shrink-0 w-2 h-2 rounded-full bg-transit-500" />
        <span className="text-caption font-medium text-transit-700 truncate">Suivi GPS actif</span>
      </button>
      <button
        type="button"
        onClick={onEndTrip}
        aria-label="Terminer le trajet"
        className="shrink-0 h-12 px-3 flex items-center gap-1.5 rounded-md border border-border-strong text-text hover:bg-surface-muted transition-colors duration-normal ease-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        <span className="text-caption font-medium whitespace-nowrap">Terminer</span>
      </button>
    </div>
  )
}

function ModeChipsFieldset({
  modes,
  onChange,
}: {
  modes: TransportMode[]
  onChange: (modes: TransportMode[]) => void
}) {
  function toggle(mode: TransportMode) {
    if (modes.includes(mode)) {
      if (modes.length === 1) return
      onChange(modes.filter((m) => m !== mode))
    } else {
      onChange([...modes, mode])
    }
  }

  return (
    <fieldset className="m-0 p-0 border-0 min-w-0 w-full flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none *:shrink-0">
      <legend className="sr-only">Modes de transport autorisés pour ce trajet</legend>
      {TRANSPORT_MODES.map((mode) => (
        <ModeChip
          key={mode}
          mode={mode}
          selected={modes.includes(mode)}
          onClick={() => toggle(mode)}
        />
      ))}
    </fieldset>
  )
}

// Résumé départ/arrivée en tête de la mi-hauteur — MAQUETTE.md §5.2 état 3
// "A→B renseigné" (rangées résolues, pas des champs de saisie live : l'objet
// est de pouvoir corriger sans redescendre en `collapsed`, pas de refaire
// tourner l'autocomplete ici). Tap sur une adresse → réouvre `search`.
function MidAddressRow({
  fromLabel,
  toLabel,
  onSwap,
  onEditAddresses,
}: {
  fromLabel: string | null
  toLabel: string | null
  onSwap: () => void
  onEditAddresses: () => void
}) {
  return (
    <div className="flex gap-2.5 items-stretch">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onEditAddresses}
          aria-label={`Modifier l'adresse de départ, actuellement ${fromLabel ?? 'Ma position'}`}
          className="flex items-center gap-2.5 h-11.5 px-3 rounded-md bg-surface-sunken text-left"
        >
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
          <span className="flex-1 min-w-0 truncate text-body-sm font-medium text-text">
            {fromLabel ?? 'Ma position'}
          </span>
        </button>
        <button
          type="button"
          onClick={onEditAddresses}
          aria-label={`Modifier l'adresse d'arrivée, actuellement ${toLabel ?? ''}`}
          className="flex items-center gap-2.5 h-11.5 px-3 rounded-md bg-surface border border-text text-left"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-text shrink-0"
          >
            <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12z" />
          </svg>
          <span className="flex-1 min-w-0 truncate text-body-sm font-semibold text-text">
            {toLabel}
          </span>
        </button>
      </div>
      <SwapDirectionButton onSwap={onSwap} />
    </div>
  )
}

function MidView({
  fromLabel,
  toLabel,
  onSwap,
  onEditAddresses,
  options,
  onOptionsChange,
  journeys,
  journeyLoading,
  journeyError,
  onOpenSettings,
  onViewResults,
}: {
  fromLabel: string | null
  toLabel: string | null
  onSwap: () => void
  onEditAddresses: () => void
  options: SearchOptions
  onOptionsChange: (o: SearchOptions) => void
  journeys: Journey[]
  journeyLoading: boolean
  journeyError: string | null
  onOpenSettings: () => void
  onViewResults: () => void
}) {
  const count = journeys.length
  const summary = journeyLoading
    ? 'Calcul en cours…'
    : journeyError
      ? journeyError
      : `${count} itinéraire${count > 1 ? 's' : ''} · calcul déterministe`

  return (
    <div className="flex flex-col gap-3">
      <MidAddressRow
        fromLabel={fromLabel}
        toLabel={toLabel}
        onSwap={onSwap}
        onEditAddresses={onEditAddresses}
      />
      <ModeChipsFieldset
        modes={options.modes}
        onChange={(modes) => onOptionsChange({ ...options, modes })}
      />
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center justify-between gap-2 text-body-sm text-text-muted px-1 py-2"
      >
        <span className="min-w-0 truncate text-left">
          {options.datetimeType === 'departure' ? 'Partir maintenant' : 'Arriver avant'} ·{' '}
          {options.maxWalkMinutes} min de marche
          {options.pmrAccessibility && ' · PMR'}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {!journeyLoading && journeyError && count === 0 ? (
        <EmptyResultsPanel
          time={options.datetime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          options={options}
          onOptionsChange={onOptionsChange}
          onOpenSettings={onOpenSettings}
        />
      ) : (
        <button
          type="button"
          onClick={onViewResults}
          disabled={journeyLoading || count === 0}
          className="btn-secondary w-full justify-between"
        >
          <span aria-live="polite" className="min-w-0 truncate text-left">
            {summary}
          </span>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Champs communs à SettingsView (mobile, dépliant) et DesktopPanel (toujours
// visible, "en ligne d'outils" — MAQUETTE.md §5.2 desktop).
function SettingsFields({
  options,
  onOptionsChange,
}: {
  options: SearchOptions
  onOptionsChange: (o: SearchOptions) => void
}) {
  const pmrId = useId()
  const elevationId = useId()

  return (
    <>
      <DatetimePicker
        datetime={options.datetime}
        type={options.datetimeType}
        onDatetimeChange={(datetime) => onOptionsChange({ ...options, datetime })}
        onTypeChange={(datetimeType) => onOptionsChange({ ...options, datetimeType })}
      />

      <Toggle
        id={pmrId}
        checked={options.pmrAccessibility}
        onChange={(pmrAccessibility) => onOptionsChange({ ...options, pmrAccessibility })}
        label="Trajet accessible (PMR)"
        description={
          options.pmrAccessibility
            ? `Marche ≤ ${Math.min(options.maxWalkMinutes, 5)} min · segments vélo écartés`
            : 'Réduit la marche max à 5 min et écarte les segments vélo'
        }
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="max-walk-sheet" className="text-body-sm font-medium text-text">
            Marche maximum
          </label>
          <span className="text-body-sm font-semibold text-primary tabular-nums">
            {options.maxWalkMinutes} min
          </span>
        </div>
        <Slider
          id="max-walk-sheet"
          min={5}
          max={25}
          step={5}
          value={options.maxWalkMinutes}
          onChange={(maxWalkMinutes) => onOptionsChange({ ...options, maxWalkMinutes })}
          ariaValueText={`${options.maxWalkMinutes} minutes`}
        />
      </div>

      <Toggle
        id={elevationId}
        checked={options.avoidElevation}
        onChange={(avoidElevation) => onOptionsChange({ ...options, avoidElevation })}
        label="Éviter le dénivelé"
        description="Pénalise les itinéraires à vélo (approximation — pas de données d'altimétrie réelles)"
      />
    </>
  )
}

function SettingsView({
  options,
  onOptionsChange,
  onApply,
  onReset,
  onCollapse,
}: {
  options: SearchOptions
  onOptionsChange: (o: SearchOptions) => void
  onApply: () => void
  onReset: () => void
  onCollapse: () => void
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <span className="text-h3 font-bold text-text">Réglages avancés</span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Replier les réglages avancés"
          className="btn-icon size-9"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
      </div>

      <SettingsFields options={options} onOptionsChange={onOptionsChange} />

      <div className="mt-auto pt-3 border-t border-border flex gap-3">
        <button type="button" onClick={onReset} className="btn-secondary flex-1 justify-center">
          Réinitialiser
        </button>
        <button type="button" onClick={onApply} className="btn-primary flex-1 justify-center">
          Appliquer
        </button>
      </div>
    </div>
  )
}

// ── Panneau desktop (≥1024px) ───────────────────────────────────────────────
// MAQUETTE.md §5.2 "Desktop" : les états 2 à 6 (saisie/mi-hauteur/réglages/
// résultats/détail) deviennent des sections empilées dans le même panneau,
// sans overlay ni divulgation progressive — recherche, profil, modes et
// réglages avancés toujours visibles, résultats/détail juste en dessous.
// Seul l'état 7 (suivi actif) reste exclusif : pas de recherche affichée
// pendant un trajet en cours.
function DesktopPanel({
  state,
  fromLabel,
  toLabel,
  onFromSelect,
  onToSelect,
  onSwap,
  options,
  onOptionsChange,
  journeys,
  journeyLoading,
  journeyError,
  selectedJourney,
  onSelectJourney,
  onClosePanel,
  activeSegmentIdx,
  onSegmentSelect,
  trackingPhase,
  weather,
  onDepartClick,
  onEndTrip,
}: {
  state: SheetState
  fromLabel: string | null
  toLabel: string | null
  onFromSelect: (c: Coordinates, label: string) => void
  onToSelect: (c: Coordinates, label: string) => void
  onSwap: () => void
  options: SearchOptions
  onOptionsChange: (o: SearchOptions) => void
  journeys: Journey[]
  journeyLoading: boolean
  journeyError: string | null
  selectedJourney: Journey | null
  onSelectJourney: (j: Journey) => void
  onClosePanel: () => void
  activeSegmentIdx: number | null
  onSegmentSelect: (i: number | null) => void
  trackingPhase: JourneyTrackingPhase
  weather?: WeatherCondition | null
  onDepartClick: () => void
  onEndTrip: () => void
}) {
  const isTracking = state === 'tracking'
  // Réglages avancés repliés par défaut (MAQUETTE.md §4 "divulgation
  // progressive" + §5.2 desktop "en barre d'outils en ligne") — jamais
  // dépliés d'office, quel que soit l'état.
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Formulaire de recherche réduit à un résumé dès qu'il y a un résultat à
  // montrer, pour laisser la hauteur au panneau résultats (`flex-1` plus
  // bas) — sinon recherche + profil + modes + réglages remplissent le
  // panneau et un seul itinéraire n'y tient même pas en entier. `editingForm`
  // permet de rouvrir le formulaire complet à la demande ("Modifier").
  const [editingForm, setEditingForm] = useState(false)
  const hasResults = journeys.length > 0 || selectedJourney !== null
  const formCompact = hasResults && !editingForm

  // Un nouveau calcul en cours équivaut à une nouvelle recherche : on referme
  // le formulaire déplié manuellement pour revenir au résumé compact une
  // fois le résultat prêt. Ajusté pendant le rendu (pas un effect) suivant le
  // pattern React officiel de reset d'état dérivé d'une prop.
  const [prevJourneyLoading, setPrevJourneyLoading] = useState(journeyLoading)
  if (journeyLoading !== prevJourneyLoading) {
    setPrevJourneyLoading(journeyLoading)
    if (journeyLoading) setEditingForm(false)
  }

  function handleSelectJourney(journey: Journey) {
    setEditingForm(false)
    onSelectJourney(journey)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {!isTracking &&
        (formCompact ? (
          <DesktopFormSummary
            fromLabel={fromLabel}
            toLabel={toLabel}
            options={options}
            onEdit={() => setEditingForm(true)}
          />
        ) : (
          <>
            <span className="text-h3 font-bold text-text">Itinéraire</span>

            <div className="flex gap-2.5 items-stretch">
              <div className="flex-1 flex flex-col gap-1.5">
                <AddressSearch
                  label="Adresse de départ"
                  onSelect={onFromSelect}
                  placeholder={fromLabel ?? 'Départ — ex : Ma position, Commerce...'}
                />
                <AddressSearch
                  label="Adresse d'arrivée"
                  onSelect={onToSelect}
                  placeholder={toLabel ?? 'Arrivée'}
                />
              </div>
              <SwapDirectionButton onSwap={onSwap} />
            </div>

            <PreferenceRadioGroup
              value={options.preference}
              onChange={(preference) => onOptionsChange({ ...options, preference })}
            />

            <ModeChipsFieldset
              modes={options.modes}
              onChange={(modes) => onOptionsChange({ ...options, modes })}
            />

            <div>
              <button
                type="button"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-expanded={settingsOpen}
                className="flex items-center justify-between gap-2 w-full h-10 px-3 rounded-button border border-border bg-surface-muted text-body-sm font-medium text-text-muted hover:bg-surface-sunken transition-colors duration-fast"
              >
                <span className="flex items-center gap-2">
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Réglages avancés
                </span>
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={settingsOpen ? 'rotate-180' : ''}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {settingsOpen && (
                <div className="flex flex-col gap-3 p-3 mt-2 rounded-xl border border-border bg-surface-muted">
                  <SettingsFields options={options} onOptionsChange={onOptionsChange} />
                </div>
              )}
            </div>
          </>
        ))}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {selectedJourney ? (
          <JourneyPanel
            journey={selectedJourney}
            onClose={onClosePanel}
            onDepartClick={onDepartClick}
            onEndTrip={onEndTrip}
            trackingPhase={trackingPhase}
            weather={weather}
            activeSegmentIdx={activeSegmentIdx}
            onSegmentSelect={onSegmentSelect}
          />
        ) : journeyLoading ? (
          <p className="text-body-sm text-text-muted text-center py-6" aria-live="polite">
            Calcul en cours…
          </p>
        ) : journeyError && journeys.length === 0 ? (
          <EmptyResultsPanel
            time={options.datetime.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            options={options}
            onOptionsChange={onOptionsChange}
          />
        ) : journeys.length > 0 ? (
          <JourneyResults journeys={journeys} onSelect={handleSelectJourney} />
        ) : null}
      </div>

      {!isTracking && <Co2FactorsNote className="pt-3 border-t border-border" />}
    </div>
  )
}

// Résumé compact du formulaire de recherche (desktop) — remplace
// adresses+profil+modes+réglages une fois qu'il y a un résultat à montrer,
// pour rendre au panneau résultats la hauteur qu'ils occupaient (MAQUETTE.md
// §4 "divulgation progressive"). "Modifier" redéploie le formulaire complet.
function DesktopFormSummary({
  fromLabel,
  toLabel,
  options,
  onEdit,
}: {
  fromLabel: string | null
  toLabel: string | null
  options: SearchOptions
  onEdit: () => void
}) {
  const time = options.datetime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface-muted">
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-text truncate">
          {fromLabel ?? 'Ma position'} → {toLabel}
        </p>
        <p className="text-caption text-text-subtle truncate">
          {PREFERENCE_META[options.preference].label} ·{' '}
          {options.datetimeType === 'departure' ? 'Départ' : 'Arrivée'} {time}
          {options.pmrAccessibility && ' · PMR'}
        </p>
      </div>
      <button type="button" onClick={onEdit} className="btn-secondary shrink-0 h-9 px-3">
        Modifier
      </button>
    </div>
  )
}

// ── MapSheet ─────────────────────────────────────────────────────────────────

// Distance de swipe verticale (px) sur la poignée mobile avant de basculer
// le rétrécissement manuel (indépendant de l'état — voir `.bottom-sheet`
// `data-mobile-minimized` dans index.css).
const MINIMIZE_SWIPE_THRESHOLD_PX = 24

// Un cran en arrière — Échap replie le sheet d'un niveau (MAQUETTE.md §8).
// 'tracking' n'a pas de parent : un suivi actif ne se replie pas au clavier.
const PARENT_STATE: Partial<Record<SheetState, SheetState>> = {
  search: 'collapsed',
  mid: 'collapsed',
  settings: 'mid',
  results: 'mid',
  detail: 'results',
}

export function MapSheet(props: MapSheetProps) {
  const {
    state,
    onStateChange,
    fromLabel,
    fromCoords,
    toLabel,
    hasFrom,
    onFromSelect,
    onToSelect,
    onSwap,
    onCancelSearch,
    onMobileMinimizedChange,
    options,
    defaultOptions,
    onOptionsChange,
    journeys,
    journeyLoading,
    journeyError,
    selectedJourney,
    onSelectJourney,
    onClosePanel,
    activeSegmentIdx,
    onSegmentSelect,
    trackingPhase,
    weather,
    onDepartClick,
    onEndTrip,
  } = props

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isDialog = !isDesktop && state !== 'collapsed'

  // `search` est accessible depuis plusieurs états (`collapsed` en premier
  // contact, `mid` pour corriger une adresse déjà choisie) — contrairement
  // au reste de `PARENT_STATE` (une relation fixe, connue à l'avance), son
  // "retour" dépend de la navigation réelle de l'utilisateur. `lastStateRef`
  // retient l'état vu au rendu précédent (mis à jour en effet, jamais lu
  // pendant le rendu — la règle `react-hooks/refs` interdit de lire/écrire
  // un ref pendant le rendu) pour détecter la transition *vers* `search` et
  // capturer l'état d'où elle vient dans `stateBeforeSearchRef`, seul lu
  // plus tard dans des gestionnaires d'événements (swipe/tap/Échap/retour).
  const stateBeforeSearchRef = useRef<SheetState>('collapsed')
  const lastStateRef = useRef<SheetState>(state)

  useEffect(() => {
    if (state === 'search' && lastStateRef.current !== 'search') {
      stateBeforeSearchRef.current = lastStateRef.current
    }
    lastStateRef.current = state
  }, [state])

  // Point d'entrée unique pour "à quel état revenir depuis `from`" — `search`
  // lit la capture dynamique ci-dessus, tous les autres états lisent la
  // relation fixe `PARENT_STATE`. Les 4 déclencheurs de retour (Échap, tap
  // poignée, swipe poignée, chevron de `SearchView`) passent tous par cette
  // même fonction plutôt que de répéter chacun leur propre `state ===
  // 'search' ? ... : ...`.
  function backTarget(from: SheetState): SheetState | undefined {
    return from === 'search' ? stateBeforeSearchRef.current : PARENT_STATE[from]
  }

  useEffect(() => {
    if (isDesktop) return
    const parent = backTarget(state)
    if (!parent) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onStateChange(parent!)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state, onStateChange, isDesktop])

  // Réduction du panneau desktop et rétrécissement mobile — pur affichage,
  // indépendant de la machine à états du sheet (search/results/...). Un
  // changement d'état (nouvelle adresse, trajet sélectionné...) réaffiche
  // automatiquement le panneau : rien ne doit rester bloqué caché derrière un
  // rail réduit ou une bande minimisée. Ajusté pendant le rendu (pattern
  // React "adjusting state when a prop changes") plutôt qu'un useEffect,
  // pour éviter un rendu en cascade évitable.
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mobileMinimized, setMobileMinimized] = useState(false)

  // Reporté en effet (pas pendant le rendu) : muter un state du parent
  // pendant le rendu de cet enfant déclencherait l'avertissement React
  // "Cannot update a component while rendering a different component".
  useEffect(() => {
    onMobileMinimizedChange?.(mobileMinimized)
  }, [mobileMinimized, onMobileMinimizedChange])

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    setDesktopCollapsed(false)
    setMobileMinimized(false)
  }

  // Swipe vertical sur la poignée mobile — rétrécit/restaure indépendamment
  // de l'état, sans intercepter le tap simple (qui garde la navigation
  // agrandir/réduire existante entre états). `didSwipe` évite que le click
  // émis juste après le pointerup ne redéclenche aussi la navigation d'état.
  const swipeStartY = useRef<number | null>(null)
  const didSwipe = useRef(false)

  function handleSheetHandlePointerDown(e: React.PointerEvent) {
    swipeStartY.current = e.clientY
    didSwipe.current = false
  }

  function handleSheetHandlePointerMove(e: React.PointerEvent) {
    if (swipeStartY.current === null) return
    const delta = e.clientY - swipeStartY.current
    if (delta > MINIMIZE_SWIPE_THRESHOLD_PX && state !== 'collapsed') {
      didSwipe.current = true
      swipeStartY.current = null
      // Depuis `search`, minimiser revient à l'état d'où la saisie a été
      // ouverte (`collapsed` ou `mid` — cf. `backTarget`) plutôt que
      // d'empiler une bande minimisée par-dessus une saisie qui n'a rien de
      // commis à résumer.
      if (state === 'search') onStateChange(backTarget(state)!)
      else setMobileMinimized(true)
    } else if (delta < -MINIMIZE_SWIPE_THRESHOLD_PX) {
      didSwipe.current = true
      swipeStartY.current = null
      // Depuis `collapsed`/`mid`, tirer vers le haut ouvre directement la
      // saisie — `setMobileMinimized(false)` seul était un no-op dans ces
      // deux états (jamais minimisés, cf. garde `state !== 'collapsed'`
      // ci-dessus ; `mid` non plus puisqu'il ne passe jamais par ce chemin),
      // donc le geste n'avait visuellement aucun effet.
      if (state === 'collapsed' || state === 'mid') onStateChange('search')
      else setMobileMinimized(false)
    }
  }

  function handleSheetHandlePointerUp() {
    swipeStartY.current = null
  }

  // Desktop : panneau latéral permanent, `aside` + landmark plutôt qu'un
  // dialogue transitoire (MAQUETTE.md §5.2 "Panneau en aside + landmarks").
  const Wrapper = isDesktop ? 'aside' : 'div'

  return (
    <Wrapper
      className="bottom-sheet lg:relative"
      data-sheet-state={state}
      data-desktop-collapsed={isDesktop ? desktopCollapsed : undefined}
      data-mobile-minimized={!isDesktop ? mobileMinimized : undefined}
      role={isDialog ? 'dialog' : undefined}
      aria-label={
        isDesktop
          ? 'Recherche et résultats'
          : isDialog
            ? "Recherche et suivi d'itinéraire"
            : undefined
      }
    >
      {!isDesktop && (
        <div className="relative self-stretch shrink-0 -mx-4 -mt-2 px-4">
          <button
            type="button"
            onPointerDown={handleSheetHandlePointerDown}
            onPointerMove={handleSheetHandlePointerMove}
            onPointerUp={handleSheetHandlePointerUp}
            onPointerCancel={handleSheetHandlePointerUp}
            onClick={() => {
              if (didSwipe.current) {
                didSwipe.current = false
                return
              }
              if (mobileMinimized) {
                setMobileMinimized(false)
                return
              }
              if (state === 'collapsed') {
                onStateChange(hasFrom ? 'mid' : 'search')
                return
              }
              const parent = backTarget(state)
              // Pas de parent (`tracking`) : réduire le panneau au lieu de
              // ne rien faire — seul le rétrécissement manuel a un sens
              // pour un suivi actif, cf. `PARENT_STATE`.
              if (parent) onStateChange(parent)
              else setMobileMinimized(true)
            }}
            aria-label={
              mobileMinimized || state === 'collapsed'
                ? 'Agrandir le panneau'
                : 'Réduire le panneau'
            }
            className="w-full pt-2 pb-1.5 flex items-center justify-center touch-none"
          >
            <span className="bottom-sheet-handle" aria-hidden="true" />
          </button>

          {!mobileMinimized &&
            toLabel &&
            state !== 'results' &&
            state !== 'detail' &&
            state !== 'tracking' && (
              <button
                type="button"
                onClick={onCancelSearch}
                aria-label="Annuler la recherche"
                className="absolute top-1 right-3 w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-text hover:bg-surface-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            )}
        </div>
      )}

      {isDesktop && (
        <button
          type="button"
          onClick={() => setDesktopCollapsed((v) => !v)}
          aria-label={
            desktopCollapsed
              ? 'Agrandir le panneau de recherche'
              : 'Réduire le panneau de recherche'
          }
          aria-expanded={!desktopCollapsed}
          className="bottom-sheet-desktop-tab"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {desktopCollapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>
      )}

      {isDesktop && desktopCollapsed ? null : isDesktop ? (
        <DesktopPanel
          state={state}
          fromLabel={fromLabel}
          toLabel={toLabel}
          onFromSelect={onFromSelect}
          onToSelect={onToSelect}
          onSwap={onSwap}
          options={options}
          onOptionsChange={onOptionsChange}
          journeys={journeys}
          journeyLoading={journeyLoading}
          journeyError={journeyError}
          selectedJourney={selectedJourney}
          onSelectJourney={(j) => {
            onSelectJourney(j)
            onStateChange('detail')
          }}
          onClosePanel={onClosePanel}
          activeSegmentIdx={activeSegmentIdx}
          onSegmentSelect={onSegmentSelect}
          trackingPhase={trackingPhase}
          weather={weather}
          onDepartClick={onDepartClick}
          onEndTrip={onEndTrip}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* `key` force un vrai démontage/remontage à chaque changement d'état
           * ou de minimisation (au lieu d'un simple re-render de la branche déjà
           * montée) : c'est ce montage DOM qui relance `animate-sheet-grow` à
           * chaque fois, en CSS pur (`@keyframes`), sans mesure de hauteur ni
           * rejeu JS — cf. le commentaire sur `.bottom-sheet` dans index.css
           * pour pourquoi `top`/`bottom`/`max-height` seuls ne suffisent pas à
           * animer `collapsed`/`mid` (hauteur intrinsèque). */}
          <div
            key={mobileMinimized ? 'minimized' : state}
            className="h-full origin-bottom animate-sheet-grow"
          >
            {mobileMinimized ? (
              state === 'tracking' ? (
                <MinimizedTrackingBar
                  onRestore={() => setMobileMinimized(false)}
                  onEndTrip={onEndTrip}
                />
              ) : (
                <MinimizedSearchBar
                  fromLabel={fromLabel}
                  toLabel={toLabel}
                  onRestore={() => setMobileMinimized(false)}
                />
              )
            ) : (
              <>
                {state === 'collapsed' && (
                  <CollapsedView
                    onOpenSearch={() => onStateChange('search')}
                    preference={options.preference}
                    onPreferenceChange={(preference) => onOptionsChange({ ...options, preference })}
                  />
                )}

                {state === 'search' && (
                  <SearchView
                    fromLabel={fromLabel}
                    fromCoords={fromCoords}
                    toLabel={toLabel}
                    onFromSelect={onFromSelect}
                    onToSelect={(c, label) => {
                      onToSelect(c, label)
                      if (hasFrom) onStateChange('mid')
                    }}
                    onSwap={onSwap}
                    onBack={() => onStateChange(backTarget('search')!)}
                  />
                )}

                {state === 'mid' && (
                  <MidView
                    fromLabel={fromLabel}
                    toLabel={toLabel}
                    onSwap={onSwap}
                    onEditAddresses={() => onStateChange('search')}
                    options={options}
                    onOptionsChange={onOptionsChange}
                    journeys={journeys}
                    journeyLoading={journeyLoading}
                    journeyError={journeyError}
                    onOpenSettings={() => onStateChange('settings')}
                    onViewResults={() => onStateChange('results')}
                  />
                )}

                {state === 'settings' && (
                  <SettingsView
                    options={options}
                    onOptionsChange={onOptionsChange}
                    onApply={() => onStateChange('mid')}
                    onReset={() => {
                      onOptionsChange(defaultOptions)
                      onStateChange('mid')
                    }}
                    onCollapse={() => onStateChange('mid')}
                  />
                )}

                {state === 'results' && (
                  <JourneyResults
                    journeys={journeys}
                    onSelect={(j) => {
                      onSelectJourney(j)
                      onStateChange('detail')
                    }}
                    onClose={() => onStateChange('mid')}
                  />
                )}

                {(state === 'detail' || state === 'tracking') && selectedJourney && (
                  <JourneyPanel
                    journey={selectedJourney}
                    onClose={onClosePanel}
                    onDepartClick={() => {
                      onDepartClick()
                    }}
                    onEndTrip={onEndTrip}
                    trackingPhase={trackingPhase}
                    weather={weather}
                    activeSegmentIdx={activeSegmentIdx}
                    onSegmentSelect={onSegmentSelect}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Wrapper>
  )
}
