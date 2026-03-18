import { describe, test, expect } from 'vitest'
import type { GeoIPEntry, GeoSiteEntry } from './types.ts'
import { isGeoIPEntry, isGeoSiteEntry, getDomainTypeLabel, DOMAIN_TYPE_LABELS } from './types.ts'

describe('isGeoIPEntry', () => {
  test('returns true for a GeoIPEntry', () => {
    const entry: GeoIPEntry = { tag: 'US', cidrs: ['1.0.0.0/24'] }
    expect(isGeoIPEntry(entry)).toBe(true)
  })

  test('returns false for a GeoSiteEntry', () => {
    const entry: GeoSiteEntry = {
      tag: 'GOOGLE',
      domains: [{ type: 2, value: 'google.com' }],
    }
    expect(isGeoIPEntry(entry)).toBe(false)
  })
})

describe('isGeoSiteEntry', () => {
  test('returns true for a GeoSiteEntry', () => {
    const entry: GeoSiteEntry = {
      tag: 'GOOGLE',
      domains: [{ type: 2, value: 'google.com' }],
    }
    expect(isGeoSiteEntry(entry)).toBe(true)
  })

  test('returns false for a GeoIPEntry', () => {
    const entry: GeoIPEntry = { tag: 'US', cidrs: ['1.0.0.0/24'] }
    expect(isGeoSiteEntry(entry)).toBe(false)
  })
})

describe('getDomainTypeLabel', () => {
  test('returns Plain for type 0', () => {
    expect(getDomainTypeLabel(0)).toBe('Plain')
  })

  test('returns Regex for type 1', () => {
    expect(getDomainTypeLabel(1)).toBe('Regex')
  })

  test('returns Domain for type 2', () => {
    expect(getDomainTypeLabel(2)).toBe('Domain')
  })

  test('returns Full for type 3', () => {
    expect(getDomainTypeLabel(3)).toBe('Full')
  })

  test('returns string representation for unknown type', () => {
    expect(getDomainTypeLabel(99)).toBe('99')
  })

  test('returns string representation for negative number', () => {
    expect(getDomainTypeLabel(-1)).toBe('-1')
  })
})

describe('DOMAIN_TYPE_LABELS', () => {
  test('has exactly 4 entries', () => {
    const keys: readonly string[] = Object.keys(DOMAIN_TYPE_LABELS)
    expect(keys).toHaveLength(4)
  })

  test('values match expected labels', () => {
    expect(DOMAIN_TYPE_LABELS[0]).toBe('Plain')
    expect(DOMAIN_TYPE_LABELS[1]).toBe('Regex')
    expect(DOMAIN_TYPE_LABELS[2]).toBe('Domain')
    expect(DOMAIN_TYPE_LABELS[3]).toBe('Full')
  })
})
