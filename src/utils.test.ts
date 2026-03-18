import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatBytes, debounce, readFileAsBytes } from './utils.ts'

describe('formatBytes', () => {
  test('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  test('formats small byte values without conversion', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  test('formats exactly 1 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })

  test('formats fractional KB values', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  test('rounds values above 10 to whole numbers', () => {
    expect(formatBytes(10240)).toBe('10 KB')
  })

  test('formats exactly 1 MB', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB')
  })

  test('formats exactly 1 GB', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
  })

  test('stays in GB for values exceeding 1 GB', () => {
    const twoGB = 2 * 1073741824
    expect(formatBytes(twoGB)).toBe('2.0 GB')
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('does not call the callback immediately', () => {
    const callback = vi.fn()
    const debounced = debounce(callback, 100)
    debounced()
    expect(callback).not.toHaveBeenCalled()
  })

  test('calls the callback after the specified delay', () => {
    const callback = vi.fn()
    const debounced = debounce(callback, 100)
    debounced()
    vi.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledOnce()
  })

  test('resets the timer on subsequent calls', () => {
    const callback = vi.fn()
    const debounced = debounce(callback, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(callback).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(callback).toHaveBeenCalledOnce()
  })

  test('passes arguments to the callback', () => {
    const callback = vi.fn()
    const debounced = debounce(callback, 100)
    debounced('hello', 42)
    vi.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledWith('hello', 42)
  })
})

describe('readFileAsBytes', () => {
  test('reads a file into a Uint8Array', async () => {
    const content = new Uint8Array([72, 101, 108, 108, 111])
    const file = new File([content], 'test.dat', { type: 'application/octet-stream' })
    const result: Uint8Array = await readFileAsBytes(file)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111])
  })

  test('returns an empty Uint8Array for an empty file', async () => {
    const file = new File([], 'empty.dat')
    const result: Uint8Array = await readFileAsBytes(file)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
  })
})
