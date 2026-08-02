import { useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface ModalProps {
  titleId: string
  descriptionId?: string
  onClose: () => void
  children: ReactNode
}

/** Dialogue modal générique — backdrop + `.modal` (radius-2xl, shadow-modal, padding). */
export function Modal({ titleId, descriptionId, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onClose)

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'var(--scrim)' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="modal w-full max-w-sm animate-slide-up"
      >
        {children}
      </div>
    </div>
  )
}
