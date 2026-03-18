import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from '../types.ts'

export const MESSAGE_KIND = {
  DECODE: 'decode',
  FILTER: 'filter',
  REMOVE_TAB: 'remove-tab',
  FILTER_ALL: 'filter-all',
  DECODE_RESULT: 'decode:result',
  FILTER_RESULT: 'filter:result',
  REMOVE_TAB_RESULT: 'remove-tab:result',
  FILTER_ALL_RESULT: 'filter-all:result',
  DECODE_ERROR: 'decode:error',
  FILTER_ERROR: 'filter:error',
  REMOVE_TAB_ERROR: 'remove-tab:error',
  FILTER_ALL_ERROR: 'filter-all:error',
} as const

export const REQUEST_TO_ERROR_KIND = {
  [MESSAGE_KIND.DECODE]: MESSAGE_KIND.DECODE_ERROR,
  [MESSAGE_KIND.FILTER]: MESSAGE_KIND.FILTER_ERROR,
  [MESSAGE_KIND.REMOVE_TAB]: MESSAGE_KIND.REMOVE_TAB_ERROR,
  [MESSAGE_KIND.FILTER_ALL]: MESSAGE_KIND.FILTER_ALL_ERROR,
} as const

// --- Request types ---

interface WorkerRequestBase {
  readonly id: string
}

export interface DecodeRequest extends WorkerRequestBase {
  readonly kind: typeof MESSAGE_KIND.DECODE
  readonly bytes: Uint8Array
  readonly type: FileType
  readonly filename: string
  readonly tabId: string
}

export interface FilterRequest extends WorkerRequestBase {
  readonly kind: typeof MESSAGE_KIND.FILTER
  readonly search: string
  readonly tabId: string
}

export interface RemoveTabRequest extends WorkerRequestBase {
  readonly kind: typeof MESSAGE_KIND.REMOVE_TAB
  readonly tabId: string
}

export interface FilterAllRequest extends WorkerRequestBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_ALL
  readonly search: string
}

export type WorkerRequest = DecodeRequest | FilterRequest | RemoveTabRequest | FilterAllRequest

// --- Response types ---

interface WorkerResponseBase {
  readonly id: string
}

export interface TabSearchResult {
  readonly tabId: string
  readonly matchCount: number
  readonly entries: readonly (GeoIPEntry | GeoSiteEntry)[]
}

export interface DecodeResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.DECODE_RESULT
  readonly result: DecodedResult
}

export interface FilterResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_RESULT
  readonly entries: readonly (GeoIPEntry | GeoSiteEntry)[]
}

export interface RemoveTabResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.REMOVE_TAB_RESULT
}

export interface FilterAllResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_ALL_RESULT
  readonly results: readonly TabSearchResult[]
}

export interface DecodeErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.DECODE_ERROR
  readonly error: string
}

export interface FilterErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_ERROR
  readonly error: string
}

export interface RemoveTabErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.REMOVE_TAB_ERROR
  readonly error: string
}

export interface FilterAllErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_ALL_ERROR
  readonly error: string
}

export type WorkerResponse =
  | DecodeResultResponse
  | FilterResultResponse
  | RemoveTabResultResponse
  | FilterAllResultResponse
  | DecodeErrorResponse
  | FilterErrorResponse
  | RemoveTabErrorResponse
  | FilterAllErrorResponse
