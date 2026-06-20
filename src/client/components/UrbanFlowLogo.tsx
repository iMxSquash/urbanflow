export function UrbanFlowLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 12 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3 h-[18px] shrink-0"
        aria-hidden="true"
      >
        <path
          d="M6 0C2.686 0 0 2.686 0 6c0 5.25 6 12 6 12s6-6.75 6-12C12 2.686 9.314 0 6 0z"
          fill="#4ADE80"
        />
      </svg>
      <span className="text-h3 font-semibold text-text-primary tracking-tight">UrbanFlow</span>
    </div>
  )
}
