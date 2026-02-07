/**
 * Formats byte count into human-readable size string.
 * Converts bytes to appropriate unit (B, KB, MB, GB) with automatic scaling.
 * @param {number} bytes - The number of bytes to format
 * @returns {string} Formatted string with value and unit (e.g., "1.5 MB", "256 KB")
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

/**
 * Creates a debounced version of a function that delays invocation
 * until after `delayMs` milliseconds have elapsed since the last call.
 * @param callback - The function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function with the same signature
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(
  callback: T,
  delayMs: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => callback(...args), delayMs)
  }
}
