import type { DecodeWorkerClient } from '../worker/DecodeWorkerClient.ts'
import type { TabSearchResult } from '../worker/messages.ts'
import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from '../types.ts'
import { readFileAsBytes, formatBytes } from '../utils.ts'
import { renderSummary } from '../renderer/summary.ts'
import { renderResults } from '../renderer/results.ts'
import { buildTabContent } from './TabContentBuilder.ts'
import {
  createTabButton,
  updateTabLabel,
  setActiveTabButton,
  updateMatchIndicator,
  removeTabButton,
  updateCloseButtonVisibility,
} from './TabBarRenderer.ts'
import type { TabId, TabState, MatchIndicator } from './tabTypes.ts'

const COPY_RESET_DELAY_MS = 1500

/**
 * Orchestrates multiple file tabs, coordinating per-tab state,
 * worker communication, and cross-tab search.
 */
export class TabManager {
  readonly #tabs = new Map<TabId, TabState>()
  readonly #tabButtons = new Map<TabId, HTMLElement>()
  readonly #workerClient: DecodeWorkerClient
  readonly #tabBar: HTMLElement
  readonly #tabContentHost: HTMLElement
  readonly #searchInput: HTMLInputElement
  #activeTabId: TabId | null = null
  #currentSearch = ''
  #lastSearchResults = new Map<TabId, readonly (GeoIPEntry | GeoSiteEntry)[]>()

  constructor(
    workerClient: DecodeWorkerClient,
    tabBar: HTMLElement,
    tabContentHost: HTMLElement,
    searchInput: HTMLInputElement,
  ) {
    this.#workerClient = workerClient
    this.#tabBar = tabBar
    this.#tabContentHost = tabContentHost
    this.#searchInput = searchInput
    this.#tabBar.addEventListener('click', this.#handleTabBarClick)
    this.#tabContentHost.addEventListener('click', this.#handleCopyClick)
  }

  /** Creates a new tab, wires events, and activates it. */
  createTab(): TabId {
    const tabId = crypto.randomUUID()
    const elements = buildTabContent(tabId)
    const tabButton = createTabButton(tabId)
    const addButton = this.#tabBar.querySelector('.add-tab-button')
    this.#tabBar.insertBefore(tabButton, addButton)
    this.#tabContentHost.appendChild(elements.container)
    const state: TabState = {
      id: tabId,
      elements,
      selectedFile: null,
      currentResult: null,
      filename: '',
    }
    this.#tabs.set(tabId, state)
    this.#tabButtons.set(tabId, tabButton)
    this.#wireTabEvents(state)
    this.#activateTab(tabId)
    this.#updateCloseButtons()
    return tabId
  }

  /** Switches to the specified tab, rendering correct content. */
  #activateTab(tabId: TabId): void {
    if (this.#activeTabId) {
      const previousTab = this.#tabs.get(this.#activeTabId)
      if (previousTab) previousTab.elements.container.classList.remove('active')
    }
    this.#activeTabId = tabId
    const tab = this.#tabs.get(tabId)
    if (!tab) return
    tab.elements.container.classList.add('active')
    setActiveTabButton(this.#tabBar, tabId)
    this.#renderActiveTabContent(tab)
  }

  /** Renders the correct content for the active tab based on search state. */
  #renderActiveTabContent(tab: TabState): void {
    if (!tab.currentResult) return
    const hasSearch = this.#currentSearch.length > 0
    const filteredEntries = hasSearch ? this.#lastSearchResults.get(tab.id) : undefined
    const entries = filteredEntries ?? tab.currentResult.entries
    this.#renderSummary(tab, filteredEntries ? filteredEntries.length : undefined)
    renderResults(
      tab.elements.resultsElement,
      entries as readonly (GeoIPEntry | GeoSiteEntry)[],
      tab.filename,
    )
  }

  /** Closes a tab, cleaning up all associated state and memory. */
  closeTab(tabId: TabId): void {
    if (this.#tabs.size <= 1) return
    const tab = this.#tabs.get(tabId)
    const tabButton = this.#tabButtons.get(tabId)
    if (!tab || !tabButton) return
    const isActive = this.#activeTabId === tabId
    tab.elements.container.remove()
    removeTabButton(tabButton)
    this.#tabs.delete(tabId)
    this.#tabButtons.delete(tabId)
    this.#lastSearchResults.delete(tabId)
    this.#workerClient.removeTab(tabId)
    if (isActive) {
      const nextTabId = this.#tabs.keys().next().value as TabId
      this.#activateTab(nextTabId)
    }
    this.#updateCloseButtons()
  }

  /** Parses the selected file in the specified tab. */
  async parseFile(tabId: TabId): Promise<void> {
    const tab = this.#tabs.get(tabId)
    if (!tab?.selectedFile) return
    this.#setError(tab, '')
    this.#setParsingState(tab, true)
    try {
      performance.mark('parse:read-start')
      const bytes = await readFileAsBytes(tab.selectedFile)
      performance.mark('parse:read-end')
      performance.mark('parse:decode-start')
      const result = await this.#workerClient.decode(
        bytes,
        tab.elements.typeSelect.value as FileType,
        tab.selectedFile.name,
        tabId,
      )
      performance.mark('parse:decode-end')
      if (result.detectedType === 'unknown') {
        throw new Error('Unable to detect file type. Please choose a type.')
      }
      performance.mark('parse:render-start')
      tab.currentResult = result
      tab.filename = tab.selectedFile.name
      this.#renderDecodedResult(tab, result)
      this.#updateTabLabelFromState(tab)
      performance.mark('parse:render-end')
      this.#logParseTiming()
      this.#enableSearchIfNeeded()
    } catch (err: unknown) {
      this.#setError(tab, err instanceof Error ? err.message : 'Parsing failed.')
    } finally {
      this.#setParsingState(tab, false)
    }
  }

  /** Handles cross-tab search, updating indicators and rendering filtered results. */
  async handleGlobalSearch(search: string): Promise<void> {
    this.#currentSearch = search
    if (!search) {
      this.#clearSearchState()
      return
    }
    const results = await this.#workerClient.filterAll(search)
    this.#applySearchResults(results)
  }

  /** Returns the number of tabs. */
  get tabCount(): number {
    return this.#tabs.size
  }

  /** Returns whether any tab has parsed data. */
  get hasParsedTabs(): boolean {
    for (const tab of this.#tabs.values()) {
      if (tab.currentResult) return true
    }
    return false
  }

  // --- Private helpers ---

  #wireTabEvents(tab: TabState): void {
    const { elements } = tab
    elements.dropzone.addEventListener('click', () => elements.fileInput.click())
    elements.dropzone.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        elements.fileInput.click()
      }
    })
    elements.fileInput.addEventListener('change', () => {
      tab.selectedFile = elements.fileInput.files?.[0] ?? null
      this.#updateFileDisplay(tab)
    })
    elements.uploadButton.addEventListener('click', () => this.parseFile(tab.id))
    this.#wireDropEvents(tab)
  }

  #wireDropEvents(tab: TabState): void {
    const { dropzone } = tab.elements
    dropzone.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault()
      dropzone.classList.add('dragover')
    })
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover')
    })
    dropzone.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault()
      dropzone.classList.remove('dragover')
      const file = event.dataTransfer?.files[0]
      if (!file) return
      tab.selectedFile = file
      this.#updateFileDisplay(tab)
    })
  }

  #updateFileDisplay(tab: TabState): void {
    if (!tab.selectedFile) {
      tab.elements.dropText.textContent = 'Drop a .dat file here or click to choose'
      tab.elements.uploadButton.disabled = true
      return
    }
    tab.elements.dropText.textContent = `Selected: ${tab.selectedFile.name} (${formatBytes(tab.selectedFile.size)})`
    tab.elements.uploadButton.disabled = false
  }

  #renderSummary(tab: TabState, filteredLists?: number): void {
    if (!tab.currentResult || !tab.selectedFile) return
    renderSummary(tab.elements.summaryPanel, tab.elements.summaryElement, {
      filename: tab.filename,
      size: tab.selectedFile.size,
      detectedType: tab.currentResult.detectedType,
      totals: tab.currentResult.totals,
      filteredLists,
    })
  }

  #renderDecodedResult(tab: TabState, result: DecodedResult): void {
    this.#renderSummary(tab)
    renderResults(
      tab.elements.resultsElement,
      result.entries as readonly (GeoIPEntry | GeoSiteEntry)[],
      tab.filename,
    )
  }

  #updateTabLabelFromState(tab: TabState): void {
    const tabButton = this.#tabButtons.get(tab.id)
    if (tabButton) updateTabLabel(tabButton, tab.filename || 'New file')
  }

  #setError(tab: TabState, message: string): void {
    tab.elements.errorElement.textContent = message || ''
  }

  #setParsingState(tab: TabState, isParsing: boolean): void {
    tab.elements.uploadButton.disabled = isParsing
    tab.elements.uploadButton.textContent = isParsing ? 'Parsing...' : 'Parse file'
  }

  #enableSearchIfNeeded(): void {
    if (this.#searchInput.disabled && this.hasParsedTabs) {
      this.#searchInput.disabled = false
    }
  }

  #clearSearchState(): void {
    this.#lastSearchResults.clear()
    this.#clearAllIndicators()
    const activeTab = this.#activeTabId ? this.#tabs.get(this.#activeTabId) : null
    if (activeTab?.currentResult) {
      this.#renderSummary(activeTab)
      renderResults(
        activeTab.elements.resultsElement,
        activeTab.currentResult.entries as readonly (GeoIPEntry | GeoSiteEntry)[],
        activeTab.filename,
      )
    }
  }

  #applySearchResults(results: readonly TabSearchResult[]): void {
    this.#lastSearchResults.clear()
    const resultsByTab = new Map<TabId, TabSearchResult>()
    for (const result of results) {
      resultsByTab.set(result.tabId, result)
      this.#lastSearchResults.set(result.tabId, result.entries)
    }
    for (const [tabId, tabButton] of this.#tabButtons) {
      const tab = this.#tabs.get(tabId)
      if (!tab?.currentResult) {
        updateMatchIndicator(tabButton, 'none')
        continue
      }
      const searchResult = resultsByTab.get(tabId)
      const indicator: MatchIndicator = searchResult
        ? searchResult.matchCount > 0
          ? 'match'
          : 'no-match'
        : 'no-match'
      updateMatchIndicator(tabButton, indicator)
    }
    const activeTab = this.#activeTabId ? this.#tabs.get(this.#activeTabId) : null
    if (!activeTab?.currentResult) return
    const activeResult = resultsByTab.get(this.#activeTabId!)
    const entries = activeResult?.entries ?? []
    this.#renderSummary(activeTab, entries.length)
    renderResults(activeTab.elements.resultsElement, entries, activeTab.filename)
  }

  #clearAllIndicators(): void {
    for (const tabButton of this.#tabButtons.values()) {
      updateMatchIndicator(tabButton, 'none')
    }
  }

  #updateCloseButtons(): void {
    updateCloseButtonVisibility(this.#tabBar, this.#tabs.size > 1)
  }

  #handleTabBarClick = (event: Event): void => {
    const target = event.target as HTMLElement
    const tabWrapper = target.closest('.tab') as HTMLElement | null
    if (!tabWrapper) return
    const tabId = tabWrapper.dataset.tabId
    if (!tabId) return
    if (target.classList.contains('tab-close')) {
      this.closeTab(tabId)
      return
    }
    if (target.classList.contains('tab-button')) {
      this.#activateTab(tabId)
    }
  }

  #handleCopyClick = async (event: Event): Promise<void> => {
    const target = event.target
    if (!(target instanceof HTMLButtonElement) || !target.classList.contains('copy-btn')) return
    const textToCopy = target.dataset.textToCopy
    if (!textToCopy) return
    await navigator.clipboard.writeText(textToCopy)
    target.textContent = 'Copied!'
    target.classList.add('copied')
    setTimeout(() => {
      target.textContent = 'Copy'
      target.classList.remove('copied')
    }, COPY_RESET_DELAY_MS)
  }

  #logParseTiming(): void {
    const readMs = performance.measure('parse:read', 'parse:read-start', 'parse:read-end')
    const decodeMs = performance.measure('parse:decode', 'parse:decode-start', 'parse:decode-end')
    const renderMs = performance.measure('parse:render', 'parse:render-start', 'parse:render-end')
    const totalMs = performance.measure('parse:total', 'parse:read-start', 'parse:render-end')
    console.log(
      `[perf] total=${totalMs.duration.toFixed(1)}ms | ` +
        `read=${readMs.duration.toFixed(1)}ms | ` +
        `decode=${decodeMs.duration.toFixed(1)}ms | ` +
        `render=${renderMs.duration.toFixed(1)}ms`,
    )
  }
}
