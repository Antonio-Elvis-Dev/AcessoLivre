import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: 'png',
    mime: 'image/png',
    test: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    test: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
]

/** Identifica o tipo real da imagem pelo conteúdo, sem confiar na extensão enviada. */
export function detectImage(buffer: Buffer) {
  return SIGNATURES.find((s) => s.test(buffer)) ?? null
}

/**
 * Armazenamento de fotos em disco (MVP). Para produção, troque por um serviço
 * compatível com S3 mantendo a mesma interface.
 */
export class LocalStorage {
  constructor(public readonly dir: string) {}

  async save(buffer: Buffer, ext: string): Promise<string> {
    await mkdir(this.dir, { recursive: true })
    const filename = `${randomUUID()}.${ext}`
    await writeFile(path.join(this.dir, filename), buffer)
    return filename
  }

  async remove(filename: string) {
    // path.basename impede apagar algo fora da pasta de uploads
    await unlink(path.join(this.dir, path.basename(filename))).catch(() => undefined)
  }
}
