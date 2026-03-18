import { describe, test, expect } from 'vitest'
import { detectType, matchesSearch, filterEntryContent } from './workerLogic.ts'
import type { GeoIPEntry, GeoSiteEntry } from '../types.ts'

// --- detectType ---

describe('detectType', () => {
  test('returns geoip for filename containing geoip', () => {
    expect(detectType('geoip.dat')).toBe('geoip')
  })

  test('returns geoip case-insensitively', () => {
    expect(detectType('GeoIP.dat')).toBe('geoip')
  })

  test('returns geosite for filename containing geosite', () => {
    expect(detectType('geosite.dat')).toBe('geosite')
  })

  test('returns geosite case-insensitively', () => {
    expect(detectType('GeoSite.dat')).toBe('geosite')
  })

  test('returns unknown for unrecognized filename', () => {
    expect(detectType('random.dat')).toBe('unknown')
  })

  test('returns unknown for empty string', () => {
    expect(detectType('')).toBe('unknown')
  })

  test('returns geoip when geoip appears anywhere in filename', () => {
    expect(detectType('my-custom-geoip-file.dat')).toBe('geoip')
  })
})

// --- matchesSearch ---

describe('matchesSearch', () => {
  const geoipEntry: GeoIPEntry = {
    tag: 'US',
    cidrs: ['192.168.1.0/24', '10.0.0.0/8'],
  }

  const geositeEntry: GeoSiteEntry = {
    tag: 'GOOGLE',
    domains: [
      { type: 2, value: 'google.com' },
      { type: 1, value: '^api\\.example\\.com$' },
    ],
  }

  test('returns true for empty search string', () => {
    expect(matchesSearch(geoipEntry, '')).toBe(true)
  })

  test('matches GeoIPEntry by tag', () => {
    expect(matchesSearch(geoipEntry, 'us')).toBe(true)
  })

  test('matches GeoIPEntry by CIDR', () => {
    expect(matchesSearch(geoipEntry, '192.168')).toBe(true)
  })

  test('returns false for GeoIPEntry with no match', () => {
    expect(matchesSearch(geoipEntry, 'xyz')).toBe(false)
  })

  test('matches GeoSiteEntry by tag', () => {
    expect(matchesSearch(geositeEntry, 'google')).toBe(true)
  })

  test('matches GeoSiteEntry by domain value', () => {
    expect(matchesSearch(geositeEntry, 'google.com')).toBe(true)
  })

  test('matches GeoSiteEntry by domain type label', () => {
    expect(matchesSearch(geositeEntry, 'regex')).toBe(true)
  })

  test('returns false for GeoSiteEntry with no match', () => {
    expect(matchesSearch(geositeEntry, 'xyz')).toBe(false)
  })

  test('performs case-insensitive matching', () => {
    expect(matchesSearch(geoipEntry, 'US')).toBe(true)
    expect(matchesSearch(geositeEntry, 'GOOGLE')).toBe(true)
  })
})

// --- filterEntryContent ---

describe('filterEntryContent', () => {
  test('filters GeoIPEntry CIDRs to only matching ones', () => {
    const entry: GeoIPEntry = {
      tag: 'US',
      cidrs: ['192.168.1.0/24', '10.0.0.0/8', '192.168.2.0/24'],
    }
    const result = filterEntryContent(entry, '192.168')
    expect(result).toEqual({
      tag: 'US',
      cidrs: ['192.168.1.0/24', '192.168.2.0/24'],
    })
  })

  test('returns full GeoIPEntry when tag matches but no CIDR matches', () => {
    const entry: GeoIPEntry = {
      tag: 'US',
      cidrs: ['192.168.1.0/24', '10.0.0.0/8'],
    }
    const result = filterEntryContent(entry, 'us')
    expect(result).toBe(entry)
  })

  test('filters GeoSiteEntry domains to only matching ones', () => {
    const entry: GeoSiteEntry = {
      tag: 'MIXED',
      domains: [
        { type: 2, value: 'google.com' },
        { type: 2, value: 'facebook.com' },
        { type: 2, value: 'google.org' },
      ],
    }
    const result = filterEntryContent(entry, 'google')
    expect(result).toEqual({
      tag: 'MIXED',
      domains: [
        { type: 2, value: 'google.com' },
        { type: 2, value: 'google.org' },
      ],
    })
  })

  test('returns filtered GeoSiteEntry when both tag and domains match', () => {
    const entry: GeoSiteEntry = {
      tag: 'GOOGLE',
      domains: [
        { type: 2, value: 'google.com' },
        { type: 3, value: 'www.google.com' },
        { type: 2, value: 'youtube.com' },
      ],
    }
    const result = filterEntryContent(entry, 'google')
    expect(result).toEqual({
      tag: 'GOOGLE',
      domains: [
        { type: 2, value: 'google.com' },
        { type: 3, value: 'www.google.com' },
      ],
    })
  })

  test('returns full GeoSiteEntry when only tag matches', () => {
    const entry: GeoSiteEntry = {
      tag: 'CUSTOM',
      domains: [
        { type: 2, value: 'example.com' },
        { type: 3, value: 'test.org' },
      ],
    }
    const result = filterEntryContent(entry, 'custom')
    expect(result).toBe(entry)
  })
})
