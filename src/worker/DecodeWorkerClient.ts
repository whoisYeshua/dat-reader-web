import { MESSAGE_KIND } from './messages.ts'
import type {
  WorkerRequest,
  WorkerResponse,
  DecodeResultResponse,
  FilterResultResponse,
  FilterAllResultResponse,
  TabSearchResult,
} from './messages.ts'
import type { DecodedResult, FileType, GeoIPEntry, GeoSiteEntry } from '../types.ts'

interface PendingRequest {
  readonly resolve: (value: WorkerResponse) => void
  readonly reject: (reason: Error) => void
}

/**
 * Web Worker client for decode, filter, and tab management operations.
 * The worker persists for the lifetime of the instance, caching the proto schema and decoded entries per tab.
 */
export class DecodeWorkerClient {
  readonly #worker: Worker
  readonly #pending = new Map<string, PendingRequest>()

  constructor() {
    this.#worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' })
    this.#worker.onmessage = this.#handleMessage
    this.#worker.onerror = this.#handleError
  }

  /** Decodes a .dat file and caches entries under the given tabId. */
  async decode(
    bytes: Uint8Array,
    type: FileType,
    filename: string,
    tabId: string,
  ): Promise<DecodedResult> {
    const id = crypto.randomUUID()
    const response = await this.#postRequest(
      { id, kind: MESSAGE_KIND.DECODE, bytes, type, filename, tabId },
      [bytes.buffer],
    )
    return (response as DecodeResultResponse).result
  }

  /** Filters cached entries for a specific tab. */
  async filter(
    search: string,
    tabId: string,
    filterContent: boolean = false,
  ): Promise<readonly (GeoIPEntry | GeoSiteEntry)[]> {
    const id = crypto.randomUUID()
    const response = await this.#postRequest({
      id,
      kind: MESSAGE_KIND.FILTER,
      search,
      tabId,
      filterContent,
    })
    return (response as FilterResultResponse).entries
  }

  /** Filters cached entries across all tabs in a single round-trip. */
  async filterAll(
    search: string,
    filterContent: boolean = false,
  ): Promise<readonly TabSearchResult[]> {
    const id = crypto.randomUUID()
    const response = await this.#postRequest({
      id,
      kind: MESSAGE_KIND.FILTER_ALL,
      search,
      filterContent,
    })
    return (response as FilterAllResultResponse).results
  }

  /** Removes cached entries for a closed tab. */
  async removeTab(tabId: string): Promise<void> {
    const id = crypto.randomUUID()
    await this.#postRequest({ id, kind: MESSAGE_KIND.REMOVE_TAB, tabId })
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
    if (this.#isErrorResponse(response)) {
      request.reject(new Error(response.error))
      return
    }
    request.resolve(response)
  }

  #isErrorResponse(
    response: WorkerResponse,
  ): response is WorkerResponse & { readonly error: string } {
    return response.kind.endsWith(':error')
  }

  #handleError = ({ message }: ErrorEvent): void => {
    const error = new Error(message || 'Worker error')
    for (const [id, request] of this.#pending) {
      request.reject(error)
      this.#pending.delete(id)
    }
  }
}
