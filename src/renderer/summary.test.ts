import { describe, test, expect, beforeEach } from 'vitest'
import { renderSummary } from './summary.ts'
import type { SummaryData } from '../types.ts'

const createSummaryData = (overrides: Partial<SummaryData> = {}): SummaryData => ({
  filename: 'geoip.dat',
  size: 5242880,
  detectedType: 'geoip',
  totals: { lists: 120, cidrs: 45000, domains: 0 },
  ...overrides,
})

describe('renderSummary', () => {
  let summaryPanel: HTMLElement
  let summaryElement: HTMLElement

  beforeEach(() => {
    summaryPanel = document.createElement('div')
    summaryPanel.hidden = true
    summaryElement = document.createElement('div')
  })

  test('sets summaryPanel hidden to false', () => {
    const data = createSummaryData()
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryPanel.hidden).toBe(false)
  })

  test('renders filename in summary', () => {
    const data = createSummaryData({ filename: 'test-geoip.dat' })
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryElement.innerHTML).toContain('test-geoip.dat')
  })

  test('renders formatted file size', () => {
    const data = createSummaryData({ size: 5242880 })
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryElement.innerHTML).toContain('5.0 MB')
  })

  test('renders detected type', () => {
    const data = createSummaryData({ detectedType: 'geoip' })
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryElement.innerHTML).toContain('geoip')
  })

  test('renders total lists count without filter', () => {
    const data = createSummaryData({
      totals: { lists: 120, cidrs: 1000, domains: 0 },
      filteredLists: undefined,
    })
    renderSummary(summaryPanel, summaryElement, data)
    const listsSpan = Array.from(summaryElement.querySelectorAll('span')).find(span =>
      span.innerHTML.includes('Lists'),
    )
    expect(listsSpan).not.toBeUndefined()
    expect(listsSpan!.textContent).toContain('120')
    expect(listsSpan!.textContent).not.toContain('/')
  })

  test('renders filtered lists in "filtered/total" format', () => {
    const data = createSummaryData({
      totals: { lists: 120, cidrs: 1000, domains: 0 },
      filteredLists: 15,
    })
    renderSummary(summaryPanel, summaryElement, data)
    const listsSpan = Array.from(summaryElement.querySelectorAll('span')).find(span =>
      span.innerHTML.includes('Lists'),
    )
    expect(listsSpan).not.toBeUndefined()
    expect(listsSpan!.textContent).toContain('15/120')
  })

  test('renders total CIDRs for GeoIP data', () => {
    const data = createSummaryData({ totals: { lists: 10, cidrs: 5000, domains: 0 } })
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryElement.innerHTML).toContain('Total CIDRs')
    expect(summaryElement.innerHTML).toContain('5000')
  })

  test('renders total domains for GeoSite data', () => {
    const data = createSummaryData({
      detectedType: 'geosite',
      totals: { lists: 50, cidrs: 0, domains: 12000 },
    })
    renderSummary(summaryPanel, summaryElement, data)
    expect(summaryElement.innerHTML).toContain('Total domains')
    expect(summaryElement.innerHTML).toContain('12000')
  })

  test('renders all summary spans as children', () => {
    const data = createSummaryData({ totals: { lists: 10, cidrs: 100, domains: 200 } })
    renderSummary(summaryPanel, summaryElement, data)
    const spans = summaryElement.querySelectorAll('span')
    expect(spans.length).toBe(6)
  })
})
