import { describe, test, expect } from 'vitest'
import {
  createTabButton,
  updateTabLabel,
  setActiveTabButton,
  updateMatchIndicator,
  removeTabButton,
  updateCloseButtonVisibility,
} from './TabBarRenderer.ts'

describe('createTabButton', () => {
  test('creates a div with class "tab" and correct data-tab-id', () => {
    const tab = createTabButton('tab-1')
    expect(tab.tagName).toBe('DIV')
    expect(tab.className).toBe('tab')
    expect(tab.dataset.tabId).toBe('tab-1')
  })

  test('contains a button with class "tab-button" and role "tab"', () => {
    const tab = createTabButton('tab-1')
    const button = tab.querySelector('.tab-button') as HTMLButtonElement
    expect(button).not.toBeNull()
    expect(button.tagName).toBe('BUTTON')
    expect(button.role).toBe('tab')
  })

  test('button has the provided label text', () => {
    const tab = createTabButton('tab-1', 'geoip.dat')
    const button = tab.querySelector('.tab-button') as HTMLButtonElement
    expect(button.textContent).toBe('geoip.dat')
  })

  test('uses default label "New file" when no label provided', () => {
    const tab = createTabButton('tab-1')
    const button = tab.querySelector('.tab-button') as HTMLButtonElement
    expect(button.textContent).toBe('New file')
  })

  test('contains a span with class "tab-indicator"', () => {
    const tab = createTabButton('tab-1')
    const indicator = tab.querySelector('.tab-indicator')
    expect(indicator).not.toBeNull()
    expect(indicator!.tagName).toBe('SPAN')
  })

  test('contains a close button with class "tab-close", aria-label, and times symbol', () => {
    const tab = createTabButton('tab-1')
    const closeButton = tab.querySelector('.tab-close') as HTMLButtonElement
    expect(closeButton).not.toBeNull()
    expect(closeButton.tagName).toBe('BUTTON')
    expect(closeButton.getAttribute('aria-label')).toBe('Close tab')
    expect(closeButton.textContent).toBe('\u00d7')
  })
})

describe('updateTabLabel', () => {
  test('updates the tab-button text content', () => {
    const tab = createTabButton('tab-1', 'Old label')
    updateTabLabel(tab, 'New label')
    const button = tab.querySelector('.tab-button') as HTMLButtonElement
    expect(button.textContent).toBe('New label')
  })

  test('does nothing if no tab-button found', () => {
    const emptyDiv = document.createElement('div')
    expect(() => updateTabLabel(emptyDiv, 'Label')).not.toThrow()
  })
})

describe('setActiveTabButton', () => {
  const createTabBar = (): HTMLElement => {
    const tabBar = document.createElement('div')
    tabBar.appendChild(createTabButton('tab-1', 'First'))
    tabBar.appendChild(createTabButton('tab-2', 'Second'))
    tabBar.appendChild(createTabButton('tab-3', 'Third'))
    return tabBar
  }

  test('adds "active" class to matching tab', () => {
    const tabBar = createTabBar()
    setActiveTabButton(tabBar, 'tab-2')
    const tabs = tabBar.querySelectorAll('.tab')
    expect(tabs[1].classList.contains('active')).toBe(true)
  })

  test('removes "active" class from non-matching tabs', () => {
    const tabBar = createTabBar()
    setActiveTabButton(tabBar, 'tab-1')
    setActiveTabButton(tabBar, 'tab-2')
    const tabs = tabBar.querySelectorAll('.tab')
    expect(tabs[0].classList.contains('active')).toBe(false)
    expect(tabs[1].classList.contains('active')).toBe(true)
    expect(tabs[2].classList.contains('active')).toBe(false)
  })
})

describe('updateMatchIndicator', () => {
  test('adds "match" class when indicator is "match"', () => {
    const tab = createTabButton('tab-1')
    updateMatchIndicator(tab, 'match')
    const dot = tab.querySelector('.tab-indicator')!
    expect(dot.classList.contains('match')).toBe(true)
    expect(dot.classList.contains('no-match')).toBe(false)
  })

  test('adds "no-match" class when indicator is "no-match"', () => {
    const tab = createTabButton('tab-1')
    updateMatchIndicator(tab, 'no-match')
    const dot = tab.querySelector('.tab-indicator')!
    expect(dot.classList.contains('no-match')).toBe(true)
    expect(dot.classList.contains('match')).toBe(false)
  })

  test('removes both classes when indicator is "none"', () => {
    const tab = createTabButton('tab-1')
    updateMatchIndicator(tab, 'match')
    updateMatchIndicator(tab, 'none')
    const dot = tab.querySelector('.tab-indicator')!
    expect(dot.classList.contains('match')).toBe(false)
    expect(dot.classList.contains('no-match')).toBe(false)
  })
})

describe('removeTabButton', () => {
  test('removes element from parent', () => {
    const parent = document.createElement('div')
    const tab = createTabButton('tab-1')
    parent.appendChild(tab)
    expect(parent.children.length).toBe(1)
    removeTabButton(tab)
    expect(parent.children.length).toBe(0)
  })
})

describe('updateCloseButtonVisibility', () => {
  const createTabBar = (): HTMLElement => {
    const tabBar = document.createElement('div')
    tabBar.appendChild(createTabButton('tab-1'))
    tabBar.appendChild(createTabButton('tab-2'))
    return tabBar
  }

  test('shows close buttons when canClose is true', () => {
    const tabBar = createTabBar()
    updateCloseButtonVisibility(tabBar, true)
    const closeButtons = tabBar.querySelectorAll('.tab-close')
    for (const btn of closeButtons) {
      expect((btn as HTMLElement).hidden).toBe(false)
    }
  })

  test('hides close buttons when canClose is false', () => {
    const tabBar = createTabBar()
    updateCloseButtonVisibility(tabBar, false)
    const closeButtons = tabBar.querySelectorAll('.tab-close')
    for (const btn of closeButtons) {
      expect((btn as HTMLElement).hidden).toBe(true)
    }
  })
})
