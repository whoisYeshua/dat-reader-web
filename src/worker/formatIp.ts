import type { ProtoCIDR } from '../types.ts'

// --- IP formatting ---

const formatIpv4 = (bytes: Uint8Array): string => {
  return `${bytes[0]}.${bytes[1]}.${bytes[2]}.${bytes[3]}`
}

const formatIpv6 = (bytes: Uint8Array): string => {
  const parts: number[] = []
  for (let i = 0; i < 16; i += 2) {
    parts.push((bytes[i] << 8) | bytes[i + 1])
  }

  let bestStart = -1
  let bestLen = 0
  let currStart = -1
  let currLen = 0

  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === 0) {
      if (currStart === -1) {
        currStart = i
        currLen = 1
      } else {
        currLen += 1
      }
    } else if (currStart !== -1) {
      if (currLen > bestLen) {
        bestStart = currStart
        bestLen = currLen
      }
      currStart = -1
      currLen = 0
    }
  }

  if (currStart !== -1 && currLen > bestLen) {
    bestStart = currStart
    bestLen = currLen
  }

  if (bestLen < 2) {
    bestStart = -1
  }

  const output: string[] = []
  for (let i = 0; i < parts.length; i += 1) {
    if (i === bestStart) {
      output.push('')
      i += bestLen - 1
      if (i === parts.length - 1) {
        output.push('')
      }
      continue
    }
    output.push(parts[i].toString(16))
  }

  return output.join(':').replace(/^:/, '::').replace(/:$/, '::')
}

const formatIp = (bytes: Uint8Array | null | undefined): string => {
  if (!bytes || bytes.length === 0) return ''
  if (bytes.length === 4) return formatIpv4(bytes)
  if (bytes.length === 16) return formatIpv6(bytes)
  return Array.from(bytes)
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')
}

export const formatCidr = (cidr: ProtoCIDR): string => {
  const ip = formatIp(cidr.ip)
  return `${ip}/${cidr.prefix}`
}
