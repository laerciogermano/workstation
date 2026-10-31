import { BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdirSync, unlink, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024

// Confere a assinatura do arquivo (não confia no mimetype do cliente).
function detect(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

export function savePhoto(dir: string, buf: Buffer) {
  const ext = detect(buf)
  if (!ext) throw new BadRequestException('Envie uma imagem JPG, PNG ou WebP.')
  mkdirSync(dir, { recursive: true })
  const file = `${randomUUID()}.${ext}`
  writeFileSync(join(dir, file), buf)
  return file
}

export function removePhoto(dir: string, file: string | null) {
  if (file) unlink(join(dir, file), () => undefined)
}
