import type { CSSProperties } from 'react'

interface SliderProps {
  id?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  ariaValueText?: string
}

/** Slider partagé — piste 6px + poignée 26px à liseré primary (`.slider`
 * dans index.css), remplace un `<input type="range">` nu qui ne peut pas
 * reproduire ce visuel via `accent-color` seul. */
export function Slider({ id, value, min, max, step = 1, onChange, ariaValueText }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="slider"
      style={{ '--slider-fill': `${percent}%` } as CSSProperties}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={ariaValueText}
    />
  )
}
