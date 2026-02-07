export interface ProtoCIDR {
  readonly ip: Uint8Array
  readonly prefix: number
}

interface ProtoGeoIP {
  readonly countryCode: string
  readonly cidr: ProtoCIDR[]
}

export interface ProtoGeoIPList {
  readonly entry: ProtoGeoIP[]
}

interface ProtoDomain {
  readonly type: number
  readonly value: string
}

export const DOMAIN_TYPE_LABELS = {
  0: 'Plain',
  1: 'Regex',
  2: 'Domain',
  3: 'Full',
} as const

export const getDomainTypeLabel = (type: number): string => {
  if (type in DOMAIN_TYPE_LABELS) return DOMAIN_TYPE_LABELS[type as keyof typeof DOMAIN_TYPE_LABELS]
  return String(type)
}

export interface ProtoGeoSite {
  readonly countryCode: string
  readonly domain: ProtoDomain[]
}

export interface ProtoGeoSiteList {
  readonly entry: ProtoGeoSite[]
}

export type DetectedType = 'geoip' | 'geosite' | 'unknown'
export type FileType = 'auto' | 'geoip' | 'geosite'

export interface GeoIPEntry {
  readonly tag: string
  readonly cidrs: readonly string[]
}

export interface DomainEntry {
  readonly type: number
  readonly value: string
}

export interface GeoSiteEntry {
  readonly tag: string
  readonly domains: readonly DomainEntry[]
}

export interface Totals {
  readonly lists: number
  readonly cidrs: number
  readonly domains: number
}

export interface DecodedResult {
  readonly detectedType: DetectedType
  readonly entries: readonly GeoIPEntry[] | readonly GeoSiteEntry[]
  readonly totals: Totals
}

export interface DecodeOptions {
  readonly bytes: Uint8Array
  readonly type: FileType
  readonly filename: string
}

export interface SummaryData {
  readonly filename: string
  readonly size: number
  readonly detectedType: DetectedType
  readonly totals: Totals
}

// Type guards
export const isGeoIPEntry = (entry: GeoIPEntry | GeoSiteEntry): entry is GeoIPEntry =>
  'cidrs' in entry

export const isGeoSiteEntry = (entry: GeoIPEntry | GeoSiteEntry): entry is GeoSiteEntry =>
  'domains' in entry
