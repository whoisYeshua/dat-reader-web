import type { TabId, TabDomElements } from './tabTypes.ts'

const createDropzone = (
  tabId: TabId,
): { dropzone: HTMLElement; dropText: HTMLElement; fileInput: HTMLInputElement } => {
  const dropzone = document.createElement('div')
  dropzone.className = 'dropzone'
  dropzone.role = 'button'
  dropzone.tabIndex = 0
  dropzone.setAttribute(
    'aria-label',
    'Drop zone for .dat files. Click or press Enter to choose a file',
  )
  const dropText = document.createElement('div')
  dropText.textContent = 'Drop a .dat file here or click to choose'
  dropzone.appendChild(dropText)
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.dat'
  fileInput.hidden = true
  fileInput.setAttribute('aria-label', 'Choose a .dat file')
  fileInput.id = `fileInput-${tabId}`
  dropzone.appendChild(fileInput)
  return { dropzone, dropText, fileInput }
}

const createActions = (
  tabId: TabId,
): { actions: HTMLElement; typeSelect: HTMLSelectElement; uploadButton: HTMLButtonElement } => {
  const actions = document.createElement('div')
  actions.className = 'actions'
  const typeLabel = document.createElement('label')
  typeLabel.htmlFor = `typeSelect-${tabId}`
  typeLabel.className = 'visually-hidden'
  typeLabel.textContent = 'File type detection'
  actions.appendChild(typeLabel)
  const typeSelect = document.createElement('select')
  typeSelect.id = `typeSelect-${tabId}`
  typeSelect.title =
    'Choose how to interpret the .dat file. Auto-detect infers the type from the filename; pick GeoIP or GeoSite manually if detection fails.'
  typeSelect.setAttribute('aria-label', 'Choose file type: Auto-detect, GeoIP, or GeoSite')
  const options = [
    { value: 'auto', text: 'Auto-detect' },
    { value: 'geoip', text: 'GeoIP' },
    { value: 'geosite', text: 'GeoSite' },
  ] as const
  for (const opt of options) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.text
    typeSelect.appendChild(option)
  }
  actions.appendChild(typeSelect)
  const uploadButton = document.createElement('button')
  uploadButton.type = 'button'
  uploadButton.disabled = true
  uploadButton.setAttribute('aria-label', 'Parse selected DAT file')
  uploadButton.textContent = 'Parse file'
  actions.appendChild(uploadButton)
  return { actions, typeSelect, uploadButton }
}

const createSummaryPanel = (): { summaryPanel: HTMLElement; summaryElement: HTMLElement } => {
  const summaryPanel = document.createElement('section')
  summaryPanel.className = 'panel'
  summaryPanel.hidden = true
  summaryPanel.setAttribute('aria-label', 'File summary')
  const heading = document.createElement('h2')
  heading.className = 'visually-hidden'
  heading.textContent = 'File Summary'
  summaryPanel.appendChild(heading)
  const summaryElement = document.createElement('div')
  summaryElement.className = 'summary'
  summaryPanel.appendChild(summaryElement)
  return { summaryPanel, summaryElement }
}

/**
 * Creates DOM elements for a single tab's content panel.
 * Returns references to all interactive elements for event wiring.
 */
export const buildTabContent = (tabId: TabId): TabDomElements => {
  const container = document.createElement('div')
  container.className = 'tab-content'
  container.dataset.tabId = tabId
  const panel = document.createElement('section')
  panel.className = 'panel'
  panel.setAttribute('aria-label', 'File upload and controls')
  const heading = document.createElement('h2')
  heading.className = 'visually-hidden'
  heading.textContent = 'Upload DAT File'
  panel.appendChild(heading)
  const { dropzone, dropText, fileInput } = createDropzone(tabId)
  panel.appendChild(dropzone)
  const { actions, typeSelect, uploadButton } = createActions(tabId)
  panel.appendChild(actions)
  const errorElement = document.createElement('div')
  errorElement.className = 'error'
  errorElement.role = 'alert'
  errorElement.setAttribute('aria-live', 'polite')
  panel.appendChild(errorElement)
  container.appendChild(panel)
  const { summaryPanel, summaryElement } = createSummaryPanel()
  container.appendChild(summaryPanel)
  const resultsElement = document.createElement('section')
  resultsElement.className = 'results'
  resultsElement.setAttribute('aria-label', 'Parsed results')
  container.appendChild(resultsElement)
  return {
    container,
    dropzone,
    dropText,
    fileInput,
    typeSelect,
    uploadButton,
    errorElement,
    summaryPanel,
    summaryElement,
    resultsElement,
  }
}
