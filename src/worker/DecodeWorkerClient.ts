import { MESSAGE_KIND } from './messages.ts'
import type {
  WorkerRequest,
  WorkerResponse,
  DecodeResultResponse,
  FilterResultResponse,
} from './messages.ts'
import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from '../types.ts'

interface PendingRequest {
  readonly resolve: (value: WorkerResponse) => void
  readonly reject: (reason: Error) => void
}

/**
 * Web Worker client for decode and filter operations.
 * The worker persists for the lifetime of the instance, caching the proto schema and decoded entries.
 */
export class DecodeWorkerClient {
  readonly #worker: Worker
  readonly #pending = new Map<string, PendingRequest>()

  constructor() {
    this.#worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' })
    this.#worker.onmessage = this.#handleMessage
    this.#worker.onerror = this.#handleError
  }

  async decode(bytes: Uint8Array, type: FileType, filename: string): Promise<DecodedResult> {
    const id = crypto.randomUUID()
    const response = await this.#postRequest(
      { id, kind: MESSAGE_KIND.DECODE, bytes, type, filename },
      [bytes.buffer],
    )
    const decodeResponse = response as DecodeResultResponse
    return decodeResponse.result
  }

  async filter(search: string): Promise<readonly (GeoIPEntry | GeoSiteEntry)[]> {
    const id = crypto.randomUUID()
    const response = await this.#postRequest({ id, kind: MESSAGE_KIND.FILTER, search })
    const filterResponse = response as FilterResultResponse
    return filterResponse.entries
  }

  terminate(): void {
    this.#worker.terminate()
    this.#pending.clear()
  }

  #postRequest(message: WorkerRequest, transfer: Transferable[] = []): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      this.#pending.set(message.id, { resolve, reject })
      this.#worker.postMessage(message, transfer)
    })
  }

  #handleMessage = ({ data: response }: MessageEvent<WorkerResponse>): void => {
    const request = this.#pending.get(response.id)
    if (!request) return
    this.#pending.delete(response.id)
    if (
      response.kind === MESSAGE_KIND.DECODE_ERROR ||
      response.kind === MESSAGE_KIND.FILTER_ERROR
    ) {
      request.reject(new Error(response.error))
      return
    }
    request.resolve(response)
  }

  #handleError = ({ message }: ErrorEvent): void => {
    const error = new Error(message || 'Worker error')
    for (const [id, request] of this.#pending) {
      request.reject(error)
      this.#pending.delete(id)
    }
  }
}
