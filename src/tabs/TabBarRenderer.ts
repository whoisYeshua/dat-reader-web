import type { TabId, MatchIndicator } from './tabTypes.ts'

const DEFAULT_TAB_LABEL = 'New file'

/**
 * Creates a tab button element with label, indicator, and close button.
 * @returns The tab wrapper element containing button, indicator, and close control
 */
export const createTabButton = (tabId: TabId, label: string = DEFAULT_TAB_LABEL): HTMLElement => {
  const tab = document.createElement('div')
  tab.className = 'tab'
  tab.dataset.tabId = tabId
  const button = document.createElement('button')
  button.className = 'tab-button'
  button.role = 'tab'
  button.textContent = label
  tab.appendChild(button)
  const indicator = document.createElement('span')
  indicator.className = 'tab-indicator'
  tab.appendChild(indicator)
  const closeButton = document.createElement('button')
  closeButton.className = 'tab-close'
  closeButton.setAttribute('aria-label', 'Close tab')
  closeButton.textContent = '\u00d7'
  tab.appendChild(closeButton)
  return tab
}

/** Updates the tab button text label. */
export const updateTabLabel = (tabElement: HTMLElement, label: string): void => {
  const button = tabElement.querySelector('.tab-button')
  if (button) button.textContent = label
}

/** Sets the active tab in the tab bar by toggling CSS classes on the tab wrapper. */
export const setActiveTabButton = (tabBar: HTMLElement, tabId: TabId): void => {
  for (const tab of tabBar.querySelectorAll('.tab')) {
    const isActive = (tab as HTMLElement).dataset.tabId === tabId
    tab.classList.toggle('active', isActive)
  }
}

/** Updates the match indicator dot on a tab button. */
export const updateMatchIndicator = (tabElement: HTMLElement, indicator: MatchIndicator): void => {
  const dot = tabElement.querySelector('.tab-indicator')
  if (!dot) return
  dot.classList.toggle('match', indicator === 'match')
  dot.classList.toggle('no-match', indicator === 'no-match')
}

/** Removes a tab button element from the DOM. */
export const removeTabButton = (tabElement: HTMLElement): void => {
  tabElement.remove()
}

/** Shows or hides close buttons depending on whether tabs can be closed. */
export const updateCloseButtonVisibility = (tabBar: HTMLElement, canClose: boolean): void => {
  for (const closeBtn of tabBar.querySelectorAll('.tab-close')) {
    ;(closeBtn as HTMLElement).hidden = !canClose
  }
}
