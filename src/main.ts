import { DecodeWorkerClient } from './worker/DecodeWorkerClient.ts'
import { debounce } from './utils.ts'
import { TabManager } from './tabs/TabManager.ts'

const searchInput = document.getElementById('searchInput') as HTMLInputElement
const contentFilterCheckbox = document.getElementById('contentFilterCheckbox') as HTMLInputElement
const tabBar = document.getElementById('tabBar')!
const tabContentHost = document.getElementById('tabContentHost')!
const addTabButton = document.getElementById('addTabButton') as HTMLButtonElement

const workerClient = new DecodeWorkerClient()
const tabManager = new TabManager(workerClient, tabBar, tabContentHost, searchInput, contentFilterCheckbox)

tabManager.createTab()

addTabButton.addEventListener('click', () => tabManager.createTab())

searchInput.addEventListener(
  'input',
  debounce(async ({ target }: Event) => {
    const search = (target as HTMLInputElement).value.trim()
    await tabManager.handleGlobalSearch(search)
  }, 300),
)

contentFilterCheckbox.addEventListener('change', async () => {
  const search = searchInput.value.trim()
  if (search) {
    await tabManager.handleGlobalSearch(search)
  }
})
