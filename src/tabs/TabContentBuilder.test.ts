import { describe, test, expect } from 'vitest'
import { buildTabContent } from './TabContentBuilder.ts'
import type { TabDomElements } from './tabTypes.ts'

describe('buildTabContent', () => {
  const TAB_ID = 'test-tab-1'

  test('returns an object with all TabDomElements properties defined', () => {
    const elements: TabDomElements = buildTabContent(TAB_ID)
    const keys: ReadonlyArray<keyof TabDomElements> = [
      'container',
      'dropzone',
      'dropText',
      'fileInput',
      'typeSelect',
      'uploadButton',
      'errorElement',
      'summaryPanel',
      'summaryElement',
      'resultsElement',
    ] as const
    for (const key of keys) {
      expect(elements[key]).toBeDefined()
      expect(elements[key]).not.toBeNull()
    }
  })

  test('container has class "tab-content" and correct data-tab-id', () => {
    const { container } = buildTabContent(TAB_ID)
    expect(container.className).toBe('tab-content')
    expect(container.dataset.tabId).toBe(TAB_ID)
  })

  test('dropzone has class "dropzone" and role "button"', () => {
    const { dropzone } = buildTabContent(TAB_ID)
    expect(dropzone.className).toBe('dropzone')
    expect(dropzone.role).toBe('button')
  })

  test('fileInput is an input[type=file] with accept=".dat" and is hidden', () => {
    const { fileInput } = buildTabContent(TAB_ID)
    expect(fileInput.tagName).toBe('INPUT')
    expect(fileInput.type).toBe('file')
    expect(fileInput.accept).toBe('.dat')
    expect(fileInput.hidden).toBe(true)
  })

  test('typeSelect has 3 options: Auto-detect, GeoIP, GeoSite', () => {
    const { typeSelect } = buildTabContent(TAB_ID)
    expect(typeSelect.tagName).toBe('SELECT')
    expect(typeSelect.options.length).toBe(3)
    expect(typeSelect.options[0].value).toBe('auto')
    expect(typeSelect.options[0].textContent).toBe('Auto-detect')
    expect(typeSelect.options[1].value).toBe('geoip')
    expect(typeSelect.options[1].textContent).toBe('GeoIP')
    expect(typeSelect.options[2].value).toBe('geosite')
    expect(typeSelect.options[2].textContent).toBe('GeoSite')
  })

  test('uploadButton is disabled by default with text "Parse file"', () => {
    const { uploadButton } = buildTabContent(TAB_ID)
    expect(uploadButton.tagName).toBe('BUTTON')
    expect(uploadButton.disabled).toBe(true)
    expect(uploadButton.textContent).toBe('Parse file')
  })

  test('errorElement has class "error" and role "alert"', () => {
    const { errorElement } = buildTabContent(TAB_ID)
    expect(errorElement.className).toBe('error')
    expect(errorElement.role).toBe('alert')
  })

  test('summaryPanel is hidden by default', () => {
    const { summaryPanel } = buildTabContent(TAB_ID)
    expect(summaryPanel.hidden).toBe(true)
  })

  test('resultsElement has class "results"', () => {
    const { resultsElement } = buildTabContent(TAB_ID)
    expect(resultsElement.className).toBe('results')
  })
})
