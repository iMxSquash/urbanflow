import { describe, expect, it } from 'vitest'
import { isIosDevice } from './platform'

function stubWindow(userAgent: string, platform: string, maxTouchPoints = 0) {
  Object.defineProperty(globalThis, 'window', {
    value: { navigator: { userAgent, platform, maxTouchPoints } },
    writable: true,
    configurable: true,
  })
}

describe('isIosDevice', () => {
  it('detects iPhone Chrome (WebKit wrapper — same as Safari)', () => {
    stubWindow(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
      'iPhone'
    )
    expect(isIosDevice()).toBe(true)
  })

  it('detects iPadOS 13+ spoofing macOS via touch support', () => {
    stubWindow(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      'MacIntel',
      5
    )
    expect(isIosDevice()).toBe(true)
  })

  it('does not flag a real Mac (no touch points)', () => {
    stubWindow(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/605.1.15',
      'MacIntel',
      0
    )
    expect(isIosDevice()).toBe(false)
  })

  it('does not flag Android Chrome', () => {
    stubWindow(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Linux armv8l',
      5
    )
    expect(isIosDevice()).toBe(false)
  })
})
