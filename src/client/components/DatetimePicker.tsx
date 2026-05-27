import { useState } from 'react'

interface DatetimePickerProps {
  datetime: Date
  type: 'departure' | 'arrival'
  onDatetimeChange: (dt: Date) => void
  onTypeChange: (type: 'departure' | 'arrival') => void
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

export function DatetimePicker({
  datetime,
  type,
  onDatetimeChange,
  onTypeChange,
}: DatetimePickerProps) {
  // useState lazy initializer captures "now" once at mount — not recalculated on re-renders.
  const [mountedAt] = useState(() => Date.now())
  const isNow = Math.abs(datetime.getTime() - mountedAt) < 2 * 60 * 1000

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return
    onDatetimeChange(new Date(e.target.value))
  }

  return (
    <div className="bg-white rounded-card shadow-card px-3 py-2 flex items-center gap-2">
      <div
        className="flex rounded-button overflow-hidden border border-slate-200 shrink-0"
        role="group"
        aria-label="Mode horaire"
      >
        <button
          type="button"
          onClick={() => onTypeChange('departure')}
          aria-pressed={type === 'departure'}
          className={[
            'px-2.5 py-1 text-caption font-medium transition-colors duration-fast',
            type === 'departure' ? 'bg-eco-600 text-white' : 'text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Départ
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('arrival')}
          aria-pressed={type === 'arrival'}
          className={[
            'px-2.5 py-1 text-caption font-medium transition-colors duration-fast border-l border-slate-200',
            type === 'arrival' ? 'bg-eco-600 text-white' : 'text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Arrivée
        </button>
      </div>

      <input
        type="datetime-local"
        value={toLocalIso(datetime)}
        onChange={handleInputChange}
        className="flex-1 text-body-sm text-slate-700 bg-transparent border-none outline-none min-w-0 cursor-pointer"
        aria-label={type === 'departure' ? 'Heure de départ' : "Heure d'arrivée souhaitée"}
      />

      {!isNow && (
        <button
          type="button"
          onClick={() => onDatetimeChange(new Date())}
          aria-label="Réinitialiser à maintenant"
          className="text-caption font-medium text-eco-600 hover:text-eco-700 shrink-0 transition-colors duration-fast"
        >
          Maintenant
        </button>
      )}
    </div>
  )
}
