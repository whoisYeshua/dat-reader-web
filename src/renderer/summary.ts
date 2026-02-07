import { formatBytes } from '../utils.ts'
import type { SummaryData } from '../types.ts'

/**
 * Renders file summary information into the summary panel.
 * Displays file metadata, detected type, and totals.
 * @param {HTMLElement} summaryPanel - Container panel element to show/hide
 * @param {HTMLElement} summaryElement - Element to render summary content into
 * @param {SummaryData} data - Summary data including filename, size, type, and totals
 * @returns {void}
 */
export const renderSummary = (
  summaryPanel: HTMLElement,
  summaryElement: HTMLElement,
  data: SummaryData,
): void => {
  summaryPanel.hidden = false
  const items: string[] = []
  items.push(`<span><strong>File</strong> ${data.filename}</span>`)
  items.push(`<span><strong>Size</strong> ${formatBytes(data.size)}</span>`)
  items.push(`<span><strong>Type</strong> ${data.detectedType}</span>`)
  items.push(`<span><strong>Lists</strong> ${data.totals.lists}</span>`)
  if (data.totals.cidrs !== undefined) {
    items.push(`<span><strong>Total CIDRs</strong> ${data.totals.cidrs}</span>`)
  }
  if (data.totals.domains !== undefined) {
    items.push(`<span><strong>Total domains</strong> ${data.totals.domains}</span>`)
  }
  summaryElement.innerHTML = items.join('')
}
