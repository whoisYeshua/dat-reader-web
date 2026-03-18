import { describe, test, expect, beforeEach } from 'vitest'
import { renderResults } from './results.ts'
import type { GeoIPEntry, GeoSiteEntry, DomainEntry } from '../types.ts'

const FILENAME = 'geoip.dat' as const

const createGeoIPEntry = (tag: string, cidrs: readonly string[]): GeoIPEntry => ({
  tag,
  cidrs,
})

const createGeoSiteEntry = (tag: string, domains: readonly DomainEntry[]): GeoSiteEntry => ({
  tag,
  domains,
})

describe('renderResults', () => {
  let resultsElement: HTMLElement

  beforeEach(() => {
    resultsElement = document.createElement('div')
  })

  test('renders empty state when entries array is empty', () => {
    renderResults(resultsElement, [], FILENAME)
    const muted = resultsElement.querySelector('.muted')
    expect(muted).not.toBeNull()
    expect(muted!.textContent).toBe('No entries to display.')
  })

  test('creates details elements for GeoIP entries', () => {
    const entries: readonly GeoIPEntry[] = [
      createGeoIPEntry('US', ['1.0.0.0/8', '2.0.0.0/16']),
      createGeoIPEntry('CN', ['3.0.0.0/24']),
    ]
    renderResults(resultsElement, entries, FILENAME)
    const details = resultsElement.querySelectorAll('details.entry')
    expect(details.length).toBe(2)
  })

  test('renders GeoIP summary with tag and CIDR count', () => {
    const entries: readonly GeoIPEntry[] = [createGeoIPEntry('US', ['1.0.0.0/8', '2.0.0.0/16'])]
    renderResults(resultsElement, entries, FILENAME)
    const summary = resultsElement.querySelector('summary')
    expect(summary).not.toBeNull()
    expect(summary!.textContent).toContain('[US] - 2 CIDR ranges')
  })

  test('renders copy button with lowercase tag in data attribute', () => {
    const entries: readonly GeoIPEntry[] = [createGeoIPEntry('US', ['1.0.0.0/8'])]
    renderResults(resultsElement, entries, FILENAME)
    const copyButton = resultsElement.querySelector<HTMLButtonElement>('.copy-btn')
    expect(copyButton).not.toBeNull()
    expect(copyButton!.dataset.textToCopy).toBe('ext:geoip.dat:us')
  })

  test('renders CIDR strings in entry body', () => {
    const cidrs = ['10.0.0.0/8', '192.168.0.0/16']
    const entries: readonly GeoIPEntry[] = [createGeoIPEntry('PRIVATE', cidrs)]
    renderResults(resultsElement, entries, FILENAME)
    const entryList = resultsElement.querySelector('.entry-list')
    expect(entryList).not.toBeNull()
    expect(entryList!.textContent).toContain('10.0.0.0/8')
    expect(entryList!.textContent).toContain('192.168.0.0/16')
  })

  test('renders GeoSite summary with tag and domain count', () => {
    const entries: readonly GeoSiteEntry[] = [
      createGeoSiteEntry('GOOGLE', [
        { type: 2, value: 'google.com' },
        { type: 3, value: 'www.google.com' },
      ]),
    ]
    renderResults(resultsElement, entries, 'geosite.dat')
    const summary = resultsElement.querySelector('summary')
    expect(summary).not.toBeNull()
    expect(summary!.textContent).toContain('[GOOGLE] - 2 domains')
  })

  test('renders domain type labels and values in entry body', () => {
    const entries: readonly GeoSiteEntry[] = [
      createGeoSiteEntry('EXAMPLE', [
        { type: 0, value: 'example.com' },
        { type: 1, value: '.*\\.example\\.com' },
        { type: 2, value: 'example.org' },
        { type: 3, value: 'full.example.com' },
      ]),
    ]
    renderResults(resultsElement, entries, 'geosite.dat')
    const entryList = resultsElement.querySelector('.entry-list')
    expect(entryList).not.toBeNull()
    expect(entryList!.textContent).toContain('[Plain] example.com')
    expect(entryList!.textContent).toContain('[Regex] .*\\.example\\.com')
    expect(entryList!.textContent).toContain('[Domain] example.org')
    expect(entryList!.textContent).toContain('[Full] full.example.com')
  })

  test('clears previous content when called again', () => {
    const firstEntries: readonly GeoIPEntry[] = [createGeoIPEntry('US', ['1.0.0.0/8'])]
    const secondEntries: readonly GeoIPEntry[] = [
      createGeoIPEntry('CN', ['3.0.0.0/8']),
      createGeoIPEntry('JP', ['4.0.0.0/8']),
    ]
    renderResults(resultsElement, firstEntries, FILENAME)
    renderResults(resultsElement, secondEntries, FILENAME)
    const details = resultsElement.querySelectorAll('details.entry')
    expect(details.length).toBe(2)
    const summaries = resultsElement.querySelectorAll('summary')
    expect(summaries[0]!.textContent).toContain('[CN]')
    expect(summaries[1]!.textContent).toContain('[JP]')
  })
})
