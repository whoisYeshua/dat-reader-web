import * as protobuf from 'protobufjs'
import { formatCidr } from './formatIp.ts'
import { MESSAGE_KIND, REQUEST_TO_ERROR_KIND } from './messages.ts'
import { detectType, matchesSearch, filterEntryContent } from './workerLogic.ts'
import type {
  DecodedResult,
  FileType,
  GeoIPEntry,
  GeoSiteEntry,
  ProtoGeoIPList,
  ProtoGeoSiteList,
} from '../types.ts'
import type { WorkerRequest, WorkerResponse, TabSearchResult } from './messages.ts'

const PROTO_PATH = `${import.meta.env.BASE_URL}geoip.proto`
const GEOIP_LIST = 'xray.app.router.GeoIPList'
const GEOSITE_LIST = 'xray.app.router.GeoSiteList'

let cachedRoot: protobuf.Root | null = null
const entriesByTab = new Map<string, readonly (GeoIPEntry | GeoSiteEntry)[]>()

// --- Protobuf loading ---

const loadRoot = async (): Promise<protobuf.Root> => {
  if (cachedRoot) return cachedRoot
  cachedRoot = await protobuf.load(PROTO_PATH)
  return cachedRoot
}

// --- Decoding ---

const decodeGeoIP = (decoded: protobuf.Message): DecodedResult => {
  const raw = decoded as unknown as ProtoGeoIPList
  const entries = raw.entry || []
  const geoipEntries = entries.map(entry => ({
    tag: (entry.countryCode || '').toUpperCase(),
    cidrs: (entry.cidr || []).map(formatCidr),
  }))
  const totalCidrs = geoipEntries.reduce((sum, entry) => sum + entry.cidrs.length, 0)
  return {
    detectedType: 'geoip',
    entries: geoipEntries,
    totals: { lists: geoipEntries.length, cidrs: totalCidrs, domains: 0 },
  }
}

const decodeGeoSite = (decoded: protobuf.Message): DecodedResult => {
  const raw = decoded as unknown as ProtoGeoSiteList
  const entries = raw.entry || []
  const geositeEntries = entries.map(({ countryCode, domain }) => ({
    tag: (countryCode || '').toUpperCase(),
    domains: (domain || []).map(({ type, value = '' }) => ({ type, value })),
  }))
  const totalDomains = geositeEntries.reduce((sum, entry) => sum + entry.domains.length, 0)
  return {
    detectedType: 'geosite',
    entries: geositeEntries,
    totals: { lists: geositeEntries.length, cidrs: 0, domains: totalDomains },
  }
}

const decodeDat = async (
  bytes: Uint8Array,
  type: FileType,
  filename: string,
  tabId: string,
): Promise<DecodedResult> => {
  const root = await loadRoot()
  const detectedType = type === 'auto' ? detectType(filename) : type
  if (detectedType !== 'geoip' && detectedType !== 'geosite') {
    return {
      detectedType: 'unknown',
      entries: [],
      totals: { lists: 0, cidrs: 0, domains: 0 },
    }
  }
  const MessageType = root.lookupType(detectedType === 'geoip' ? GEOIP_LIST : GEOSITE_LIST)
  const decoded = MessageType.decode(bytes)
  const result = detectedType === 'geoip' ? decodeGeoIP(decoded) : decodeGeoSite(decoded)
  entriesByTab.set(tabId, result.entries as readonly (GeoIPEntry | GeoSiteEntry)[])
  return result
}

// --- Filtering ---

const filterEntries = (
  search: string,
  tabId: string,
  filterContent: boolean,
): readonly (GeoIPEntry | GeoSiteEntry)[] => {
  const entries = entriesByTab.get(tabId) ?? []
  const matched = entries.filter(entry => matchesSearch(entry, search))
  if (!filterContent) return matched
  const needle = search.toLowerCase()
  return matched.map(entry => filterEntryContent(entry, needle))
}

const filterAllEntries = (search: string, filterContent: boolean): readonly TabSearchResult[] => {
  const results: TabSearchResult[] = []
  const needle = search.toLowerCase()
  for (const [tabId, entries] of entriesByTab) {
    const matched = entries.filter(entry => matchesSearch(entry, search))
    const finalEntries = filterContent
      ? matched.map(entry => filterEntryContent(entry, needle))
      : matched
    results.push({ tabId, matchCount: matched.length, entries: finalEntries })
  }
  return results
}

const removeTab = (tabId: string): void => {
  entriesByTab.delete(tabId)
}

// --- Message handler ---

self.onmessage = async (event: MessageEvent<WorkerRequest>): Promise<void> => {
  const request = event.data
  try {
    switch (request.kind) {
      case MESSAGE_KIND.DECODE: {
        const result = await decodeDat(request.bytes, request.type, request.filename, request.tabId)
        const response: WorkerResponse = {
          id: request.id,
          kind: MESSAGE_KIND.DECODE_RESULT,
          result,
        }
        self.postMessage(response)
        break
      }
      case MESSAGE_KIND.FILTER: {
        const entries = filterEntries(request.search, request.tabId, request.filterContent)
        const response: WorkerResponse = {
          id: request.id,
          kind: MESSAGE_KIND.FILTER_RESULT,
          entries,
        }
        self.postMessage(response)
        break
      }
      case MESSAGE_KIND.REMOVE_TAB: {
        removeTab(request.tabId)
        const response: WorkerResponse = {
          id: request.id,
          kind: MESSAGE_KIND.REMOVE_TAB_RESULT,
        }
        self.postMessage(response)
        break
      }
      case MESSAGE_KIND.FILTER_ALL: {
        const results = filterAllEntries(request.search, request.filterContent)
        const response: WorkerResponse = {
          id: request.id,
          kind: MESSAGE_KIND.FILTER_ALL_RESULT,
          results,
        }
        self.postMessage(response)
        break
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown worker error'
    const errorKind = REQUEST_TO_ERROR_KIND[request.kind]
    const response: WorkerResponse = { id: request.id, kind: errorKind, error: errorMessage }
    self.postMessage(response)
  }
}
