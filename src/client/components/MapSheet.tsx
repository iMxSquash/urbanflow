import { useEffect, useId } from 'react'
import type { Coordinates, Journey, TransportMode, UserPreference, WeatherCondition } from '@shared/types/index'
import { TRANSPORT_MODES, USER_PREFERENCES } from '@shared/types/index'
import { AddressSearch } from './AddressSearch'
import { BottomNav } from './BottomNav'
import { DatetimePicker } from './DatetimePicker'
import { EmptyResultsPanel } from './EmptyResultsPanel'
import { JourneyPanel, type JourneyTrackingPhase } from './JourneyPanel'
import { JourneyResults } from './JourneyResults'
import { ModeChip } from './ModeChip'

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
  toLabel: string | null
  hasFrom: boolean
  onFromSelect: (c: Coordinates, label: string) => void
  onToSelect: (c: Coordinates, label: string) => void

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
      <BottomNav />
    </div>
  )
}

function SearchView({
  fromLabel,
  toLabel,
  onFromSelect,
  onToSelect,
  onBack,
}: {
  fromLabel: string | null
  toLabel: string | null
  onFromSelect: (c: Coordinates, label: string) => void
  onToSelect: (c: Coordinates, label: string) => void
  onBack: () => void
}) {
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

      <AddressSearch
        label="Adresse de départ"
        onSelect={(c) => onFromSelect(c, 'Adresse de départ')}
        placeholder={fromLabel ?? 'Départ — ex : Ma position, Commerce...'}
      />
      <AddressSearch
        label="Adresse d'arrivée"
        onSelect={(c) => onToSelect(c, 'Adresse')}
        placeholder="Arrivée"
      />

      <p className="text-caption text-text-subtle mt-auto pt-2">
        ↑↓ pour parcourir · Entrée pour choisir · Échap pour revenir à la carte
        {toLabel && ' · '}
        {toLabel}
      </p>
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
    <fieldset className="m-0 p-0 border-0 flex flex-wrap gap-2">
      <legend className="sr-only">Modes de transport autorisés pour ce trajet</legend>
      {TRANSPORT_MODES.map((mode) => (
        <ModeChip key={mode} mode={mode} selected={modes.includes(mode)} onClick={() => toggle(mode)} />
      ))}
    </fieldset>
  )
}

function MidView({
  options,
  onOptionsChange,
  journeys,
  journeyLoading,
  journeyError,
  onOpenSettings,
  onViewResults,
}: {
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
      <ModeChipsFieldset
        modes={options.modes}
        onChange={(modes) => onOptionsChange({ ...options, modes })}
      />
      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center justify-between text-body-sm text-text-muted px-1 py-2"
      >
        <span>
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
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {!journeyLoading && journeyError && count === 0 ? (
        <EmptyResultsPanel
          time={options.datetime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
          <span aria-live="polite">{summary}</span>
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={id} className="text-body-sm font-medium text-text">
          {label}
        </p>
        {description && <p className="text-caption text-text-subtle mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={[
          'relative shrink-0 w-11 h-6 rounded-full transition-colors duration-fast',
          checked ? 'bg-primary' : 'bg-surface-sunken',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow-card transition-transform duration-fast',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
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
  const pmrId = useId()
  const elevationId = useId()

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
        <input
          id="max-walk-sheet"
          type="range"
          min={5}
          max={25}
          step={5}
          value={options.maxWalkMinutes}
          onChange={(e) =>
            onOptionsChange({ ...options, maxWalkMinutes: Number(e.target.value) })
          }
          className="w-full cursor-pointer accent-primary"
          aria-valuemin={5}
          aria-valuemax={25}
          aria-valuenow={options.maxWalkMinutes}
          aria-valuetext={`${options.maxWalkMinutes} minutes`}
        />
      </div>

      <Toggle
        id={elevationId}
        checked={options.avoidElevation}
        onChange={(avoidElevation) => onOptionsChange({ ...options, avoidElevation })}
        label="Éviter le dénivelé"
        description="Pénalise les itinéraires à vélo (approximation — pas de données d'altimétrie réelles)"
      />

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

// ── MapSheet ─────────────────────────────────────────────────────────────────

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
    toLabel,
    hasFrom,
    onFromSelect,
    onToSelect,
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

  const isDialog = state !== 'collapsed'

  useEffect(() => {
    const parent = PARENT_STATE[state]
    if (!parent) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onStateChange(parent!)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state, onStateChange])

  return (
    <div
      className="bottom-sheet"
      data-sheet-state={state}
      role={isDialog ? 'dialog' : undefined}
      aria-label={isDialog ? "Recherche et suivi d'itinéraire" : undefined}
    >
      {state !== 'search' && <div className="bottom-sheet-handle" aria-hidden="true" />}

      <div className="flex-1 min-h-0 overflow-y-auto">
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
            toLabel={toLabel}
            onFromSelect={onFromSelect}
            onToSelect={(c, label) => {
              onToSelect(c, label)
              if (hasFrom) onStateChange('mid')
            }}
            onBack={() => onStateChange(fromLabel || toLabel ? 'mid' : 'collapsed')}
          />
        )}

        {state === 'mid' && (
          <MidView
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
      </div>
    </div>
  )
}
