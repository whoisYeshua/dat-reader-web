import type { GeoIPEntry, GeoSiteEntry } from '../types.ts'
import { isGeoIPEntry, isGeoSiteEntry, getDomainTypeLabel } from '../types.ts'

const createCopyButton = (filename: string, tag: string): HTMLButtonElement => {
  const copyButton = document.createElement('button')
  copyButton.className = 'copy-btn'
  copyButton.textContent = 'Copy'
  copyButton.dataset.textToCopy = `ext:${filename}:${tag.toLowerCase()}`
  return copyButton
}

const createEntrySummary = (entry: GeoIPEntry | GeoSiteEntry, filename: string): HTMLElement => {
  const summary = document.createElement('summary')
  const count = isGeoIPEntry(entry) ? entry.cidrs.length : entry.domains.length
  const label = isGeoIPEntry(entry) ? 'CIDR ranges' : 'domains'
  const headerText = `[${entry.tag}] - ${count} ${label}`
  summary.textContent = headerText
  const copyButton = createCopyButton(filename, entry.tag)
  summary.appendChild(copyButton)
  return summary
}

const createEntryList = (entry: GeoIPEntry | GeoSiteEntry) => {
  const textElement = document.createElement('span')
  textElement.style.whiteSpace = 'break-spaces'
  let text = ''
  textElement.className = 'entry-list'
  if (isGeoIPEntry(entry)) {
    for (const cidr of entry.cidrs) {
      text += `\n${cidr}`
    }
  } else if (isGeoSiteEntry(entry)) {
    for (const domain of entry.domains) {
      text += `\n[${getDomainTypeLabel(domain.type)}] ${domain.value}`
    }
  }
  textElement.textContent = text
  return textElement
}

const createEntryDetails = (
  entry: GeoIPEntry | GeoSiteEntry,
  filename: string,
): HTMLDetailsElement => {
  const details = document.createElement('details')
  details.className = 'entry'
  const summary = createEntrySummary(entry, filename)
  details.appendChild(summary)
  const body = document.createElement('div')
  body.className = 'entry-body'
  const list = createEntryList(entry)
  body.appendChild(list)
  details.appendChild(body)
  return details
}

/**
 * Renders pre-filtered file entries into expandable result list.
 * Displays entries with copy functionality.
 * @param {HTMLElement} resultsElement - Container element to render results into
 * @param {readonly (GeoIPEntry | GeoSiteEntry)[]} entries - Pre-filtered entries to display
 * @param {string} filename - Source filename for copy functionality
 * @returns {void}
 */
export const renderResults = (
  resultsElement: HTMLElement,
  entries: readonly (GeoIPEntry | GeoSiteEntry)[],
  filename: string,
): void => {
  resultsElement.innerHTML = ''
  if (!entries.length) {
    resultsElement.innerHTML = '<div class="muted">No entries to display.</div>'
    return
  }
  performance.mark('render:dom-start')
  const fragment = document.createDocumentFragment()
  entries.forEach((entry: GeoIPEntry | GeoSiteEntry) => {
    const details = createEntryDetails(entry, filename)
    fragment.appendChild(details)
  })
  resultsElement.appendChild(fragment)
  performance.mark('render:dom-end')
  const domMeasure = performance.measure('render:dom', 'render:dom-start', 'render:dom-end')
  console.log(`[perf:render] dom=${domMeasure.duration.toFixed(1)}ms (${entries.length} entries)`)
}
