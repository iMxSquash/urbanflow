/** Citation des facteurs d'émission ADEME — CLAUDE.md §Facteurs CO2, source à citer. */
export function Co2FactorsNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-caption text-text-subtle leading-relaxed ${className}`}>
      Facteurs d'émission : Base Empreinte ADEME — voiture 253 g/km, bus 109, tramway 4, navibus 50,
      train 14, vélo · marche · trottinette 0 g/km. Calcul déterministe, sans estimation
      automatique.
    </p>
  )
}
