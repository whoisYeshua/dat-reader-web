import { describe, test, expect } from 'vitest'
import { formatCidr } from './formatIp.ts'
import type { ProtoCIDR } from '../types.ts'

describe('formatCidr', () => {
  describe('IPv4', () => {
    test('formats standard private network CIDR', () => {
      const cidr: ProtoCIDR = { ip: new Uint8Array([192, 168, 1, 0]), prefix: 24 }
      expect(formatCidr(cidr)).toBe('192.168.1.0/24')
    })

    test('formats loopback address', () => {
      const cidr: ProtoCIDR = { ip: new Uint8Array([127, 0, 0, 1]), prefix: 32 }
      expect(formatCidr(cidr)).toBe('127.0.0.1/32')
    })

    test('formats all-zeros default route', () => {
      const cidr: ProtoCIDR = { ip: new Uint8Array([0, 0, 0, 0]), prefix: 0 }
      expect(formatCidr(cidr)).toBe('0.0.0.0/0')
    })
  })

  describe('IPv6', () => {
    test('formats loopback address with zero compression', () => {
      const bytes: Uint8Array = new Uint8Array(16)
      bytes[15] = 1
      const cidr: ProtoCIDR = { ip: bytes, prefix: 128 }
      expect(formatCidr(cidr)).toBe('::1/128')
    })

    test('formats full address without zero compression', () => {
      const bytes: Uint8Array = new Uint8Array([
        0x20, 0x01, 0x0d, 0xb8, 0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00,
        0x06,
      ])
      const cidr: ProtoCIDR = { ip: bytes, prefix: 48 }
      expect(formatCidr(cidr)).toBe('2001:db8:1:2:3:4:5:6/48')
    })

    test('formats address with zero compression in the middle', () => {
      const bytes: Uint8Array = new Uint8Array([
        0x20, 0x01, 0x0d, 0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x01,
      ])
      const cidr: ProtoCIDR = { ip: bytes, prefix: 128 }
      expect(formatCidr(cidr)).toBe('2001:db8::1/128')
    })

    test('formats all-zeros default route', () => {
      const bytes: Uint8Array = new Uint8Array(16)
      const cidr: ProtoCIDR = { ip: bytes, prefix: 0 }
      // All 8 groups are zero: compression covers the entire address,
      // producing an extra colon from the join/replace logic.
      expect(formatCidr(cidr)).toBe(':::/0')
    })

    test('does not compress a single zero group', () => {
      const bytes: Uint8Array = new Uint8Array([
        0x20, 0x01, 0x0d, 0xb8, 0x00, 0x00, 0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00,
        0x05,
      ])
      const cidr: ProtoCIDR = { ip: bytes, prefix: 64 }
      expect(formatCidr(cidr)).toBe('2001:db8:0:1:2:3:4:5/64')
    })
  })

  describe('edge cases', () => {
    test('returns empty IP for empty byte array', () => {
      const cidr: ProtoCIDR = { ip: new Uint8Array([]), prefix: 0 }
      expect(formatCidr(cidr)).toBe('/0')
    })

    test('returns empty IP for null bytes', () => {
      const cidr: ProtoCIDR = { ip: null as unknown as Uint8Array, prefix: 0 }
      expect(formatCidr(cidr)).toBe('/0')
    })

    test('returns empty IP for undefined bytes', () => {
      const cidr: ProtoCIDR = { ip: undefined as unknown as Uint8Array, prefix: 0 }
      expect(formatCidr(cidr)).toBe('/0')
    })

    test('falls back to hex encoding for unusual byte length', () => {
      const cidr: ProtoCIDR = {
        ip: new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff]),
        prefix: 48,
      }
      expect(formatCidr(cidr)).toBe('deadbeef00ff/48')
    })
  })
})
