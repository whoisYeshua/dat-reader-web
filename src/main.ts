import { DecodeWorkerClient } from './worker/DecodeWorkerClient.ts'
import { debounce, formatBytes } from './utils.ts'
import { renderSummary } from './renderer/summary.ts'
import { renderResults } from './renderer/results.ts'
import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from './types.ts'

const dropzone = document.getElementById('dropzone')!
const dropText = document.getElementById('dropText')!
const fileInput = document.getElementById('fileInput') as HTMLInputElement
const uploadButton = document.getElementById('uploadButton') as HTMLButtonElement
const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement
const searchInput = document.getElementById('searchInput') as HTMLInputElement
const errorElement = document.getElementById('error')!
const summaryPanel = document.getElementById('summaryPanel')!
const summaryElement = document.getElementById('summary')!
const resultsElement = document.getElementById('results')!

let selectedFile: File | null = null
let currentResult: DecodedResult | null = null
let filterController: AbortController | null = null

const workerClient = new DecodeWorkerClient()

const setError = (message: string) => {
  errorElement.textContent = message || ''
}

const updateFileDisplay = (file: File | null) => {
  if (!file) {
    dropText.textContent = 'Drop a .dat file here or click to choose'
    uploadButton.disabled = true
    return
  }
  dropText.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`
  uploadButton.disabled = false
}

const readFileAsBytes = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsArrayBuffer(file)
  })
}

const setParsingState = (isParsing: boolean) => {
  uploadButton.disabled = isParsing
  uploadButton.textContent = isParsing ? 'Parsing...' : 'Parse file'
}

const renderDecodedResult = (result: DecodedResult, filename: string, fileSize: number) => {
  currentResult = result
  renderSummary(summaryPanel, summaryElement, {
    filename,
    size: fileSize,
    detectedType: result.detectedType,
    totals: result.totals,
  })
  searchInput.disabled = false
  searchInput.value = ''
  renderResults(resultsElement, result.entries as readonly (GeoIPEntry | GeoSiteEntry)[], filename)
}

const logParseTiming = (
  readMs: number,
  decodeMs: number,
  renderMs: number,
  totalMs: number,
): void => {
  console.log(
    `[perf] total=${totalMs.toFixed(1)}ms | ` +
      `read=${readMs.toFixed(1)}ms | ` +
      `decode=${decodeMs.toFixed(1)}ms | ` +
      `render=${renderMs.toFixed(1)}ms`,
  )
}

const parseFile = async () => {
  if (!selectedFile) {
    setError('Choose a .dat file first.')
    return
  }
  setError('')
  setParsingState(true)
  try {
    performance.mark('parse:read-start')
    const bytes = await readFileAsBytes(selectedFile)
    performance.mark('parse:read-end')
    performance.mark('parse:decode-start')
    const result = await workerClient.decode(bytes, typeSelect.value as FileType, selectedFile.name)
    performance.mark('parse:decode-end')
    if (result.detectedType === 'unknown') {
      throw new Error('Unable to detect file type. Please choose a type.')
    }
    performance.mark('parse:render-start')
    document.title = selectedFile.name
    renderDecodedResult(result, selectedFile.name, selectedFile.size)
    performance.mark('parse:render-end')
    const readMeasure = performance.measure('parse:read', 'parse:read-start', 'parse:read-end')
    const decodeMeasure = performance.measure(
      'parse:decode',
      'parse:decode-start',
      'parse:decode-end',
    )
    const renderMeasure = performance.measure(
      'parse:render',
      'parse:render-start',
      'parse:render-end',
    )
    const totalMeasure = performance.measure('parse:total', 'parse:read-start', 'parse:render-end')
    logParseTiming(
      readMeasure.duration,
      decodeMeasure.duration,
      renderMeasure.duration,
      totalMeasure.duration,
    )
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Parsing failed.')
  } finally {
    setParsingState(false)
  }
}

dropzone.addEventListener('click', () => fileInput.click())

dropzone.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    fileInput.click()
  }
})

fileInput.addEventListener('change', () => {
  selectedFile = fileInput.files?.[0] ?? null
  updateFileDisplay(selectedFile)
})

uploadButton.addEventListener('click', parseFile)

dropzone.addEventListener('dragover', event => {
  event.preventDefault()
  dropzone.classList.add('dragover')
})

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover')
})

dropzone.addEventListener('drop', event => {
  event.preventDefault()
  dropzone.classList.remove('dragover')
  const file = event.dataTransfer?.files[0]
  if (file) {
    selectedFile = file
    updateFileDisplay(selectedFile)
  }
})

const copyButtonHandler = async (buttonElement: HTMLButtonElement) => {
  const textToCopy = buttonElement.dataset.textToCopy
  if (!textToCopy) return
  await navigator.clipboard.writeText(textToCopy)
  buttonElement.textContent = 'Copied!'
  buttonElement.classList.add('copied')
  setTimeout(() => {
    buttonElement.textContent = 'Copy'
    buttonElement.classList.remove('copied')
  }, 1500)
}

resultsElement.addEventListener('click', event => {
  if (event.target instanceof HTMLButtonElement && event.target.classList.contains('copy-btn')) {
    copyButtonHandler(event.target)
    return
  }
})

searchInput.addEventListener(
  'input',
  debounce(async ({ target }: Event) => {
    if (!currentResult || !selectedFile) return
    const search = (target as HTMLInputElement).value.trim()
    if (!search) {
      renderResults(resultsElement, currentResult.entries, selectedFile.name)
      return
    }
    filterController?.abort()
    filterController = new AbortController()
    const { signal } = filterController
    performance.mark('filter:start')
    const entries = await workerClient.filter(search)
    performance.mark('filter:end')
    if (signal.aborted) return
    const filterMeasure = performance.measure('filter', 'filter:start', 'filter:end')
    console.log(
      `[perf:filter] ${filterMeasure.duration.toFixed(1)}ms ` +
        `(${entries.length}/${currentResult.entries.length} entries)`,
    )
    renderResults(resultsElement, entries, selectedFile.name)
  }, 300),
)
