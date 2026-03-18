import { isGeoIPEntry, isGeoSiteEntry, getDomainTypeLabel } from '../types.ts'
import type { DetectedType, GeoIPEntry, GeoSiteEntry } from '../types.ts'

/** Detects whether a .dat file is GeoIP, GeoSite, or unknown based on its filename. */
export const detectType = (filename: string): DetectedType => {
  const lower = (filename || '').toLowerCase()
  if (lower.includes('geoip')) {
    return 'geoip'
  }
  if (lower.includes('geosite')) {
    return 'geosite'
  }
  return 'unknown'
}

/** Checks whether a GeoIP or GeoSite entry matches a search string (case-insensitive). */
export const matchesSearch = (entry: GeoIPEntry | GeoSiteEntry, search: string): boolean => {
  if (!search) return true
  const needle = search.toLowerCase()
  if (entry.tag.toLowerCase().includes(needle)) {
    return true
  }
  if (isGeoIPEntry(entry)) {
    return entry.cidrs.some(cidr => cidr.toLowerCase().includes(needle))
  }
  if (isGeoSiteEntry(entry)) {
    return entry.domains.some(domain => {
      const label = getDomainTypeLabel(domain.type).toLowerCase()
      return domain.value.toLowerCase().includes(needle) || label.includes(needle)
    })
  }
  return false
}

/** Filters the internal content of an entry to only items matching the needle. */
export const filterEntryContent = (
  entry: GeoIPEntry | GeoSiteEntry,
  needle: string,
): GeoIPEntry | GeoSiteEntry => {
  const isTagMatch = entry.tag.toLowerCase().includes(needle)
  if (isGeoIPEntry(entry)) {
    const matchingCidrs = entry.cidrs.filter(cidr => cidr.toLowerCase().includes(needle))
    if (matchingCidrs.length === 0 && isTagMatch) return entry
    return { tag: entry.tag, cidrs: matchingCidrs }
  }
  if (isGeoSiteEntry(entry)) {
    const matchingDomains = entry.domains.filter(domain => {
      const label = getDomainTypeLabel(domain.type).toLowerCase()
      return domain.value.toLowerCase().includes(needle) || label.includes(needle)
    })
    if (matchingDomains.length === 0 && isTagMatch) return entry
    return { tag: entry.tag, domains: matchingDomains }
  }
  return entry
}
