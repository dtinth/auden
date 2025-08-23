// Simple hash function for browser compatibility (replaces Node.js crypto)
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function getHue(uid: string) {
  return simpleHash(uid) % 360
}

export function getUserColor(uid: string) {
  return `hsl(${getHue(uid)}, 88%, 64%)`
}
