const megabyteFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatMegabytes(bytes: number): string {
  return `${megabyteFormatter.format(bytes / (1024 * 1024))} Mo`
}
