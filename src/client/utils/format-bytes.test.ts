import { describe, expect, it } from 'vitest'
import { formatMegabytes } from './format-bytes'

describe('formatMegabytes', () => {
  it('formats bytes as French-locale megabytes with one decimal', () => {
    expect(formatMegabytes(1_048_576)).toBe('1,0 Mo')
  })

  it('rounds to one decimal', () => {
    expect(formatMegabytes(1_310_720)).toBe('1,3 Mo')
  })

  it('formats sub-megabyte sizes', () => {
    expect(formatMegabytes(524_288)).toBe('0,5 Mo')
  })

  it('formats zero', () => {
    expect(formatMegabytes(0)).toBe('0,0 Mo')
  })
})
