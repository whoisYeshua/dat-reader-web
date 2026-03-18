import type { DecodedResult } from '../types.ts'

export type TabId = string

export interface TabDomElements {
  readonly container: HTMLElement
  readonly dropzone: HTMLElement
  readonly dropText: HTMLElement
  readonly fileInput: HTMLInputElement
  readonly typeSelect: HTMLSelectElement
  readonly uploadButton: HTMLButtonElement
  readonly errorElement: HTMLElement
  readonly summaryPanel: HTMLElement
  readonly summaryElement: HTMLElement
  readonly resultsElement: HTMLElement
}

export interface TabState {
  readonly id: TabId
  readonly elements: TabDomElements
  selectedFile: File | null
  currentResult: DecodedResult | null
  filename: string
}

export type MatchIndicator = 'none' | 'match' | 'no-match'
