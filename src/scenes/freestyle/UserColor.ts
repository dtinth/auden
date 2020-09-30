import { createHash } from 'crypto'

export function getHue(uid: string) {
  return (
    parseInt(createHash('md5').update(uid).digest('hex').slice(-8), 16) % 360
  )
}

export function getUserColor(uid: string) {
  return `hsl(${getHue(uid)}, 88%, 64%)`
}
