import { useId } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  id?: string
}

/** Toggle partagé — 46×28px, poignée 22×22 (DESIGN-SYSTEM.md, maquette
 * "1a Estuaire - Écrans.dc.html" lignes 315-348). Checkbox natif + label
 * plutôt qu'un `<button>` : la règle globale `button{min-height:48px}`
 * (cibles tactiles) écraserait la hauteur 28px de la maquette. */
export function Toggle({ checked, onChange, label, description, id }: ToggleProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <label htmlFor={inputId} className="flex items-center justify-between gap-4 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-body-sm font-medium text-text">{label}</span>
        {description && (
          <span className="block text-caption text-text-subtle mt-0.5">{description}</span>
        )}
      </span>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={[
          'shrink-0 w-11.5 h-7 rounded-full flex items-center p-0.75 transition-colors duration-fast',
          'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
          checked ? 'bg-primary justify-end' : 'bg-border justify-start',
        ].join(' ')}
      >
        <span className="size-5.5 rounded-full bg-surface shadow-card" />
      </span>
    </label>
  )
}
