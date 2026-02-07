import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from '../types.ts'

export const MESSAGE_KIND = {
  DECODE: 'decode',
  FILTER: 'filter',
  DECODE_RESULT: 'decode:result',
  FILTER_RESULT: 'filter:result',
  DECODE_ERROR: 'decode:error',
  FILTER_ERROR: 'filter:error',
} as const

export const REQUEST_TO_ERROR_KIND = {
  [MESSAGE_KIND.DECODE]: MESSAGE_KIND.DECODE_ERROR,
  [MESSAGE_KIND.FILTER]: MESSAGE_KIND.FILTER_ERROR,
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
}

export interface FilterRequest extends WorkerRequestBase {
  readonly kind: typeof MESSAGE_KIND.FILTER
  readonly search: string
}

export type WorkerRequest = DecodeRequest | FilterRequest

// --- Response types ---

interface WorkerResponseBase {
  readonly id: string
}

export interface DecodeResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.DECODE_RESULT
  readonly result: DecodedResult
}

export interface FilterResultResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_RESULT
  readonly entries: readonly (GeoIPEntry | GeoSiteEntry)[]
}

export interface DecodeErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.DECODE_ERROR
  readonly error: string
}

export interface FilterErrorResponse extends WorkerResponseBase {
  readonly kind: typeof MESSAGE_KIND.FILTER_ERROR
  readonly error: string
}

export type WorkerResponse =
  | DecodeResultResponse
  | FilterResultResponse
  | DecodeErrorResponse
  | FilterErrorResponse
